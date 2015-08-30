/* global angular */
'use strict';

var _ = require('lodash');
var P = require('../util/promise');

require('./nb_util');
require('./nb_api');
require('./nb_nodes');
require('./nb_files');

var nb_console = angular.module('nb_console', [
    'nb_util',
    'nb_api',
    'ngRoute',
    'ngCookies',
    'ngAnimate',
    'ngSanitize',
    'ngTouch',
]);



nb_console.config(['$routeProvider', '$locationProvider', '$compileProvider',
    function($routeProvider, $locationProvider, $compileProvider) {
        // allow blob urls
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|file|blob|filesystem):/);
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|file|blob|filesystem):/);
        // routes
        $locationProvider.html5Mode(true);
        // using reloadOnSearch=false to ignore hash changes for the sake of nbHashRouter
        $routeProvider
            .when('/overview', {
                templateUrl: 'console/overview.html',
                reloadOnSearch: false,
            })
            // .when('/resource', {
            //     templateUrl: 'console/resource_view.html',
            //     reloadOnSearch: false,
            // })
            .when('/data', {
                templateUrl: 'console/data_view.html',
                reloadOnSearch: false,
            })
            .when('/tier/:tier_name', {
                templateUrl: 'console/tier_view.html',
                reloadOnSearch: false,
            })
            .when('/tier/:tier_name/:node_name*', {
                templateUrl: 'console/node_view.html',
                reloadOnSearch: false,
            })
            .when('/bucket/:bucket_name', {
                templateUrl: 'console/bucket_view.html',
                reloadOnSearch: false,
            })
            .when('/bucket/:bucket_name/:file_name*', {
                templateUrl: 'console/file_view.html',
                reloadOnSearch: false,
            })
            .when('/support', {
                templateUrl: 'console/support.html',
                reloadOnSearch: false,
            })
            .when('/users', {
                templateUrl: 'console/users_management.html',
                reloadOnSearch: false,
            })
            .otherwise({
                redirectTo: '/overview'
            });
    }
]);



nb_console.controller('ConsoleCtrl', [
    '$scope', '$http', '$q', '$window', '$location',
    'nbSystem', 'nbNodes', 'nbFiles', 'nbClient', 'nbAlertify',
    function($scope, $http, $q, $window, $location,
        nbSystem, nbNodes, nbFiles, nbClient, nbAlertify) {

        $scope.nbClient = nbClient;
        $scope.nbSystem = nbSystem;
        $scope.nbNodes = nbNodes;
        $scope.nbFiles = nbFiles;
        $scope.nbAlertify = nbAlertify;

        $scope.nav = {
            active: 'overview',
        };
    }
]);



nb_console.controller('SupportViewCtrl', [
    '$scope', '$q', '$timeout', '$window', '$location', '$routeParams',
    'nbClient', 'nbSystem', 'nbNodes', 'nbHashRouter', 'nbAlertify', 'nbModal',
    function($scope, $q, $timeout, $window, $location, $routeParams,
        nbClient, nbSystem, nbNodes, nbHashRouter, nbAlertify, nbModal) {
        $scope.nav.active = 'support';
        $scope.nav.reload_view = reload_view;
        $scope.create_account = create_account;

        var support_router = $scope.support_router =
            nbHashRouter($scope)
            .when('accounts', {
                templateUrl: 'console/support_accounts.html',
                reload: reload_accounts
            })
            .when('stats', {
                templateUrl: 'console/support_stats.html',
            })
            .when('settings', {
                templateUrl: 'console/support_settings.html',
            })
            .otherwise({
                redirectTo: 'accounts'
            });

        reload_view(true);

        function reload_view(init_only) {
            return nbSystem.init_system
                .then(function() {
                    if (!nbClient.account || !nbClient.account.is_support) {
                        $location.path('/');
                        return;
                    }
                    support_router.done();
                });
        }

        function reload_accounts() {
            return $q.when(nbClient.client.account.list_accounts())
                .then(function(res) {
                    console.log('ACCOUNTS', res);
                    $scope.accounts = res.accounts;
                });
        }

        function create_account() {
            var scope = $scope.$new();
            scope.system_name = '';
            scope.email = '';
            scope.password = '';


            scope.update_email_message = function() {
                scope.email_message = '';
            };
            scope.create = function() {
                return $q.when(nbClient.client.account.create_account({
                        name: scope.system_name,
                        email: scope.email,
                        password: scope.password
                    }))
                    .then(function() {
                        scope.modal.modal('hide');
                        return reload_accounts();
                    }, function(err) {
                        console.error('CREATE ACCOUNT ERROR:', err.stack, err);
                        if (err.rpc_code) {
                            nbAlertify.error(err.message);
                        } else {
                            nbAlertify.error('Failed: ' + JSON.stringify(err));
                        }
                        return reload_accounts();
                    });
            };
            scope.modal = nbModal({
                template: 'console/account_create_dialog.html',
                scope: scope,
            });
        }
    }
]);

