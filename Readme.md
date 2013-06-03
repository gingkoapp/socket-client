# backbone-socket

## Example

```js
/**
 * Define collection and Backbone.Socket instance
 */

var Notes = Backbone.Collection.extend({
  // required option to specify namespace
  // notes:add, notes:change, notes:remove
  // also you can specify socketEvents: { add: '1', change: '2', remove: '3' }
  socket: 'notes'
});

var SocketManager = Backbone.Socket.extend({
  // prepare data to Object(id, json, socket) format
  parse: function(data) {
    return { id: data.noteId, json: data.json, socket: data.socketId };
  }
});

/**
 * Use it with socket.io
 */

// connect to socket.io
var socket = io.connect();

// define collection
var notes = new Notes([
  { id: 1, name: 'create plugin for backbone' },
  { id: 2, name: 'with support of socket.io' },
  { id: 3, name: 'to sync data with server simpler' }
]);

// create Backbone.Socket instance with 2 required options: collection and socket
var notesSocket = new SocketManager({ collection: notes, socket: socket });

// supports after:remove and after:remove:<collectionName>
notesSocket.on('after-remove:notes', function(data) {
  Backbone.trigger('sockets:note-remove', data.id, data.socket);
});
```

## Licence

  Aleksey Kulikov, MIT
