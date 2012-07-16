// Generated by CoffeeScript 1.3.3
var Events,
  __slice = [].slice;

Events = (function() {

  function Events() {}

  Events.prototype.bind = function(ev, callback) {
    var calls, evs, name, _i, _len, _results;
    evs = ev.split(' ');
    calls = this.hasOwnProperty('_callbacks') && this._callbacks || (this._callbacks = {});
    _results = [];
    for (_i = 0, _len = evs.length; _i < _len; _i++) {
      name = evs[_i];
      calls[name] || (calls[name] = []);
      _results.push(calls[name].push(callback));
    }
    return _results;
  };

  Events.prototype.on = Events.prototype.bind;

  Events.prototype.one = function(ev, callback) {
    return this.bind(ev, function() {
      this.unbind(ev, arguments.callee);
      return callback.apply(this, arguments);
    });
  };

  Events.prototype.trigger = function() {
    var args, callback, ev, list, _i, _len, _ref;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    ev = args.shift();
    list = this.hasOwnProperty('_callbacks') && ((_ref = this._callbacks) != null ? _ref[ev] : void 0);
    if (!list) {
      return;
    }
    for (_i = 0, _len = list.length; _i < _len; _i++) {
      callback = list[_i];
      callback.apply(this, args);
    }
    return true;
  };

  Events.prototype.unbind = function(ev, callback) {
    var cb, i, list, _i, _len, _ref;
    if (!ev) {
      this._callbacks = {};
      return this;
    }
    list = (_ref = this._callbacks) != null ? _ref[ev] : void 0;
    if (!list) {
      return this;
    }
    if (!callback) {
      delete this._callbacks[ev];
      return this;
    }
    for (i = _i = 0, _len = list.length; _i < _len; i = ++_i) {
      cb = list[i];
      if (!(cb === callback)) {
        continue;
      }
      list = list.slice();
      list.splice(i, 1);
      this._callbacks[ev] = list;
      break;
    }
    return this;
  };

  return Events;

})();
// Generated by CoffeeScript 1.3.3
var Hoodie,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Hoodie = (function(_super) {

  __extends(Hoodie, _super);

  Hoodie.prototype.modules = {
    my: {
      store: "LocalStore",
      config: "Config",
      account: "Account",
      remote: "RemoteStore"
    },
    user: "UserStore",
    email: "Email"
  };

  function Hoodie(baseUrl) {
    this.baseUrl = baseUrl != null ? baseUrl : '';
    this.baseUrl = this.baseUrl.replace(/\/+$/, '');
    this._loadModules();
  }

  Hoodie.prototype.request = function(type, path, options) {
    var defaults;
    if (options == null) {
      options = {};
    }
    defaults = {
      type: type,
      url: "" + this.baseUrl + path,
      xhrFields: {
        withCredentials: true
      },
      crossDomain: true,
      dataType: 'json'
    };
    return $.ajax($.extend(defaults, options));
  };

  Hoodie.prototype.defer = $.Deferred;

  Hoodie.prototype.isPromise = function(obj) {
    return typeof obj.done === 'function' && typeof obj.fail === 'function';
  };

  Hoodie.prototype._loadModules = function(context, modules) {
    var instanceName, moduleName, namespace, _results;
    if (context == null) {
      context = this;
    }
    if (modules == null) {
      modules = this.modules;
    }
    _results = [];
    for (instanceName in modules) {
      moduleName = modules[instanceName];
      if (typeof moduleName === 'string') {
        _results.push(context[instanceName] = new Hoodie[moduleName](this));
      } else {
        namespace = instanceName;
        context[namespace] = {};
        _results.push(this._loadModules(context[namespace], modules[namespace]));
      }
    }
    return _results;
  };

  return Hoodie;

})(Events);
// Generated by CoffeeScript 1.3.3
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Hoodie.Account = (function() {

  Account.prototype.username = void 0;

  function Account(hoodie) {
    this.hoodie = hoodie;
    this._handleSignOut = __bind(this._handleSignOut, this);

    this._handleSignIn = __bind(this._handleSignIn, this);

    this.authenticate = __bind(this.authenticate, this);

    this.username = this.hoodie.my.config.get('_account.username');
    this.on('signin', this._handleSignIn);
    this.on('signout', this._handleSignOut);
  }

  Account.prototype.authenticate = function() {
    var defer,
      _this = this;
    defer = this.hoodie.defer();
    if (!this.username) {
      return defer.reject().promise();
    }
    if (this._authenticated === true) {
      return defer.resolve(this.username).promise();
    }
    if (this._authenticated === false) {
      return defer.reject().promise();
    }
    this._authRequest = this.hoodie.request('GET', "/_session");
    this._authRequest.done(function(response) {
      if (response.userCtx.name) {
        _this._authenticated = true;
        _this.username = response.userCtx.name;
        return defer.resolve(_this.username);
      } else {
        _this._authenticated = false;
        delete _this.username;
        _this.hoodie.trigger('account:error:unauthenticated');
        return defer.reject();
      }
    });
    this._authRequest.fail(function(xhr) {
      var error;
      try {
        error = JSON.parse(xhr.responseText);
      } catch (e) {
        error = {
          error: xhr.responseText || "unknown"
        };
      }
      return defer.reject(error);
    });
    return defer.promise();
  };

  Account.prototype.signUp = function(username, password) {
    var data, defer, handleSucces, key, requestPromise,
      _this = this;
    if (password == null) {
      password = '';
    }
    defer = this.hoodie.defer();
    key = "" + this._prefix + ":" + username;
    data = {
      _id: key,
      name: username,
      type: 'user',
      roles: [],
      password: password
    };
    requestPromise = this.hoodie.request('PUT', "/_users/" + (encodeURIComponent(key)), {
      data: JSON.stringify(data),
      contentType: 'application/json'
    });
    handleSucces = function(response) {
      _this.hoodie.trigger('account:signup', username);
      _this._doc._rev = response.rev;
      return _this.signIn(username, password).then(defer.resolve, defer.reject);
    };
    requestPromise.then(handleSucces, defer.reject);
    return defer.promise();
  };

  Account.prototype.signIn = function(username, password) {
    var defer, handleSucces, requestPromise,
      _this = this;
    if (password == null) {
      password = '';
    }
    defer = this.hoodie.defer();
    requestPromise = this.hoodie.request('POST', '/_session', {
      data: {
        name: username,
        password: password
      }
    });
    handleSucces = function(response) {
      _this.hoodie.trigger('account:signin', username);
      _this.fetch();
      return defer.resolve(username, response);
    };
    requestPromise.then(handleSucces, defer.reject);
    return defer.promise();
  };

  Account.prototype.login = Account.prototype.signIn;

  Account.prototype.changePassword = function(currentPassword, newPassword) {
    var data, defer, key,
      _this = this;
    if (currentPassword == null) {
      currentPassword = '';
    }
    defer = this.hoodie.defer();
    if (!this.username) {
      defer.reject({
        error: "unauthenticated",
        reason: "not logged in"
      });
      return defer.promise();
    }
    key = "" + this._prefix + ":" + this.username;
    data = $.extend({}, this._doc);
    delete data.salt;
    delete data.passwordSha;
    data.password = newPassword;
    return this.hoodie.request('PUT', "/_users/" + (encodeURIComponent(key)), {
      data: JSON.stringify(data),
      contentType: "application/json",
      success: function(response) {
        _this.fetch();
        return defer.resolve();
      },
      error: function(xhr) {
        var error;
        try {
          error = JSON.parse(xhr.responseText);
        } catch (e) {
          error = {
            error: xhr.responseText || "unknown"
          };
        }
        return defer.reject(error);
      }
    });
  };

  Account.prototype.signOut = function() {
    var _this = this;
    return this.hoodie.request('DELETE', '/_session', {
      success: function() {
        return _this.hoodie.trigger('account:signout');
      }
    });
  };

  Account.prototype.logout = Account.prototype.signOut;

  Account.prototype.on = function(event, cb) {
    return this.hoodie.on("account:" + event, cb);
  };

  Account.prototype.db = function() {
    var _ref;
    return (_ref = this.username) != null ? _ref.toLowerCase().replace(/@/, "$").replace(/\./g, "_") : void 0;
  };

  Account.prototype.fetch = function() {
    var defer, key,
      _this = this;
    defer = this.hoodie.defer();
    if (!this.username) {
      defer.reject({
        error: "unauthenticated",
        reason: "not logged in"
      });
      return defer.promise();
    }
    key = "" + this._prefix + ":" + this.username;
    this.hoodie.request('GET', "/_users/" + (encodeURIComponent(key)), {
      success: function(response) {
        _this._doc = response;
        return defer.resolve(response);
      },
      error: function(xhr) {
        var error;
        try {
          error = JSON.parse(xhr.responseText);
        } catch (e) {
          error = {
            error: xhr.responseText || "unknown"
          };
        }
        return defer.reject(error);
      }
    });
    return defer.promise();
  };

  Account.prototype.destroy = function() {
    var _this = this;
    return this.fetch().pipe(function() {
      var key;
      key = "" + _this._prefix + ":" + _this.username;
      return _this.hoodie.request('DELETE', "/_users/" + (encodeURIComponent(key)) + "?rev=" + _this._doc._rev);
    });
  };

  Account.prototype._prefix = 'org.couchdb.user';

  Account.prototype._doc = {};

  Account.prototype._handleSignIn = function(username) {
    this.username = username;
    this.hoodie.my.config.set('_account.username', this.username);
    return this._authenticated = true;
  };

  Account.prototype._handleSignOut = function() {
    delete this.username;
    this.hoodie.my.config.remove('_account.username');
    return this._authenticated = false;
  };

  return Account;

})();
// Generated by CoffeeScript 1.3.3
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Hoodie.Config = (function() {

  Config.prototype.type = '$config';

  Config.prototype.id = 'hoodie';

  Config.prototype.cache = {};

  function Config(hoodie, options) {
    var _this = this;
    this.hoodie = hoodie;
    if (options == null) {
      options = {};
    }
    this.clear = __bind(this.clear, this);

    if (options.type) {
      this.type = options.type;
    }
    if (options.id) {
      this.id = options.id;
    }
    this.hoodie.my.store.load(this.type, this.id).done(function(obj) {
      return _this.cache = obj;
    });
    this.hoodie.on('account:signedOut', this.clear);
  }

  Config.prototype.set = function(key, value) {
    var isSilent, update;
    if (this.cache[key] === value) {
      return;
    }
    this.cache[key] = value;
    update = {};
    update[key] = value;
    isSilent = key.charAt(0) === '_';
    return this.hoodie.my.store.update(this.type, this.id, update, {
      silent: isSilent
    });
  };

  Config.prototype.get = function(key) {
    return this.cache[key];
  };

  Config.prototype.clear = function() {
    this.cache = {};
    return this.hoodie.my.store.destroy(this.type, this.id);
  };

  Config.prototype.remove = Config.prototype.set;

  return Config;

})();
// Generated by CoffeeScript 1.3.3
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Hoodie.Email = (function() {

  function Email(hoodie) {
    this.hoodie = hoodie;
    this._handleEmailUpdate = __bind(this._handleEmailUpdate, this);

  }

  Email.prototype.send = function(emailAttributes) {
    var attributes, defer,
      _this = this;
    if (emailAttributes == null) {
      emailAttributes = {};
    }
    defer = this.hoodie.defer();
    attributes = $.extend({}, emailAttributes);
    if (!this._isValidEmail(emailAttributes.to)) {
      attributes.error = "Invalid email address (" + (attributes.to || 'empty') + ")";
      return defer.reject(attributes).promise();
    }
    this.hoodie.my.store.create('$email', attributes).then(function(obj) {
      return _this._handleEmailUpdate(defer, obj);
    });
    return defer.promise();
  };

  Email.prototype._isValidEmail = function(email) {
    if (email == null) {
      email = '';
    }
    return /@/.test(email);
  };

  Email.prototype._handleEmailUpdate = function(defer, attributes) {
    var _this = this;
    if (attributes == null) {
      attributes = {};
    }
    if (attributes.error) {
      return defer.reject(attributes);
    } else if (attributes.deliveredAt) {
      return defer.resolve(attributes);
    } else {
      return this.hoodie.one("remote:updated:$email:" + attributes.id, function(attributes) {
        return _this._handleEmailUpdate(defer, attributes);
      });
    }
  };

  return Email;

})();
// Generated by CoffeeScript 1.3.3