nb_console.controller('UserManagementViewCtrl', [
    '$scope', '$q', '$timeout', '$window', '$location', '$routeParams',
    'nbClient', 'nbSystem', 'nbNodes', 'nbHashRouter', 'nbAlertify', 'nbModal',
    function($scope, $q, $timeout, $window, $location, $routeParams,
        nbClient, nbSystem, nbNodes, nbHashRouter, nbAlertify, nbModal) {
        $scope.nav.active = 'cog';
        $scope.nav.reload_view = reload_view;
        $scope.add_new_user = add_new_user;
        $scope.delete_user = delete_user;
        $scope.reset_password = reset_password;
        $scope.set_email = set_email;

        reload_accounts();
        console.log('accounts:' + $scope.accounts);

        function reload_view(init_only) {
            return nbSystem.init_system;
        }

        function reload_accounts() {
            return $q.when(nbClient.client.account.list_system_accounts())
                .then(function(res) {
                    $scope.accounts = res.accounts;
                });
        }

        function reset_password(user_email) {
            var scope = $scope.$new();
            scope.system_name = '';
            scope.password = '';
            scope.email = '';
            scope.update_password = true;
            scope.update = function() {
                return $q.when(nbClient.client.account.update_account({
                        name: nbSystem.system.name,
                        email: user_email,
                        password: scope.password,
                        original_email: user_email,
                    }))
                    .then(function() {
                        nbAlertify.success('Password for ' + user_email + ' has been set');
                        scope.modal.modal('hide');
                    }, function(err) {
                        console.error('Reset password failure:', err.stack, err);
                        if (err.rpc_code) {
                            nbAlertify.error(err.message);
                        } else {
                            nbAlertify.error('Failed: ' + JSON.stringify(err));
                        }
                    });
            };
            scope.modal = nbModal({
                template: 'console/reset_user_info_dialog.html',
                scope: scope,
            });
        }

        function set_email(user_email) {
            var scope = $scope.$new();
            scope.system_name = '';
            scope.password = '';
            scope.email = user_email;
            scope.update_email = true;
            scope.update = function() {
                console.log('scope.email:' + scope.email);
                return $q.when(nbClient.client.account.update_account({
                        name: nbSystem.system.name,
                        email: scope.email,
                        original_email: user_email,
                    }))
                    .then(function() {
                        if (scope.email) {
                            scope.modal.modal('hide');
                            nbAlertify.success('Email ' + scope.email + ' has been set');
                            reload_accounts();
                        }
                    }, function(err) {
                        console.error('Reset email failure:', err.stack, err);
                        if (err.rpc_code) {
                            nbAlertify.error(err.message);
                        } else {
                            nbAlertify.error('Failed: ' + JSON.stringify(err));
                        }
                    });
            };
            scope.modal = nbModal({
                template: 'console/reset_user_info_dialog.html',
                scope: scope,
            });
        }

        function delete_user(user_email) {
            console.log('attempt to delete ' + user_email);
            var user_info = _.find($scope.accounts, function(account) {
                console.log('attempt to delete acc:' + account.email);

                return account.email === user_email;
            });
            if (user_info) {
                if ($scope.accounts.length === 1) {
                    nbAlertify.error('System must have at least one account');
                } else {
                    if (nbClient.account.email === user_email) {
                        nbAlertify.error('Cannot delete current logged in user');
                    } else {

                        nbAlertify.confirm('Are you sure that you want to delete ' + user_email + '?')
                            .then(function(result) {
                                console.log('in confirm user deletion');

                                return $q.when(nbClient.client.account.delete_account(user_email))
                                    .then(function() {
                                        nbAlertify.success('User ' + user_email + ' has been deleted');
                                        reload_accounts();
                                    });

                            })
                            .then(null, function(err) {
                                if (err.message !== "canceled") {
                                    nbAlertify.error('Error while trying to delete user. ERROR:' + err.message);
                                }
                            });
                    }

                }

            } else {
                nbAlertify.error('User does not exist any more.');
                reload_accounts();
            }
        }

        function add_new_user() {
            var scope = $scope.$new();
            scope.system_name = '';
            scope.password = '';
            scope.email = '';
            console.log('system:', JSON.stringify(nbSystem.system));
            scope.update_email_message = function() {
                scope.email_message = 'Hi,\r\n' +
                    'I created a noobaa user for you\r\n' +
                    'To use NooBaa, go to ' + $location.protocol() + '://' + $location.host() + ':' + $location.port() + '\r\n' +
                    'User name: ' + scope.email + '\r\n' +
                    'password:' + scope.password + '\r\n' +
                    'you can change the password on your login or later on';
            };
            scope.update_email_message();
            scope.create = function() {

                return $q.when(nbClient.client.account.create_account({
                        name: nbSystem.system.name,
                        email: scope.email,
                        password: scope.password
                    }))
                    .then(function() {
                        scope.modal.modal('hide');
                        return reload_accounts();
                    }, function(err) {
                        console.error('CREATE ACCOUNT ERROR:', err.stack, err);
                        if (err.rpc_code) {
                            nbAlertify.error(err.message);
                        } else {
                            nbAlertify.error('Failed: ' + JSON.stringify(err));
                        }
                        return reload_accounts();
                    });
            };
            scope.modal = nbModal({
                template: 'console/account_create_dialog.html',
                scope: scope,
            });
        }

    }
]);




