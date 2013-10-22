$(function() {
  var wsUrl = jsRoutes.controllers.SocketController.connectToGameServer().webSocketURL();
  //window.gameEngine = new WebSocket(wsUrl)
  window.wsUrl = wsUrl;
})