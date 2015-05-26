
var hookly = {},
  defaults,
  channels,
  connections,
  adapter;

 var clone = require('clone');

hookly.reset = function() {
  delete hookly.token;
  delete hookly.uid;

  defaults = {};
  channels = {};
  connections = {};
  adapter = null;

  return hookly;
};

hookly.start = function(token, uid) {
  hookly.token = token;
  hookly.uid = uid;

  defaults.token = token;
  hookly.uid && (defaults.uid = uid);

  adapter = new hookly.Adapter('https://hookly.herokuapp.com');
  adapter.connect(defaults);
};

hookly.on = function(channel, callback) {
  channels[channel] || (channels[channel] = []);
  channels[channel].push(callback);

  var opts = clone(defaults);
  opts.slug = channel;

  adapter.channel(opts);
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

  adapter.send(opts);
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
  };

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

      that.socket.emit('connections:create', JSON.stringify(options));
      that.socket.on('message', that.call);
    });

    that.socket.on('disconnect', function() {
      that.connected = false;
    });

    // that.channel(options, 'create'); // Add things to options
    //that.socket.emit('connect:create', options); // This is who I am as a user
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
    that.socket.emit('notes:create', JSON.stringify(options));
  };

  return that;
};

exports = module.exports = hookly.reset();
