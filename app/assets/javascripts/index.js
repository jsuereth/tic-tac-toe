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
    self.oPlayerText = ko.computed(function() {
    	if(self.player() == 'o') {
    		return '<You>';
    	}
    	return self.oPlayer();
    });
    // Here's our command to update our state upon move.
    self.updateState = function(msg) {
      self.board(fixBoard(msg.board));
      self.xPlayer(msg.x)
      self.oPlayer(msg.o)
      self.winner(msg.winner)
    }
    // Now we create computed observable to drive the game.
    self.winnerText = ko.computed(function() {
      var winner = self.winner();
      switch(winner) {
      case 'tie':
    	  return 'Tie!';
      case 'x':
      case 'y':
    	  if(winner == self.player()) {
    		  return 'You win!';
    	  }
    	  return 'You Lose!';
      default:
    	  return '';
      }
    });
    // Now our UI actions
    self.move = function(row, col) {
      console.debug('Moving to (', row, ',', col, ')')
      server.move(id, row, col);
    }
    self.makeMove
    self.refresh = function() {
      server.refreshGame(id);
    }
  }
  
  // TODO - this is what we bind to the UI....
  gameServer = (function() {
	// Game server information
	var user = ko.observable('Default UserName');
	var boards = ko.observable({});
	var connectingToGame = ko.observable(false);
	
	// Game server UI drivers
	var activeGame = ko.computed(function() {
		var u = user();
		var bs = boards();
		for(var i in bs) {
			var b = bs[i];
			if(b.activeGame()) {
				return b;
			}
		}
		return null;
	});
	var hasActiveGame = ko.computed(function() {
		var game = activeGame();
		return game != null;
	});
	
	
	// Game Server Actions
    function joinGame(game) {
      connection.send({
    	  request: 'JoinGame',
    	  player: user(),
    	  game: game
      })
    }
    function createGame() {
      connection.send({ request: 'CreateGame', player: user() });
    }
	    
    function refreshGame(game) {
   	  connection.send({ request: 'BoardStateRequest', game: game });
    }
    function move(game, row, col) {
	  connection.send({ request: 'Move', row: row, col: col, game: game });
	}
    // Private function that creates new board objects.
    function findOrCreateBoard(id) {
        var bs = boards();
        if(!bs[id]) {
      	  bs[id] = new Board(id, { move: move, refreshGame: refreshGame });
      	  boards(bs);
        }
        return bs[id];
    }
    function handleBoardState(obj) {
    	var b = findOrCreateBoard(obj.game);
    	b.updateState(obj);
    	if(connectingToGame()) {
    		joinGame(b.id);
    	}
    }

    function updateBoardList() {
      connection.send({ request: 'ListAvailableGames' });
    }
    function handleListing(obj) {
    	// TODO - Should we try to set anything on the board from the listing?
    	if(obj.active && obj.players < 2) {
    		findOrCreateBoard(obj.game);
    	}
    }
    function firstAvailableBoard() {
    	var bs = boards();
    	for(var i in bs) {
    		return bs[i];
    	}
    	return null;
    }
    function joinFirstAvailableGame() {
      var first = firstAvailableBoard();
      if(first) {
    	  joinGame(first.id);
      } else {
    	  createGame();
      }
    }
    function handleJoinGame(obj) {
    	// TODO - Check to make sure we really joined
    	if(!obj.error) {
    	  var game = findOrCreateBoard(obj.game);
    	  game.player(obj.player);
    	  // Update state so we stop showing connecting message.
    	  connectingToGame(false);
    	} else {
    		// Remove the game from our list, see if we need to try to connect
    		// again...
    		var bs = boards();
    		delete bs[obj.game];
    		boards(bs);
    		if(connectingToGame()) {
    			joinFirstAvailableGame();
    		}
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
          case 'BoardListing':
        	  handleListing(obj);
        	  break;
        }
      }
    });
    
    function connnectToGame() {
    	connectingToGame(true);
    	// Here we notify that we'll join the first game that tells us it is available.
    	updateBoardList();
    	joinFirstAvailableGame();
    }
    
    
    // Before we return, let's update our state:
    updateBoardList();
	return {
	  // Private-ish
	  joinGame: joinGame,
	  createGame: createGame,
	  refreshGame: refreshGame,
	  move: move,
	  // Public
	  user: user,
	  connectToGame: connnectToGame,
	  boards: boards,
	  activeGame: activeGame,
	  hasActiveGame: hasActiveGame
	}
  })();
  $(function() {
	  ko.applyBindings(gameServer); 
  });
});