nb_console.controller('OverviewCtrl', [
    '$scope', '$q', '$location', '$timeout', '$window', 'nbSystem', 'nbModal',
    function($scope, $q, $location, $timeout, $window, nbSystem, nbModal) {
        $scope.nav.active = 'overview';
        $scope.nav.reload_view = reload_view;
        $scope.upload = upload;
        $scope.rest_server_information = rest_server_information;
        $scope.download_rest_server_package = download_rest_server_package;


        return $scope.nbSystem.init_system
            .then(function() {
                if (!$scope.nbNodes.node_groups) {
                    return $scope.nbNodes.refresh_node_groups();
                }
            })
            .then(function() {
                return $scope.nbNodes.draw_nodes_map();
            });

        function reload_view() {
            return $q.all([
                $scope.nbSystem.reload_system(),
                $scope.nbNodes.refresh_node_groups()
            ]);
        }

        function upload() {
            var bucket_name = $scope.nbSystem.system.buckets[0].name;
            $location.path('bucket/' + bucket_name);
            $timeout(function() {
                return $scope.nbFiles.upload_file(bucket_name);
            }, 1);
        }

        function rest_server_information() {
            var scope = $scope.$new();
            scope.access_keys = nbSystem.system.access_keys;

            var rest_host = ($window.location.host).replace(':' + nbSystem.system.web_port, '').replace(':' + nbSystem.system.ssl_port, ':443');
            console.log('SYS3:' + nbSystem.system.web_port + ' host:' + rest_host);
            scope.rest_endpoint = rest_host;
            scope.bucket_name = $scope.nbSystem.system.buckets[0].name;
            scope.rest_package = download_rest_server_package;
            console.log('rest_server_information', scope.rest_package, scope.rest_endpoint);
            console.log('rest_server_information', $window.location, $location);
            scope.modal = nbModal({
                template: 'console/rest_server_information.html',
                scope: scope,
            });
        }

        function download_rest_server_package() {
            console.log('rest_package1');
            var link;
            return nbSystem.get_s3_rest_installer()
                .then(function(url) {
                    console.log('GOT URL1:', url);
                    link = $window.document.createElement("a");
                    link.id = 'noobaa_link_rest_package';
                    $window.document.body.appendChild(link);
                    link.download = '';
                    link.href = url;
                    link.click();
                    return P.delay(2000);
                }).then(function() {
                    $window.document.body.removeChild(link);
                });
        }


    }
]);



nb_console.controller('SystemResourceCtrl', [
    '$scope', '$q', 'nbSystem',
    function($scope, $q, nbSystem) {
        $scope.nav.active = 'resource';
        $scope.nav.reload_view = reload_view;

        reload_view(true);

        function reload_view(init_only) {
            return init_only ? nbSystem.init_system : nbSystem.reload_system();
        }
    }
]);



