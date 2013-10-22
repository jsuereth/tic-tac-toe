$(function() {
  var wsUrl = jsRoutes.controllers.SocketController.connectToGameServer().webSocketURL();
  var gameEngine = new WebSocket(wsUrl)
  
  
  gameEngine.onmessage = function(msg) {
	  console.debug("Got message: ", msg)
	  // Append to a div....
	  $('#messages').text(msg.data); 
  }
  
  function sendMessage(msgOrString) {
	var msg = (typeof(msgOrString) == 'string') ? msgOrString :  JSON.stringify(msgOrString);
	gameEngine.send(msg);	
  }
  
  
  $('#sendMessage').click(function() {
	 var raw = $('#nextmsg').val();
	 var obj = eval('(' + raw + ')');
	 sendMessage(obj);
  });
})