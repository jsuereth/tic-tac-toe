$(function() {
  var EMPTY_BOARD = [ [null, null, null],
                      [null, null, null],
                      [null, null, null]
                    ];

  // Some names and adjectives for "random" nicknames
  var animals = "Aardvark,Albatross,Alligator,Alpaca,Ant,Anteater,Antelope,Ape,Armadillo,Baboon,Badger,Barracuda,Bat,Bear,Beaver,Bee,Bison,Boar,Galago,Butterfly,Camel,Caribou,Cat,Caterpillar,Cattle,Chamois,Cheetah,Chicken,Chimpanzee,Chinchilla,Chough,Clam,Cobra,Cockroach,Cod,Cormorant,Coyote,Crab,Crocodile,Crow,Curlew,Deer,Dinosaur,Dog,Dolphin,Donkey,Dotterel,Dove,Dragonfly,Duck,Dugong,Dunlin,Eagle,Echidna,Eel,Elephant,Elk,Emu,Falcon,Ferret,Finch,Fish,Flamingo,Fly,Fox,Frog,Gaur,Gazelle,Gerbil,Giraffe,Gnat,Goat,Goose,Goldfish,Gorilla,Goshawk,Grasshopper,Grouse,Guanaco,Gull,Hamster,Hare,Hawk,Hedgehog,Heron,Herring,Hippopotamus,Hornet,Horse,Hummingbird,Hyena,Jackal,Jaguar,Jay,Jellyfish,Kangaroo,Koala,Kouprey,Kudu,Lapwing,Lark,Lemur,Leopard,Lion,Llama,Lobster,Locust,Loris,Louse,Lyrebird,Magpie,Mallard,Manatee,Marten,Meerkat,Mink,Monkey,Moose,Mouse,Mosquito,Mule,Narwhal,Newt,Nightingale,Octopus,Okapi,Opossum,Oryx,Ostrich,Otter,Owl,Ox,Oyster,Parrot,Partridge,Peafowl,Pelican,Penguin,Pheasant,Pig,Pigeon,Pony,Porcupine,Porpoise,Quail,Quelea,Rabbit,Raccoon,Rat,Raven,Reindeer,Rhinoceros,Ruff,Salamander,Salmon,Sandpiper,Sardine,Scorpion,Seahorse,Shark,Sheep,Shrew,Shrimp,Skunk,Snail,Snake,Spider,Squid,Squirrel,Starling,Stingray,Stinkbug,Stork,Swallow,Swan,Tapir,Tarsier,Termite,Tiger,Toad,Trout,Turtle,Vulture,Wallaby,Walrus,Wasp,Weasel,Whale,Wolf,Wolverine,Wombat,Woodcock,Woodpecker,Worm,Wren,Yak,Zebra".split(",");
  var adjectives = "Amazing,Angry,Black,Cunning,Dark,Dangerous,Fantastic,Flash,Flying,Great,Green,Grey,Magic,Nasty,Rapid,Reactive,Red,Silly,Speedy,Stealthy,Striking,Stunning,Swift,The,White,Wicked,Wild".split(",");

  // A custom knockout binding so that we can directly take the board
  // status updates and use them.
  ko.bindingHandlers.board = {
    init: function(element, valueAccessor, allBindings) {
        // Here we grab a click handler
        // We could use a direct reference to self.move as well
        // But since we are in a component let's avoid side effects
        var clickHandler = allBindings().boardClick || function() {};

        // Now we create our DOM elements....
        // We don't actually need to write out the text values here, because
        // Update will be called immediately after init.  So we just
        // layout the structure and click listeners, nothing more.
        for(var row = 0; row < 3; ++row) {
          for(var col = 0; col < 3; ++ col) {
        	// We have to explicitly grab these. Thanks javascript.
        	(function(r, c) {
              $('<div class="box"/>').click(function(){
                clickHandler(r, c);
              }).appendTo(element);
        	})(row,col);
          }
        }
    },
    update: function(element, valueAccessor) {
        var rawBoard = valueAccessor();
        var board = ko.unwrap(rawBoard);
        // Update values in the board.
        $(element).children('div').each(function(idx, el) {
          var e = $(el);
          var row = Math.floor(idx/3);
          var col = idx%3;
          var value = board[row][col] || '';
          e.text(value);
        });
    }
  };



  // The board class.
  var Board = function() {
    var self = this;
    var now = new Date(); // For "random" nickname
    var nickname = adjectives[now%adjectives.length]+" "+animals[now%animals.length];

    // ------ Direct State ------------------------------------------
    // Here are the observables that contain the raw state of the UI.
    // --------------------------------------------------------------
    self.user = ko.observable(nickname); // The name we use when playing others.
    self.id = ko.observable();  // The current game id.
    self.board = ko.observable(EMPTY_BOARD);  // The state of the board.
    self.player = ko.observable();  // Our move type (x or o)
    self.winner = ko.observable();  // The winner of the game
    self.xPlayer = ko.observable(); // The name of the x player
    self.oPlayer = ko.observable(); //  The name of the o player
    self.loggedIn = ko.observable(false); // Whether we logged in with our name or not.
    self.turn = ko.observable(false); // Who's turn (true = me)

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
      case 'o':
        return true;
      }
      return false;
    });

    // Did we tie?
    self.isTie = ko.computed(function() {
      return self.winner() == 'tie';
    });
    // Did we win?
    self.isWin = ko.computed(function() {
      return self.player() && (self.winner() == self.player());
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
    server.setMessageHandler(function(obj) {
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
      server.send({ request: 'Move', row: row, col: col, game: self.id() });
    }
    // UI Action - refresh the game.
    self.refresh = function() {
      if(self.id()) {
        server.send({ request: 'BoardStateRequest', game: self.id() });
      }
    }

    // UI Action - Try to find a new game.
    self.getNextGame = function() {
      // RESET our state to 'joining'
        self.loggedIn(true);
        self.player(null);
        server.send({
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