nb_console.controller('SystemDataCtrl', [
    '$scope', '$q', 'nbSystem', '$rootScope', '$location', 'nbModal', 'nbClient', 'nbAlertify',
    function($scope, $q, nbSystem, $rootScope, $location, nbModal, nbClient, nbAlertify) {

        $scope.nav.active = 'data';
        $scope.nav.reload_view = reload_view;
        $scope.add_new_bucket = add_new_bucket;
        $scope.delete_bucket = delete_bucket;
        $scope.sync_bucket = sync_bucket;


        reload_view(true);

        function delete_bucket(bucket_name) {
            console.log('attempt to delete ' + bucket_name);
            var current_bucket = _.find(nbSystem.system.buckets, function(bucket) {
                return bucket.name === bucket_name;
            });
            if (current_bucket) {
                if (current_bucket.num_objects > 0) {
                    nbAlertify.error('Bucket contains ' + current_bucket.num_objects + ' objects. Only empty bucket can be deleted.');
                } else {

                    nbAlertify.confirm('Are you sure that you want to delete bucket "' + bucket_name + '"?')
                        .then(function(result) {
                            console.log('in confirm');
                            $q.when(nbClient.client.bucket.delete_bucket({
                                    name: bucket_name,
                                }))
                                .then(function() {
                                    nbAlertify.success('Bucket ' + bucket_name + ' has been deleted');
                                    reload_view();
                                });

                        })
                        .then(null, function(err) {
                            if (err.message !== "canceled") {
                                nbAlertify.error('Error while trying to delete bucket. ERROR:' + err.message);
                            }
                        });

                }

            } else {
                nbAlertify.error('Bucket does not exist any more.');
                reload_view();
            }
        }

        function sync_bucket(bucket_name) {
            var scope = $rootScope.$new();
            scope.done_disabled = 'disabled';
            scope.status = "Loading...";
            if (bucket_name.length > 10) {
                scope.bucket_name = bucket_name.substring(0, 10) + '...';
            } else {
                scope.bucket_name = bucket_name;
            }
            scope.full_bucket_name = bucket_name;
            scope.$location = $location;
            scope.accessKeys = [];

            console.log('Account:::' + JSON.stringify(nbClient.account));

            $q.when(nbClient.client.bucket.get_cloud_sync_policy({
                    name: bucket_name
                }))
                .then(function(cloud_sync_policy) {
                    console.log('cloud policy' + JSON.stringify(cloud_sync_policy));
                    if (_.isEmpty(cloud_sync_policy)) {
                        scope.status = "No policy defined";
                        scope.aws_target = "None";
                        scope.has_policy = false;
                        scope.arrow_type = 'arrow-inverse';
                    } else {
                        scope.status = cloud_sync_policy.status;
                        if (cloud_sync_policy.policy.endpoint.length > 10) {
                            scope.aws_target = cloud_sync_policy.policy.endpoint.substring(0, 10) + '...';
                        } else {
                            scope.aws_target = cloud_sync_policy.policy.endpoint;
                        }
                        scope.full_target_name = cloud_sync_policy.policy.endpoint;
                        scope.has_policy = true;
                        console.log('cloud policy' + JSON.stringify(cloud_sync_policy));
                        scope.arrow_type = 'arrow-success';
                    }

                });
            $q.when(nbClient.client.account.get_account_sync_credentials_cache())
                .then(function(cached_access_key) {
                    // TODO: Test, remove
                    // AKIAJOP7ZFXOOPGL5BOA knaTbOnT9F3Afk+lfbWDSAUACAqsfoWj1FnHMaDz
                    // AKIAIKFRM4EAAO5TAXJA nntw4SsW60qUUldKiLH99SJnUe2c+rsVlmSyQWHF


                    console.log('Cached keys :::' + JSON.stringify(cached_access_key));
                    scope.accessKeys.push({
                        access_key: 'Choose Access Key',
                        secret_key: '',
                        _id: ''
                    });
                    scope.selected_key = scope.accessKeys[0];
                    if (!_.isEmpty(cached_access_key)) {
                        scope.accessKeys = (_(scope.accessKeys).concat(cached_access_key)).value();

                        console.log('keys', scope.accessKeys);
                        scope.select_key();
                    }
                    scope.enable_new_key = false;
                    scope.access_key = '';
                    scope.secret_key = '';
                    scope.buckets = [];
                    scope.has_error = false;
                    scope.modal = nbModal({
                        template: 'console/sync_bucket.html',
                        scope: scope,
                    });
                });
            scope.add_new_key = function() {
                scope.enable_new_key = true;
                scope.access_key = '';
                scope.secret_key = '';
            };
            scope.set_cloud_sync_policy = function() {
                scope.has_policy = false;
            };
            scope.delete_cloud_sync_policy = function() {
                nbAlertify.confirm('Are you sure that you want to delete the sync policy?')
                    .then(function(result) {
                        console.log('in confirm sync policy deletion');
                        $q.when(nbClient.client.bucket.delete_cloud_sync({
                            name: bucket_name
                        }));
                    })
                    .then(function() {
                        scope.status = "No policy defined";
                        scope.arrow_type = 'arrow-inverse';
                        scope.has_policy = false;
                        scope.aws_target = '';
                    })
                    .then(null, function(err) {
                        console.log('err:' + err.message);
                        if (err.message !== 'canceled') {
                            scope.error_message = err.message;
                            scope.has_error = true;
                        }
                    });
            };
            scope.select_key = function() {
                console.log("selected:" + scope.selected_key.access_key);
                if (scope.selected_key.access_key === scope.accessKeys[0].access_key) {
                    console.log("empty bucket list");
                    scope.buckets = [];
                } else {

                    scope.buckets = ["Loading..."];
                    scope.selected_bucket = scope.buckets[0];
                    $q.when(nbClient.client.bucket.get_cloud_buckets({
                        access_key: scope.selected_key.access_key,
                        secret_key: scope.selected_key.secret_key
                    })).then(function(buckets_list) {
                        console.log('got list1' + JSON.stringify(buckets_list));
                        buckets_list.push('Choose Bucket for sync');
                        scope.buckets = buckets_list;
                        console.log('got list2' + JSON.stringify(scope.buckets));
                        scope.selected_bucket = scope.buckets[buckets_list.length - 1];

                    }).then(null, function(err) {
                        scope.error_message = 'Error:' + err.message + ',' + err.stack;
                        scope.has_error = true;

                    });
                }

            };

            scope.select_bucket = function() {
                console.log("selected1:" + scope.selected_bucket);
                if (scope.selected_bucket !== scope.buckets[scope.buckets.length - 1]) {
                    scope.done_disabled = '';
                } else {
                    scope.done_disabled = 'disabled';
                }
            };

            scope.done = function() {
                console.log('done done');
                $q.when(nbClient.client.bucket.set_cloud_sync({
                    name: bucket_name,
                    policy: {
                        endpoint: scope.selected_bucket,
                        access_keys: [{
                            access_key: scope.selected_key.access_key,
                            secret_key: scope.selected_key.secret_key
                        }],
                        schedule: 360,
                        paused: false,
                        c2n_enabled: true,
                        n2c_enabled: true,
                        //TODO:: Change to this once direction can be chosen additions_only: scope.sync_deleted,
                        additions_only: false
                    }
                })).then(function() {
                    scope.modal.modal('hide');
                    nbAlertify.success('Congrats! ' + bucket_name + ' sync set');
                    reload_view();
                }).then(null, function(err) {
                    scope.error_message = err.message;
                    scope.has_error = true;
                });
            };
            scope.cancel_new_key = function() {
                console.log('cancel done key:', scope.access_key, ' secret: ', scope.secret_key);
                scope.enable_new_key = false;
                scope.error_message = '';
                scope.has_error = false;
                scope.select_key();

            };
            scope.save_new_key = function() {
                console.log('save done key:', scope.access_key, ' secret: ', scope.secret_key);
                if (!_.isEmpty(scope.access_key) && !_.isEmpty(scope.secret_key)) {
                    if (_.findIndex(scope.accessKeys, {
                            'access_key': scope.access_key
                        }) > 0) {
                        scope.error_message = "Key already exists";
                        scope.has_error = true;
                    } else {

                        scope.buckets = ["Loading..."];
                        scope.selected_bucket = scope.buckets[0];
                        $q.when(nbClient.client.bucket.get_cloud_buckets({
                            access_key: scope.access_key,
                            secret_key: scope.secret_key
                        })).then(function(buckets_list) {
                            console.log('got list' + JSON.stringify(buckets_list));
                            scope.enable_new_key = false;
                            scope.error_message = '';
                            scope.has_error = false;

                            scope.buckets = _(['Choose Bucket for sync']).concat(buckets_list);
                            scope.selected_bucket = scope.buckets[0];

                        }).then(function() {

                            scope.accessKeys.push({
                                access_key: scope.access_key,
                                secret_key: scope.secret_key
                            });
                            return $q.when(nbClient.client.account.add_account_sync_credentials_cache({
                                access_key: scope.access_key,
                                secret_key: scope.secret_key
                            }));
                        }).then(function() {
                            console.log('done save');
                            scope.enable_new_key = false;
                            nbAlertify.success('Added AWS credentials to the cache!');
                            scope.selected_key = scope.accessKeys[scope.accessKeys.length-1];
                            scope.select_key();
                        }).then(null, function(err) {
                            scope.error_message = err.message;
                            scope.has_error = true;

                        });
                    }
                } else {
                    scope.error_message = "Empty keys. Please enter access key and secret key.";
                    scope.has_error = true;
                }

            };
        }

        function add_new_bucket() {
            var scope = $rootScope.$new();
            scope.$location = $location;
            scope.has_error = false;
            scope.modal = nbModal({
                template: 'console/add_new_bucket.html',
                scope: scope,
            });
            scope.done = function() {
                console.log('name:' + scope.new_bucket_name);
                var bucket_name = scope.new_bucket_name.toLowerCase();
                var return_value = validate_bucket_name(bucket_name);
                if (return_value === "ok") {
                    $q.when(nbClient.client.bucket.create_bucket({
                        name: bucket_name,
                        tiering: ['nodes']
                    })).then(function() {
                        console.log('created new bucket');
                        scope.modal.modal('hide');
                        nbAlertify.success('Congrats! ' + bucket_name + ' bucket is ready');
                        reload_view();
                    }).then(null, function(err) {
                        scope.error_message = 'Error:' + err.message + ',' + err.stack;
                        scope.has_error = true;

                    });

                } else {
                    scope.error_message = return_value;
                    scope.has_error = true;
                }
            };
        }

        function check_is_IPv4(entry) {
            var blocks = entry.split(".");
            if (blocks.length === 4) {
                return blocks.every(function(block) {
                    return parseInt(block, 10) >= 0 && parseInt(block, 10) <= 255;
                });
            }
            return false;
        }

        //Copied from amazon java sdk
        function validate_bucket_name(bucket_name) {
            var error_message = '';
            if (bucket_name.length < 3 || bucket_name.length > 63) {
                error_message = ('The bucket name must be between 3 and 63 characters.');
                return error_message;
            }
            if (check_is_IPv4(bucket_name)) {
                return "Bucket name should not contain IP address";
            }
            var previous = '\0';

            for (var i = 0; i < bucket_name.length; ++i) {
                var next = bucket_name.charAt(i);
                if (next >= 'A' && next <= 'Z') {
                    return "Bucket name should not contain uppercase characters";
                }

                if (next === ' ' || next === '\t' || next === '\r' || next === '\n') {
                    return "Bucket name should not contain white space";
                }

                if (next === '.') {
                    if (previous === '\0') {
                        return "Bucket name should not begin with a period";
                    }
                    if (previous === '.') {
                        return "Bucket name should not contain two adjacent periods";
                    }
                    if (previous === '-') {
                        return "Bucket name should not contain dashes next to periods";
                    }
                } else if (next === '-') {
                    if (previous === '.') {
                        return "Bucket name should not contain dashes next to periods";
                    }
                } else if ((next < '0') || (next > '9' && next < 'a') || (next > 'z')) {

                    return "Bucket name should not contain '" + next + "'";
                }

                previous = next;
            }

            if (previous === '.' || previous === '-') {
                return "Bucket name should not end with '-' or '.'";
            }


            var bucket_exists = _.find(nbSystem.system.buckets, function(bucket) {
                return bucket.name === bucket_name;
            });
            if (bucket_exists) {
                error_message = ('The bucket already exists.');
                return error_message;
            }

            return "ok";

        }

        function reload_view(init_only) {
            return init_only ? nbSystem.init_system : nbSystem.reload_system();
        }
    }
]);



