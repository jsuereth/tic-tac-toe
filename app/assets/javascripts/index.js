$(function() {

  var connection = (function(){
    var socket = new WebSocket(jsRoutes.controllers.SocketController.connectToGameServer().webSocketURL());
    var $socket = $(socket); // Evented
    var alive = ko.observable(false);

    $socket.bind("open", function(e) {
      alive(true);
      console.log("OPEN: ", e);
    })

    $socket.bind("error", function(e) {
      alive(false);
      console.log("ERROR: ", e);
    });
    
    function sendMessage(jsonOrString) {
      var msg = typeof jsonOrString == 'string' ? jsonOrString :  JSON.stringify(jsonOrString);
      socket.send(msg);
    }

    return {
      send: sendMessage,
      socket: $socket
    }
  }());

  game = function(){
    var self = this;
    self.allGames = ko.observableArray([]);
  }

  connection.socket.bind("message", function(e) {
    console.log(e);
  });

});