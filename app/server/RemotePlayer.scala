package server

import akka.actor._
import server.protocol._
import play.api.libs.json._
import play.api.libs.iteratee.Concurrent


// A player is attached to a websocket.
// He accepts commands and communicates them forward.
class RemotePlayer(channel: Concurrent.Channel[JsValue]) extends Actor {

  def receive: Receive = {
    case v: JsValue =>  handleInput(v)

    // Known game responses.
    case msg: JoinedAsX   => sendJsonToUser(msg)
    case msg: JoinedAsO   => sendJsonToUser(msg)
    case msg: GameIsFull  => sendJsonToUser(msg)
    case msg: InvalidMove => sendJsonToUser(msg)
    case msg: BoardState   => sendJsonToUser(msg)
  }

  def sendJsonToUser[T](t: T)(implicit writes: Writes[T]): Unit = {
    channel.push(writes.writes(t))
  }


  def parseInput(v: JsValue): Request = {
    v.asOpt[BoardStateRequest] orElse
    v.asOpt[JoinGame] orElse
    v.asOpt[Move] orElse
    v.asOpt[ListenToGame] getOrElse sys.error("Unable to parse input: " + v)
  }
  def handleInput(v: JsValue): Unit = {
    parseInput(v) match {
      case x => println("Don't know how to handle: " + x)
    }
  }
}
object RemotePlayer {
  def props(channel: Concurrent.Channel[JsValue]): Props =
    Props(new RemotePlayer(channel))
}