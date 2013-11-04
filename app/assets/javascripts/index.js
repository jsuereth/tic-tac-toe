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
  
  // A custom knockout binding so that we can directly take the board
  // status updates and use them.
  ko.bindingHandlers.board = {
    init: function(element, valueAccessor, allBindings) {
    	// The accessor gives us a function that returns the value.
        var rawBoard = valueAccessor();
        var board = ko.unwrap(rawBoard);
        // Here we grab a click handler
        var clickHandler = allBindings().boardClick || function() {};
        
        // Now we create our DOM elements....
        var buf = [];
        // We don't actually need to write out the text values here, because
        // Update will be called immediately after init.  So we just
        // layout the structure and click listeners, nothing more.
        for(var row = 0; row < 3; ++row) {
        	for(var col = 0; col < 3; ++ col) {
        		var value = board[row][col]
        		buf.push('<div class="box" data-row="', row, '"')
        		buf.push(' data-col="', col, '"></div>')
        	}
        }
        var html = buf.join('')
        element.innerHTML = html;
        // Register our listener.
        var clicker = function(e) {
        	var el = $(this);
        	var row = Number(el.attr('data-row'));
        	var col = Number(el.attr('data-col'));
        	clickHandler(row, col);
        }
        $(element).children('div').each(function(idx, el) {
        	$(el).click(clicker);
        });
    },
    update: function(element, valueAccessor) {
        var rawBoard = valueAccessor();
        var board = ko.unwrap(rawBoard);
        // Update values in the board.
        $(element).children('div').each(function(idx, el) {
        	var e = $(el);
        	var row = e.attr('data-row');
        	var col = e.attr('data-col');
        	var value = board[row][col];
        	e.text(value ? value : '');
        });
        // TODO - See if we need to update the click handler..
    }
  };
  


  // The board class.
  var Board = function() {
    var self = this;

    // ------ Direct State ------------------------------------------
    // Here are the observables that contain the raw state of the UI.
    // --------------------------------------------------------------
    self.user = ko.observable(''); // The name we use when playing others.
    self.id = ko.observable();  // The current game id.
    self.board = ko.observable(EMPTY_BOARD);  // The state of the board.
    self.player = ko.observable();  // Our move type (x or o)
    self.winner = ko.observable();  // The winner of the game
    self.xPlayer = ko.observable(); // The name of the x player
    self.oPlayer = ko.observable(); //  The name of the o player
    self.loggedIn = ko.observable(false); // Whether we logged in with our name or not.
    
    
    
    // ------ Derived State --------------------------------------
    // Here are the *computed* observables we use to drive the UI.
    // -----------------------------------------------------------
    
    // Are we involved in a game?
    self.hasActiveGame = ko.computed(function(){
    	switch(self.player()) {
    	case 'x':
    	case 'o':
    		return true;
        default:
        	return false;
    	}
    });
    
    // Are we still looking for someone to play?
    self.isSearchingOpponent = ko.computed(function(){
        return self.player() == 'x' && !self.oPlayer();
    });

    // What text should we use for player X?
    self.xPlayerText = ko.computed(function() {
    	if(self.player() == 'x') {
    		return '<You>';
    	}
    	return self.xPlayer();
    });

    // What text should we use for player Y?
    self.oPlayerText = ko.computed(function() {
    	if(self.player() == 'o') {
    		return '<You>';
    	}
    	var tmp = self.oPlayer();
    	return tmp ? tmp : 'Finding Opponent...';
    });
    
    // Is the active game finished?
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
    
    // Did we tie?
    self.isTie = ko.computed(function() {
    	return self.winner() == 'tie';
    });
    // Did we win?
    self.isWin = ko.computed(function() {
    	return self.winner() == self.player();
    });
    // Did we lose?
    self.isLose = ko.computed(function() {
    	return self.isDone() && !(self.isTie() || self.isWin());
    })
    
    // ------ Responses -------------------------------
    // How we respond to messages from the game server.
    // ------------------------------------------------

    
    // This will update the state of the game from a game state update message.
    function handleBoardState(msg) {
      // TODO - Check to see if msg.game = self.id()
      self.board(msg.board);
      self.xPlayer(msg.x)
      self.oPlayer(msg.o)
      self.winner(msg.winner)
    }
    
    function handleJoinGame(obj) {
      self.player(obj.player);
      self.id(obj.game);
    }
    
 // Here we register our handler for messages
    connection.setHandler(function(obj) {
        if(obj.response) {
          switch(obj.response) {
            case 'JoinGame':
          	  handleJoinGame(obj);
          	break;
            case 'BoardState':
              handleBoardState(obj);
          	break;
          }
        }
      });
    
    // ------ Actions -----------------------
    // Methods that manipulate our state.  
    // Can be from the server, or via the UI.
    // --------------------------------------
    
    // UI Action - try to move at the given row + column
    self.move = function(row, col) {
      console.debug('Moving to (', row, ',', col, ')')
      connection.send({ request: 'Move', row: row, col: col, game: self.id() });
    }
    // UI Action - refresh the game.
    self.refresh = function() {
      if(self.id()) {
        connection.send({ request: 'BoardStateRequest', game: self.id() });
      }
    }
    
    // UI Action - Try to find a new game.
    self.getNextGame = function() {
    	// RESET our state to 'joining'
        self.loggedIn(true);
        self.player(null);
        connection.send({
      	  request: 'FindGameForPlayer',
      	  player: self.user()
        });
    }
    
    

  }
  
  $(function() {
	  var board = new Board();
	  window.board = board;
	  ko.applyBindings(board); 
  });
});