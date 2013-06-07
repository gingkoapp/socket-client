// Sync Backbone.Collection with Socket.io
// https://github.com/gingko-io/backbone-socket

;(function(Backbone, _) {
  'use strict';

  var Socket = Backbone.Socket = function(options) {
    this.cid = _.uniqueId('socket');
    this.initialize.apply(this, options);
  };

  _.extend(Socket.prototype, Backbone.Events, {
    // convention to define constructor
    initialize: function() {},
  });

  Socket.extend = Backbone.Model.extend;
}).call(this, Backbone, _);
