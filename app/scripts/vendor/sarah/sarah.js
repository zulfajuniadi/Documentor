var Sarah = Sarah || {};
Sarah.Utils = {};
Sarah.Cache = {};
Sarah.Runtime = {};

;
(function(Sarah) {
    var Utils = Sarah.Utils;
    var Cache = Sarah.Cache;

    Cache.pubsub = {};
    var psCache = Cache.pubsub;

    Utils.getTemplateVars = function(html) {
        return _.uniq(_.compact(_.flatten((html.match(/\{\{#?[\w].+?\}\}|\{\{#if?[\w].+?\}\}/g) || []).map(function(hash) {
            return hash.replace(/#[\w.]+\s/, '').split(' ');
        })).map(function(word) {
            return word.replace(/\{\{|\}\}/g, '').replace('../', '');
        }).map(function(word) {
            return word.indexOf('"') > -1 || word.indexOf("'") > -1 || _.keys(Handlebars.helpers).indexOf(word) > -1 || word === 'else' ? undefined : word
        })));
    }

    Utils.cleanUrl = function(url) {
        url = url.replace('http://', 'HTTPCOLSLASH').
        replace('https://', 'HTTPSCOLSLASH').
        replace('//', '/').
        replace('HTTPCOLSLASH', 'http://').
        replace('HTTPSCOLSLASH', 'https://');
        return url;
    }

    Utils.isNumber = function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    Utils.isString = function(value) {
        return (value && (value).constructor === String);
    }

    Utils.isObject = function(value) {
        return (value && (value).constructor === Object) || false;
    }

    Utils.isArray = function(value) {
        if (typeof value === 'undefined') {
            return false;
        }
        return typeof value.forEach === 'function' && typeof value.map === 'function';
    }

    Utils.isFunction = function(func) {
        if (typeof func === 'function')
            return true;
    }

    Utils.isEmail = function(email) {
        if (Utils.isString(email)) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }
        return false;
    }

    Utils.isDate = function(str) {
        return moment(str).toDate().toString() === 'Invalid Date' ? false : true;
    }

    Utils.autoCast = function(data) {
        var nested = false;
        if (!Utils.isObject(data) || !Utils.isArray(data)) {
            data = [data];
            nested = true;
        }
        data = _.map(data, function(data) {
            var common_strings = {
                'true': true,
                'false': false,
                'undefined': undefined,
                'null': null,
                'NaN': NaN
            }
            var key;
            if (data instanceof Date) return data;
            if (Utils.isNumber(data)) return Number(data);
            for (key in common_strings) {
                if (data === key) return common_strings[key];
            }
            if (Utils.isDate(data)) return moment(date).toDate();

            return data;
        });
        return nested ? data[0] : data;
    }

    Utils._doDeepPluck = function(data, key) {
        var self = this;
        var result = [];
        return _.map(data, function(d, idx) {
            if (d === undefined || d === null) {
                return;
            } else {
                if (Utils.isArray(key)) {
                    if (key.indexOf(d) > -1 || key.indexOf(idx) > -1) {
                        return d;
                    }
                } else {
                    if (key === d || idx === key) {
                        return d;
                    }
                }
                if (Utils.isObject(d) || Utils.isArray(d)) {
                    return self._doDeepPluck(d, key);
                }
            }
        });
    }

    Utils.deepPluck = function(data, key) {
        return Utils.cleanArray(_.flatten(this._doDeepPluck(data, key)));
    }

    Utils.toTitleCase = function(str) {
        return str.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    Utils.sumArray = function(arr) {
        if (!Utils.isArray(arr) && !Utils.isObject(arr)) {
            return 0;
        } else {
            var val = 0;
            _.each(arr, function(num) {
                var num = parseInt(num, 10);
                if (!isNaN(num)) {
                    val += num;
                }
            });
            return val;
        }
    }

    Utils.isBoolean = function(bool) {
        if (['true', 'false', true, false].indexOf(bool) > -1) {
            return true;
        }
        return false;
    }

    Utils.cleanArray = function(actual) {
        for (var i = 0; i < actual.length; i++) {
            if (typeof actual[i] === 'undefined' || actual[i] === null || actual[i] === '') {
                actual.splice(i, 1);
                i--;
            }
        }
        return actual;
    }

    Utils.genId = function() {
        function S4() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        }
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    }

    Utils.publish = function( /* String */ topic, /* Array? */ args) {
        var subs = psCache[topic],
            len = subs ? subs.length : 0;

        while (len--) {
            subs[len].apply(Utils, [args] || []);
        }
    };

    Utils.subscribe = function( /* String */ topic, /* Function */ callback) {
        if (!psCache[topic]) {
            psCache[topic] = [];
        }
        psCache[topic].push(callback);
        return [topic, callback]; // Array
    };

    Utils.unsubscribe = function( /* Array */ handle, /* Function? */ callback) {
        psCache[handle] = _.without(psCache[handle], callback);
        console.log(psCache[handle]);

    };

    // https://github.com/pyrsmk/toast

    Cache.loaded = [];

    Utils.load = function() {
        var doc = document,
            head = doc.getElementsByTagName('head')[0],
            setTimeout = this.setTimeout,
            createElement = 'createElement',
            appendChild = 'appendChild',
            addEventListener = 'addEventListener',
            onreadystatechange = 'onreadystatechange',
            styleSheet = 'styleSheet',
            ten = 10,
            loading = 0,
            decrementLoading = function() {
                --loading;
            },
            i,
            // Load as much resources as we can
            loadResources = function(resources, callback, a, b) {
                // Waiting for DOM readiness then load resources
                if (!head) {
                    setTimeout(function() {
                        loadResources(resources);
                    }, ten);
                }
                // Load resources
                else if (resources.length) {
                    i = -1;
                    while (a = resources[++i]) {
                        // Simple callback
                        if ((b = typeof a) == 'function') {
                            callback = function() {
                                a();
                                return true;
                            };
                            break;
                        }
                        // Resource
                        else if (b == 'string') {
                            loadResource(a);
                        }
                        // Resource + validation callback
                        else if (a.pop) {
                            loadResource(a[0]);
                            callback = a[1];
                            break;
                        }
                    }
                    watchResources(callback, Array.prototype.slice.call(resources, i + 1));
                }
            },
            // Load one resource
            loadResource = function(resource, a) {
                ++loading;
                // CSS
                if (/\.css$/.test(resource)) {
                    a = doc[createElement]('link');
                    a.rel = styleSheet;
                    a.href = resource;
                    head[appendChild](a);
                    watchStylesheet(a);
                }
                // JS
                else {
                    if (Cache.loaded.indexOf(resource) > -1) {
                        decrementLoading();
                    } else {
                        a = doc[createElement]('script');
                        a.src = resource;
                        head[appendChild](a);
                        if (a[onreadystatechange] === null) {
                            a[onreadystatechange] = watchScript;
                        } else {
                            Cache.loaded.push(resource);
                            a.onload = decrementLoading;
                        }
                    }
                }
            },
            // Watch if all resources have been loaded
            watchResources = function(callback, resourcesToLoad) {
                var i = 0;
                var interval = window.setInterval(function() {
                    if (!loading) {
                        if (!callback || callback()) {
                            loadResources(resourcesToLoad);
                            clearInterval(interval);
                            return;
                        }
                    }
                    i++;
                }, ten);
            },
            // Watch if a CSS resource has been loaded
            watchStylesheet = function(node) {
                if (node.sheet || node[styleSheet]) {
                    decrementLoading();
                    return;
                }
                window.setTimeout(function() {
                    watchStylesheet(node);
                }, ten);
            },
            // Watch if a script has been loaded
            watchScript = function() {
                if (/ded|co/.test(this.readyState)) {
                    decrementLoading();
                }

            };
        // Load resources
        loadResources(arguments);
    };
})(Sarah);

var ljQuery = (typeof $.fn === 'undefined') ? [
    '//cdnjs.cloudflare.com/ajax/libs/jquery/1.10.2/jquery.min.js',
    function() {
        return window.jQuery || window.Zepto;
    }
] : undefined;

var lHandlebars = (typeof window.Handlebars === 'undefined') ? [
    '//cdnjs.cloudflare.com/ajax/libs/handlebars.js/1.0.0/handlebars.min.js',
    function() {
        return window.Handlebars;
    }
] : undefined;

var lLodash = (typeof _ === 'undefined') ? [
    '//cdnjs.cloudflare.com/ajax/libs/lodash.js/1.3.1/lodash.min.js',
    function() {
        return window._;
    }
] : undefined;

var lMoment = (typeof moment === 'undefined') ? [
    '//cdnjs.cloudflare.com/ajax/libs/moment.js/2.1.0/moment.min.js',
    function() {
        return window.moment;
    }
] : undefined;

Sarah.Utils.load(ljQuery, lHandlebars, lLodash, lMoment,
    function() {
        var Utils = Sarah.Utils || {};
        var Cache = Sarah.Cache;
        var script = $('script[data-app]');

        var rootUrl = script.data('rooturl');
        var base = Utils.cleanUrl(rootUrl + script.data('base') + '/');
        var templatedir = script.data('templatedir') || '';
        var plugins = script.data('plugins') ? script.data('plugins').split(',').map(function(p) {
            return p.trim();
        }) : [];
        var templates = script.data('templates') ? script.data('templates').split(',').map(function(t) {
            return t.trim();
        }) : [];

        var options = {
            base: base,
            templatedir: templatedir,
            templates: templates,
            plugins: plugins,
            rootUrl: rootUrl
        };

        Sarah.Runtime = _.extend(Sarah.Runtime, options);
        Sarah.Runtime.Loaded = {};
        Sarah.Runtime.Persistance = {};
        Sarah.Runtime.onClose = [];
        Sarah.Runtime.onEnter = [];
        Sarah.Runtime.onAway = [];
        Sarah.Runtime.onBack = [];
        Sarah.Runtime.onHidden = [];
        Sarah.Runtime.onVisible = [];

        if (options.plugins.length > 0) {
            var loadConfig = options.plugins.map(function(basename) {
                var basename = basename || '';
                if (basename.indexOf('.js') === -1) {
                    basename = basename + '.js';
                }

                name = Utils.cleanUrl(base + 'plugins/' + basename);

                return [name, function() {
                    return Sarah.Runtime.Loaded[basename];
                }];
            });

            loadConfig.push(function() {
                startup.call(this, options, window.Sarah, window.Handlebars, window._, window.$, function() {
                    if (script[0]) {
                        Utils.load(script.data('app'), function() {
                            // window.Router.run();
                        });
                    }
                })
            });
            Utils.load.apply(window, loadConfig);
        } else {
            startup.call(this, options, window.Sarah, window.Handlebars, window._, window.$, function() {
                if (script[0]) {
                    Utils.load(script.data('app'), function() {
                        // window.Router.run();
                    });
                }
            })

        }

        function startup(options, Sarah, Handlebars, _, $, Callback) {

            Cache.bindElement = {};
            _.each({
                debug: function(optionalValue) {
                    console.log("Current Context");
                    console.log("====================");
                    console.log(this);

                    if (optionalValue) {
                        console.log("Value");
                        console.log("====================");
                        console.log(optionalValue);
                    }
                },
                bind: function(eoptions) {
                    var id = Utils.genId();
                    Cache.bindElement[id] = this;
                    return ' rel=boundedData data-binding = ' + id;
                },
                sessionGet : function(key) {
                    return Session.get(key);
                },
                sessionHas: function(key, item, trueClass, falseClass) {
                    if (Session.has(key, item)) {
                        return trueClass;
                    } else {
                        if(Utils.isObject(falseClass))
                            return;
                        return falseClass;
                    }
                },
                sessionEq : function(key, value, options) {
                    if (Session.equals(key, value)) {
                        return options.fn(this);
                    }
                    return options.inverse(this);
                },
                and: function(testA, testB, options) {
                    if (testA && testB) {
                        return options.fn(this);
                    }
                    return options.inverse(this);
                },
                gt: function(value, test, options) {
                    if(Utils.isArray(value)) {
                        value = value.length;
                    }
                    if (value > test) {
                        return options.fn(this);
                    }
                    return options.inverse(this);
                },
                gte: function(value, test, options) {
                    if(Utils.isArray(value)) {
                        value = value.length;
                    }
                    if (value >= test) {
                        return options.fn(this);
                    }
                    return options.inverse(this);
                },
                is: function(value, test, options) {
                    if (value === test) {
                        return options.fn(this);
                    }
                    return options.inverse(this);
                },
                isnt: function(value, test, options) {
                    if (value !== test) {
                        return options.fn(this);
                    }
                    return options.inverse(this);
                },
                lt: function(value, test, options) {
                    if(Utils.isArray(value)) {
                        value = value.length;
                    }
                    if (value < test) {
                        return options.fn(this);
                    }
                    return options.inverse(this);
                },
                lte: function(value, test, options) {
                    if(Utils.isArray(value)) {
                        value = value.length;
                    }
                    if (value <= test) {
                        return options.fn(this);
                    }
                    return options.inverse(this);
                },
                or: function(testA, testB, options) {
                    if (testA || testB) {
                        return options.fn(this);
                    }
                    return options.inverse(this);
                },
                length: function(items, attr, value) {
                    if(items && Utils.isString(attr)) {
                        return _.filter(items, function(item){
                            if(Utils.isObject(value)) {
                                value = true;
                            }
                            return item[attr] === value;
                        }).length || 0;
                    }
                    else if (items) {
                        if (items.length !== undefined) {
                            return items.length || 0;
                        } else {
                            var length = 0,
                                key;
                            for (key in items) {
                                if (items.hasOwnProperty(key)) length++;
                            }
                            return length || 0;
                        }
                    }
                    return 0;
                },
                if_eq: function(context, options) {
                    if (context === options.hash.compare) {
                        return options.fn(this);
                    }
                    return options.inverse(this);
                },
                unless_eq: function(context, options) {
                    if (context === options.hash.compare) {
                        return options.inverse(this);
                    }
                    return options.fn(this);
                },
                if_gt: function(context, options) {
                    if (context > options.hash.compare) {
                        return options.fn(this);
                    }
                    return options.inverse(this);
                },
                unless_gt: function(context, options) {
                    if (context > options.hash.compare) {
                        return options.inverse(this);
                    }
                    return options.fn(this);
                },
                if_lt: function(context, options) {
                    if (context < options.hash.compare) {
                        return options.fn(this);
                    }
                    return options.inverse(this);
                },
                unless_lt: function(context, options) {
                    if (context < options.hash.compare) {
                        return options.inverse(this);
                    }
                    return options.fn(this);
                },
                if_gteq: function(context, options) {
                    if (context >= options.hash.compare) {
                        return options.fn(this);
                    }
                    return options.inverse(this);
                },
                unless_gteq: function(context, options) {
                    if (context >= options.hash.compare) {
                        return options.inverse(this);
                    }
                    return options.fn(this);
                },
                if_lteq: function(context, options) {
                    if (context <= options.hash.compare) {
                        return options.fn(this);
                    }
                    return options.inverse(this);
                },
                unless_lteq: function(context, options) {
                    if (context <= options.hash.compare) {
                        return options.inverse(this);
                    }
                    return options.fn(this);
                },
                // session: function(key, value, options) {
                //     if (Session.equals(key, value)) {
                //         return options.fn(this);
                //     }
                //     return options.inverse(this);
                // },

                ifAny: function() {
                    var argLength, content, i, success;
                    argLength = arguments.length - 2;
                    content = arguments[argLength + 1];
                    success = true;
                    i = 0;
                    while (i < argLength) {
                        if (!arguments[i]) {
                            success = false;
                            break;
                        }
                        i += 1;
                    }
                    if (success) {
                        return content(this);
                    } else {
                        return content.inverse(this);
                    }
                },
                numberFormat: function(amount) {
                    if (amount)
                        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    else
                        return '';
                },
                thSorter: function(current, tag, prop, title) {
                    var current = current || {};
                    var chevron = (current.sortBy === prop) ? '&nbsp;&nbsp;&nbsp;<i class="icon-chevron-' + current.sortDir + '"></i>' : '';
                    return '<' + tag + ' class="sortable" data-prop="' + prop + '"">' + title + chevron + '</' + tag + '>';
                },
                timeAgo : function(date) {
                    return moment(date).fromNow();
                }
            }, function(fn, name) {
                Handlebars.registerHelper(name, fn);
            });

            Handlebars.VM.invokePartial = function(data, template, context, options) {
                var name = template;
                if (typeof Sarah.Templates[name] === 'undefined') {
                    throw new Error('Template ' + template + ' not found');
                } else {
                    return Sarah.Templates[name].render(context);
                }
            }

            Utils.getBinding = function(id) {
                return Cache.bindElement[id];
            }

            var ids, e;
            setInterval(function() {
                var a = {};
                ids = $('[data-binding]').map(function(idx, elem) {
                    e = $(elem);
                    return e.data('binding');
                });
                ids = $.makeArray(ids);
                _.each(Cache.bindElement, function(properties, id) {
                    if (ids.indexOf(id) > -1)
                        a[id] = properties;
                });
                Cache.bindElement = _.extend({}, a);
            }, 500);

            $.fn.onReady = function(handler) {
                var self = this;
                if (this.length > 0) {
                    handler();
                } else {
                    var interval = setInterval(function() {
                        console.log($(self.selector).length, self.selector);
                        if ($(self.selector).length > 0) {
                            clearInterval(interval);
                            handler();
                        }
                    }, 15);
                }
            }

            /**************************************************************************************************************/
            /********************************************** MAIN APP START ************************************************/
            /**************************************************************************************************************/



            /************************************************** STARTUP ***************************************************/

            Sarah.Start = function() {
                window.Utils = Sarah.Utils;

                window.Deps = new Sarah.Deps();
                Sarah.Utils.publish('LOAD:DEPS');

                window.Session = new Sarah.Session();
                Sarah.Utils.publish('LOAD:SESSION');

                window.Template = Sarah.Templates;
                Sarah.Utils.publish('LOAD:TEMPLATES');

                window.Collection = Sarah.Collection;
                Sarah.Utils.publish('LOAD:COLLECTION');

                window.Collections = Sarah.Collections;

                window.Router = new Sarah.Router();
                Sarah.Utils.publish('LOAD:ROUTER');

                /* Set Deps Interval */

                window.Runtime = Sarah.Runtime;

                var status = window.Status = Runtime.Status = {};

                Sarah.Utils.Idle = new Idle({
                    onHidden: function() {
                        Sarah.Runtime.onHidden.forEach(function(fn) {
                            if (typeof fn === 'function') {
                                fn();
                            }
                        });
                        Deps.setInterval(500);
                    },
                    onVisible: function() {
                        Sarah.Runtime.onVisible.forEach(function(fn) {
                            if (typeof fn === 'function') {
                                fn();
                            }
                        });
                        Deps.setInterval(15);
                    },
                    onAway: function() {
                        Sarah.Runtime.onAway.forEach(function(fn) {
                            if (typeof fn === 'function') {
                                fn();
                            }
                        });
                        Deps.setInterval(1000);
                    },
                    onAwayBack: function() {
                        Sarah.Runtime.onBack.forEach(function(fn) {
                            if (typeof fn === 'function') {
                                fn();
                            }
                        });
                        Deps.setInterval(15);
                    },
                    awayTimeout: 60000
                });

                Sarah.Utils.publish('LOAD:STATUS');



                var doNext = function() {
                    $('[type="template"]').each(function(idx, template) {
                        var template = $(template);
                        var properties = {
                            name: template.attr('name')
                        }
                        if (template.length > 0 && properties) {
                            Sarah.Templates[properties.name] = new Sarah.Template(properties);
                        }
                    });
                    if (Utils.isFunction(Callback)) {
                        Callback();
                    }
                }

                if (options.templates) {
                    if (options.templates.length > 0) {
                        // var i = options.templates.length - 1,
                        //     j = 0;
                        // Utils.subscribe('EXTTEMPLATE:LOADED', function() {
                        //     j++;
                        //     if (j === options.templates.length) {
                        //         doNext();
                        //     };
                        // });

                        var templates = options.templates.map(function(templateName) {
                            var url = Utils.cleanUrl(options.templatedir + '/' + templateName);
                            var name = templateName.split('.');
                            name.pop() // remove .html
                            name = name.join('.');
                            return {
                                name: name,
                                url: url
                            }
                        });

                        templates.forEach(function(properties) {
                            var templateName = properties.name.replace('/', '__');
                            Sarah.Templates[templateName] = new Sarah.Template(properties);
                        });

                        doNext();
                    } else {
                        doNext();
                    }
                } else {
                    doNext();
                }
            }



            /****************************************************** IDLE **************************************************/

            /* http://shawnmclean.github.io/Idle.js/lib/idle.js */

            var Idle = {};

            Idle = (function() {

                Idle.isAway = false;

                Idle.awayTimeout = 3000;

                Idle.awayTimestamp = 0;

                Idle.awayTimer = null;

                Idle.onAway = null;

                Idle.onAwayBack = null;

                Idle.onVisible = null;

                Idle.onHidden = null;

                function Idle(options) {
                    var activeMethod, activity;
                    if (options) {
                        this.awayTimeout = parseInt(options.awayTimeout, 10);
                        this.onAway = options.onAway;
                        this.onAwayBack = options.onAwayBack;
                        this.onVisible = options.onVisible;
                        this.onHidden = options.onHidden;
                    }
                    activity = this;
                    activeMethod = function() {
                        return activity.onActive();
                    };
                    window.onclick = activeMethod;
                    window.onmousemove = activeMethod;
                    window.onmouseenter = activeMethod;
                    window.onkeydown = activeMethod;
                    window.onscroll = activeMethod;
                    this.startAwayTimeout();
                    document.addEventListener("visibilitychange", (function() {
                        return activity.handleVisibilityChange();
                    }), false);
                    document.addEventListener("webkitvisibilitychange", (function() {
                        return activity.handleVisibilityChange();
                    }), false);
                    document.addEventListener("msvisibilitychange", (function() {
                        return activity.handleVisibilityChange();
                    }), false);
                }

                Idle.prototype.onActive = function() {
                    this.awayTimestamp = new Date().getTime() + this.awayTimeout;
                    if (this.isAway) {
                        if (this.onAwayBack) this.onAwayBack();
                        this.startAwayTimeout();
                    }
                    this.isAway = false;
                    return true;
                };

                Idle.prototype.startAwayTimeout = function() {
                    var activity;
                    this.awayTimestamp = new Date().getTime() + this.awayTimeout;
                    if (this.awayTimer !== null) clearTimeout(this.awayTimer);
                    activity = this;
                    return this.awayTimer = setTimeout((function() {
                        return activity.checkAway();
                    }), this.awayTimeout + 100);
                };

                Idle.prototype.setAwayTimeout = function(ms) {
                    this.awayTimeout = parseInt(ms, 10);
                    return this.startAwayTimeout();
                };

                Idle.prototype.checkAway = function() {
                    var activity, t;
                    t = new Date().getTime();
                    if (t < this.awayTimestamp) {
                        this.isAway = false;
                        activity = this;
                        this.awayTimer = setTimeout((function() {
                            return activity.checkAway();
                        }), this.awayTimestamp - t + 100);
                        return;
                    }
                    if (this.awayTimer !== null) clearTimeout(this.awayTimer);
                    this.isAway = true;
                    if (this.onAway) return this.onAway();
                };

                Idle.prototype.handleVisibilityChange = function() {
                    if (document.hidden || document.msHidden || document.webkitHidden) {
                        if (this.onHidden) return this.onHidden();
                    } else {
                        if (this.onVisible) return this.onVisible();
                    }
                };

                return Idle;

            })();


            /************************************************** NOTIFICATION **********************************************/

            /* https://github.com/pham/desktopify */

            (function(win, Sarah) {
                var PERMISSION_DEFAULT = "default",
                    PERMISSION_GRANTED = "granted",
                    PERMISSION_DENIED = "denied",
                    PERMISSION = [PERMISSION_GRANTED, PERMISSION_DEFAULT, PERMISSION_DENIED],
                    defaultSetting = {
                        pageVisibility: false,
                        autoClose: 0
                    },
                    empty = {},
                    emptyString = "",
                    isSupported = (function() {
                        var isSupported = false;
                        /*
                         * Use try {} catch() {} because the check for IE may throws an exception
                         * if the code is run on browser that is not Safar/Chrome/IE or
                         * Firefox with html5notifications plugin.
                         *
                         * Also, we canNOT detect if msIsSiteMode method exists, as it is
                         * a method of host object. In IE check for existing method of host
                         * object returns undefined. So, we try to run it - if it runs
                         * successfully - then it is IE9+, if not - an exceptions is thrown.
                         */
                        try {
                            isSupported = !! ( /* Safari, Chrome */ win.Notification || /* Chrome & ff-html5notifications plugin */ win.webkitNotifications || /* Firefox Mobile */ navigator.mozNotification || /* IE9+ */ (win.external && win.external.msIsSiteMode() !== undefined));
                        } catch (e) {}
                        return isSupported;
                    }()),
                    ieVerification = Math.floor((Math.random() * 10) + 1),
                    isFunction = function(value) {
                        return (value && (value).constructor === Function);
                    },
                    isString = function(value) {
                        return (value && (value).constructor === String);
                    },
                    isObject = function(value) {
                        return (value && (value).constructor === Object);
                    },
                    /**
                     * Dojo Mixin
                     */
                    mixin = function(target, source) {
                        var name, s;
                        for (name in source) {
                            s = source[name];
                            if (!(name in target) || (target[name] !== s && (!(name in empty) || empty[name] !== s))) {
                                target[name] = s;
                            }
                        }
                        return target; // Object
                    },
                    noop = function() {},
                    settings = defaultSetting;

                function getNotification(title, options) {
                    var notification;
                    if (win.Notification) { /* Safari 6, Chrome (23+) */
                        notification = new win.Notification(title, {
                            /* The notification's icon - For Chrome in Windows, Linux & Chrome OS */
                            icon: isString(options.icon) ? options.icon : options.icon.x32,
                            /* The notification’s subtitle. */
                            body: options.body || emptyString,
                            /*
                    The notification’s unique identifier.
                    This prevents duplicate entries from appearing if the user has multiple instances of your website open at once.
                */
                            tag: options.tag || emptyString
                        });
                    } else if (win.webkitNotifications) { /* FF with html5Notifications plugin installed */
                        notification = win.webkitNotifications.createNotification(options.icon, title, options.body);
                        notification.show();
                    } else if (navigator.mozNotification) { /* Firefox Mobile */
                        notification = navigator.mozNotification.createNotification(title, options.body, options.icon);
                        notification.show();
                    } else if (win.external && win.external.msIsSiteMode()) { /* IE9+ */
                        //Clear any previous notifications
                        win.external.msSiteModeClearIconOverlay();
                        win.external.msSiteModeSetIconOverlay((isString(options.icon) ? options.icon : options.icon.x16), title);
                        win.external.msSiteModeActivate();
                        notification = {
                            "ieVerification": ieVerification + 1
                        };
                    }
                    return notification;
                }

                function getWrapper(notification) {
                    return {
                        close: function() {
                            if (notification) {
                                if (notification.close) {
                                    //http://code.google.com/p/ff-html5notifications/issues/detail?id=58
                                    notification.close();
                                } else if (win.external && win.external.msIsSiteMode()) {
                                    if (notification.ieVerification === ieVerification) {
                                        win.external.msSiteModeClearIconOverlay();
                                    }
                                }
                            }
                        }
                    };
                }

                function requestPermission(callback) {
                    if (!isSupported) {
                        return;
                    }
                    var callbackFunction = isFunction(callback) ? callback : noop;
                    if (win.webkitNotifications && win.webkitNotifications.checkPermission) {
                        /*
                         * Chrome 23 supports win.Notification.requestPermission, but it
                         * breaks the browsers, so use the old-webkit-prefixed
                         * win.webkitNotifications.checkPermission instead.
                         *
                         * Firefox with html5notifications plugin supports this method
                         * for requesting permissions.
                         */
                        win.webkitNotifications.requestPermission(callbackFunction);
                    } else if (win.Notification && win.Notification.requestPermission) {
                        win.Notification.requestPermission(callbackFunction);
                    }
                }

                function permissionLevel() {
                    var permission;
                    if (!isSupported) {
                        return;
                    }
                    if (win.Notification && win.Notification.permissionLevel) {
                        //Safari 6
                        permission = win.Notification.permissionLevel();
                    } else if (win.webkitNotifications && win.webkitNotifications.checkPermission) {
                        //Chrome & Firefox with html5-notifications plugin installed
                        permission = PERMISSION[win.webkitNotifications.checkPermission()];
                    } else if (navigator.mozNotification) {
                        //Firefox Mobile
                        permission = PERMISSION_GRANTED;
                    } else if (win.Notification && win.Notification.permission) {
                        // Firefox 23+
                        permission = win.Notification.permission;
                    } else if (win.external && (win.external.msIsSiteMode() !== undefined)) { /* keep last */
                        //IE9+
                        permission = win.external.msIsSiteMode() ? PERMISSION_GRANTED : PERMISSION_DEFAULT;
                    }
                    return permission;
                }
                /**
                 *
                 */

                function config(params) {
                    if (params && isObject(params)) {
                        mixin(settings, params);
                    }
                    return settings;
                }

                function isDocumentHidden() {
                    return settings.pageVisibility ? (document.hidden || document.msHidden || document.mozHidden || document.webkitHidden) : true;
                }

                function createNotification(title, options) {
                    var notification,
                        notificationWrapper;
                    /*
            Return undefined if notifications are not supported.

            Return undefined if no permissions for displaying notifications.

            Title and icons are required. Return undefined if not set.
         */
                    if (isSupported && isDocumentHidden() && isString(title) && (options && (isString(options.icon) || isObject(options.icon))) && (permissionLevel() === PERMISSION_GRANTED)) {
                        notification = getNotification(title, options);
                    }
                    notificationWrapper = getWrapper(notification);
                    //Auto-close notification
                    if (settings.autoClose && notification && !notification.ieVerification && notification.addEventListener) {
                        notification.addEventListener("show", function() {
                            var notification = notificationWrapper;
                            win.setTimeout(function() {
                                notification.close();
                            }, settings.autoClose);
                        });
                    }
                    return notificationWrapper;
                }
                Sarah.Notify = win.Notify = {
                    PERMISSION_DEFAULT: PERMISSION_DEFAULT,
                    PERMISSION_GRANTED: PERMISSION_GRANTED,
                    PERMISSION_DENIED: PERMISSION_DENIED,
                    isSupported: isSupported,
                    config: config,
                    createNotification: createNotification,
                    permissionLevel: permissionLevel,
                    requestPermission: requestPermission
                };
                if (isFunction(Object.seal)) {
                    Object.seal(win.Notify);
                }
            }(window, Sarah));


            /************************************************** DEPENDENCIES **********************************************/

            Sarah.Dependency = function(name, watch, callback) {
                var self = this;
                self.name = name;
                self.watch = watch;
                self.lastResult = null;
                self.callback = callback;
            }

            Sarah.Deps = function() {
                var self = this;
                this.watchList = [];
                this.Timeout;
                var i = 0;
                var j = 0;
                var sum = 0;
                var to;
                var errorCount = 0;
                self.interval = 15;
                self.loopDuration = 0;
                this.loop = function(timeOut) {
                    if (self.watchList.length > 0) {
                        var val;
                        self.Timeout = setTimeout(function() {
                            var i = 0;
                            var sdate = new Date().getTime();
                            self.watchList = self.watchList.map(function(dep) {
                                // try {
                                val = JSON.stringify(dep.watch());
                                if (val) {
                                    if (val !== dep.lastResult) {
                                        dep.callback(JSON.parse(val), JSON.parse(dep.lastResult));
                                        dep.lastResult = val;
                                    }
                                }
                                return dep;
                                // } catch (e) {
                                // errorCount++;
                                if (errorCount == 10) {
                                    self.stop();
                                    console.log(self, i);
                                    console.error('Application Error evaluating Deps list. Stopped.');
                                }
                                // }
                                i++;
                            });
                            var loopDuration = new Date().getTime() - sdate;
                            if(loopDuration !== self.loopDuration) {
                                // console.log(loopDuration);
                                self.loopDuration = loopDuration;
                            }
                            self.start();
                        }, timeOut);
                    } else {
                        to = setTimeout(function() {
                            if (self.watchList.length > 0) {
                                self.loop();
                                clearTimeout(to);
                            }
                        }, 100);
                    }
                }
                this.start();
            }

            Sarah.Deps.prototype.setInterval = function(interval) {
                this.interval = interval;
            }

            Sarah.Deps.prototype.getInterval = function() {
                return this.interval + this.loopDuration;
            }

            Sarah.Deps.prototype.start = function() {
                var timeOut = this.getInterval();
                this.loop(timeOut);
                return true;
            }

            Sarah.Deps.prototype.stop = function() {
                clearTimeout(this.Timeout);
                return true;
            }

            Sarah.Deps.prototype.reset = function() {
                this.stop();
                this.watchList = [];
                this.start();
            }

            Sarah.Deps.prototype.register = function(name, watch, callback) {
                var watch = watch || '';
                if (Utils.isFunction(watch) && Utils.isFunction(callback)) {
                    var dep = new Sarah.Dependency(name, watch, callback);
                    this.watchList.push(dep);
                    return dep;
                }
                return null;
            }

            Sarah.Deps.prototype.unregister = function(name) {
                this.watchList = _.without(this.watchList, _.where(this.watchList, {
                    name: name
                }));
            }

            /************************************************** ROUTER ****************************************************/

            /*
         Adapted from the works of:
         Copyright 2011 Paul Kinlan
         https://github.com/PaulKinlan/leviroutes
        */

            var router = Sarah.Router = function() {
                var _routes = [];
                var self = this;
                this._routes = [];
                this._stateProperties = {};
                this._state = '';
                this.init();
                this.beforeUnload = null;
            };

            router.prototype.parseRoute = function(path) {
                this.parseGroups = function(loc) {
                    var nameRegexp = new RegExp(":([^/.\\\\]+)", "g");
                    var newRegexp = "" + loc;
                    var groups = {};
                    var matches = null;
                    var i = 0;

                    // Find the places to edit.
                    while (matches = nameRegexp.exec(loc)) {
                        groups[matches[1]] = i++;
                        newRegexp = newRegexp.replace(matches[0], "([^/.\\\\]+)");
                    }

                    newRegexp += "$"; // Only do a full string match

                    return {
                        "groups": groups,
                        "regexp": new RegExp(newRegexp)
                    };
                };

                return this.parseGroups(path);
            };

            router.prototype.matchRoute = function(url, e) {
                var route = null;
                if (this._routes.length > 0) {
                    var self = this;
                    for (var i = 0; route = this._routes[i]; i++) {
                        var routeMatch = route.regex.regexp.exec(url);

                        if ( !! routeMatch == false) continue;

                        var params = {};
                        for (var g in route.regex.groups) {
                            var group = route.regex.groups[g];
                            params[g] = routeMatch[group + 1];
                        }

                        var values = {};
                        if (e && e.target instanceof HTMLFormElement) {
                            var form = $(e.target);
                            var fields = form.serializeArray();
                            $.each(fields, function() {
                                var input = $(form.find('[name="' + this.name + '"]'));
                                var multiple = input.attr('multiple');
                                if (multiple) {
                                    values[this.name] = values[this.name] || [];
                                    values[this.name].push(this.value || '');
                                } else {
                                    if (input.is(':radio') || input.is(':checkbox')) {
                                        if (input.is(':checked')) {
                                            values[this.name] = this.value || '';
                                        }
                                    } else {
                                        values[this.name] = this.value || '';
                                    }
                                }
                            });
                        }

                        var obj = _.extend({}, e || {}, {
                            "url": url,
                            "params": params,
                            "values": values,
                            "matched": routeMatch[0]
                        });

                        Router._stateProperties = obj || {};
                        Router._state = this._routes[i].state || '';
                        Router.currentRoute = this._routes[i] || {};

                        _.each(Router.currentRoute.data, function(item, key) {
                            Handlebars.registerHelper('route-' + key, function() {
                                return item;
                            });
                        })

                        // remove non persistant templates
                        _.each(Sarah.Templates, function(template) {
                            if (!template._persistant) {
                                template._partials = [];
                                template.removeOutlets();
                            }
                        });

                        route.callback(obj);
                        return true;
                    }
                }

                return false;
            };

            router.prototype.onExit = function(callback) {
                if(Utils.isFunction(callback)){
                    this.beforeUnload = callback;
                }
            }

            router.prototype.get = function(route, state, callback, data) {
                var data = data || data;
                if (Utils.isFunction(state)) {
                    console.log(state);
                    throw TypeError("Usage : Router.get('/path', 'state', [callback (function)], [data (object)])");
                }
                this._routes.push({
                    regex: this.parseRoute(route),
                    "callback": callback,
                    data: data,
                    state: state,
                    route: route,
                    method: "get"
                });
            };

            router.prototype.post = function(route, state, callback, data) {
                var data = data || data;
                if (Utils.isFunction(state)) {
                    throw TypeError("Usage : Router.get('/path', 'state', [callback (function)])");
                }
                this._routes.push({
                    regex: this.parseRoute(route),
                    "callback": callback,
                    data: data,
                    state: state,
                    method: "post"
                });
            };

            router.prototype.getRoutes = function() {
                return this._routes;
            };

            router.prototype.run = function(callback) {
                var self = this;
                var triggered = false;
                if (!triggered) {
                    if(self.matchRoute(document.location.pathname) === false){
                        if(Utils.isFunction(callback)){
                            callback();
                        }
                    }
                    triggered = true;
                }
                Utils.publish('ROUTE:' + document.location.pathname, {
                    router: self,
                    route: document.location.pathname
                });

                window.onbeforeunload = function() {
                    Sarah.Runtime.onClose.forEach(function(fn) {
                        if (typeof fn === 'function') {
                            fn();
                        }
                    })
                }
            };

            router.prototype.to = function(state, arg) {
                var self = this;
                if(Utils.isFunction(self.beforeUnload)) {
                    if(self.beforeUnload() === false) {
                        return false;
                    }
                }
                setTimeout(function() {
                    var route = _.findWhere(self._routes, {
                        state: state
                    });
                    if (route) {
                        window.history.pushState({}, '', route.route);
                        self.matchRoute(route.route);
                    } else {
                        window.history.pushState({}, '', state);
                        self.matchRoute(state);
                    }
                });
            }

            router.prototype.back = function() {
                if(Utils.isFunction(self.beforeUnload)) {
                    if(self.beforeUnload() === false) {
                        return false;
                    }
                }
                setTimeout(function() {
                    window.history.back();
                }, 1)
            }

            router.prototype.init = function(Callback) {
                var self = this;
                var triggered = false;
                var cancelHashChange = false;
                var cancelPopstate = false;
                if ( !! window.history && !! window.history.pushState) {
                    var pushStateProxy = history.__proto__.pushState;
                    history.__proto__.pushState = function(state, title, url) {
                        pushStateProxy.apply(history, arguments);
                        var evt = document.createEvent("Event");
                        evt.initEvent("statechanged", false, false);
                        evt.state = state;
                        window.dispatchEvent(evt);
                        return;
                    };
                }

                // Intercept FORM submissions.
                $(window).on("submit", function(e) {
                    if (e.target.method == "post") {
                        if(Utils.isFunction(self.beforeUnload)) {
                            if(self.beforeUnload() === false) {
                                e.preventDefault();
                                return false;
                            }
                        }
                        if (self.matchRoute(e.target.action, e)) {
                            e.preventDefault();
                            Utils.publish('ROUTE:' + document.location.pathname, {
                                router: self,
                                route: e.target.action
                            });
                            window.history.pushState({}, '', e.target.action);
                            return false;
                        }
                    }
                    // If we haven't matched a URL let the normal request happen.
                    return false;
                });

                window.addEventListener("popstate", function(e) {
                    if (cancelPopstate) {
                        cancelPopstate = false;
                        cancelHashChange = false;
                        return;
                    }
                    if(Utils.isFunction(self.beforeUnload)) {
                        if(self.beforeUnload() === false) {
                            e.preventDefault();
                            return false;
                        }
                    }
                    self.matchRoute(document.location.pathname);

                    // popstate fires before a hash change, don't fire twice.
                    cancelHashChange = true;
                    Utils.publish('ROUTE:' + document.location.pathname, {
                        router: self,
                        route: document.location.pathname
                    });
                }, false);

                // window.addEventListener("load", function(e) {
                //     if(Utils.isFunction(self.beforeUnload)) {
                //         if(self.beforeUnload() === false) {
                //             return false;
                //         }
                //     }
                //     if (!triggered) {
                //         self.matchRoute(document.location.pathname);
                //         triggered = true;
                //     }
                //     cancelHashChange = true;
                //     cancelPopstate = true;
                //     Utils.publish('ROUTE:' + document.location.pathname, {
                //         router: self,
                //         route: document.location.pathname
                //     });
                // }, false);

                window.addEventListener("click", function(event) {
                    if (cancelHashChange) {
                        cancelHashChange = false;
                        cancelPopstate = false;
                        return;
                    }
                    var origEl = event.target || event.srcElement;
                    if (origEl.tagName === 'A' || origEl.parentNode.tagName === 'A') {
                        if(Utils.isFunction(self.beforeUnload)) {
                            if(self.beforeUnload() === false) {
                                event.preventDefault();
                                return false;
                            }
                        }
                        var href = origEl.href || origEl.parentNode.href;
                        if (self.matchRoute(href)) {
                            event.preventDefault();
                            window.history.pushState({}, '', href);
                            Utils.publish('ROUTE:' + document.location.pathname, {
                                router: self,
                                route: href
                            });
                            return false;
                        }
                    }
                }, false);
            };

            /************************************************** DATABASE **************************************************/

            Sarah.Cache.db = {};

            Sarah.Collections = Sarah.Collections || {};

            var collection = Sarah.Collection = function(name, options) {
                this.name = name;
                this.persistance = {};
                this.data = Sarah.Cache.db[name] = [];
                Sarah.Collections[name] = this;
                this.init(options);
                this.revertHistory = [];
            }

            collection.prototype.checksum = null;

            collection.prototype._softDelete = false;

            collection.prototype.get = function(id) {
                return Sarah.Cache.db[this.name].filter(function(data) {
                    return data._id === id && (data.deletedAt === '0' || data.deletedAt === null);
                })[0] || null;
            }

            collection.prototype.getAll = function() {
                if (Utils.isFunction(this.getFilter)) {
                    return Sarah.Cache.db[this.name].filter(this.getFilter);
                } else {
                    return Sarah.Cache.db[this.name].filter(function(data) {
                        return data.deletedAt === null || data.deletedAt === '0';
                    });
                }
            }

            collection.prototype.filter = function(fn) {
                var data = this.getAll();
                if (Utils.isFunction(fn)) {
                    return data.filter(fn);
                } else {
                    return data;
                }
            }

            collection.prototype.where = function(where) {
                var where = where || {};
                if (this._softDelete) {
                    where.deletedAt = null
                }
                return _.where(Sarah.Cache.db[this.name], where);
            }

            collection.prototype.findWhere = function(where) {
                var data = this.getAll();
                return _.findWhere(data, where);
            }

            collection.prototype.insert = function(data, quiet) {
                var self = this;
                var quiet = quiet || false;

                var doInsert = function(data) {
                    if (data._id === undefined) {
                        data._id = Utils.genId();
                        data.createdAt = new Date();
                        data.updatedAt = new Date();
                        data.deletedAt = null;
                    }
                    Sarah.Cache.db[self.name].push(data);
                    if (!quiet) {
                        var revertData = _.extend({}, data);
                        revertData.r = {
                            collectionName: self.name,
                            _id: data._id,
                            operation: 'INSERT'
                        }
                        Utils.publish('COLLECTION:INSERT:' + self.name, revertData);
                        Session.setFlash({
                            type: 'notification',
                            message: 'Data inserted successfully.',
                            level: 'success'
                        });
                    }
                    return data;
                }
                if (data) {
                    if (data.length !== undefined) {
                        data.forEach(function(d) {
                            doInsert(d);
                        });
                    } else {
                        return doInsert(data);
                    }
                }
            }

            collection.prototype.merge = function(data, quiet) {
                var self = this;
                var quiet = quiet || false;

                var doMerge = function(data) {
                    var odata = self.get(data._id);
                    if (odata)
                        Sarah.Cache.db[self.name].splice(Sarah.Cache.db[self.name].indexOf(odata), 1, data);
                    else
                        Sarah.Cache.db[self.name].push(data);

                    if (!quiet) {
                        var revertData = _.extend({}, data);
                        revertData.r = {
                            collectionName: self.name,
                            _id: data._id,
                            operation: 'INSERT'
                        }
                        Utils.publish('COLLECTION:INSERT:' + self.name, revertData);
                        Session.setFlash({
                            type: 'notification',
                            message: 'Data inserted successfully.',
                            level: 'success'
                        });
                    }
                    return data;
                }
                if (data) {
                    if (data.length !== undefined) {
                        data.forEach(function(d) {
                            doMerge(d);
                        });
                    } else {
                        return doMerge(data);
                    }
                }
            }

            collection.prototype.update = function(find, updates, quiet) {
                var self = this;
                var quiet = quiet || false;
                var data = this.findWhere(find);
                var original = _.extend({}, data);
                if (data) {
                    var index = Sarah.Cache.db[this.name].indexOf(data);
                    var updated = _.extend({}, data, updates);
                    updated.updatedAt = new Date();
                    Sarah.Cache.db[this.name].splice(index, 1, updated);
                }
                if (!quiet) {
                    var revertData = _.extend({}, updated);
                    revertData.r = {
                        collectionName: this.name,
                        _id: data._id,
                        operation: 'UPDATE'
                    }
                    self.revertHistory.push(original);
                    Utils.publish('COLLECTION:UPDATE:' + self.name, revertData);
                    Session.setFlash({
                        type: 'notification',
                        message: 'Data updated successfully.',
                        level: 'success'
                    });
                }
                return data;
            }

            collection.prototype.first = function() {
                if (this.getAll().length === 0)
                    return;
                return this.getAll()[0];

            }

            collection.prototype.last = function() {
                if (this.getAll().length === 0)
                    return;
                return this.getAll()[(this.getAll().length - 1)];

            }

            collection.prototype.deepPluck = function(data, key) {
                var self = this;
                if (typeof key === 'undefined') {
                    key = data;
                    data = this.getAll();
                }
                // console.log('start');
                var res = Utils.deepPluck(data, key);
                // console.log('end');
                return res;
            }

            collection.prototype.deepFilter = function(data, key, value) {
                var self = this;
                var result = [];

                if (data instanceof Array) {
                    for (var i = 0; i < data.length; i++) {
                        var res = self.deepFilter(data[i], key, value);
                        if (res !== null) {
                            result.push(res);
                        }
                    }
                } else {
                    for (var prop in data) {
                        if (prop === key) {
                            if (Utils.isFunction(value)) {
                                if (value(data[prop])) {
                                    return data;
                                }
                            } else if (data[prop] === value) {
                                return data;
                            }
                        }
                        if (data[prop] instanceof Object || data[prop] instanceof Array) {
                            var res = self.deepFilter(data[prop], key, value);
                            if (res !== null) {
                                result.push(res);
                            }
                        }
                    }
                }
                return _.flatten(result);
            }

            collection.prototype.inCollection = function(data, key, value, parents) {
                var self = this;

                if (typeof data === 'undefined' || data === null || data === []) {
                    return false;
                }

                if (Utils.isArray(data) || Utils.isObject(data)) {
                    if (data[key] === value) {
                        parents.unshift(data);
                        return true;
                    }
                    var filtered = _.filter(data, function(d) {
                        return self.inCollection(d, key, value, parents);
                    });
                    if (filtered.length > 0) {
                        if (Utils.isObject(data)) {
                            parents.push(data);
                        }
                        return true;
                    }
                    return false;
                }
                return false;
            }

            collection.prototype.getProperties = function(_id, key, value) {
                var self = this;
                var ret = {};
                var parents = [];
                var collection = [];
                if (typeof value === 'undefined') {
                    value = key;
                    key = _id;
                    collection = self.getAll().filter(function(data) {
                        return self.inCollection(data, key, value, parents);
                    });
                } else {
                    var data = self.get(_id);
                    if (data) {
                        if (self.inCollection(data, key, value, parents)) {
                            collection.push(data);
                        }
                    }
                }
                if (collection.length > 0) {
                    ret.collection = collection[0];
                    ret.data = parents[0];
                    ret.parent = parents[1];
                    ret.paths = parents;
                    return ret;
                }
                return;
            }

            collection.prototype.remove = function(where, quiet) {
                var self = this;
                var quiet = quiet || false;
                var data = self.findWhere(where);
                if(data) {
                    var original = _.extend({}, data);
                    if (self._softDelete) {
                        data.deletedAt = new Date();
                        self.update({
                            _id: data.id
                        }, data, true);
                    } else {
                        Sarah.Cache.db[self.name].splice(Sarah.Cache.db[self.name].indexOf(data), 1);
                    }
                    if (!quiet) {
                        var revertData = _.extend({}, original);
                        revertData.r = {
                            collectionName: self.name,
                            _id: data._id,
                            operation: 'REMOVE'
                        }
                        self.revertHistory.push(original);
                        Utils.publish('COLLECTION:REMOVE:' + self.name, revertData);
                        Session.setFlash({
                            type: 'notification',
                            message: 'Data removed successfully.',
                            level: 'success'
                        });
                    }
                }
            }

            collection.prototype.revert = function(r) {
                var self = this;
                switch (r.operation) {
                    case 'INSERT':
                        self.remove({
                            _id: r._id
                        }, true);
                    case 'UPDATE':
                        self.update({
                            _id: r._id
                        }, _.where(self.revertHistory, {
                            _id: r._id
                        }).pop(), true);
                    case 'REMOVE':
                        self.insert(_.where(self.revertHistory, {
                            _id: r._id
                        }).pop(), true);
                }
            }

            collection.prototype.export = function() {
                return _.where(Sarah.Cache.db[this.name], {
                    isFixture: undefined
                });
            }

            collection.prototype.purge = function() {
                if (confirm('Are you sure you want to purge "' + this.name + '" collection?')) {
                    var self = this;
                    var data = this.getAll();
                    data.forEach(function(d) {
                        self.remove({
                            name: d.name
                        });
                    })
                }
            }

            collection.prototype.import = function(data, replace) {
                var replace = replace || true;
                if (replace) {
                    Sarah.Cache.db[this.name] = data;
                }
                return Sarah.Cache.db[this.name];
            }

            collection.prototype.init = function(options) {
                var self = this;

                if (options.fixtures) {
                    options.fixtures.forEach(function(fixture) {
                        fixture.isFixture = true;
                        self.insert(fixture, true);
                    });
                }
                if (options.plugins) {
                    _.each(options.plugins, function(config, name) {
                        if (typeof Sarah.Runtime.Persistance[name] === 'function') {
                            self.persistance[name] = new Sarah.Runtime.Persistance[name](self.name, config);
                        } else {
                            var error = 'Plugin for database backend "' + name + '" is unavailable. Did you load it?';
                            throw new Error(error);
                        }
                    })
                }
                if (options.softDelete) {
                    this._softDelete = options.softDelete;
                }
                Sarah.Utils.publish('LOAD:COLLECTION:' + self.name);
            }


            /**************************************************** DEBUG ***************************************************/

            // var dbg = window.Debug = Sarah.Debug = {};

            // Cache.debug = {};

            // dbg.benchFunction = function(fn){
            //     if(typeof Cache.debug[fn] === 'undefined') {
            //         Cache.debug[fn] = 0;
            //     }
            //     var start = new Date().toString();
            //     fn.call();
            //     var diff = new Date().toString() - start;
            //     if(Cache.debug[fn] !== diff) {
            //         Cache.debug[fn] = diff;
            //         console.log(diff);
            //     }
            // };

            /************************************************** TEMPLATES *************************************************/

            Sarah.Templates = {};
            Sarah.Cache.tmplVars = {};

            var _rendered = [];

            var template = Sarah.Template = function(properties) {
                var self = this;
                this._name = properties.name;
                this._html = properties.html;
                this._url = properties.url;
                this._outlets = [];
                this._attributes = {};
                this._persistant = false;
                this._partials = [];

                Deps.register('_eventsList', function() {
                    return this._eventsList;
                }, function() {
                    self.renderAll(true);
                });

                Utils.subscribe('SETLAYOUT:' + this._name, function(outlet) {
                    if (typeof outlet !== 'undefined') {
                        self.setOutlet(outlet);
                    } else {
                        self.renderAll;
                    }
                });
            }

            template.prototype.setOutlet = function(selector, persistant) {
                if (persistant) {
                    this._persistant = true;
                }
                if (this._outlets.indexOf(selector) === -1) {
                    this._outlets.push(selector);
                }
                this.renderAll();
            }

            template.prototype.removeOutlet = function(selector) {
                Deps.unregister(self._name);
                this.unbindEvents($(selector));
                $(selector).empty();
                this._outlets = _.without(this._outlets, selector);
            }

            template.prototype.removeOutlets = function() {
                var self = this;
                this._outlets.forEach(function(outlet) {
                    self.removeOutlet(outlet);
                });
            }

            template.prototype.template = function() {
                return Handlebars.compile(this._html);
            }

            template.prototype.renderAll = function() {
                var self = this;

                clearTimeout(self.bubbleTimer);
                self.bubbleTimer = setTimeout(function() {
                    if (typeof self.beforeRender === 'function') {
                        self.beforeRender.call(self);
                    }

                    self._outlets.forEach(function(outlet) {
                        var outlet = $(outlet);
                        self.unbindEvents(outlet);
                        outlet.empty();
                        outlet.onReady(function() {
                            self.renderToElement(outlet);
                            self.bindEvents(outlet);
                            self._partials.forEach(function(partial) {
                                Utils.publish('SETLAYOUT:' + partial.template._name, partial.outlet);
                            });
                        });
                    });
                    if (typeof self.afterRender === 'function') {
                        self.afterRender.call(self);
                    }
                }, 100);
            }

            template.prototype.partials = function(hashes) {
                var self = this;
                hashes.forEach(function(hash) {
                    if (self._partials.indexOf(hash) === -1) {
                        self._partials.push(hash);
                    }
                });
            }

            template.prototype.attributes = function(hash) {
                var self = this;
                Deps.unregister(self._name);
                _.each(hash, function(fn, attr) {
                    if (Utils.isFunction(fn)) {
                        Deps.register(self._name, fn, function(value) {
                            self._attributes[attr] = value;
                            self.renderAll(true);
                        });
                    } else {
                        self._attributes[attr] = fn;
                    }
                    self.renderAll(true);
                });
            }

            template.prototype.unbindEvents = function(target) {
                // var target = $(target);
                // $('*', target).each(function(idx, childOutlet) {
                //     $(childOutlet).unbind();
                // });
                // target.unbind();
            }

            template.prototype.bindEvents = function(target) {
                var self = this;
                var target = $(target);
                _.each(this._eventsList, function(fn, hashStr) {
                    hashStr.split(',').forEach(function(hashStr) {
                        var hstrArray = hashStr.trim().split(/\s+/);
                        var elems = $(hstrArray[1], $(target));
                        if (elems.length > 0) {
                            elems.each(function(idx, elem) {
                                var elem = $(elem);
                                var bindingId = elem.data('binding');
                                var data = {};
                                if (bindingId) {
                                    data = Sarah.Cache.bindElement[bindingId];
                                }
                                elem.on(hstrArray[0], elem, function(e) {
                                    var e = _.extend(e, {
                                        data: data
                                    })
                                    fn(e, elem);
                                });
                            })
                        }
                    });
                })
            }

            template.prototype._eventsList = {};

            template.prototype.events = function(hash) {
                var self = this;
                _.each(hash, function(fn, attr) {
                    if (Utils.isFunction(fn)) {
                        self._eventsList[attr] = fn;
                    }
                });
            }

            template.prototype.render = function(data) {
                var self = this;
                var done = false;
                var to;

                function doNext() {
                    Sarah.Cache.tmplVars[self._name] = Utils.getTemplateVars(self._html);
                    Deps.register('_vars' + self._name, function() {
                        return Sarah.Cache.tmplVars[self._name];
                    }, function(vars) {
                        vars.forEach(function(varb) {
                            if (typeof self[varb] === 'function') {
                                var hash = {};
                                hash[varb] = self[varb];
                                self.attributes(hash);
                            }
                        });
                    });
                    clearTimeout(to);
                    done = true;
                }

                if (self._html === undefined) {
                    to = setTimeout(function() {
                        done = true;
                    }, 10000);

                    if (self._url) {
                        $.ajax({
                            type: "GET",
                            async: false,
                            url: self._url,
                            success: function(data) {
                                self._html = data;
                                doNext();
                            },
                            error: function(xhr, status) {
                                throw Error(status);
                            }
                        })
                    } else if ($('[type="template"][name="' + self._name + '"]').length > 0) {
                        self._html = $('[type="template"][name="' + self._name + '"]').html();
                        doNext();
                    } else {
                        clearTimeout(to);
                        done = true;
                        throw Error('Template not found');
                        return;
                    };
                } else {
                    done = true;
                }

                while (done === false) {};
                if (data)
                    return this.template()(data);
                else
                    return this.template()(this._attributes);
            }

            template.prototype.renderToElement = function(elem) {
                var elem = $(elem);
                elem.html(this.render()).removeClass().addClass(this._name);
            }

            /* Listen for route changes */

            /**************************************************** SESSION *************************************************/

            var sess = Sarah.Session = function() {
                var self = this;
                this.data = {};
                this.flashTimeout = 5000;
            }

            sess.prototype._flash = [];

            sess.prototype.setFlash = function(data) {
                var self = this;
                self._flash.push(data);
                setTimeout(function() {
                    self.unsetFlash(data);
                }, self.flashTimeout);
            };

            sess.prototype.unsetFlash = function(data) {
                this._flash = _.without(this._flash, data);
            };

            sess.prototype.getFlash = function() {
                return this._flash || [];
            }

            sess.prototype.set = function(variable, value) {
                this.data[variable] = value;
            };

            sess.prototype.remove = function(variable) {
                if (variable) {
                    delete this.data[variable];
                }
                console.log(this.data[variable])
            }

            sess.prototype.equals = function(key, value) {
                if (key) {
                    var saved = this.get(key);
                    if (saved === value) {
                        return true;
                    }
                }
                return false;
            }

            sess.prototype.get = function(variable, value) {
                return this.data[variable] || value;
            }

            sess.prototype.toggle = function(variable) {
                if (typeof this.data[variable] === 'undefined') {
                    this.data[variable] = false
                }
                this.data[variable] = !this.data[variable] || false;
                return this.data[variable];
            }

            sess.prototype.has = function(variable, value) {
                var self = this;
                if (this.data[variable] === undefined) {
                    this.data[variable] = [];
                }
                return (this.data[variable].indexOf(value) > -1) ? true : false;
            }

            sess.prototype.push = function(variable, values) {
                var self = this;
                if (this.data[variable] === undefined) {
                    this.data[variable] = [];
                }

                if (this.data[variable].map) {
                    if (values.map) {
                        values.forEach(function(value) {
                            self.data[variable].push(value);
                        });
                    } else {
                        self.data[variable].push(values);
                    }
                }
            }

            sess.prototype.pull = function(variable, value) {
                if (this.data[variable].map) {
                    this.data[variable] = _.without(this.data[variable], value);
                }
            }
            Sarah.Start(options);
        }
    });