package server

import akka.actor._
import server.protocol._
import play.api.libs.json._
import play.api.libs.iteratee.Concurrent
import java.util.UUID
import java.util.concurrent.TimeUnit


// A player is attached to a websocket.
// He accepts commands and communicates them forward.
class RemotePlayer(publish:RemotePlayer.ClientPublish) extends Actor {
  // We set a receive timeout so we constantly spam our clients
  // with updates. (Necessary to ensure heroku doesn't close it).
  context.setReceiveTimeout(concurrent.duration.Duration(3, TimeUnit.SECONDS))
  
  var playerName: String = UUID.randomUUID.toString
  var searchingForGames: Boolean = false
  var attemptingToJoinAGame: Boolean = false
  var gamesToAttempt: Vector[String] = Vector.empty

  // TODO - Inject don't look up?
  //I believe this can just be a val and not def so the lookup only happens once?
  val gameRoom = {
    context.actorSelection(context.system / "gameroom")
  }
  
  def receive: Receive = {
    case v: JsValue =>  handleInput(v)
    // Known game responses.
    case msg: JoinedAsX   => 
      clearGameSearchState()
      publishJson(msg)
    case msg: JoinedAsO   => 
      clearGameSearchState()
      publishJson(msg)
    case msg: GameIsFull  => handleGameFull()
    case msg: InvalidMove => publishJson(msg)
    case msg: BoardState  => publishJson(msg)
    case msg: GameInfo    => 
      if(searchingForGames) {
        checkGameAvailable(msg)
      }
    case msg: GameError    => publishJson(msg)
    case ReceiveTimeout =>
      if(searchingForGames) {
        // Here we just create one.
        searchingForGames = false
        gameRoom ! CreateGame(playerName)
      } else {
        // Here we spam the client with a ping.
        // TODO -if we don't get a response, then drop the connection/kill
        // the game.
        publish(JsObject(Seq("request" -> JsString("ping"))))
      }
  }

  def publishJson[T](t: T)(implicit writes: Writes[T]): Unit = {
    println(self + " - Writing to usesr: " + t)
    publish(writes.writes(t))
  }

  def parseInput(v: JsValue): Request = (
    v.asOpt[BoardStateRequest] orElse
    v.asOpt[Move] orElse
    v.asOpt[FindGameForPlayer]
    getOrElse sys.error("Unable to parse input: " + v)
  )

  def handleInput(v: JsValue): Unit = {
    parseInput(v) match {
      case FindGameForPlayer(player) =>
        findGameForPlayer(player)
      // Here, we track whether or not we're part of a game and 
      // where to send events...
      case msg @ (_: Move | _: BoardStateRequest) =>
        gameRoom ! msg
      case x =>
        publishJson(GameError("Don't know how to handle: " + x))
    }
  }
  
  def findGameForPlayer(player: String): Unit = {
    println("Looking for games for player: " + player)
    playerName = player
    searchingForGames = true
    gamesToAttempt = Vector.empty
    println("Listing all available games.")
    gameRoom ! ListAvailableGames()
  }
  
  def checkGameAvailable(game: GameInfo): Unit = {
    if(game.players < 2) {
      if(!attemptingToJoinAGame) {
        attemptingToJoinAGame = true
        gameRoom ! JoinGame(game.game, playerName)
      } else {
        gamesToAttempt = gamesToAttempt :+ game.game
      }
    }
  }
  def handleGameFull(): Unit = {
    if(searchingForGames) {
        gamesToAttempt match {
          case game +: rest =>
            gamesToAttempt = rest
            attemptingToJoinAGame = true
            gameRoom ! JoinGame(game, playerName)
          case _ =>
            // No games left to try... wait for the timeout before creating one.
            attemptingToJoinAGame = false
        }
      }
  }
  def clearGameSearchState(): Unit = {
    searchingForGames = false
    attemptingToJoinAGame = false
  }
}
object RemotePlayer {

  type ClientPublish = JsValue => Unit

  def props(publish:RemotePlayer.ClientPublish): Props =
    Props(new RemotePlayer(publish))
}