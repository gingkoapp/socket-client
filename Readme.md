# Backbone.Socket

  Sync Backbone.Collection instance with server through socket-server.

## Example

```js
// Define collection and Backbone.Socket instance
var Cards = Backbone.Collection.extend({});

// define collection
var cards = new Cards([
  { id: 1, name: 'create plugin for backbone' },
  { id: 2, name: 'with support of socket.io' },
  { id: 3, name: 'to sync data with server simpler' }
]);

// create Backbone.Socket instance for selected socket
var socketManager = new Backbone.Socket();
socketManager.add(cards, 'cards');

// it triggers event after every sync event from socket
// data has format: { id, socketId, t, json }
// id - id of changed object
// socketId - event initializer
// t - time in miliseconds
// json - object attributes

socketManager.on('remove-cards', function(data) {
  Backbone.trigger('sockets:card-removed', data.id, data.socket);
});
```

## Development

  * `./script/postinstall && component install --dev`
  * `./script/start` - to start watcher and socket server from test/server/index.js
  * `component testem -s`
  * `./script/stop` - to stop server
