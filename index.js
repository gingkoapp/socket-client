var Backbone = require('backbone');
var _ = require('underscore');
var io = require('./vendor/socket.io-client.min');

/**
 * Reserved sync events.
 */

var RESERVED = ['add', 'change', 'remove'];

/**
 * Expose `Socket`.
 */

module.exports = Socket;

/**
 * Initialize new `Socket` with socket.io-client `ops`.
 *
 * @param {Object} ops
 */

function Socket(ops) {
  if (!ops) ops = {};
  var that = this;

  this.socket = io.connect(ops.url || '/', ops);
  this.active = false;
  this.trees = [];
  this.collections = {};
  this.validators = {};

  // listen `sync` event
  this.socket.on('sync', this.onsync.bind(this));

  // emit viewers
  this.socket.on('viewers', function(viewers) {
    that.active = viewers.length > 1;
    that.trigger('viewers', viewers);
  });

  // join current room on reconect
  this.socket.on('reconnect', function() {
    that.join(that.trees);
  });
}

/**
 * Mixins.
 */

_.extend(Socket.prototype, Backbone.Events);

/**
 * Convinient method to change current room.
 * It changes room after socket connected.
 *
 * @param {Array} trees
 */

Socket.prototype.join = function(trees) {
  this.trees = trees;
  if (this.socket.socket.connected) {
    this.socket.emit('subscribe', trees);
  } else {
    setTimeout(this.join.bind(this, trees), 50);
  }
};

/**
 * Emit specific event.
 *
 * @param {String} event
 * @param {Object} json (also add event and socketId)
 */

Socket.prototype.emit = function(event, json) {
  if (!this.active) return;
  json.event = event;
  json.socketId = this.socketId();
  this.socket.emit('sync', json);
};

/**
 * Sync `collection` in the room.
 *
 * @param {Backbone.Collection} collection
 * @param {String} name
 * @param {Function} [validator]
 * @return {Socket}
 */

Socket.prototype.add = function(collection, name, validator) {
  if (!name || this.collections[name])
    throw new TypeError('Collection has to have unique name or already added');

  this.validators[name] = validator;
  this.collections[name] = collection;

  collection.on('add', eventHandler('add', name), this);
  collection.on('change', eventHandler('change', name), this);
  collection.on('remove', eventHandler('remove', name), this);

  return this;

  function eventHandler(event, name) {
    return function(model, collection, options) {
      if (!this.active) return; // return if only one viewer
      if (!options) options = collection; // for change event
      if (options && options.socketId) return; // prevent updates after sync

      this.emit(event, { name: name, json: model.toJSON() });
    };
  }
};

/**
 * Handles `sync` event to update collection based on received data.
 *
 * @param {Object} data
 */

Socket.prototype.onsync = function(data) {
  // ignore events except reserved
  if (!~RESERVED.indexOf(data.event)) return this.trigger(data.event, data);

  // handle collection's event
  var collection = this.collections[data.name], model;
  var validator  = this.validators[data.name];
  var json = _.extend(data.json, { socketId: data.socketId });

  // validate json to prevent alien content or socket.io bugs
  if (validator && !validator(data.json)) return;

  switch (data.event) {
    case 'add':
      collection.add(data.json, { socketId: data.socketId });
      break;

    case 'change':
      model = collection.get(data.json._id);
      if (model) model.set(data.json, { socketId: data.socketId });
      break;

    case 'remove':
      model = collection.get(data.json._id);
      if (model) collection.remove(model, { socketId: data.socketId });
      break;
  }

  this.trigger(data.name + ':' + data.event, json);
};

/**
 * Get id of current socket.
 *
 * @return {String}
 */

Socket.prototype.socketId = function() {
  return this.socket.socket.sessionid;
};
