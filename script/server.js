var socketServer = require('socket-server');
var server = require('http').createServer();

socketServer(server);
server.listen(7358);
