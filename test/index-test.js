describe('Backbone.Socket', function() {
  'use strict';

  var expect = chai.expect;
  var Cards  = Backbone.Collection.extend({ socket: 'cards' });
  var Trees  = Backbone.Collection.extend({ socket: 'trees' });
  var ivan, alex, dima;

  function createUser(name, cb) {
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

    user.socket.on('connect', function() {
      user.manager = new Backbone.Socket(user.socket);
      user.manager.add(user.cards);
      user.manager.add(user.trees);
      cb(null, user);
    });
  }

  before(function(done) {
    async.parallel([
      function(cb) { createUser('ivan', cb); },
      function(cb) { createUser('alex', cb); },
      function(cb) { createUser('dima', cb); }
    ], function(err, result) {
      ivan = result[0];
      alex = result[1];
      dima = result[2];
      done(err);
    });
  });

  after(function() {
    ivan.socket.disconnect();
    alex.socket.disconnect();
    dima.socket.disconnect();
  });

  it('emits add event', function(done) {
    ivan.cards.add({ id: 4, name: 'test add', treeId: 1 });
    var next = _.after(2, done.bind(null, null));

    alex.manager.on('add-cards', function(data) {
      expect(_.keys(data)).length(4);
      expect(data.id).equal(4);
      expect(data.socketId).equal(ivan.socket.socket.sessionid);
      expect(data.t).exists;
      expect(_.keys(data.json)).length(3);
      next();
    });
    dima.manager.on('add-cards', next);
  });
});
