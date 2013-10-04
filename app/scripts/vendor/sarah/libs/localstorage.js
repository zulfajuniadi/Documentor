;
(function(Sarah) {

    // https://github.com/marcuswestin/store.js/blob/master/store.js

    var store = {},
        doc = document,
        localStorageName = 'localStorage',
        namespace = '__storejs__',
        storage;

    store.disabled = false;
    store.set = function(key, value) {}
    store.get = function(key) {}
    store.remove = function(key) {}
    store.clear = function() {}
    store.transact = function(key, defaultVal, transactionFn) {
        var val = store.get(key)
        if (transactionFn == null) {
            transactionFn = defaultVal
            defaultVal = null
        }
        if (typeof val == 'undefined') {
            val = defaultVal || {}
        }
        transactionFn(val)
        store.set(key, val)
    }
    store.getAll = function() {}

    store.serialize = function(value) {
        return JSON.stringify(value)
    }
    store.deserialize = function(value) {
        if (typeof value != 'string') {
            return undefined
        }
        try {
            return JSON.parse(value)
        } catch (e) {
            return value || undefined
        }
    }

    var isLocalStorageNameSupported = function() {
        try {
            return (localStorageName in window && window[localStorageName])
        } catch (err) {
            return false
        }
    }

    var withIEStorage = function(storeFunction) {
        return function() {
            var args = Array.prototype.slice.call(arguments, 0)
            args.unshift(storage)
            storageOwner.appendChild(storage)
            storage.addBehavior('#default#userData')
            storage.load(localStorageName)
            var result = storeFunction.apply(store, args)
            storageOwner.removeChild(storage)
            return result
        }
    }

    var ieKeyFix = function(key) {
        return key.replace(forbiddenCharsRegex, '___')
    }

    if (isLocalStorageNameSupported()) {
        storage = window[localStorageName]
        store.set = function(key, val) {
            if (val === undefined) {
                return store.remove(key)
            }
            storage.setItem(key, store.serialize(val))
            return val
        }
        store.get = function(key) {
            return store.deserialize(storage.getItem(key))
        }
        store.remove = function(key) {
            storage.removeItem(key)
        }
        store.clear = function() {
            storage.clear()
        }
        store.getAll = function() {
            var ret = {}
            for (var i = 0; i < storage.length; ++i) {
                var key = storage.key(i)
                ret[key] = store.get(key)
            }
            return ret
        }
    } else if (doc.documentElement.addBehavior) {
        var storageOwner,
            storageContainer
        try {
            storageContainer = new ActiveXObject('htmlfile')
            storageContainer.open()
            storageContainer.write('<s' + 'cript>document.w=window</s' + 'cript><iframe src="/favicon.ico"></iframe>')
            storageContainer.close()
            storageOwner = storageContainer.w.frames[0].document
            storage = storageOwner.createElement('div')
        } catch (e) {
            storage = doc.createElement('div')
            storageOwner = doc.body
        }

        var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g")

        store.set = withIEStorage(function(storage, key, val) {
            key = ieKeyFix(key)
            if (val === undefined) {
                return store.remove(key)
            }
            storage.setAttribute(key, store.serialize(val))
            storage.save(localStorageName)
            return val
        });
        store.get = withIEStorage(function(storage, key) {
            key = ieKeyFix(key)
            return store.deserialize(storage.getAttribute(key))
        });
        store.remove = withIEStorage(function(storage, key) {
            key = ieKeyFix(key)
            storage.removeAttribute(key)
            storage.save(localStorageName)
        });
        store.clear = withIEStorage(function(storage) {
            var attributes = storage.XMLDocument.documentElement.attributes
            storage.load(localStorageName)
            for (var i = 0, attr; attr = attributes[i]; i++) {
                storage.removeAttribute(attr.name)
            }
            storage.save(localStorageName)
        });
        store.getAll = withIEStorage(function(storage) {
            var attributes = storage.XMLDocument.documentElement.attributes
            var ret = {}
            for (var i = 0, attr; attr = attributes[i]; ++i) {
                var key = ieKeyFix(attr.name)
                ret[attr.name] = store.deserialize(storage.getAttribute(key))
            }
            return ret
        });
    }

    try {
        store.set(namespace, namespace)
        if (store.get(namespace) != namespace) {
            store.disabled = true
        }
        store.remove(namespace)
    } catch (e) {
        store.disabled = true
    }

    Sarah.Utils.Store = store;
})(Sarah);