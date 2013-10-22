package model


sealed trait Player
case object X extends Player
case object O extends Player

case class Move(x: Player, row: Int, column: Int)


sealed trait GameResult
case object NotFinished extends GameResult
case object XWin extends GameResult
case object OWin extends GameResult
case object Tie extends GameResult

class Board private (val moves: Vector[Option[Player]] = Vector.fill(9)(None)) {

  private def makeIndex(row: Int, col: Int): Int = {
    require(row >= 0 && row < 3, "Row is not inside the game board")
    require(col >= 0 && col < 3, "Column is not inside the game board")
    (row * 3) + col
  }
  def apply(row: Int, col: Int): Option[Player] = {
    moves(makeIndex(row, col))
  }
  def update(row: Int, col: Int, move: Player): Board = {
    // TODO - special exceptions...
    val idx = makeIndex(row, col)
    require(moves(idx).isEmpty, "Cannot move where another move exists.")
    require(move == turn, "Player is playing out of turn.")
    new Board(moves.updated(idx, Some(move)))
  }

  // TODO - we could be lazier here and track this as moves come in...
  lazy val numMoves: Int = moves.filter(_.isDefined).map(_ => 1).sum

  //TODO: encode turn as a type so can do Update(0,0).Update(1,0)
  
  // Which player's turn is it
  lazy val turn: Player = 
    if(numMoves % 2 == 0) X
    else O


  lazy val result: GameResult = {
    if(numMoves < 5) NotFinished
    else {
      // If we have enough moves to even check for completion.
      val solutionSpace =
        for(indexes <- Board.possibleWins)
        //yield indexes.map((apply _).tupled)
        yield indexes.map{
          case (x,y) => apply(x,y)
        }
      val winningIndex = solutionSpace find { moves =>
         moves.forall(_ == Some(X)) || moves.forall(_ == Some(O))
      }
      val winner: Option[Player] = winningIndex.flatMap(_.headOption).flatten
      winner match {
        case Some(X) => XWin
        case Some(O) => OWin
        // TODO - Also make sure win is still possible...
        case _ if numMoves < 9 => NotFinished
        case _ => Tie
      }
    }
  }

  override def toString: String = {
    val sb = new StringBuffer
    for {
     row <- moves.grouped(3)
     rowStrings = row.map(_.fold(" ")(_.toString))
    } sb.append(s"${rowStrings.mkString("[", "][", "]")}\n")
    sb.toString
  }
}

object Board{
  
  
      def apply(): Board = new Board()

    val board = Board()
  //println(board update(0,0, X) update(0,1,O) update(1,0,X) update(1,1,O) update(2,0,X) update(2,1,O) result)



  // TODO cache all the possible ways of solving the board, in terms of indicies to lookup.
  lazy val possibleWins: Seq[Seq[(Int, Int)]] = {
    def rows = 
      for(row <- 0 until 3) yield Seq(row -> 0, row -> 1, row -> 2)
    def cols =
      for(col <- 0 until 3) yield Seq(0 -> col, 1 -> col, 2 -> col)
    def diags =
       Seq(
         Seq(0 -> 0, 1 -> 1, 2 -> 2),
         Seq(0 -> 2, 1 -> 1, 2 -> 0)
       ) 
    (diags ++ rows ++ cols).reverse
  } 
  


}