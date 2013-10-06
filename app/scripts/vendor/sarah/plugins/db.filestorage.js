;
(function(Sarah) {
    function run() {
        var Utils = Sarah.Utils;

        var fn = function(name, config) {

            var self = this;
            self.name = name;
            self.path = config.path;

            self.sync = function(data) {
                if(data.savePath) {
                    Sarah.Utils.FileStorage.unlink(data.savePath);
                }
                if(data.oldtitle) {
                    Sarah.Utils.FileStorage.unlink(self.path + '/' + data.oldtitle + '.mdd');
                }
                setTimeout(function(){
                    data.savePath = self.path + '/' + data.title + '.mdd';
                    Sarah.Utils.FileStorage.save(data.savePath, data, function(err, path){
                        if(err) {
                            return;
                        }
                        else {
                            Utils.publish('FILESTORAGE:SAVE', path);
                        }
                    });
                },500)
            }

            Utils.subscribe('COLLECTION:INSERT:' + self.name + '', function(data) {
                self.sync(data);
            });

            Utils.subscribe('COLLECTION:UPDATE:' + self.name + '', function(data) {
                self.sync(data);
            });

            Utils.subscribe('COLLECTION:REMOVE:' + self.name + '', function(data) {});
        }

        Sarah.Runtime.Persistance.filestorage = fn;
        Sarah.Runtime.Loaded['db.filestorage.js'] = true;
    }
    Sarah.Utils.load(
        [Sarah.Runtime.base + 'libs/filestorage.js',
            function() {
                return Sarah.Utils.FileStorage;
            }
        ],
        function() {
            run();
        }
    )
})(Sarah);