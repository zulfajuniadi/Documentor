;(function(Sarah){
    function run() {

        /***************************************************** METHODS ************************************************/

        var method = Sarah.Method = function() {
            this.methods = [];
            this.init();
        }

        method.prototype.run = function(name, data, callback) {
            var self = this;
            var data = data || {};
            if (self.methods.indexOf(name) === -1) {
                console.log('Method ' + name + ' does not exists. Did you declare it on the server?');
            } else {
                $.ajax({
                    url: '/methods/run/' + name,
                    method: 'GET',
                    data: data,
                    contentType: 'application/json',
                    success: function(res) {
                        if (callback) {
                            callback(res.data);
                        }
                    },
                    error: function() {
                        console.log('Error running method');
                    }
                });
            }
        }

        method.prototype.init = function() {
            var self = this;
            $.ajax({
                url: '/methods/list',
                method: 'GET',
                contentType: 'application/json',
                success: function(res) {
                    self.methods = res.data;
                },
                error: function() {
                    console.log('Error retrieving method list');
                }
            });
        }

        method.prototype.list = function() {
            return this.methods;
        }

        window.Methods = new Sarah.Method();

        Sarah.Runtime.Loaded['methods.js'] = true;
    }

    run();
})(Sarah);


