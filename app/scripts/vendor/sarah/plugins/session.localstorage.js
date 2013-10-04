;
(function(Sarah) {
    function run() {
        var Utils = Sarah.Utils;
        Utils.subscribe('LOAD:SESSION', function() {
            window.Session.data = Utils.Store.get('___session___') || {};
        });

        Sarah.Runtime.onClose.push(function(event) {
            if (window.Session)
                Utils.Store.set('___session___', window.Session.data);
        });

        Sarah.Runtime.Loaded['session.localstorage.js'] = true;
    }
    Sarah.Utils.load(
        [Sarah.Runtime.base + 'libs/localstorage.js',
            function() {
                return Sarah.Utils.Store;
            }
        ],
        run()
    )
})(Sarah);