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
