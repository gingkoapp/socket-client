var socketServer = require('socket-server');
var server = require('http').createServer();

socketServer(server, 1);
server.listen(7358);