nb_console.controller('TierViewCtrl', [
    '$scope', '$q', '$timeout', '$window', '$location', '$routeParams',
    'nbSystem', 'nbNodes', 'nbHashRouter', 'nbModal',
    function($scope, $q, $timeout, $window, $location, $routeParams,
        nbSystem, nbNodes, nbHashRouter, nbModal) {
        $scope.nav.active = 'tier';
        $scope.nav.reload_view = reload_view;
        $scope.nodes_num_pages = 0;
        $scope.nodes_page_size = 10;
        $scope.nodes_query = {};

        var tier_router = $scope.tier_router =
            nbHashRouter($scope)
            .when('overview', {
                templateUrl: 'console/tier_overview.html',
            })
            .when('nodes', {
                templateUrl: 'console/tier_nodes.html',
                pagination: true,
                reload: reload_nodes
            })
            .when('stats', {
                templateUrl: 'console/tier_stats.html',
            })
            .when('settings', {
                templateUrl: 'console/tier_settings.html',
            })
            .otherwise({
                redirectTo: 'overview'
            });

        reload_view(true);

        function reload_view(init_only) {
            return $q.when()
                .then(function() {
                    return init_only ? nbSystem.init_system : nbSystem.reload_system();
                })
                .then(function() {
                    $scope.tier = _.find(nbSystem.system.tiers, function(tier) {
                        return tier.name === $routeParams.tier_name;
                    });
                    if (!$scope.tier) {
                        $location.path('/tier/');
                        return;
                    }
                    $scope.pie_chart = storage_pie_chart($scope, $scope.tier.storage);
                    tier_router.done();
                });
        }

        function reload_nodes(hash_query) {
            $scope.nodes_query = _.clone(hash_query);
            var query = {
                tier: $routeParams.tier_name
            };
            if ($scope.nodes_query.search) {
                query.name = $scope.nodes_query.search;
            }
            if ($scope.nodes_query.geo) {
                query.geolocation = $scope.nodes_query.geo;
            }
            if ($scope.nodes_query.state) {
                // online/offline
                query.state = $scope.nodes_query.state;
            }
            return nbNodes.list_nodes({
                query: query,
                skip: $scope.nodes_query.page * $scope.nodes_page_size,
                limit: $scope.nodes_page_size,
                pagination: true
            }).then(function(res) {
                $scope.nodes = res.nodes;
                set_number_of_nodes(res.total_count);
            });
        }

        function set_number_of_nodes(count) {
            $scope.nodes_num_pages = Math.ceil(
                count / $scope.nodes_page_size);
            $scope.nodes_pages = _.times(Math.min(15, $scope.nodes_num_pages), _.identity);
            tier_router.set_num_pages('nodes', $scope.nodes_num_pages);
        }

    }
]);



