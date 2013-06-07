var io = require('socket.io').listen(7357);
var _  = require('underscore');

io.sockets.on('connection', function (socket) {
  function broadcast(event) {
    socket.on(event, function (data) {
      socket.broadcast(event, {
        id:       data.id,
        socketId: data.socketId,
        t:        data.t,
        json:     _.omit(data, 'id', 'socketId', 't')
      });
    });
  }

  broadcats('add-card');
  broadcats('change-card');
  broadcats('remove-card');
  broadcats('add-tree');
  broadcats('change-tree');
  broadcats('remove-tree');
});