Hoodie.Errors = {
  INVALID_KEY: function(idOrType) {
    var key;
    key = idOrType.id ? 'id' : 'type';
    return new Error("invalid " + key + " '" + idOrType[key] + "': numbers and lowercase letters allowed only");
  },
  INVALID_ARGUMENTS: function(msg) {
    return new Error(msg);
  },
  NOT_FOUND: function(type, id) {
    return new Error("" + type + " with " + id + " could not be found");
  }
};
// Generated by CoffeeScript 1.3.3
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Hoodie.RemoteStore = (function() {

  RemoteStore.prototype.active = true;

  function RemoteStore(hoodie) {
    this.hoodie = hoodie;
    this._handlePushSuccess = __bind(this._handlePushSuccess, this);

    this._handlePullResults = __bind(this._handlePullResults, this);

    this._handlePullError = __bind(this._handlePullError, this);

    this._handlePullSuccess = __bind(this._handlePullSuccess, this);

    this._restartPullRequest = __bind(this._restartPullRequest, this);

    this.sync = __bind(this.sync, this);

    this.push = __bind(this.push, this);

    this.pull = __bind(this.pull, this);

    this.disconnect = __bind(this.disconnect, this);

    this.connect = __bind(this.connect, this);

    this.deactivate = __bind(this.deactivate, this);

    this.activate = __bind(this.activate, this);

    if (this.hoodie.my.config.get('_remote.active') != null) {
      this.active = this.hoodie.my.config.get('_remote.active');
    }
    if (this.active) {
      this.activate();
    }
  }

  RemoteStore.prototype.activate = function() {
    this.hoodie.my.config.set('_remote.active', this.active = true);
    this.hoodie.on('account:signedOut', this.disconnect);
    this.hoodie.on('account:signedIn', this.connect);
    return this.connect();
  };

  RemoteStore.prototype.deactivate = function() {
    this.hoodie.my.config.set('_remote.active', this.active = false);
    this.hoodie.unbind('account:signedIn', this.connect);
    this.hoodie.unbind('account:signedOut', this.disconnect);
    return this.disconnect();
  };

  RemoteStore.prototype.connect = function() {
    this.connected = true;
    return this.hoodie.my.account.authenticate().pipe(this.sync);
  };

  RemoteStore.prototype.disconnect = function() {
    var _ref, _ref1;
    this.connected = false;
    this.hoodie.unbind('store:dirty:idle', this.push);
    if ((_ref = this._pullRequest) != null) {
      _ref.abort();
    }
    return (_ref1 = this._pushRequest) != null ? _ref1.abort() : void 0;
  };

  RemoteStore.prototype.pull = function() {
    this._pullRequest = this.hoodie.request('GET', this._pullUrl(), {
      contentType: 'application/json'
    });
    if (this.connected && this.active) {
      window.clearTimeout(this._pullRequestTimeout);
      this._pullRequestTimeout = window.setTimeout(this._restartPullRequest, 25000);
    }
    return this._pullRequest.then(this._handlePullSuccess, this._handlePullError);
  };

  RemoteStore.prototype.push = function(docs) {
    var doc, docsForRemote;
    if (!$.isArray(docs)) {
      docs = this.hoodie.my.store.changedDocs();
    }
    if (docs.length === 0) {
      return this.hoodie.defer().resolve([]).promise();
    }
    docsForRemote = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = docs.length; _i < _len; _i++) {
        doc = docs[_i];
        _results.push(this._parseForRemote(doc));
      }
      return _results;
    }).call(this);
    this._pushRequest = this.hoodie.request('POST', "/" + (encodeURIComponent(this.hoodie.my.account.db())) + "/_bulkDocs", {
      dataType: 'json',
      processData: false,
      contentType: 'application/json',
      data: JSON.stringify({
        docs: docsForRemote,
        newEdits: false
      })
    });
    return this._pushRequest.done(this._handlePushSuccess(docs, docsForRemote));
  };

  RemoteStore.prototype.sync = function(docs) {
    if (this.active) {
      this.hoodie.unbind('store:dirty:idle', this.push);
      this.hoodie.on('store:dirty:idle', this.push);
    }
    return this.push(docs).pipe(this.pull);
  };

  RemoteStore.prototype.on = function(event, cb) {
    return this.hoodie.on("remote:" + event, cb);
  };

  RemoteStore.prototype._pullUrl = function() {
    var since;
    since = this.hoodie.my.config.get('_remote.seq') || 0;
    if (this.active) {
      return "/" + (encodeURIComponent(this.hoodie.my.account.db())) + "/_changes?include_docs=true&heartbeat=10000&feed=longpoll&since=" + since;
    } else {
      return "/" + (encodeURIComponent(this.hoodie.my.account.db())) + "/_changes?include_docs=true&since=" + since;
    }
  };

  RemoteStore.prototype._restartPullRequest = function() {
    var _ref;
    return (_ref = this._pullRequest) != null ? _ref.abort() : void 0;
  };

  RemoteStore.prototype._handlePullSuccess = function(response) {
    this.hoodie.my.config.set('_remote.seq', response.lastSeq);
    this._handlePullResults(response.results);
    if (this.connected && this.active) {
      return this.pull();
    }
  };

  RemoteStore.prototype._handlePullError = function(xhr, error, resp) {
    if (!this.connected) {
      return;
    }
    switch (xhr.status) {
      case 403:
        this.hoodie.trigger('remote:error:unauthenticated', error);
        return this.disconnect();
      case 404:
        return window.setTimeout(this.pull, 3000);
      case 500:
        this.hoodie.trigger('remote:error:server', error);
        return window.setTimeout(this.pull, 3000);
      default:
        if (!this.active) {
          return;
        }
        if (xhr.statusText === 'abort') {
          return this.pull();
        } else {
          return window.setTimeout(this.pull, 3000);
        }
    }
  };

  RemoteStore.prototype._validSpecialAttributes = ['_id', '_rev', '_deleted', '_revisions', '_attachments'];

  RemoteStore.prototype._parseForRemote = function(obj) {
    var attr, attributes;
    attributes = $.extend({}, obj);
    for (attr in attributes) {
      if (~this._validSpecialAttributes.indexOf(attr)) {
        continue;
      }
      if (!/^_/.test(attr)) {
        continue;
      }
      delete attributes[attr];
    }
    attributes._id = "" + attributes.type + "/" + attributes.id;
    delete attributes.id;
    this._addRevisionTo(attributes);
    return attributes;
  };

  RemoteStore.prototype._generateNewRevisionId = function() {
    var timestamp, uuid;
    this._timezoneOffset || (this._timezoneOffset = new Date().getTimezoneOffset() * 60);
    timestamp = Date.now() + this._timezoneOffset;
    uuid = this.hoodie.my.store.uuid(5);
    return "" + uuid + "#" + timestamp;
  };

  RemoteStore.prototype._addRevisionTo = function(attributes) {
    var currentRevId, currentRevNr, newRevisionId, _ref;
    try {
      _ref = attributes._rev.split(/-/), currentRevNr = _ref[0], currentRevId = _ref[1];
    } catch (_error) {}
    currentRevNr = parseInt(currentRevNr) || 0;
    newRevisionId = this._generateNewRevisionId();
    attributes._rev = "" + (currentRevNr + 1) + "-" + newRevisionId;
    attributes._revisions = {
      start: 1,
      ids: [newRevisionId]
    };
    if (currentRevId) {
      attributes._revisions.start += currentRevNr;
      return attributes._revisions.ids.push(currentRevId);
    }
  };

  RemoteStore.prototype._parseFromPull = function(obj) {
    var id, _ref;
    id = obj._id || obj.id;
    delete obj._id;
    _ref = id.split(/\//), obj.type = _ref[0], obj.id = _ref[1];
    if (obj.createdAt) {
      obj.createdAt = new Date(Date.parse(obj.createdAt));
    }
    if (obj.updatedAt) {
      obj.updatedAt = new Date(Date.parse(obj.updatedAt));
    }
    if (obj.rev) {
      obj._rev = obj.rev;
      delete obj.rev;
    }
    return obj;
  };

  RemoteStore.prototype._parseFromPush = function(obj) {
    var id, _ref;
    id = obj._id || delete obj._id;
    _ref = obj.id.split(/\//), obj.type = _ref[0], obj.id = _ref[1];
    obj._rev = obj.rev;
    delete obj.rev;
    delete obj.ok;
    return obj;
  };

  RemoteStore.prototype._handlePullResults = function(changes) {
    var doc, promise, _changedDocs, _destroyedDocs, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _results,
      _this = this;
    _destroyedDocs = [];
    _changedDocs = [];
    for (_i = 0, _len = changes.length; _i < _len; _i++) {
      doc = changes[_i].doc;
      doc = this._parseFromPull(doc);
      if (doc._deleted) {
        _destroyedDocs.push([
          doc, this.hoodie.my.store.destroy(doc.type, doc.id, {
            remote: true
          })
        ]);
      } else {
        _changedDocs.push([
          doc, this.hoodie.my.store.update(doc.type, doc.id, doc, {
            remote: true
          })
        ]);
      }
    }
    for (_j = 0, _len1 = _destroyedDocs.length; _j < _len1; _j++) {
      _ref = _destroyedDocs[_j], doc = _ref[0], promise = _ref[1];
      promise.then(function(object) {
        _this.hoodie.trigger('remote:destroy', object);
        _this.hoodie.trigger("remote:destroy:" + doc.type, object);
        _this.hoodie.trigger("remote:destroy:" + doc.type + ":" + doc.id, object);
        _this.hoodie.trigger('remote:change', 'destroy', object);
        _this.hoodie.trigger("remote:change:" + doc.type, 'destroy', object);
        return _this.hoodie.trigger("remote:change:" + doc.type + ":" + doc.id, 'destroy', object);
      });
    }
    _results = [];
    for (_k = 0, _len2 = _changedDocs.length; _k < _len2; _k++) {
      _ref1 = _changedDocs[_k], doc = _ref1[0], promise = _ref1[1];
      _results.push(promise.then(function(object, objectWasCreated) {
        var event;
        event = objectWasCreated ? 'create' : 'update';
        _this.hoodie.trigger("remote:" + event, object);
        _this.hoodie.trigger("remote:" + event + ":" + doc.type, object);
        _this.hoodie.trigger("remote:" + event + ":" + doc.type + ":" + doc.id, object);
        _this.hoodie.trigger("remote:change", event, object);
        _this.hoodie.trigger("remote:change:" + doc.type, event, object);
        return _this.hoodie.trigger("remote:change:" + doc.type + ":" + doc.id, event, object);
      }));
    }
    return _results;
  };

  RemoteStore.prototype._handlePushSuccess = function(docs, pushedDocs) {
    var _this = this;
    return function() {
      var doc, i, options, update, _i, _len, _results;
      _results = [];
      for (i = _i = 0, _len = docs.length; _i < _len; i = ++_i) {
        doc = docs[i];
        update = {
          _rev: pushedDocs[i]._rev
        };
        options = {
          remote: true
        };
        _results.push(_this.hoodie.my.store.update(doc.type, doc.id, update, options));
      }
      return _results;
    };
  };

  return RemoteStore;

})();
// Generated by CoffeeScript 1.3.3
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Hoodie.LocalStore = (function() {

  function LocalStore(hoodie) {
    this.hoodie = hoodie;
    this.clear = __bind(this.clear, this);

    if (!this.isPersistent()) {
      this.db = {
        getItem: function() {
          return null;
        },
        setItem: function() {
          return null;
        },
        removeItem: function() {
          return null;
        },
        key: function() {
          return null;
        },
        length: function() {
          return 0;
        },
        clear: function() {
          return null;
        }
      };
    }
    this.hoodie.on('account:signout', this.clear);
  }

  LocalStore.prototype.db = {
    getItem: function(key) {
      return window.localStorage.getItem(key);
    },
    setItem: function(key, value) {
      return window.localStorage.setItem(key, value);
    },
    removeItem: function(key) {
      return window.localStorage.removeItem(key);
    },
    key: function(nr) {
      return window.localStorage.key(nr);
    },
    length: function() {
      return window.localStorage.length;
    },
    clear: function() {
      return window.localStorage.clear();
    }
  };

  LocalStore.prototype.save = function(type, id, object, options) {
    var defer, isNew;
    if (options == null) {
      options = {};
    }
    defer = this.hoodie.defer();
    if (typeof object !== 'object') {
      defer.reject(Hoodie.Errors.INVALID_ARGUMENTS("object is " + (typeof object)));
      return defer.promise();
    }
    object = $.extend({}, object);
    if (id && !this._isValidId(id)) {
      return defer.reject(Hoodie.Errors.INVALID_KEY({
        id: id
      })).promise();
    }
    if (!this._isValidType(type)) {
      return defer.reject(Hoodie.Errors.INVALID_KEY({
        type: type
      })).promise();
    }
    if (id) {
      isNew = typeof this._cached["" + type + "/" + id] !== 'object';
    } else {
      isNew = true;
      id = this.uuid();
    }
    if (options["public"] != null) {
      object.$public = options["public"];
    }
    if (options.remote) {
      object._syncedAt = this._now();
    } else if (!options.silent) {
      object.updatedAt = this._now();
      object.createdAt || (object.createdAt = object.updatedAt);
    }
    delete object.id;
    delete object.type;
    try {
      object = this.cache(type, id, object, options);
      defer.resolve(object, isNew).promise();
    } catch (error) {
      defer.reject(error).promise();
    }
    return defer.promise();
  };

  LocalStore.prototype.create = function(type, object, options) {
    if (options == null) {
      options = {};
    }
    return this.save(type, void 0, object);
  };

  LocalStore.prototype.update = function(type, id, objectUpdate, options) {
    var defer, _loadPromise,
      _this = this;
    if (options == null) {
      options = {};
    }
    defer = this.hoodie.defer();
    _loadPromise = this.load(type, id).pipe(function(currentObj) {
      var changedProperties, key, value;
      if (typeof objectUpdate === 'function') {
        objectUpdate = objectUpdate($.extend({}, currentObj));
      }
      if (!objectUpdate) {
        return defer.resolve(currentObj);
      }
      changedProperties = (function() {
        var _results;
        _results = [];
        for (key in objectUpdate) {
          value = objectUpdate[key];
          if (!(currentObj[key] !== value)) {
            continue;
          }
          currentObj[key] = value;
          _results.push(key);
        }
        return _results;
      })();
      if (!changedProperties.length) {
        return defer.resolve(currentObj);
      }
      return _this.save(type, id, currentObj, options).then(defer.resolve, defer.reject);
    });
    _loadPromise.fail(function() {
      return _this.save(type, id, objectUpdate, options).then(defer.resolve, defer.reject);
    });
    return defer.promise();
  };

  LocalStore.prototype.updateAll = function(filterOrObjects, objectUpdate, options) {
    var promise,
      _this = this;
    if (options == null) {
      options = {};
    }
    if (this.hoodie.isPromise(filterOrObjects)) {
      promise = filterOrObjects;
    } else {
      promise = this.hoodie.defer().resolve(filterOrObjects).resolve();
    }
    return promise.pipe(function(objects) {
      var defer, object, _updatePromises;
      defer = _this.hoodie.defer();
      _updatePromises = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          object = objects[_i];
          _results.push(this.update(object.type, object.id, objectUpdate, options));
        }
        return _results;
      }).call(_this);
      $.when.apply(null, _updatePromises).then(defer.resolve);
      return defer.promise();
    });
  };

  LocalStore.prototype.load = function(type, id) {
    var defer, object;
    defer = this.hoodie.defer();
    if (!(typeof type === 'string' && typeof id === 'string')) {
      return defer.reject(Hoodie.Errors.INVALID_ARGUMENTS("type & id are required")).promise();
    }
    try {
      object = this.cache(type, id);
      if (!object) {
        return defer.reject(Hoodie.Errors.NOT_FOUND(type, id)).promise();
      }
      defer.resolve(object);
    } catch (error) {
      defer.reject(error);
    }
    return defer.promise();
  };

  LocalStore.prototype.loadAll = function(filter) {
    var currentType, defer, id, key, keys, obj, results, type;
    if (filter == null) {
      filter = function() {
        return true;
      };
    }
    defer = this.hoodie.defer();
    keys = this._index();
    if (typeof filter === 'string') {
      type = filter;
      filter = function(obj) {
        return obj.type === type;
      };
    }
    try {
      results = (function() {
        var _i, _len, _ref, _results;
        _results = [];
        for (_i = 0, _len = keys.length; _i < _len; _i++) {
          key = keys[_i];
          if (!(this._isSemanticId(key))) {
            continue;
          }
          _ref = key.split('/'), currentType = _ref[0], id = _ref[1];
          obj = this.cache(currentType, id);
          if (filter(obj)) {
            _results.push(obj);
          } else {
            continue;
          }
        }
        return _results;
      }).call(this);
      defer.resolve(results).promise();
    } catch (error) {
      defer.reject(error).promise();
    }
    return defer.promise();
  };

  LocalStore.prototype["delete"] = function(type, id, options) {
    var defer, key, object;
    if (options == null) {
      options = {};
    }
    defer = this.hoodie.defer();
    object = this.cache(type, id);
    if (!object) {
      return defer.reject(Hoodie.Errors.NOT_FOUND(type, id)).promise();
    }
    if (object._syncedAt && !options.remote) {
      object._deleted = true;
      this.cache(type, id, object);
    } else {
      key = "" + type + "/" + id;
      this.db.removeItem(key);
      this._cached[key] = false;
      this.clearChanged(type, id);
    }
    return defer.resolve($.extend({}, object)).promise();
  };

  LocalStore.prototype.destroy = LocalStore.prototype["delete"];

  LocalStore.prototype.cache = function(type, id, object, options) {
    var key;
    if (object == null) {
      object = false;
    }
    if (options == null) {
      options = {};
    }
    key = "" + type + "/" + id;
    if (object) {
      this._cached[key] = $.extend(object, {
        type: type,
        id: id
      });
      this._setObject(type, id, object);
      if (options.remote) {
        this.clearChanged(type, id);
        return $.extend({}, this._cached[key]);
      }
    } else {
      if (this._cached[key] != null) {
        return $.extend({}, this._cached[key]);
      }
      this._cached[key] = this._getObject(type, id);
    }
    if (this._cached[key] && (this._isDirty(this._cached[key]) || this._isMarkedAsDeleted(this._cached[key]))) {
      this.markAsChanged(type, id, this._cached[key]);
    } else {
      this.clearChanged(type, id);
    }
    if (this._cached[key]) {
      return $.extend({}, this._cached[key]);
    } else {
      return this._cached[key];
    }
  };

  LocalStore.prototype.clearChanged = function(type, id) {
    var key;
    if (type && id) {
      key = "" + type + "/" + id;
      delete this._dirty[key];
    } else {
      this._dirty = {};
    }
    return this.hoodie.trigger('store:dirty');
  };

  LocalStore.prototype.isMarkedAsDeleted = function(type, id) {
    return this._isMarkedAsDeleted(this.cache(type, id));
  };

  LocalStore.prototype.markAsChanged = function(type, id, object) {
    var key, timeout,
      _this = this;
    key = "" + type + "/" + id;
    this._dirty[key] = object;
    this.hoodie.trigger('store:dirty');
    timeout = 2000;
    window.clearTimeout(this._dirtyTimeout);
    return this._dirtyTimeout = window.setTimeout((function() {
      return _this.hoodie.trigger('store:dirty:idle');
    }), timeout);
  };

  LocalStore.prototype.changedDocs = function() {
    var key, object, _ref, _results;
    _ref = this._dirty;
    _results = [];
    for (key in _ref) {
      object = _ref[key];
      _results.push(object);
    }
    return _results;
  };

  LocalStore.prototype.isDirty = function(type, id) {
    if (!type) {
      return $.isEmptyObject(this._dirty);
    }
    return this._isDirty(this.cache(type, id));
  };

  LocalStore.prototype.clear = function() {
    var defer;
    defer = this.hoodie.defer();
    try {
      this.db.clear();
      this._cached = {};
      this.clearChanged();
      defer.resolve();
    } catch (error) {
      defer.reject(error);
    }
    return defer.promise();
  };

  LocalStore.prototype.isPersistent = function() {
    try {
      if (!window.localStorage) {
        return false;
      }
      localStorage.setItem('Storage-Test', "1");
      if (localStorage.getItem('Storage-Test') !== "1") {
        return false;
      }
      localStorage.removeItem('Storage-Test');
    } catch (e) {
      return false;
    }
    return true;
  };

  LocalStore.prototype.uuid = function(len) {
    var chars, i, radix;
    if (len == null) {
      len = 7;
    }
    chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
    radix = chars.length;
    return ((function() {
      var _i, _results;
      _results = [];
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        _results.push(chars[0 | Math.random() * radix]);
      }
      return _results;
    })()).join('');
  };

  LocalStore.prototype._setObject = function(type, id, object) {
    var key, store;
    key = "" + type + "/" + id;
    store = $.extend({}, object);
    delete store.type;
    delete store.id;
    return this.db.setItem(key, JSON.stringify(store));
  };

  LocalStore.prototype._getObject = function(type, id) {
    var json, key, obj;
    key = "" + type + "/" + id;
    json = this.db.getItem(key);
    if (json) {
      obj = JSON.parse(json);
      obj.type = type;
      obj.id = id;
      if (obj.createdAt) {
        obj.createdAt = new Date(Date.parse(obj.createdAt));
      }
      if (obj.updatedAt) {
        obj.updatedAt = new Date(Date.parse(obj.updatedAt));
      }
      if (obj._syncedAt) {
        obj._syncedAt = new Date(Date.parse(obj._syncedAt));
      }
      return obj;
    } else {
      return false;
    }
  };

  LocalStore.prototype._now = function() {
    return new Date;
  };

  LocalStore.prototype._isValidId = function(key) {
    return /^[a-z0-9\-]+$/.test(key);
  };

  LocalStore.prototype._isValidType = function(key) {
    return /^[a-z$][a-z0-9]+$/.test(key);
  };

  LocalStore.prototype._isSemanticId = function(key) {
    return /^[a-z$][a-z0-9]+\/[a-z0-9]+$/.test(key);
  };

  LocalStore.prototype._cached = {};

  LocalStore.prototype._dirty = {};

  LocalStore.prototype._isDirty = function(object) {
    if (!object._syncedAt) {
      return true;
    }
    if (!object.updatedAt) {
      return false;
    }
    return object._syncedAt.getTime() < object.updatedAt.getTime();
  };

  LocalStore.prototype._isMarkedAsDeleted = function(object) {
    return object._deleted === true;
  };

  LocalStore.prototype._index = function() {
    var i, _i, _ref, _results;
    _results = [];
    for (i = _i = 0, _ref = this.db.length(); 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      _results.push(this.db.key(i));
    }
    return _results;
  };

  return LocalStore;

})();
// Generated by CoffeeScript 1.3.3

Hoodie.User = (function() {

  function User(hoodie) {
    return function(username) {
      return new Hoodie.UserStore.Instance(username, hoodie);
    };
  }

  return User;

})();

Hoodie.UserStore = (function() {

  function UserStore(username, hoodie) {
    this.username = username;
    this.hoodie = hoodie;
  }

  UserStore.prototype.loadAll = function() {
    return this._request = this.hoodie.request('GET', this._userPublicStoreUrl(), {
      contentType: 'application/json'
    });
  };

  UserStore.prototype._userPublicStoreUrl = function() {
    var dbName;
    dbName = this.username.toLowerCase().replace(/@/, "$").replace(/\./g, "_");
    return "/" + (encodeURIComponent(dbName)) + "/public/_all_docs";
  };

  return UserStore;

})();
