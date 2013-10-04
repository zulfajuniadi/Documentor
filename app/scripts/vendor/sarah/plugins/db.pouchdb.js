;
(function(Sarah) {
    function run() {
        var Utils = Sarah.Utils;
        var fn = function(name, config) {
            var syncError = function(a, b, c, d) {
                console.log(a, b, c, d)
            }
            var self = this;
            self.name = name;
            var cname = self.cname = config.name || name;
            var rev = '';
            var data = self.data = null;
            var db = self.db = new PouchDB(config.name);
            var collection = self.collection = Sarah.Collections[self.name];
            var opts = {
                continuous: true,
                complete: syncError
            };

            var remoteCouch = false;

            db.info(function(err, info) {
                db.changes({
                    since: info.update_seq,
                    continuous: true,
                    onChange: syncLocalData
                });
            });

            Utils.subscribe('COLLECTION:INSERT:' + self.name + '', function(data) {
                var revertData = data.r;
                var data = _.extend({}, data);
                delete data.r;
                db.put(data, function callback(err, result) {
                    if (err) {
                        console.log(err);
                        collection.revert(revertData);
                    }
                });
            });

            Utils.subscribe('COLLECTION:UPDATE:' + self.name + '', function(data) {
                var revertData = data.r;
                var data = _.extend({}, data);
                delete data.r;
                db.put(data, function callback(err, result) {
                    if (err) {
                        collection.revert(revertData);
                    }
                });
            });

            Utils.subscribe('COLLECTION:REMOVE:' + self.name + '', function(data) {
                var revertData = data.r;
                var data = _.extend({}, data);
                delete data.r;
                db.remove(data, function callback(err, result) {
                    if (err) {
                        collection.revert(revertData);
                    }
                });
            });

            var syncLocalData = function() {
                db.allDocs({
                    include_docs: true,
                    descending: true
                }, function(err, doc) {
                    var data = _.pluck(doc.rows, 'doc');
                    collection.import(data);
                });
            }

            db.replicate.to(config.host, opts);
            db.replicate.from(config.host, opts);

            syncLocalData();
        }

        Sarah.Runtime.Persistance.pouchdb = fn;
        Sarah.Runtime.Loaded['db.pouchdb.js'] = true;
    }
    Sarah.Utils.load(
        [Sarah.Runtime.base + 'libs/pouchdb.js',
            function() {
                return window.Pouch;
            }
        ],
        run()
    )
})(Sarah);