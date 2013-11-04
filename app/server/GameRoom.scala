package server

import akka.actor._
import server.protocol._

/** This class is responsible for managing all the active games occuring. */
class GameRoom extends Actor {
  def receive: Receive = {
    case msg: ListAvailableGames =>
      // Just list all children.
      val length = context.children.toSeq.length
      println("Listing games: " + length)
      if (length == 0)
        sender ! GameError("No Games Found - Create one yourself!")
      else
        context.children foreach { child =>
          println("Forwarding to " + child)
          child forward (msg)
        }
    case CreateGame(player) =>
      val id = java.util.UUID.randomUUID.toString
      println("Creating game: " + id)
      val game = context.actorOf(Game.props(id), id)
      // TODO - We can't guarantee this player joins first but we can try.
      game forward (JoinGame(id, player))

    //Handle all other game requests in GameRoom so we can return an exception when the game is not found
    case req: Request => {

      val game = req match {
        case m: Move => m.game
        case s: BoardStateRequest => s.game
        case j: JoinGame => j.game
        case l: ListenToGame => l.game
        case _ => sys.error("Bad request: " + req)
      }

      val gameActorOpt: Option[ActorRef] = context.child(game)
      gameActorOpt match {
        case Some(gameActor) => gameActor forward req
        case None => sender ! GameError("Game not found!")
      }

    }
  }
}
object GameRoom {
  def props: Props = Props.apply[GameRoom]
}