nb_console.controller('NodeViewCtrl', [
    '$scope', '$q', '$timeout', '$window', '$location', '$routeParams',
    'nbClient', 'nbSystem', 'nbNodes', 'nbHashRouter',
    function($scope, $q, $timeout, $window, $location, $routeParams,
        nbClient, nbSystem, nbNodes, nbHashRouter) {
        $scope.nav.active = 'tier';
        $scope.nav.reload_view = reload_view;
        $scope.parts_num_pages = 0;
        $scope.parts_page_size = 10;
        $scope.parts_query = {};

        var node_router = $scope.node_router =
            nbHashRouter($scope)
            .when('parts', {
                templateUrl: 'console/node_parts.html',
                pagination: true,
                reload: reload_parts
            })
            .when('properties', {
                templateUrl: 'console/node_properties.html',
            })
            .when('stats', {
                templateUrl: 'console/node_stats.html',
            })
            .when('settings', {
                templateUrl: 'console/node_settings.html',
            })
            .when('overview', {
                templateUrl: 'console/node_overview.html',
            })
            .otherwise({
                redirectTo: 'overview'
            });

        reload_view(true);

        function reload_view(init_only) {
            return $q.when()
                .then(function() {
                    return init_only ? nbSystem.init_system : nbSystem.reload_system();
                })
                .then(function() {
                    $scope.tier = _.find(nbSystem.system.tiers, function(tier) {
                        return tier.name === $routeParams.tier_name;
                    });
                    if (!$scope.tier) {
                        $location.path('/tier/');
                        return;
                    }
                    return nbNodes.read_node($routeParams.node_name);
                })
                .then(function(node) {
                    $scope.node = node;
                    $scope.pie_chart = storage_pie_chart($scope, node.storage);

                    // TODO handle node parts pages
                    $scope.parts_num_pages = 9;
                    // Math.ceil($scope.bucket.num_objects / $scope.parts_page_size);
                    $scope.parts_pages = _.times(Math.min(15, $scope.parts_num_pages), _.identity);
                    node_router.set_num_pages('parts', $scope.parts_num_pages);
                    node_router.done();
                });
        }

        function reload_parts(hash_query) {
            $scope.parts_query = _.clone(hash_query);
            var query = {
                name: $routeParams.node_name,
                skip: $scope.parts_query.page * $scope.parts_page_size,
                limit: $scope.parts_page_size,
            };
            return $q.when(nbClient.client.node.read_node_maps(query))
                .then(function(res) {
                    $scope.parts = [];
                    _.each(res.objects, function(object) {
                        _.each(object.parts, function(part) {
                            // TODO handle parity frags
                            var frag_size = part.chunk.size / part.chunk.data_frags;
                            _.each(part.frags, function(fragment) {
                                fragment.start = part.start + (frag_size * fragment.frag);
                                fragment.size = frag_size;
                            });
                            part.file = object.key;
                            part.bucket = object.bucket;
                            $scope.parts.push(part);
                        });
                    });
                });
        }
    }
]);



