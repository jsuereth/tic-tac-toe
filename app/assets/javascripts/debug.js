$(function() {

  server.setMessageHandler(function(msg) {
	  console.debug("Got message: ", msg)
    if(msg.request != 'ping') {
  	  // Append to a div....
	    $('#messages').append('<pre>' + JSON.stringify(msg) + '</pre>'); 
    }
  });
  
  $('#sendMessage').click(function() {
	  var raw = $('#nextmsg').val();
	  var obj = eval('(' + raw + ')');
	  server.send(obj);
  });
})
