package server

import akka.actor._
import server.protocol._
import play.api.libs.json._
import play.api.libs.iteratee.Concurrent


// A player is attached to a websocket.
// He accepts commands and communicates them forward.
class RemotePlayer(publish:RemotePlayer.ClientPublish) extends Actor {

  // TODO - Inject don't look up?
  //I believe this can just be a val and not def so the lookup only happens once?
  val gameRoom = {
    context.actorSelection(context.system / "gameroom")
  }
  
  def receive: Receive = {
    case v: JsValue =>  handleInput(v)
    // Known game responses.
    case msg: JoinedAsX   => publishJson(msg)
    case msg: JoinedAsO   => publishJson(msg)
    case msg: GameIsFull  => publishJson(msg)
    case msg: InvalidMove => publishJson(msg)
    case msg: BoardState  => publishJson(msg)
    case msg: GameInfo    => publishJson(msg)
    case msg: GameError    => publishJson(msg)
  }

  def publishJson[T](t: T)(implicit writes: Writes[T]): Unit = {
    println(self + " - Writing to usesr: " + t)
    publish(writes.writes(t))
  }

  def parseInput(v: JsValue): Request = (
    v.asOpt[BoardStateRequest] orElse
    v.asOpt[JoinGame] orElse
    v.asOpt[Move] orElse
    v.asOpt[ListenToGame] orElse
    v.asOpt[ListAvailableGames] orElse
    v.asOpt[CreateGame]
    getOrElse sys.error("Unable to parse input: " + v)
  )

  def handleInput(v: JsValue): Unit = {
    System.err.println(self + " is handling input " + v.toString)
    parseInput(v) match {
      // Here, we track whether or not we're part of a game and 
      // where to send events...
      case msg @ (_: ListAvailableGames | _: CreateGame | _: Move | _: BoardStateRequest | _: JoinGame | _: ListenToGame) =>
        gameRoom ! msg
      case x =>
        publishJson(GameError("Don't know how to handle: " + x))
    }
  }
}
object RemotePlayer {

  type ClientPublish = JsValue => Unit

  def props(publish:RemotePlayer.ClientPublish): Props =
    Props(new RemotePlayer(publish))
}