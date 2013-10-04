;
(function(Sarah) {
    function run() {

        var poller = function() {
            var options = this.options = {
                type: 'long',
                url: '/sarahphp/poller/',
                persistant: true,
                longPollInterval: 1,
                shortPollInterval: 5000,
                collections: [],
                callbacks: {},
            };
            this.started = false;
            this.interval = null;
            this.errorCount = 0;
            this.collectionData = {};
            this.xhr;
            Sarah.Runtime.PollerOnline = true;
            var self = this;

            var toShortPoll = function() {
                console.log('Polling changed to short poll.');
                self.setPollerType('short');
            }

            var toLongPoll = function() {
                console.log('Polling changed to long poll.');
                self.setPollerType('long');
            }

            this.setupPoller();

            Sarah.Runtime.onAway.push(toShortPoll);
            Sarah.Runtime.onHidden.push(toShortPoll);
            Sarah.Runtime.onBack.push(toLongPoll);
            Sarah.Runtime.onVisible.push(toLongPoll);
        }

        poller.prototype.poll = function(fn) {
            var self = this;
            if (self.errorCount === 10) {
                self.stop();
            }
            if (this.started === true) {
                var interval = this.options.runInterval;
                this.interval = setTimeout(function() {
                    self.check();
                }, interval);
            }
        }

        poller.prototype.setupPoller = function() {
            var self = this;

            if (this.options.type === 'long') {
                this.options.runUrl = this.options.url + 'long';
                this.options.runInterval = this.options.longPollInterval + (this.options.longPollInterval * this.errorCount);
            } else {
                this.options.runUrl = this.options.url + 'short';
                this.options.runInterval = this.options.shortPollInterval;
            }
        }

        poller.prototype.check = function(fn) {
            var self = this;

            self.setupPoller();

            var url = self.options.runUrl;
            if (url === null || url === undefined) {
                throw new Error('Error. No URL found. : ' + JSON.stringify(self.options))
            }
            self.options.collections.forEach(function(name) {
                // self.collectionData[name] = self.collectionData[name] || Sarah.Utils.Store.get('MTIME:' + name) || 0;
                self.collectionData[name] = self.collectionData[name] || 0;
            });
            this.xhr = $.ajax({
                url: url,
                method: 'GET',
                data: self.collectionData,
                success: function(res) {
                    if (res.data) {
                        _.each(res.data, function(mtime, collectionName) {
                            Sarah.Collections[collectionName].persistance.poller.updateData(mtime)
                        });
                    }
                    self.errorCount = 0;
                    Sarah.Runtime.PollerOnline = true;
                    self.poll();
                },
                error: function() {
                    self.errorCount++;
                    if (self.errorCount === 10) {
                        self.errorCount--;
                    }
                    Sarah.Runtime.PollerOnline = false;
                    self.errorCount++;
                    self.poll();
                }
            })
        }

        poller.prototype.setPollerType = function(type) {
            this.stop();
            if (type === 'short') {
                this.options.type = 'short';
            } else {
                this.options.type = 'long';
            }
            this.start();
        }

        poller.prototype.start = function() {
            this.setupPoller();
            if (this.started === false) {
                this.started = true;
            }
            this.poll();
        }

        poller.prototype.stop = function() {
            this.started = false;
            clearTimeout(this.interval);
            if (this.xhr)
                this.xhr.abort();
        }

        poller.prototype.setCollection = function(collection) {
            if (this.options.collections.indexOf(collection) === -1) {
                this.options.collections.push(collection);
                this.stop();
                this.start();
            }
        }

        Sarah.Runtime.Poller = new poller();

        Sarah.Runtime.onClose.push(function(event) {
            Sarah.Runtime.Poller.stop();
        });

        Sarah.Runtime.Loaded['poller.js'] = true;
    }
    Sarah.Utils.load(
        [Sarah.Runtime.base + 'libs/localstorage.js',
            function() {
                return Sarah.Utils.Store;
            }
        ], [Sarah.Runtime.base + 'libs/localstorage.js',
            function() {
                return Sarah.Utils.Store;
            }
        ],
        function() {
            run();
        }
    )
})(Sarah);