;
(function(Sarah) {
    function run() {
        var Utils = Sarah.Utils;

        var fn = function(name, config) {

            var self = this;
            self.name = name;

            var data = Utils.Store.get('PERSISTANCE:' + (config.name || name));
            if (data === undefined) {
                Utils.Store.set('PERSISTANCE:' + (config.name || name), []);
            }

            Utils.subscribe('LOAD:COLLECTION:' + name, function() {
                (Utils.Store.get('PERSISTANCE:' + (config.name || self.name)) || []).forEach(function(data) {
                    data.insertedAt = new Date(data.insertedAt);
                    data.updatedAt = new Date(data.updatedAt);
                    if (data.deletedAt === '1970-01-01T00:00:00.000Z' || data.deletedAt === null) {
                        data.deletedAt = null;
                        Collections[self.name].insert(data);
                    }
                });
            });

            self.sync = function() {
                Utils.Store.set('PERSISTANCE:' + (config.name || self.name), Sarah.Collections[self.name].export())
            }
            Utils.subscribe('COLLECTION:INSERT:' + self.name + '', function(data) {
                self.sync();
            });

            Utils.subscribe('COLLECTION:UPDATE:' + self.name + '', function(data) {
                self.sync();
            });

            Utils.subscribe('COLLECTION:REMOVE:' + self.name + '', function(data) {
                self.sync();
            });
        }

        Sarah.Runtime.Persistance.localstorage = fn;
        Sarah.Runtime.Loaded['db.localstorage.js'] = true;
    }
    Sarah.Utils.load(
        [Sarah.Runtime.base + 'libs/localstorage.js',
            function() {
                return Sarah.Utils.Store;
            }
        ],
        function() {
            run();
        }
    )
})(Sarah);