nb_console.controller('BucketViewCtrl', [
    '$scope', '$q', '$timeout', '$window', '$location', '$routeParams',
    'nbSystem', 'nbFiles', 'nbHashRouter', 'nbModal',
    function($scope, $q, $timeout, $window, $location, $routeParams,
        nbSystem, nbFiles, nbHashRouter, nbModal) {
        $scope.nav.active = 'bucket';
        $scope.nav.reload_view = reload_view;
        $scope.upload = upload;
        $scope.files_num_pages = 0;
        $scope.files_page_size = 10;
        $scope.files_query = {};
        $scope.rest_server_information = rest_server_information;
        $scope.download_rest_server_package = download_rest_server_package;

        var bucket_router = $scope.bucket_router =
            nbHashRouter($scope)
            .when('files', {
                templateUrl: 'console/bucket_files.html',
                pagination: true,
                reload: reload_files
            })
            // .when('transfers', {
            // templateUrl: 'console/bucket_transfers.html',
            // })
            .when('stats', {
                templateUrl: 'console/bucket_stats.html',
            })
            .when('settings', {
                templateUrl: 'console/bucket_settings.html',
            })
            .when('tiering', {
                templateUrl: 'console/bucket_tiering.html',
            })
            .when('link', {
                templateUrl: 'console/bucket_link.html',
            })
            .when('overview', {
                templateUrl: 'console/bucket_overview.html',
            })
            .otherwise({
                redirectTo: 'overview'
            });

        reload_view(true);

        function reload_view(init_only) {
            return $q.when()
                .then(function() {
                    return init_only ? nbSystem.init_system : nbSystem.reload_system();
                })
                .then(function() {
                    nbFiles.set_access_keys(nbSystem.system.access_keys, nbSystem.system.web_port, nbSystem.system.ssl_port);
                    $scope.bucket = _.find(nbSystem.system.buckets, function(bucket) {
                        return bucket.name === $routeParams.bucket_name;
                    });
                    if (!$scope.bucket) {
                        $location.path('/bucket/');
                        return;
                    }
                    $scope.pie_chart = storage_pie_chart($scope, $scope.bucket.storage, 0.4);
                    bucket_router.done();
                });
        }

        function reload_files(hash_query) {
            $scope.files_query = _.clone(hash_query);
            console.log('$scope.files_query', $scope.files_query);
            var params = {
                bucket: $routeParams.bucket_name,
                skip: $scope.files_query.page * $scope.files_page_size,
                limit: $scope.files_page_size,
                pagination: true
            };
            if ($scope.files_query.search) {
                params.key_query = $scope.files_query.search;
            }
            return nbFiles.list_files(params)
                .then(function(res) {
                    $scope.files = res.files;
                    set_number_of_files(res.total_count);
                });
        }

        function set_number_of_files(count) {
            $scope.files_num_pages = Math.ceil(
                count / $scope.files_page_size);
            $scope.files_pages = _.times(Math.min(15, $scope.files_num_pages), _.identity);
            bucket_router.set_num_pages('files', $scope.files_num_pages);
        }

        function upload() {
            return nbFiles.upload_file($routeParams.bucket_name)
                .then(function() {
                    return reload_view();
                });
        }

        function rest_server_information() {
            var scope = $scope.$new();
            scope.access_keys = nbSystem.system.access_keys;
            var rest_host = ($window.location.host).replace(':' + nbSystem.system.web_port, '').replace(':' + nbSystem.system.ssl_port, ':443');
            console.log('SYS2:' + nbSystem.system.web_port + ' host:' + rest_host);

            scope.rest_endpoint = rest_host;
            scope.bucket_name = $routeParams.bucket_name;
            scope.rest_package = download_rest_server_package;
            console.log('rest_server_information', scope.rest_package, scope.rest_endpoint);
            console.log('rest_server_information', $window.location, $location);
            scope.modal = nbModal({
                template: 'console/rest_server_information.html',
                scope: scope,
            });
        }

        function download_rest_server_package() {
            console.log('rest_package2');
            var link;
            return nbSystem.get_s3_rest_installer()
                .then(function(url) {
                    console.log('GOT URL2:', url);
                    link = $window.document.createElement("a");
                    link.download = '';
                    link.href = url;
                    $window.document.body.appendChild(link);
                    link.click();
                    return P.delay(2000);
                }).then(function() {
                    $window.document.body.removeChild(link);
                });
        }

    }
]);



