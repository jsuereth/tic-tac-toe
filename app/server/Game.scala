package server

import akka.actor._
import server.protocol._

object Game {
  def props(id: String): Props =
    Props(new Game(id))
}
// TODO - Detect winner
// TODO - add winner to game state
// TODO - Close down the actor after complete?
class Game(id: String) extends Actor {
  println("Game " + id + " is constructed.")
  case class PlayerInfo(ref: ActorRef, humanName: String)
  var board = model.Board()
  var xPlayer: Option[PlayerInfo] = None
  var oPlayer: Option[PlayerInfo] = None
  var listeners: Seq[ActorRef] = Nil
  
  def receive: Receive = {
    case _: ListAvailableGames => 
      println(self + " is sending game state to: " + sender)
      sender ! gameState
    case BoardStateRequest(`id`) => sender ! boardState
    // TODO - enforce the id is ours.
    case JoinGame(`id`, name) =>
      val s = sender
      (xPlayer, oPlayer) match {
        case (None, _) => 
          xPlayer = Some(PlayerInfo(s, name))
          s ! JoinedAsX(id)
          updateListeners()
        case (_, None) =>
          oPlayer = Some(PlayerInfo(s,name))
          s ! JoinedAsO(id)
          updateListeners()
        case _ =>
          s ! GameIsFull(id)
      }
    case ListenToGame(`id`) =>
      listeners = listeners :+ sender
      sender ! boardState
    case Move(row, col, `id`) =>
      val s = sender
      try move(row,col,s)
      catch {
        // TODO - only non-fatal
        case e: Exception =>
          s ! InvalidMove(id)
      }
  }
  
  def move(row: Int, col: Int, player: ActorRef): Unit = {
    val p = 
      if(xPlayer.exists(_.ref == player)) model.X
      else if(oPlayer.exists(_.ref == player)) model.O
      else sys.error("Player is not authorized!")
    val next = board.update(row,col, p)
    board = next
    updateListeners()
  }  
  def allListeners = listeners ++ xPlayer.toSeq.map(_.ref) ++ oPlayer.toSeq.map(_.ref)
  // Send board state to listeners
  def updateListeners(): Unit = {
    allListeners foreach (_ ! boardState)
  }
  def boardState: BoardState = {
    BoardState(
      game = id,
      playerX = xPlayer.map(_.humanName),
      playerO = oPlayer.map(_.humanName),
      board = Seq(0,1,2) map { row =>
        Seq(0,1,2) map { col =>
          board(row,col) match {
            case Some(model.X) => PlayerXMoved
            case Some(model.O) => PlayerOMoved
            case None => Empty
          }
        }
      },
      winner = board.result match {
        case model.NotFinished => None
        case model.XWin => Some("x")
        case model.OWin => Some("o")
        case model.Tie => Some("tie")
      }
    )
  }
  def gameState: GameInfo = {
    def opt2Int[T](x: Option[T]): Int = if(x.isDefined) 1 else 0
    val numPlayers = opt2Int(xPlayer) + opt2Int(oPlayer)
    GameInfo(
        game = id, 
        players = numPlayers,
        watchers = listeners.length,
        active = board.result == model.NotFinished) 
  }
}
