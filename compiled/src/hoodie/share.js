// Generated by CoffeeScript 1.3.3
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Hoodie.Share = (function() {

  function Share(hoodie) {
    var api;
    this.hoodie = hoodie;
    this._open = __bind(this._open, this);

    this.instance = Hoodie.ShareInstance;
    this.instance.prototype.hoodie = this.hoodie;
    api = this._open;
    $.extend(api, this);
    this.hoodie.store.decoratePromises({
      shareAt: this._storeShareAt(this.hoodie),
      unshareAt: this._storeUnshareAt(this.hoodie)
    });
    return api;
  }

  Share.prototype.add = function(attributes) {
    var share;
    if (attributes == null) {
      attributes = {};
    }
    share = new this.instance(attributes);
    share.save();
    return share;
  };

  Share.prototype.find = function(id) {
    var _this = this;
    return this.hoodie.store.find('$share', id).pipe(function(object) {
      return new _this.instance(object);
    });
  };

  Share.prototype.findAll = function() {
    var _this = this;
    return this.hoodie.store.findAll('$share').pipe(function(objects) {
      var obj, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        obj = objects[_i];
        _results.push(new _this.instance(obj));
      }
      return _results;
    });
  };

  Share.prototype.findOrAdd = function(id, attributes) {
    var _this = this;
    return this.hoodie.store.findOrAdd('$share', id, attributes).pipe(function(object) {
      return new _this.instance(object);
    });
  };

  Share.prototype.save = function(id, attributes) {
    var _this = this;
    return this.hoodie.store.save('$share', id, attributes).pipe(function(object) {
      return new _this.instance(object);
    });
  };

  Share.prototype.update = function(id, changed_attributes) {
    var _this = this;
    return this.hoodie.store.update('$share', id, changed_attributes).pipe(function(object) {
      return new _this.instance(object);
    });
  };

  Share.prototype.updateAll = function(changed_attributes) {
    var _this = this;
    return this.hoodie.store.updateAll('$share', changed_attributes).pipe(function(objects) {
      var obj, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        obj = objects[_i];
        _results.push(new _this.instance(obj));
      }
      return _results;
    });
  };

  Share.prototype.remove = function(id) {
    this.hoodie.store.findAll(function(obj) {
      return obj.$shares[id];
    }).unshareAt(id);
    return this.hoodie.store.remove('$share', id);
  };

  Share.prototype.removeAll = function() {
    this.hoodie.store.findAll(function(obj) {
      return obj.$shares;
    }).unshare();
    return this.hoodie.store.removeAll('$share');
  };

  Share.prototype._open = function(shareId, options) {
    if (options == null) {
      options = {};
    }
    $.extend(options, {
      id: shareId
    });
    return new this.instance(options);
  };

  Share.prototype._storeShareAt = function(hoodie) {
    return function(shareId, properties) {
      var _this = this;
      return this.pipe(function(objects) {
        var object, _i, _len, _results;
        if (!$.isArray(objects)) {
          objects = [objects];
        }
        _results = [];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          object = objects[_i];
          object.$shares || (object.$shares = {});
          object.$shares[shareId] = properties || true;
          _results.push(hoodie.store.update(object.$type, object.id, {
            $shares: object.$shares
          }));
        }
        return _results;
      });
    };
  };

  Share.prototype._storeUnshareAt = function(hoodie) {
    return function(shareId) {
      var _this = this;
      return this.pipe(function(objects) {
        var object, _i, _len, _results;
        if (!$.isArray(objects)) {
          objects = [objects];
        }
        _results = [];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          object = objects[_i];
          if (!(object.$shares && object.$shares[shareId])) {
            continue;
          }
          object.$shares[shareId] = false;
          _results.push(hoodie.store.update(object.$type, object.id, {
            $shares: object.$shares
          }));
        }
        return _results;
      });
    };
  };

  return Share;

})();
