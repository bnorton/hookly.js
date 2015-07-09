var hookly = {},
  defaults,
  channels,
  connections,
  clone = function(obj) {
    return JSON.parse(JSON.stringify(obj));
  };

hookly.reset = function() {
  delete hookly.token;
  delete hookly.uid;
  delete hookly.adapter;

  defaults = {};
  channels = {};
  connections = {};

  return hookly;
};

hookly.start = function(token, uid, url) {
  hookly.token = token;
  hookly.uid = uid;
  hookly.url = url || 'https://hookly.herokuapp.com';

  defaults.token = token;
  hookly.uid && (defaults.uid = uid);

  hookly.adapter = new hookly.Adapter(hookly.url);
  hookly.adapter.connect(defaults);
};

hookly.on = function(channel, callback) {
  channels[channel] || (channels[channel] = []);
  channels[channel].push(callback);

  var opts = clone(defaults);
  opts.slug = channel;

  hookly.adapter.channel(opts);
};

hookly.notify = function(channel, uid, options) {
  if(!options) {
    options = uid;
    uid = null;
  }

  var opts = clone(defaults);
  opts.to = { slug: channel };
  opts.body = options;

  uid && (opts.to.uid = uid);

  hookly.adapter.send(opts);
};

/*
 * Adapter
 *   Connect to and translate data into the the communication layer.
 */

hookly.Adapter = function(url) {
  var that = {
    url: url,
    io: require('socket.io-client'),
    initialized: false,
    connected: false
  }, sendQueue = [];

  that.socket = that.io(that.url);

  that.connect = function(options) {
    if(that.initialized) {
      console.warn('You only need to connect once');
      return;
    }

    that.initialized = true;
    that.options = options;

    that.socket.on('connect', function() {
      that.connected = true;
      that.socket.emit('connections:create', JSON.stringify(that.options));

      for(var key in connections) {
        that.socket.emit('connections:update', JSON.stringify(connections[key]));
      }

      flushSendQueue();
    });

    that.socket.on('disconnect', function() {
      that.connected = false;
    });

    that.socket.on('message', that.call);
  };

  that.channel = function(options) { var channel;
    if(connections[(channel = options.slug)])
      return;

    connections[channel] = options;

    that.socket.emit('connections:update', JSON.stringify(options));
  };

  that.call = function(data) {
    data = JSON.parse(data);

    var fns = channels[data.slug] || [];
    for(var i=fns.length-1; i>=0; --i) {
      fns[i].call(hookly , clone(data.body), { kind: data.kind });
    }
  };

  that.send = function(options) {
    sendQueue.push(options);

    if(that.connected) {
      flushSendQueue();
    }
  };

  return that;

  function flushSendQueue() {
    for(var i=0; i<sendQueue.length; ++i) {
      that.socket.emit('notes:create', JSON.stringify(sendQueue[i]));
    }

    sendQueue = [];
  }
};

exports = module.exports = hookly.reset();
