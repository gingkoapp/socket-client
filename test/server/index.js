var io = require('socket.io').listen(7358);
var _  = require('underscore');

io.sockets.on('connection', function (socket) {
  function broadcast(event) {
    socket.on(event, function (data) {
      socket.broadcast.emit(event, {
        id:       data.id,
        socketId: data.socketId,
        t:        data.t,
        json:     _.omit(data, ['socketId', 't'])
      });
    });
  }

  broadcast('add-cards');
  broadcast('change-cards');
  broadcast('remove-cards');
  broadcast('add-trees');
  broadcast('change-trees');
  broadcast('remove-trees');
});