nb_console.controller('FileViewCtrl', [
    '$scope', '$q', '$timeout', '$window', '$location', '$routeParams', '$sce',
    'nbClient', 'nbSystem', 'nbFiles', 'nbNodes', 'nbHashRouter', 'nbModal',
    function($scope, $q, $timeout, $window, $location, $routeParams, $sce,
        nbClient, nbSystem, nbFiles, nbNodes, nbHashRouter, nbModal) {
        $scope.nav.active = 'bucket';
        $scope.nav.reload_view = reload_view;
        $scope.play = play;
        $scope.parts_num_pages = 0;
        $scope.parts_page_size = 10;
        $scope.parts_query = {};

        var file_router = $scope.file_router =
            nbHashRouter($scope)
            .when('parts', {
                templateUrl: 'console/file_parts.html',
                pagination: true,
                reload: reload_parts
            })
            .when('properties', {
                templateUrl: 'console/file_properties.html',
            })
            .when('stats', {
                templateUrl: 'console/file_stats.html',
            })
            .when('settings', {
                templateUrl: 'console/file_settings.html',
            })
            .when('link', {
                templateUrl: 'console/file_link.html',
            })
            .otherwise({
                redirectTo: 'parts'
            });

        reload_view(true);


        function reload_view(init_only) {
            return $q.when()
                .then(function() {
                    return init_only ? nbSystem.init_system : nbSystem.reload_system();
                })
                .then(function() {
                    //Setting access keys.
                    //TODO: consider separation to other object with only the keys
                    //      also, check better solution in terms of security.
                    nbFiles.set_access_keys(nbSystem.system.access_keys, nbSystem.system.web_port, nbSystem.system.ssl_port);

                    $scope.bucket = _.find(nbSystem.system.buckets, function(bucket) {
                        return bucket.name === $routeParams.bucket_name;
                    });
                    if (!$scope.bucket) {
                        $location.path('/bucket/');
                        return;
                    }
                    return nbFiles.get_file({
                        bucket: $routeParams.bucket_name,
                        key: $routeParams.file_name,
                    }, 'cache_miss');
                })
                .then(function(res) {
                    $scope.file = res;

                    //now we get s3 rest signed url
                    console.log('url', $scope.file.url, $sce.trustAsResourceUrl($scope.file.url));
                    $scope.file_url = $sce.trustAsResourceUrl($scope.file.url);

                    // TODO handle file parts pages
                    $scope.parts_num_pages = 9;
                    // Math.ceil($scope.bucket.num_objects / $scope.parts_page_size);
                    $scope.parts_pages = _.times(Math.min(15, $scope.parts_num_pages), _.identity);
                    file_router.set_num_pages('parts', $scope.parts_num_pages);
                    file_router.done();
                });
        }

        function reload_parts(hash_query) {
            $scope.parts_query = _.clone(hash_query);
            var params = {
                bucket: $routeParams.bucket_name,
                key: $routeParams.file_name,
                skip: $scope.parts_query.page * $scope.parts_page_size,
                limit: $scope.parts_page_size,
                adminfo: true
            };
            return nbFiles.list_file_parts(params)
                .then(function(res) {
                    $scope.parts = res.parts;
                });
        }

        function play() {
            if ($scope.play_modal) {
                $scope.play_modal.modal('hide');
                $scope.play_modal = null;
            }
            $scope.play_modal = nbModal({
                template: 'console/file_play.html',
                size: 'lg',
                scope: $scope,
            });
        }

    }
]);


function storage_pie_chart($scope, storage, hole) {
    return {
        options: {
            is3D: false,
            legend: {
                position: 'bottom',
                // position: 'labeled',
                alignment: 'center',
                maxLines: 10,
                textStyle: {
                    color: '#eeeeee'
                }
            },
            backgroundColor: {
                fill: 'transparent',
            },
            tooltip: {
                showColorCode: true,
            },
            sliceVisibilityThreshold: 0,
            pieHole: hole || 0,
            pieSliceText: 'value',
            pieSliceTextStyle: {
                color: '#eeeeee'
            },
            slices: [{
                color: '#ff008b',
                // offset: 0.10
            }, {
                color: '#03a9f4',
            }, {
                color: '#666',
            }]
        },
        data: [
            ['Storage', 'Capacity'],
            ['NooBaa Usage', {
                v: storage.used,
                f: $scope.human_size(storage.used)
            }],
            ['OS Usage', {
                v: storage.used_os,
                f: $scope.human_size(storage.used_os)
            }],
            ['Free Space', {
                v: storage.free,
                f: $scope.human_size(storage.free)
            }],
        ]
    };
}
