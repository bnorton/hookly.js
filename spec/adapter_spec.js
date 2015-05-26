describe('Adapter', function() {
  var hookly = require('../lib/index'),
    adapter, socket, onMessages, onCallbacks;

  beforeEach(function() {
    hookly.reset();
    hookly.start('a', 'b');

    onMessages = []; onCallbacks = [];

    adapter = new hookly.Adapter('connect-string');
    socket = adapter.socket;

    spyOn(socket, 'emit');
    spyOn(socket, 'on').and.callFake(function(a,b) {
      onMessages.push(a); onCallbacks.push(b);
    });
  });

  it('should not be initialized', function() {
    expect(adapter.initialized).toBe(false);
  });

  it('should not be connected', function() {
    expect(adapter.connected).toBe(false);
  });

  describe('#connect', function() {
    beforeEach(function() {
      adapter.connect({foo: 'bar'});
    });

    it('should be initialized', function() {
      expect(adapter.initialized).toBe(true);
    });

    it('should not be connected', function() {
      expect(adapter.connected).toBe(false);
    });

    it('should have the url', function() {
      expect(adapter.url).toBe('connect-string');
    });

    it('should have the options', function() {
      expect(adapter.options).toEqual({foo: 'bar'});
    });

    it('should listen for the defaults', function() {
      expect(onMessages.length).toBe(3);
      expect(onCallbacks.length).toBe(3);
    });

    it('should listen for connection', function() {
      expect(onMessages[0]).toBe('connect');
      expect(typeof onCallbacks[0]).toBe('function');
    });

    it('should listen for disconnect', function() {
      expect(onMessages[1]).toBe('disconnect');
      expect(typeof onCallbacks[1]).toBe('function');
    });

    it('should listen for messages', function() {
      expect(onMessages[2]).toBe('message');
      expect(onCallbacks[2]).toBe(adapter.call);
    });

    describe('when the connection is made', function() {
      beforeEach(function() {
        onCallbacks[0]();
      });

      it('should be connected', function() {
        expect(adapter.connected).toBe(true);
      });

      it('should create the connection', function() {
        expect(socket.emit.calls.count()).toBe(1);
        expect(socket.emit).toHaveBeenCalledWith('connections:create', JSON.stringify({foo: 'bar'}));
      });

      describe('when the connection is dropped', function() {
        beforeEach(function() {
          onCallbacks[1]();
        });

        it('should not be connected', function() {
          expect(adapter.connected).toBe(false);
        });

        describe('when the connection is restored', function() {
          it('should re-create the connection', function() {
            onCallbacks[0]();

            expect(socket.emit.calls.count()).toBe(2);
            expect(socket.emit).toHaveBeenCalledWith('connections:create', JSON.stringify({foo: 'bar'}));
          });

          it('should not be connected', function() {
            onCallbacks[0]();

            expect(adapter.connected).toBe(true);
          });

          describe('when there are other listeners', function() {
            beforeEach(function() {
              hookly.on('#transactions', function() {});
              hookly.on('#chats', function() {});

              onCallbacks[0]();
            });

            it('should re-create the connection', function() {
              expect(socket.emit.calls.count()).toBe(4);
              expect(socket.emit).toHaveBeenCalledWith('connections:update', JSON.stringify({ token: 'a', uid: 'b', slug: '#transactions' }));
              expect(socket.emit).toHaveBeenCalledWith('connections:update', JSON.stringify({ token: 'a', uid: 'b', slug: '#chats' }));
            });
          });
        });
      });
    });
  });

  describe('#channel', function() {
    var opts;

    beforeEach(function() {
      opts = { foo: 'bar', slug: '#updates' };
      adapter.channel(opts);
    });

    it('should update the connection', function() {
      expect(socket.emit.calls.count()).toBe(1);
      expect(socket.emit).toHaveBeenCalledWith('connections:update', JSON.stringify(opts));
    });

    describe('when called with another channel', function() {
      beforeEach(function() {
        opts.slug = '#creates';

        adapter.channel(opts);
      });

      it('should update the connection', function() {
        expect(socket.emit.calls.count()).toBe(2);
        expect(socket.emit).toHaveBeenCalledWith('connections:update', JSON.stringify({foo: 'bar', slug: '#creates'}));
      });
    });

    describe('when called again', function() {
      beforeEach(function() {
        opts.slug = '#updates';

        adapter.channel(opts);
        adapter.channel(opts);
      });

      it('should not update the connection', function() {
        expect(socket.emit.calls.count()).toBe(1);
      });
    });
  });

  describe('#call', function() {
    var onRequests;

    beforeEach(function() {
      onRequests = [];
    });

    describe('when listening', function() {
      beforeEach(function() {
        hookly.on('#requests', function(a) {
          onRequests.push(a);
        });

        adapter.call(JSON.stringify({ kind: 'note', slug: '#requests', body: {id: 6, text: 'I have a problem'} }));
      });

      it('should delegate the message', function() {
        expect(onRequests.length).toBe(1);
        expect(onRequests[0]).toEqual({id: 6, text: 'I have a problem'});
      });

      describe('when other messages are received', function() {
        beforeEach(function() {
          adapter.call(JSON.stringify({ kind: 'relay', slug: '#updates', body: {id: 19} }));
        });

        it('should not have delegated the message', function() {
          expect(onRequests.length).toBe(1);
          expect(onRequests[0].id).toBe(6);
        });
      });
    });
  });

  describe('#send', function() {
    var opts;

    beforeEach(function() {
      opts = { foo: 'baz' };

      adapter.connect({});
      adapter.connected = true;
    });

    it('should create the note', function() {
      adapter.send(opts);
      expect(socket.emit).toHaveBeenCalledWith('notes:create', JSON.stringify({ foo: 'baz' }));
    });

    describe('when the adapter is disconnected', function() {
      beforeEach(function() {
        expect(onMessages[1]).toBe('disconnect');

        onCallbacks[1]();
        adapter.send(opts);
      });

      it('should not create the note', function() {
        expect(socket.emit).not.toHaveBeenCalled();
      });

      describe('when it reconnects', function() {
        beforeEach(function() {
          expect(onMessages[0]).toBe('connect');

          onCallbacks[0]();
        });

        it('should create the queued note', function() {
          expect(socket.emit).toHaveBeenCalledWith('notes:create', JSON.stringify({ foo: 'baz' }));
        });
      });
    });
  });
});
