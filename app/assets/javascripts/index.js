$(function() {
  var EMPTY_BOARD = [ [null, null, null],
                      [null, null, null],
                      [null, null, null]
                     ];
	
  // Helper ot handle binding to a socket and dealing with messages.
  var connection = (function(){
    var socket = new WebSocket(jsRoutes.controllers.SocketController.connectToGameServer().webSocketURL());
    var alive = ko.observable(false);
    var bufferedMessages = [];

    socket.onopen = function(e) {
      alive(true);
      console.log("SOCKET OPEN: ", e);
      for(var i = 0; i < bufferedMessages.length; ++i) {
    	  sendMessage(bufferedMessages[i]);
      }
      bufferedMessages = [];
    };

    socket.onerror = function(e) {
      alive(false);
      console.log("SOCKET ERROR: ", e);
    };
    
    function sendMessage(jsonOrString) {
      var msg = typeof jsonOrString == 'string' ? jsonOrString :  JSON.stringify(jsonOrString);
      if(!alive()) {
         bufferedMessages.push(msg);
      } else {
        socket.send(msg);
      }
    }

    function setHandler(handler) {
       var realListener = function(msg) {
    	  // TODO - Handle failrues
          var obj = JSON.parse(msg.data);
          console.debug('SOCKET Received: ', obj);
          handler(obj)
       }
       socket.onmessage = realListener;
    }

    return {
      send: sendMessage,
      setHandler: setHandler
    }
  })();
  


  // The board class.
  var Board = function(id, server) {
    var self = this;
    self.id = id
    self.server = server;
    function makeMove(row, col) {
    	return function() {
    		self.move(row,col);
    	}
    }
    // Helper that adds the click function on each cell
    // of the board.
    function fixBoard(board) {
    	var result = board.slice(0);
        for(var row = 0; row < 3; ++row) {
          result[row] = board[row].slice(0);
    	  for(var col = 0; col < 3; ++col) {
    	     var value = board[row][col];
    	     result[row][col] = {
    	        value: value,
    	        move: makeMove(row,col)
    	     }
    	  }
        }
      return result;
    }
    // Here are the observables that we update on every move.
    self.board = ko.observable(fixBoard(EMPTY_BOARD));
    self.player = ko.observable();
    // TODO - way to mark a game as 'done'
    self.activeGame = ko.computed(function(){
    	switch(self.player()) {
    	case 'x':
    	case 'o':
    		return true;
        default:
        	return false;
    	}
    });
    self.winner = ko.observable();
    self.xPlayer = ko.observable();
    self.xPlayerText = ko.computed(function() {
    	if(self.player() == 'x') {
    		return '<You>';
    	}
    	return self.xPlayer();
    });
    self.oPlayer = ko.observable();
    self.isSearchingOpponent = ko.computed(function(){
      return self.player() == 'x' && !self.oPlayer();
    });
    self.oPlayerText = ko.computed(function() {
    	if(self.player() == 'o') {
    		return '<You>';
    	}
    	var tmp = self.oPlayer();
    	return tmp ? tmp : 'Finding Opponent...';
    });
    // Here's our command to update our state upon move.
    self.updateState = function(msg) {
      self.board(fixBoard(msg.board));
      self.xPlayer(msg.x)
      self.oPlayer(msg.o)
      self.winner(msg.winner)
    }
    // Now we create computed observable to drive the game.
    self.isDone = ko.computed(function() {
    	switch(self.winner()) {
    	case 'tie':
    	case 'x':
    	case 'y':
    		return true;
        default:
        	return false;
    	}
    });
    self.isTie = ko.computed(function() {
      return self.winner() == 'tie';
    });
    self.isWin = ko.computed(function() {
      return self.winner() == self.player();
    });
    self.isLose = ko.computed(function() {
      return self.winner() != null && !self.isWin() && !self.isTie();
    });
    self.winnerText = ko.computed(function() {
      if(self.isTie()) {
    	  return 'Tie!';
      } else if(self.isWin()) {
    	  return 'You Win!';
      } else if(self.isLose()) {
    	  return 'You Lose!';
      }
      return '';
    });
    // Now our UI actions
    self.move = function(row, col) {
      console.debug('Moving to (', row, ',', col, ')')
      server.move(id, row, col);
    }
    self.refresh = function() {
      server.refreshGame(id);
    }
  }
  
  // TODO - this is what we bind to the UI....
  gameServer = (function() {
	// Game server information
	var user = ko.observable('Default UserName');
	var activeBoard = ko.observable(null);
	var loggedIn = ko.observable(false);
	var hasActiveGame = ko.computed(function() {
		var game = activeBoard();
		return game != null;
	});
	
	
	// Game Server Actions
    function getNextGame() {
      loggedIn(true);
      connection.send({
    	  request: 'FindGameForPlayer',
    	  player: user()
      })
    }
    function refreshGame(game) {
   	  connection.send({ request: 'BoardStateRequest', game: game });
    }
    function move(game, row, col) {
	  connection.send({ request: 'Move', row: row, col: col, game: game });
	}
    // Private function that creates new board objects.
    function findOrCreateBoard(id) {
        var bs = activeBoard();
        if(!(bs && bs.id == id)) {
      	  bs = new Board(id, { move: move, refreshGame: refreshGame });
      	  activeBoard(bs);
        }
        return bs;
    }
    function handleBoardState(obj) {
      var b = activeBoard();
      if(obj.game = b.id) {
        b.updateState(obj);
      }
    }
    function handleJoinGame(obj) {
    	// TODO - Check to make sure we really joined
    	if(!obj.error) {
    	  var game = findOrCreateBoard(obj.game);
    	  game.player(obj.player);
    	}
    }
    
    connection.setHandler(function(obj) {
      if(obj.response) {
        switch(obj.response) {
          case 'JoinGame':
        	// TODO - Either move into "joined a game",
        	// Display game is full, or 
        	  handleJoinGame(obj);
        	break;
          case 'BoardState':
        	handleBoardState(obj);
        	break;
        }
      }
    });
    
    var showLogin = ko.computed(function() {
    	return !(loggedIn());
    });
    
	return {
	  // Private-ish
      getNextGame: getNextGame,
	  refreshGame: refreshGame,
	  move: move,
	  // Public
	  user: user,
	  showLogin: showLogin,
	  activeGame: activeBoard,
	  hasActiveGame: hasActiveGame,
	  isLose: ko.computed(function() {
		  if(activeBoard()) {
			  return activeBoard().isLose();
		  }
		  return false;
	  }),
	  isWin: ko.computed(function() {
		  if(activeBoard()) {
			  return activeBoard().isWin();
		  }
		  return false;
	  }),
	  isTie: ko.computed(function() {
		  if(activeBoard()) {
			  return activeBoard().isTie();
		  }
		  return false;
	  }),
	  isSearchingOpponent: ko.computed(function() {
		  if(activeBoard()) {
			  return activeBoard().isSearchingOpponent()
		  }
		  return loggedIn();
	  })
	}
  })();
  $(function() {
	  ko.applyBindings(gameServer); 
  });
});