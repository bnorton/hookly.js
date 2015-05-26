describe('hookly', function() {
  var adapter,
    message,
    hookly = require('../lib/index'),
    receiveMessage = function() {
      adapter.call(message);
    };

  beforeEach(function() {
    hookly.reset();
    adapter = new hookly.Adapter('connect-string');
    message = null;

    spyOn(hookly, 'Adapter').and.returnValue(adapter);
    spyOn(adapter, 'connect');
    spyOn(adapter, 'channel');
    spyOn(adapter, 'send');

    hookly.start('token-123');
  });

  describe('.start', function() {
    it('should have the token', function() {
      expect(hookly.token).toBe('token-123');
    });

    it('should connect the adapter', function() {
      expect(adapter.connect).toHaveBeenCalledWith({ token: 'token-123' });
    });

    describe('when given a user identifier', function() {
      beforeEach(function() {
        hookly.start('token-123', 'user-identifier-123');
      });

      it('should have the user identifier', function() {
        expect(hookly.uid).toBe('user-identifier-123');
      });

      it('should connect the adapter', function() {
        expect(adapter.connect).toHaveBeenCalledWith({ token: 'token-123', uid: 'user-identifier-123' });
      });
    });
  });

  describe('.on', function() {
    var onArguments;

    beforeEach(function() {
      onArguments = null;

      hookly.on('#updates', function() {
        onArguments = arguments;
      });
    });

    it('should connect to the channel', function() {
      expect(adapter.channel).toHaveBeenCalledWith({ token: 'token-123', slug: '#updates' })
    });

    describe('when we know who the user is', function() {
      beforeEach(function() {
        hookly.start('token-445', 'user-identifier-98');

        hookly.on('#updates', function() { onArguments = arguments; });
      });

      it('should connect to the channel', function() {
        expect(adapter.channel).toHaveBeenCalledWith({ token: 'token-445', uid: 'user-identifier-98', slug: '#updates' })
      });
    });

    describe('receiving a note', function() {
      beforeEach(function() {
        message = JSON.stringify({ kind: 'note', slug: '#updates', body: { id: 5, name: 'New name' } });
      });

      it('should notify with the message payload', function() {
        receiveMessage();

        expect(onArguments.length).toBe(2);
        expect(onArguments[0]).toEqual({ id: 5, name: 'New name' });
        expect(onArguments[1]).toEqual({ kind: 'note' });
      });
    });

    describe('receiving a relay', function() {
      beforeEach(function() {
        message = JSON.stringify({ kind: 'relay', slug: '#updates', body: { id: 9, name: 'Other name' } });
      });

      it('should notify with the message payload', function() {
        receiveMessage();

        expect(onArguments.length).toBe(2);
        expect(onArguments[0]).toEqual({ id: 9, name: 'Other name' });
        expect(onArguments[1]).toEqual({ kind: 'relay' });
      });
    });
  });

  describe('.notify', function() {
    it('should send the message to the adapter', function() {
      hookly.notify('#updates', {id: 19, name: 'Client name'});

      expect(adapter.send).toHaveBeenCalledWith({ token: 'token-123', to: { slug: '#updates' }, body: { id: 19, name: 'Client name'} })
    });

    describe('when we know who this user is', function() {
      beforeEach(function() {
        hookly.start('token-456', 'user-identifier-123');
        hookly.notify('#updates', {id: 22, name: 'Other name'});
      });

      it('should send the message to the adapter', function() {
        expect(adapter.send).toHaveBeenCalledWith({ token: 'token-456', uid: 'user-identifier-123', to: { slug: '#updates' }, body: { id: 22, name: 'Other name'} })
      });
    });

    describe('when given a target identifier', function() {
      beforeEach(function() {
        hookly.notify('#updates', 446, {id: 22, name: 'Other name'});
      });

      it('should send the message to the adapter', function() {
        expect(adapter.send).toHaveBeenCalledWith({ token: 'token-123', to: { slug: '#updates', uid: 446 }, body: { id: 22, name: 'Other name'} })
      });
    });
  });
});
