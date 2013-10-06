;
(function(Sarah) {
    var Utils = Sarah.Utils;
    if(typeof require !== 'function') {
        require = function(){};
    }

    var fs = require('fs');

    var FS = function() {
        this.path;
        this.exportExtension = '.zip';
    };

    FS.prototype.checkExists = function(path) {
        return fs.existsSync(path);
    }

    FS.prototype.setPath = function(path) {
        if (this.checkExists(path)) {
            this.path = path;
            return true;
        }
        return false;
    }

    FS.prototype.unlink = function(filepath) {
        if(fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
    }

    FS.prototype.save = function(filepath, value, callback) {
        var self = this;

        var filename = '';

        if(filepath.indexOf('\\') > -1) {
            filename = filepath.split('\\').pop();
            path = filepath
        } else {
            filename = filepath.split('/').pop();
        }
        var path = filepath.replace(filename, '');


        if (self.checkExists(path)) {
            return fs.writeFile(filepath, new Buffer(JSON.stringify(value)).toString('base64'), function(err) {
                if (err) {
                    return callback({
                        message: 'Error writing to file ' + filepath,
                        error: err
                    });
                }
                return callback(null, filepath);
            });
        }
        if (Utils.isFunction(callback)) {
            return callback({
                message: 'Path ' + path + ' does not exist'
            });
        }
    }

    FS.prototype.load = function(filepath, callback) {
        var self = this;
        if(!fs.existsSync(filepath)) {
            return callback({
                message : filepath + ' does not exists'
            });
        }
        return fs.readFile(filepath, {encoding : 'utf8'}, function(err, blob){
            if(err) {
                return callback({
                    message : 'error reading file ' + filepath,
                    err : err
                });
            }
            var json = new Buffer(blob, 'base64').toString('utf8');
            var text = JSON.parse(json);
            callback(null, text);
        });
    }

    Utils.FileStorage = new FS();
})(Sarah);