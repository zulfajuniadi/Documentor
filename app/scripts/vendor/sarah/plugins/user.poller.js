;
(function(Sarah) {
    function run() {

        window.User = {};

        var InitCheckUser = function() {

            var error = 0;

            // checkuser every 1 minute
            setInterval(function() {
                $.ajax({
                    url: '/sarahphp/poller/me',
                    cache: false,
                    error: function() {
                        error++;
                        console.log('Error validating user');
                        if (error >= 3)
                            window.location = '/logout';
                    }
                });
            }, 10 * 1000);
        }

        Sarah.Utils.subscribe('LOAD:COLLECTION', function() {
            window.Users = new Collection('Users', {
                softDelete: false,
                plugins: {
                    poller: {
                        name: 'Users',
                    },
                }
            });

            Sarah.Utils.subscribe('LOAD:STATUS', function() {
                var hereFn = function() {
                    if (typeof User !== 'undefined')
                        Users.update({
                            email: User.email
                        }, {
                            status: 'Here'
                        });
                }
                var awayFn = function() {
                    if (typeof User !== 'undefined')
                        Users.update({
                            email: User.email
                        }, {
                            status: 'Away'
                        });
                }
                var offlineFn = function() {
                    var user = Users.get(User._id);
                    user.status = 'Offline';
                    var rid = Utils.genId();
                    $.ajax({
                        url: '/sarahphp/poller/Users/' + user._id,
                        type: 'PUT',
                        async: false,
                        contentType: 'application/json',
                        data: JSON.stringify({
                            rid: rid,
                            data: user
                        }),
                        processData: false
                    });
                }

                Sarah.Runtime.onBack.push(hereFn);
                Sarah.Runtime.onVisible.push(hereFn);
                Sarah.Runtime.onHidden.push(awayFn);
                Sarah.Runtime.onAway.push(awayFn);
                Sarah.Runtime.onClose.push(offlineFn);
            });

            $.ajax({
                url: '/sarahphp/poller/me',
                cache: false,
                success: function(res) {
                    var data = res.data;
                    var done = false;
                    Deps.register('_user', function() {
                        return Users.get(data._id);
                    }, function(result) {
                        if (result) {
                            if (!done) {
                                if (['Away', 'Offline'].indexOf(result.status) > -1) {
                                    Users.update({
                                        _id: data._id
                                    }, {
                                        status: 'Here'
                                    });
                                }
                                done = true;
                            }
                            window.User = result;
                        }
                    });
                    InitCheckUser();
                },
                error: function() {
                    window.location = '/logout';
                }
            });
        });
        Sarah.Runtime.Loaded['user.poller.js'] = true;
    }
    Sarah.Utils.load(
        [Sarah.Runtime.base + 'plugins/db.poller.js',
            function() {
                return Sarah.Runtime.Loaded['db.poller.js'];
            }
        ],
        function() {
            run();
        }
    )
})(Sarah);