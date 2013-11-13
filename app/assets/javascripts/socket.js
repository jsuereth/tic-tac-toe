// Helper to handle binding to a socket and dealing with messages.
window.server = (function(){
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

    function send(jsonOrString) {
      var msg = typeof jsonOrString == 'string' ? jsonOrString :  JSON.stringify(jsonOrString);
      if(!alive()) {
         bufferedMessages.push(msg);
      } else {
        socket.send(msg);
      }
    }

    function setMessageHandler(handler) {
       var realListener = function(msg) {
        // TODO - Handle failrues
          var obj = JSON.parse(msg.data);
          console.debug('SOCKET Received: ', obj);
          handler(obj)
       }
       socket.onmessage = realListener;
    }

    return {
      send: send,
      setMessageHandler: setMessageHandler
    }
})();


