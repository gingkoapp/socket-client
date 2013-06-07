describe('Backbone.Socket', function() {
  'use strict';

  var expect = chai.expect;
  var Cards  = Backbone.Collection.extend({ socket: 'cards' });
  var Trees  = Backbone.Collection.extend({ socket: 'trees' });

  function createUser(name) {
    var user = { name: name };
    user.socket = io.connect('http://localhost:7358', { 'force new connection': true });
    user.cards = new Cards([
      { id: 1, name: 'create plugin for backbone', treeId: 1 },
      { id: 2, name: 'with support of socket.io', treeId: 1 },
      { id: 3, name: 'to sync data with server simpler', treeId: 2 }
    ]);
    user.trees = new Trees([
      { id: 1, name: 'Tree 1' },
      { id: 2, name: 'Tree 2' }
    ]);

    user.manager = new Backbone.Socket(user.socket);
    user.manager.add(cards);
    user.manager.add(trees);

    return user;
  }

  before(function() {
    ivan = createUser('ivan');
    alex = createUser('alex');
    dima = createUser('dima');
  });

  after(function() {
    ivan.socket.disconnect();
    alex.socket.disconnect();
    dima.socket.disconnect();
  });
});
