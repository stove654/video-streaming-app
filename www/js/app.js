// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.services', 'ngCordova', 'LocalStorageModule', 'ui.utils.masks', 'btford.socket-io', 'angularMoment', 'emoji', 'ngFileUpload'])

    .run(function ($ionicPlatform, $rootScope, $state, $location, SessionService, localStorageService) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
                cordova.plugins.Keyboard.disableScroll(false);

            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
        });

        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {
            var shouldLogin = toState.data !== undefined
                && toState.data.requireLogin
                && !SessionService.isToken().isLoggedIn ;

            // NOT authenticated - wants any private stuff
            if(shouldLogin)
            {
                $state.go('intro');
                event.preventDefault();
                return;
            }
            console.log(SessionService.isToken().isLoggedIn)

            // authenticated (previously) comming not to root main
            if(SessionService.isToken().isLoggedIn) {
                var shouldGoToMain = fromState.name === ''
                    && toState.name !== 'tab.contacts' ;
                return;
            }



        });
    })

    .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider

            .state('intro', {
                url: '/intro',
                templateUrl: 'templates/intro.html'
            })

            .state('login', {
                url: '/login',
                templateUrl: 'templates/login.html',
                controller: 'LoginCtrl'
            })

            .state('verify', {
                url: '/verify',
                templateUrl: 'templates/verify.html',
                controller: 'VerifyCtrl'
            })

            // setup an abstract state for the tabs directive
            .state('tab', {
                url: '/tab',
                abstract: true,
                templateUrl: 'templates/tabs.html',
                controller: 'TabCtrl'
            })

            // Each tab has its own nav history stack:

            .state('tab.contacts', {
                url: '/contacts',
                views: {
                    'tab-contacts': {
                        templateUrl: 'templates/tabs/tab-contacts.html',
                        controller: 'ContactCtrl'
                    }
                },
                data : {requireLogin : true }
            })

            .state('tab.contact-detail', {
                url: '/contacts/:contactId',
                views: {
                    'tab-contacts': {
                        templateUrl: 'templates/tabs/contact-detail.html',
                        controller: 'ContactDetailCtrl'
                    }
                },
                data : {requireLogin : true }
            })

            .state('tab.calls', {
                url: '/calls',
                views: {
                    'tab-calls': {
                        templateUrl: 'templates/tabs/tab-calls.html',
                        controller: 'CallCtrl'
                    }
                },
                data : {requireLogin : true }
            })

            .state('tab.chats', {
                url: '/chats',
                views: {
                    'tab-chats': {
                        templateUrl: 'templates/tabs/tab-chats.html',
                        controller: 'ChatCtrl'
                    }
                },
                data : {requireLogin : true }
            })

            .state('tab.chat-detail', {
                url: '/chats/:chatId',
                views: {
                    'tab-chats': {
                        templateUrl: 'templates/tabs/chat-detail.html',
                        controller: 'ChatDetailCtrl'
                    }
                }
            })

            .state('tab.account', {
                url: '/account',
                views: {
                    'tab-account': {
                        templateUrl: 'templates/tabs/tab-account.html',
                    }
                }
            });

        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/tab/contacts');
        $ionicConfigProvider.views.maxCache(0);
        $ionicConfigProvider.tabs.position('bottom');
    })

    .filter("trustUrl", ['$sce', function ($sce) {
        return function (recordingUrl) {
            return $sce.trustAsResourceUrl(recordingUrl);
        };
    }]);
