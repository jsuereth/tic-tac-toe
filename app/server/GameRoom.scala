package server

import akka.actor._
import server.protocol._

/** This class is responsible for managing all the active games occuring. */
class GameRoom extends Actor {
  def receive: Receive = {
    case msg: ListAvailableGames =>
      // Just list all children.
      println("Listing games: " + context.children.toSeq.length)
      context.children foreach { child =>
        println("Forwarding to " + child)
        child.!(msg)(sender)
      }
    case CreateGame() =>
      val id = java.util.UUID.randomUUID.toString
      println("Creating game: " + id)
      val game = context.actorOf(Game.props(id), id)
      // TODO - Respond with the created game, or just grab the info....
      game.!(ListAvailableGames())(sender)
    case msg @ JoinGame(id, _) =>
      // TODO - What should we do if the game doesn't exist?
      context.child(id) match {
        case Some(child) => child.!(msg)(sender)
        case None => println("Error could not find game: " + id) // TODO - useful here.
      }
    case msg @ ListenToGame(id) =>
      // TODO - What should we do if the game doesn't exist?
      context.child(id).foreach(_.!(msg)(sender))
  }
}
object GameRoom {
  def props: Props = Props.apply[GameRoom]
}