$(function() {
  var EMPTY_BOARD = [ [null, null, null],
                      [null, null, null],
                      [null, null, null]
                    ];

  // Some names and adjectives for "random" nicknames
  var animals = "Aardvark,Albatross,Alligator,Alpaca,Ant,Anteater,Antelope,Ape,Armadillo,Baboon,Badger,Barracuda,Bat,Bear,Beaver,Bee,Bison,Boar,Galago,Butterfly,Camel,Caribou,Cat,Caterpillar,Cattle,Chamois,Cheetah,Chicken,Chimpanzee,Chinchilla,Chough,Clam,Cobra,Cockroach,Cod,Cormorant,Coyote,Crab,Crocodile,Crow,Curlew,Deer,Dinosaur,Dog,Dolphin,Donkey,Dotterel,Dove,Dragonfly,Duck,Dugong,Dunlin,Eagle,Echidna,Eel,Elephant,Elk,Emu,Falcon,Ferret,Finch,Fish,Flamingo,Fly,Fox,Frog,Gaur,Gazelle,Gerbil,Giraffe,Gnat,Goat,Goose,Goldfish,Gorilla,Goshawk,Grasshopper,Grouse,Guanaco,Gull,Hamster,Hare,Hawk,Hedgehog,Heron,Herring,Hippopotamus,Hornet,Horse,Hummingbird,Hyena,Jackal,Jaguar,Jay,Jellyfish,Kangaroo,Koala,Kouprey,Kudu,Lapwing,Lark,Lemur,Leopard,Lion,Llama,Lobster,Locust,Loris,Louse,Lyrebird,Magpie,Mallard,Manatee,Marten,Meerkat,Mink,Monkey,Moose,Mouse,Mosquito,Mule,Narwhal,Newt,Nightingale,Octopus,Okapi,Opossum,Oryx,Ostrich,Otter,Owl,Ox,Oyster,Parrot,Partridge,Peafowl,Pelican,Penguin,Pheasant,Pig,Pigeon,Pony,Porcupine,Porpoise,Quail,Quelea,Rabbit,Raccoon,Rat,Raven,Reindeer,Rhinoceros,Ruff,Salamander,Salmon,Sandpiper,Sardine,Scorpion,Seahorse,Shark,Sheep,Shrew,Shrimp,Skunk,Snail,Snake,Spider,Squid,Squirrel,Starling,Stingray,Stinkbug,Stork,Swallow,Swan,Tapir,Tarsier,Termite,Tiger,Toad,Trout,Turtle,Vulture,Wallaby,Walrus,Wasp,Weasel,Whale,Wolf,Wolverine,Wombat,Woodcock,Woodpecker,Worm,Wren,Yak,Zebra".split(",");
  var adjectives = "Amazing,Angry,Black,Cunning,Dark,Dangerous,Fantastic,Flash,Flying,Great,Green,Grey,Magic,Nasty,Rapid,Reactive,Red,Silly,Speedy,Stealthy,Striking,Stunning,Swift,The,White,Wicked,Wild".split(",");
  var now = new Date(); // For "random" nickname
  var nickname = adjectives[now%adjectives.length]+" "+animals[now%animals.length];
  
  // The board class.
  var Board = function() {
    var self = this;

    // ------ Direct State ------------------------------------------
    // Here are the observables that contain the raw state of the UI.
    // --------------------------------------------------------------
    
    
    // ------ Derived State --------------------------------------
    // Here are the *computed* observables we use to drive the UI.
    // -----------------------------------------------------------

    // ------ Responses -------------------------------
    // How we respond to messages from the game server.
    // ------------------------------------------------
    
    
    // ------ Actions -----------------------
    // Methods that manipulate our state.
    // Can be from the server, or via the UI.
    // --------------------------------------
    
    // UI Action - try to move at the given row + column
  };
  
  // Apply knockout model to UI.
});
