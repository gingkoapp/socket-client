/* globals Backbone, _ */
;(function(Backbone, _) {
'use strict';

// reserved type of sync events
var RESERVED = ['add', 'change', 'remove'];

var Socket = Backbone.Socket = function(options) {
  if (!options) options = {};

  this.socket = window.io.connect(options.url || '/', options);
  this.active = false;
  this.treeId = null;
  this.collections = {};
  this.validators  = {}

  // listen `sync` event
  this.subscribe('sync', this.onsync);

  // emit viewers
  this.subscribe('viewers', function(viewers) {
    this.active = viewers.length > 1;
    this.trigger('viewers', viewers);
  });

  // join current room on reconect
  this.subscribe('reconnect', function() {
    this.join(this.treeId);
  });
};

_.extend(Socket.prototype, Backbone.Events);

// Convinient method to change current room.
// It changes room after socket connected.
Socket.prototype.join = function(treeId) {
  this.treeId = treeId;
  if (this.socket.socket.connected)
    this.socket.emit('tree', treeId);
  else
    _.delay(this.join.bind(this, treeId), 50);
};

// Emit specific event
Socket.prototype.emit = function(event, json) {
  if (!this.active) return;
  if (~RESERVED.indexOf(event)) throw new Error(event + ' is reserved event');

  json.event    = event;
  json.socketId = this.socketId();
  this.socket.emit('sync', json);
};

// Sync `collection` in the room.
Socket.prototype.add = function(collection, name, validator) {
  if (!name || this.collections[name])
    throw new TypeError('Collection has to have unique name or already added');

  this.validators[name]  = validator;
  this.collections[name] = collection;

  collection.on('add',    this.handleEvent('add',    name), this);
  collection.on('change', this.handleEvent('change', name), this);
  collection.on('remove', this.handleEvent('remove', name), this);

  return this;
};

// Helper, which helps to manage changes of collection.
Socket.prototype.handleEvent = function(event, name) {
  return function(model, collection, options) {
    if (!this.active) return; // return if only one viewer
    if (!options) options = collection; // for change event
    if (options && options.socketId) return; // prevent updates after sync

    this.socket.emit('sync', {
      name: name,
      event: event,
      socketId: this.socketId(),
      json: model.toJSON()
    });
  };
};

// Handles `sync` event to update collection based on received data.
Socket.prototype.onsync = function(data) {
  if (!~RESERVED.indexOf(data.event)) return this.trigger(data.event, data);

  // handle collection's event
  var collection = this.collections[data.name], model;
  var validator  = this.validators[data.name];
  var json       = _.extend(data.json, { socketId: data.socketId });

  // validate json to prevent alient content on socket.io bugs
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

// internal method to subscribe on socket.io events
Socket.prototype.subscribe = function(event, cb) {
  this.socket.on(event, cb.bind(this));
};

// shortcut for socket id
Socket.prototype.socketId = function() {
  return this.socket.socket.sessionid;
};

}).call(this, Backbone, _);
