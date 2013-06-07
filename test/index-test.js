describe('Backbone.Socket', function() {
  'use strict';

  var expect = chai.expect;
  var Cards  = Backbone.Collection.extend({ socket: 'cards', url: 'api/cards' });
  var Trees  = Backbone.Collection.extend({ socket: 'trees', url: 'api/trees' });
  var ivan, alex, dima;

  sinon.stub($, 'ajax');

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

  it('ignores events with socket: true', function(done) {
    ivan.cards.remove(ivan.cards.get(1), { socket: true });

    alex.manager.on('remove-cards', done);
    dima.manager.on('remove-cards', done);

    _.delay(done, 100);
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

  it('emits change event', function(done) {
    var next = _.after(4, function() {
      expect(dima.trees.get(1).get('name')).equal('t1');
      expect(ivan.trees.get(1).get('name')).equal('t1');
      expect(alex.trees.get(2).get('name')).equal('t2');
      expect(alex.trees.get(2).get('name')).equal('t2');
      done();
    });

    alex.trees.get(1).save({ name: 't1' });
    ivan.trees.get(2).save({ name: 't2' });

    alex.manager.on('change-trees', next);
    ivan.manager.on('change-trees', next);
    dima.manager.on('change-trees', next);
  });
});
