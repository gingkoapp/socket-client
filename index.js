// Sync Backbone.Collection with Socket.io
// https://github.com/gingko-io/backbone-socket

;(function(Backbone, _) {
  'use strict';

  var Socket = Backbone.Socket = function(socket) {
    this.cid    = _.uniqueId('socket');
    this.socket = socket;
    this.initialize.apply(this, arguments);
  };

  _.extend(Socket.prototype, Backbone.Events, {
    initialize: function() {},

    add: function(collection) {
      collection.on('add', this.emitEvent('add', collection), this);
      collection.on('change', this.emitEvent('change', collection), this);
      collection.on('remove', this.emitEvent('remove', collection), this);
      return this;
    },

    emitEvent: function(event, collection) {
      var name = event + '-' + collection.socket;

      this.socket.on(name, function(data) {
        this['on' + event].call(this, collection, data);
        this.trigger(name, data);
      }.bind(this));

      return function(model, collection, options) {
        if (!options) options = collection; // for change event
        if (options.socket) return;

        var json = _.extend(model.toJSON(), {
          t: Date.now(), id: model.id, socketId: this.socket.socket.sessionid
        });

        this.socket.emit(name, json);
      };
    },

    onadd: function(collection, data) {
      collection.add(data.json, { socket: true });
    },

    onchange: function(collection, data) {
      var model = collection.get(data.id);
      if (!model) return;
      model.set(data.json, { socket: true });
    },

    onremove: function(collection, data) {
      var model = collection.get(data.id);
      if (!model) return;
      collection.remove(data.json, { socket: true });
    }
  });

  Socket.extend = Backbone.Model.extend;
}).call(this, Backbone, _);
