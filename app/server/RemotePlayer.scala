package server

import akka.actor._
import server.protocol._
import play.api.libs.json._
import play.api.libs.iteratee.Concurrent


// A player is attached to a websocket.
// He accepts commands and communicates them forward.
class RemotePlayer(channel: Concurrent.Channel[JsValue]) extends Actor {

  // TODO - Inject don't look up?
  def gameRoom = {
    context.actorSelection(context.system / "gameroom")
  }
  
  var latestGame: Option[ActorRef] = None 
  
  def receive: Receive = {
    case v: JsValue =>  handleInput(v)

    // Known game responses.
    case msg: JoinedAsX   => 
      latestGame = Some(sender)
      sendJsonToUser(msg)
    case msg: JoinedAsO   => 
      latestGame = Some(sender)
      sendJsonToUser(msg)
    case msg: GameIsFull  => sendJsonToUser(msg)
    case msg: InvalidMove => sendJsonToUser(msg)
    case msg: BoardState   =>
      if(latestGame.exists(_ == sender) && msg.winner.isDefined) {
        // We're done with this game.
        latestGame = None
      }
      sendJsonToUser(msg)
    case msg: GameInfo => sendJsonToUser(msg)
  }

  def sendJsonToUser[T](t: T)(implicit writes: Writes[T]): Unit = {
    println(self + " - Writing to usesr: " + t)
    channel.push(writes.writes(t))
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
      case msg @ (_: ListAvailableGames | _:JoinGame | _: CreateGame) => 
        gameRoom ! msg
      case msg @ (_: Move | _:BoardStateRequest) if latestGame.isDefined => 
        latestGame.foreach(_ ! msg)
      case x => 
        // TODO - Send error back to client!
        println("Don't know how to handle: " + x)
    }
  }
}
object RemotePlayer {
  def props(channel: Concurrent.Channel[JsValue]): Props =
    Props(new RemotePlayer(channel))
}