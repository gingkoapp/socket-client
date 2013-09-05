const socketServer = require('socket-server');
const server       = require('http').createServer();

socketServer(server);
server.listen(7358);
