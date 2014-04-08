require('functionbind');
var expect   = require('chai').expect;
var async    = require('async');
var _        = require('underscore');
var Backbone = require('backbone');
var Socket   = require('socket-client');

describe('socket-client', function() {
  var Cards    = Backbone.Collection.extend({ socketName: 'cards', url: 'api/cards' });
  var Trees    = Backbone.Collection.extend({ socketName: 'trees', url: 'api/trees' });
  var ivan, alex, dima;

  Backbone.Model.prototype.idAttribute = '_id';
  Backbone.sync = function() {}; // stub ajax calls

  function createUser(name, cb) {
    var user = { name: name };

    user.cards = new Cards([
      { _id: 1, name: 'create plugin for backbone', treeId: 1 },
      { _id: 2, name: 'with support of socket.io', treeId: 1 },
      { _id: 3, name: 'to sync data with server simpler', treeId: 2 }
    ]);

    user.trees = new Trees([
      { _id: 1, name: 'Tree 1' },
      { _id: 2, name: 'Tree 2' }
    ]);

    user.socket = new Socket({ 'force new connection': true, url: 'http://localhost:7358' })
      .add(user.cards, 'cards', validateCard)
      .add(user.trees, 'trees');

    user.socket.join(1);
    user.socket.once('viewers', function() { cb(null, user) });
  }

  // dummy validator
  function validateCard(json) {
    return json.treeId === 1 || json.treeId === 2;
  }

  beforeEach(function(done) {
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

  afterEach(function() {
    ivan.socket.socket.disconnect();
    alex.socket.socket.disconnect();
    dima.socket.socket.disconnect();
  });

  it('ignores events with socketId: true', function(done) {
    ivan.cards.remove(ivan.cards.get(1), { socketId: ivan.socket.socketId() });

    alex.socket.on('remove-cards', done);
    dima.socket.on('remove-cards', done);

    _.delay(done, 100);
  });

  it('emits add event', function(done) {
    ivan.cards.add({ _id: 4, name: 'test add', treeId: 1 });

    var next = _.after(2, function() {
      expect(alex.cards).length(4);
      expect(dima.cards).length(4);
      done();
    });

    alex.socket.on('cards:add', function(data) {
      expect(_.keys(data)).length(4);
      expect(data._id).equal(4);
      expect(data.socketId).equal(ivan.socket.socketId());
      next();
    });

    dima.socket.on('cards:add', next);
  });

  it('emits change event', function(done) {
    var next = _.after(4, function() {
      expect(dima.trees.get(1).get('name')).equal('t1');
      expect(ivan.trees.get(1).get('name')).equal('t1');
      expect(dima.trees.get(2).get('name')).equal('t2');
      expect(alex.trees.get(2).get('name')).equal('t2');
      done();
    });

    alex.trees.get(1).save({ name: 't1' });
    ivan.trees.get(2).save({ name: 't2' });

    ivan.socket.on('trees:change', next);
    alex.socket.on('trees:change', next);
    dima.socket.on('trees:change', next);
  });

  it('emit remove event', function(done) {
    var next = _.after(6, function() {
      expect(dima.cards).length(0);
      expect(ivan.cards).length(0);
      done();
    });

    ivan.cards.remove(ivan.cards.get(1));
    ivan.cards.remove(ivan.cards.get(2));
    ivan.cards.remove(ivan.cards.get(3));

    alex.socket.on('cards:remove', next);
    dima.socket.on('cards:remove', next);
  });

  it('uses validator to prevent alient content', function(done) {
    alex.cards.get(1).save({ treeId: 3 });

    ivan.socket.on('cards:change', done);
    dima.socket.on('cards:change', done);

    _.delay(done, 100);
  });
});
