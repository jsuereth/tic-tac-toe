package server 

import play.api.libs.json._

package protocol {
  
  sealed trait Request
  sealed trait Response
  
  // Request the state of the board sent back
  // json = { request: 'ListAvailableGames' }
  case class ListAvailableGames() extends Request

  // Request the state of the board sent back
  // json = { request: 'CreateGame' }  
  case class CreateGame() extends Request
  
  
  // Request the state of the board sent back
  // json = { 
  //           response: 'GameState', 
  //           players: 2,
  //           watchers: 0,
  //           active: true
  // }
  case class GameInfo(game: String, players: Int, watchers: Int, active: Boolean) extends Response
  
  

  
  // Request the state of the board sent back
  // json = { request: 'BoardStateRequest', game: '5' }
  case class BoardStateRequest(game: String) extends Request

  // Join the game as a player
  // json = { request: 'JoinGame', game: '5', player: 'Jim567' }
  case class JoinGame(game: String, player: String) extends Request
  // Response to Join game - You are player X
  // json = { response: 'JoinGame', player: 'x', game: 'foo' }
  case class JoinedAsX(game: String) extends Response
  // Response to Join game - You are player O
  // json = { response: 'JoinGame', player: 'o', game: 'bar' }
  case class JoinedAsO(game: String) extends Response
  // Response to Join the game - Game is full
  // json = { reponse: 'JoinGame', error: 'Game is full' }
  case class GameIsFull(game: String) extends Response
  // Send a move down to the server for your player
  // json = { request: 'Move', row: 1, col: 2, game: '5' }
  case class Move(row: Int, col: Int, game: String) extends Request
  // The given move is invalid
  // json = { response: 'Move', error: 'Invalid', game: '5' }
  case class InvalidMove(game: String) extends Response
  // Request to listen to board changes
  // json = { request: 'ListenToGame', game: '5' }
  case class ListenToGame(game: String) extends Request
  // The current state of the board, send upon change to listeners and
  // also upon request.
  // we only ever write BoardState
  // json = {
  //          response: 'BoardState,
  //          game: '5',
  //          x: 'Josh',
  //          o: 'Maxime',
  //          board: [
  //                   [null, 'x', null],
  //                   [null, null, null],
  //                   ['o',  null, null]
  //                 ],
  //          winner:  null // Null, 'x' or 'o', 'tie'
  //       }
  case class BoardState(game: String, board: Seq[Seq[CellState]], playerX: Option[String] = None, playerO: Option[String] = None, winner: Option[String]) extends Response

  case class GameError(errorMsg:String) extends Response

  // We only ever write cell-state
  sealed trait CellState
  case object PlayerXMoved extends CellState
  case object PlayerOMoved extends CellState
  case object Empty extends CellState
}

// Serialization handlers
package object protocol {
  
 implicit object ListAvailableGamesReader extends Reads[ListAvailableGames] {
   override def reads(o: JsValue): JsResult[ListAvailableGames] =
     for {
       tpe <- (o \ "request").validate[String]
       if tpe == "ListAvailableGames"
     } yield ListAvailableGames()
 }
 
  implicit object CreateGameReader extends Reads[CreateGame] {
   override def reads(o: JsValue): JsResult[CreateGame] =
     for {
       tpe <- (o \ "request").validate[String]
       if tpe == "CreateGame"
     } yield CreateGame()
 }
 
 implicit object GameInfoWriter extends Writes[GameInfo] {
   override def writes(o: GameInfo): JsValue = 
     JsObject(Seq(
       "game" -> JsString(o.game),
       "players" -> JsNumber(o.players),
       "watchers" -> JsNumber(o.watchers),
       "active" -> JsBoolean(o.active)
     ))
 }
  
 implicit object BoardStateRequestReader extends Reads[BoardStateRequest] {
   override def reads(o: JsValue): JsResult[BoardStateRequest] =
     for {
       tpe <- (o \ "request").validate[String]
       if tpe == "BoardStateRequest"
       game <- (o \ "game").validate[String]
     } yield BoardStateRequest(game)
 }
 implicit object joinGameReader extends Reads[JoinGame] {
   override def reads(o: JsValue): JsResult[JoinGame] =
     for {
       tpe <- (o \ "request").validate[String]
       if tpe == "JoinGame"
       game <- (o \ "game").validate[String]
       player <- (o \ "player").validate[String]
     } yield JoinGame(game, player)
 }
 implicit object JoinedAsXWriter extends Writes[JoinedAsX] {
   override def writes(o: JoinedAsX): JsValue =
     JsObject(Seq("response" -> JsString("JoinGame"),
                  "player" -> JsString("x"),
                  "game" -> JsString(o.game)))
 }
 implicit object JoinedAsOWriter extends Writes[JoinedAsO] {
   override def writes(o: JoinedAsO): JsValue =
     JsObject(Seq("response" -> JsString("JoinGame"),
                  "player" -> JsString("o"),
                  "game" -> JsString(o.game)))
 }
 implicit object GameFullWriter extends Writes[GameIsFull] {
   override def writes(o: GameIsFull): JsValue =
     JsObject(Seq("repsonse" -> JsString("JoinGame"),
                  "error" -> JsString("Game is full")))
 }
  implicit object moveReader extends Reads[Move] {
    def reads(json: JsValue): JsResult[Move] = 
      for {
        tp <- (json \ "request").validate[String]
        if tp == "Move"
        r <- (json \ "row").validate[Int]
        c <- (json \ "col").validate[Int]
        game <- (json \ "game").validate[String]
      } yield Move(r,c, game)
  }
  
 implicit object InvalidMoveWriter extends Writes[InvalidMove] {
   override def writes(o: InvalidMove): JsValue =
     JsObject(Seq("response" -> JsString("Move"), "error" -> JsString("Invalid"), "game" -> JsString(o.game)))
 }
 
 implicit object listenToGameReader extends Reads[ListenToGame] {
   override def reads(o: JsValue): JsResult[ListenToGame] =
     for {
       tpe <- (o \ "request").validate[String]
       if tpe == "ListenToGame"
       game <- (o \ "game").validate[String]
     } yield ListenToGame(game)
 }
  
 implicit object cellStateWriter extends Writes[CellState] {
    override def writes(o: CellState): JsValue =
      o match {
        case PlayerXMoved => JsString("x")
        case PlayerOMoved => JsString("o")
        case _ => JsNull
      }
  }
  implicit object boardWriter extends Writes[BoardState] {
    val boardWriter = implicitly[Writes[Seq[Seq[CellState]]]]
    override def writes(o: BoardState): JsValue = {
      def winnerJs(o: Option[String]): JsValue =
        o match {
          case Some(player) => JsString(player)
          case _ => JsNull
        }
      JsObject(Seq(
        "type" -> JsString("BoardState"),
        "game" -> JsString(o.game),
        "board" -> boardWriter.writes(o.board),
        "winner" -> winnerJs(o.winner)
      ) ++ o.playerX.toSeq.map(x => "x" -> JsString(x))
        ++ o.playerO.toSeq.map(o => "o" -> JsString(o))
      )
    }
  }

  implicit object GameErrorWriter extends Writes[GameError] {
    override def writes(o: GameError): JsValue =
      JsObject(Seq(
        "error" -> JsString(o.errorMsg))
      )
  }
}
