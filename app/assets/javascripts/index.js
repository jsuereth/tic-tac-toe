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
    // Here are the observables that we update on every move.
    self.board = ko.observable(EMPTY_BOARD);
    self.activeGame = ko.observable(false);
    self.winner = ko.observable();
    self.xPlayer = ko.observable();
    self.oPlayer = ko.observable();
    // Here's our command to update our state upon move.
    self.updateState = function(msg) {
      // TODO - Assert correct state.
      self.board(msg.board);
      self.xPlayer(msg.x)
      self.oPlayer(msg.o)
      self.winner(msg.winner)
    }
    // Now we create computed observable to drive the game.
    // Now our UI actions
    self.move = function(row, col) {
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
	var boards = ko.observable({});
	
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
    	findOrCreateBoard(obj.game).updateState(obj);
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
    function handleJoinGame(obj) {
    	// TODO - Check to make sure we really joined
    	if(!obj.error) {
    	  var game = findOrCreateBoard(obj.game);
    	  game.activeGame(true);
    	  // TODO - tell me if I'm x or o.
    	} else {
    		// Issue error to user.
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
    
    
    // Before we return, let's update our state:
    updateBoardList();
	return {
	  joinGame: joinGame,
	  createGame: createGame,
	  refreshGame: refreshGame,
	  move: move,
	  boards: boards,
	  activeGame: activeGame,
	  hasActiveGame: hasActiveGame
	}
  })();

});