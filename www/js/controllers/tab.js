'use strict';

angular.module('starter')
    .controller('TabCtrl', function ($scope, $http, config, localStorageService, socket, $ionicPlatform, ContactService, $rootScope, $cordovaDevice, $ionicPopup, $interval, $timeout, $state, $ionicModal, Upload, $ionicLoading) {

        $scope.rootData = {};

        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
            $scope.rootData.state = toState.name;
            console.log($scope.rootData.state)
        });

        $scope.rootData.user = localStorageService.get('userInfo');


        $scope.updateState = function (state) {
            $scope.rootData.state = state;
        };

        var getAllContacts = function() {
            function onSuccess(contacts) {
                console.log('contact from device')
                var result = ContactService.formatContact(contacts, localStorageService.get('country'));
                updateContacts(result);
            }

            function onError(contactError) {
                alert('onError!');
            }

            var options      = new ContactFindOptions();
            options.filter = "";
            options.multiple=true;
            options.hasPhoneNumber=true;
            var fields = ["*"];
            navigator.contacts.find(fields, onSuccess, onError, options);
        };

        var updateContacts = function (contacts) {
            var user = {
                contacts: contacts,
                phone: localStorageService.get('phoneNumber')
            };

            $http.put(config.url + config.api.users + $scope.rootData.user._id, user).then(function successCallback(response) {

                angular.forEach(response.data.contacts, function (value) {
                    if (value.name.formatted != null) {
                        value.char = value.name.formatted[0].toUpperCase();
                    }
                });

                var result = _.chain(response.data.contacts)
                    .groupBy("char")
                    .value();
                var data = [];

                angular.forEach(result, function (value, key) {
                    data.push({
                        char: key,
                        users: value
                    })
                });

                $scope.rootData.user = response.data;
                $scope.rootData.user.contacts = data;
                $scope.rootData.user.contacts = data;

                localStorageService.set('userInfo', $scope.rootData.user);

                document.addEventListener("deviceready", function () {
                    if ($cordovaDevice.getPlatform() == 'iOS') {
                        cordova.plugins.iosrtc.registerGlobals();
                        console.log('ios rtc', cordova.plugins.iosrtc);

                        window.plugins.PushbotsPlugin.initialize(config.pushBotId);

                        //Get device token
                        window.plugins.PushbotsPlugin.getRegistrationId(function(token){
                            console.log("Registration Id:" + token);

                            if (token != $scope.rootData.user.pushToken) {
                                $http.put(config.url + config.api.profile + $scope.rootData.user._id,  {
                                    pushToken: token
                                }).then(function (response) {
                                    $scope.rootData.user.pushToken = response.data.pushToken;
                                    localStorageService.set('userInfo', $scope.rootData.user);
                                    $ionicLoading.hide();
                                })
                            }
                        });

                        window.plugins.PushbotsPlugin.resetBadge();

                    } else {
                        window.plugins.PushbotsPlugin.initialize(config.pushBotId, {"android":{"sender_id": config.googleSenderId}});
                        window.plugins.PushbotsPlugin.resetBadge();
                    }

                }, false);

                socket.syncUpdates('user', $scope.rootData.user);

            }, function errorCallback(response) {
                console.log('err', response)
            });
        };



        //global video call

        $ionicModal.fromTemplateUrl('./templates/modals/video-call.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalVideoCall = modal;
        });

        socket.socket.on('webrtc:save', function (message) {
            console.log('webrtc', message)

            if (message.status == 2 && message.uuid == $scope.rootData.user.phone) {
                gotMessageFromServer(message);
            }

            if (message.status == 3 && message.uuid == $scope.rootData.user.phone) {
                _destroyStream();
            }

            if (message.status == 1 && $scope.rootData.user.phone == message.uuid && !$scope.modalVideoCall.isShown()) {

                var confirmPopup = $ionicPopup.confirm({
                    title: 'You have a call come from ' + message.from.phone,
                });

                confirmPopup.then(function(res) {
                    if(res) {
                        var user = getContact(message.from.phone);
                        if (user.user) {
                            $scope.goDetailContact(user.index, user.user);
                            $scope.openVideoView(true);
                            $http.put(config.url + config.api.call + message.idCall, {
                                status: 2
                            }).then(function (responsive) {
                                //console.log(responsive)
                            });
                        }
                    } else {
                        $http.put(config.url + config.api.call + message.idCall, {
                            status: 3
                        }).then(function (responsive) {
                            //console.log(responsive)
                        });
                    }
                });

                $timeout(function () {
                    confirmPopup.close();
                }, 45000)
            }
        });

        var getContact = function (phone) {
            for (var i = 0; i < $scope.rootData.user.contacts.length; i++) {
                for (var j = 0; j < $scope.rootData.user.contacts[i].users.length; j++) {
                    if ($scope.rootData.user.contacts[i].users[j].active && phone == $scope.rootData.user.contacts[i].users[j].phoneNumbers[0].value) {
                        return {
                            index: j,
                            user: $scope.rootData.user.contacts[i].users[j]
                        }
                    }
                }
            }

            return {};
        };


        var peerConnectionConfig = {
            'iceServers': [
                {
                    url: 'stun:stun.anyfirewall.com:3478'
                }
            ]
        };

        var peerConnection;

        $scope.goDetailContact = function (index, user) {
            $scope.rootData.userContact = user;
            localStorageService.set('contactDetail', user);
            $state.go('tab.contact-detail', {contactId: index})
        };

        $scope.updateUserTo = function (id) {
            $scope.rootData.isUserTo = id;
        };


        $scope.openVideoView = function (isStream) {
            $scope.rootData.isStreaming = isStream;
            $scope.modalVideoCall.show();
            $scope.rootData.userSelected = localStorageService.get('contactDetail');
            if (isStream) {
                $scope.openVideoCall();
            }
        };

        var stop;
        $scope.fight = function() {
            // Don't start a new fight if we are already fighting
            if ( angular.isDefined(stop) ) return;

            stop = $interval(function() {
                if ($scope.rootData.timeoutCall) {
                    $scope.rootData.timeoutCall --;
                    console.log($scope.rootData.timeoutCall);
                } else {
                    _destroyStream();
                    $scope.stopFight();
                }
            }, 1000);
        };

        $scope.stopFight = function() {
            if (angular.isDefined(stop)) {
                $interval.cancel(stop);
                $scope.rootData.timeoutCall = 0;
                stop = undefined;
            }
        };

        $scope.calling = function () {
            if ($scope.rootData.localStream != null) {
                $scope.destroyStream()
            }
            $scope.rootData.timeoutCall = 45;
            $scope.fight();
            var params = angular.copy($scope.rootData.user);
            params.contacts = null;

            console.log('open video call');
            $http.post(config.url + config.api.call, {
                from: $scope.rootData.user._id,
                to: $scope.rootData.userSelected._id,
                status: 1
            }).then(function (response) {
                //console.log(responsive)
                $http.post(config.url + config.api.webrtc, {'uuid': $scope.rootData.isUserTo, from: params, status: 1, idCall: response.data._id}).then(function (responsive) {
                    //console.log(responsive)
                });
            });
            $scope.openVideoCall();
        };

        $scope.openVideoCall = function (successCb) {
            console.log('running webrtc', $scope.rootData.isStreaming)
            if (!$ionicPlatform.is('ios')) {
                console.log('run on android webrtc')

                navigator.webkitGetUserMedia({audio: true, video: true}, function(stream) {
                    console.log('run on android webrtc stream', stream)

                    $scope.rootData.localStream = stream;
                    $scope.rootData.localStream.src = window.URL.createObjectURL(stream);
                    $scope.$apply();
                    if ($scope.rootData.isStreaming) {
                        $scope.connect(true)
                    }
                    if (successCb) {
                        successCb(stream);
                    }
                }, function (e) {
                    console.log('No live audio input: ' + e);
                });
            } else {
                cordova.plugins.iosrtc.getUserMedia(
                    { audio: true, video: true },
                    function (stream) {
                        $scope.rootData.localStream = stream;
                        $scope.rootData.localStream.src = window.URL.createObjectURL(stream);
                        if ($scope.rootData.isStreaming) {
                            $scope.connect(true)
                        }
                        if (successCb) {
                            successCb(stream);
                        }
                        $scope.$apply();
                    },
                    function (error) {
                        console.error('getUserMedia failed: ', error);
                    }
                );
            }
        };

        if ($scope.rootData.user) {
            console.log('my Id', $scope.rootData.user.phone);
        }

        $scope.updateUserTo = function (id) {
            $scope.rootData.isUserTo = id;
        };

        $scope.connect = function (isCaller) {
            peerConnection = new RTCPeerConnection(peerConnectionConfig);
            peerConnection.onicecandidate = gotIceCandidate;
            peerConnection.onaddstream = gotRemoteStream;
            peerConnection.addStream($scope.rootData.localStream);

            if(isCaller) {
                peerConnection.createOffer().then(createdDescription).catch(errorHandler);
            }
        };

        $scope.destroyStream = function () {
            _destroyStream();

            if ($scope.rootData.timeoutCall) {
                $scope.stopFight();
            }

            $http.post(config.url + config.api.webrtc, {'uuid': $scope.rootData.isUserTo, status: 3}).then(function (responsive) {
                //console.log(responsive)
            });

        };

        $scope.stopCall = function () {
            _destroyStream();
            if ($scope.rootData.timeoutCall) {
                $scope.stopFight();
            }
        };

        var _destroyStream = function () {
            if (!$ionicPlatform.is('IOS')) {
                if ($scope.rootData.localStream) {
                    $scope.rootData.localStream.getVideoTracks()[0].stop();
                    $scope.rootData.localStream.getAudioTracks()[0].stop();
                }

                if ($scope.rootData.remoteStream) {
                    $scope.rootData.remoteStream.getVideoTracks()[0].stop();
                    $scope.rootData.remoteStream.getAudioTracks()[0].stop();
                }

                $scope.rootData.localStream = null;
            } else {
                if ($scope.rootData.localStream) {
                    $scope.rootData.localStream.getAudioTracks().forEach(function(track) { track.stop(); });
                    $scope.rootData.localStream.getVideoTracks().forEach(function(track) { track.stop(); });
                }

                if ($scope.rootData.remoteStream) {
                    $scope.rootData.remoteStream.getVideoTracks().forEach(function(track) { track.stop(); });
                    $scope.rootData.remoteStream.getAudioTracks().forEach(function(track) { track.stop(); });
                }


                $scope.rootData.localStream = null;
            }
            $scope.rootData.remoteStream = null;
            peerConnection = null;
            console.log($scope.rootData);
            $scope.modalVideoCall.hide();
        }

        function gotMessageFromServer(message) {
            if(!peerConnection) $scope.connect(false);

            var signal = message;

            // Ignore messages from ourself
            if(signal.uuid == $scope.rootData.isUserTo) return;

            if(signal.sdp) {
                console.log('create offer')
                peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
                    // Only create answers in response to offers
                    if(signal.sdp.type == 'offer') {
                        peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
                    }
                }).catch(errorHandler);
            } else if(signal.ice) {
                peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
            }
        }

        function gotIceCandidate(event) {
            if(event.candidate != null) {
                $http.post(config.url + config.api.webrtc, {'ice': event.candidate, 'uuid': $scope.rootData.isUserTo, status: 2}).then(function (responsive) {
                    //console.log(responsive)
                });
            }
        }

        function gotRemoteStream(event) {
            $scope.rootData.remoteStream = event.stream;
            $scope.rootData.remoteStream.src = window.URL.createObjectURL(event.stream);
            console.log('got remote stream', $scope.rootData.remoteStream);
            if ($scope.rootData.timeoutCall) {
                $scope.stopFight()
            }
            $scope.$apply();
            if ($ionicPlatform.is('IOS')) {
                angular.forEach([0, 500, 1000, 1500], function (delay) {
                    $timeout(function () {
                        cordova.plugins.iosrtc.refreshVideos();
                    }, delay);
                })
            }
        }

        function createdDescription(description) {
            console.log('got description');

            peerConnection.setLocalDescription(description).then(function() {

                $http.post(config.url + config.api.webrtc, {'sdp': peerConnection.localDescription, 'uuid': $scope.rootData.isUserTo, status: 2}).then(function (responsive) {
                    //console.log(responsive)
                });
            }).catch(errorHandler);
        }

        function errorHandler(error) {
            console.log(error);
        }

        $scope.$watch('rootData.file', function (file) {
            if (file && file != null) {
                $ionicLoading.show();
                Upload.upload({
                    url: config.url + config.api.chatUpload,
                    data: {image: file}
                }).then(function (resp) {
                    console.log('Success ', resp.data);
                    $http.put(config.url + config.api.profile + $scope.rootData.user._id,  {
                        avatar: config.url + resp.data
                    }).then(function (response) {
                        $scope.rootData.user.avatar = response.data.avatar;
                        localStorageService.set('userInfo', $scope.rootData.user)
                        $ionicLoading.hide();
                    })
                }, function (resp) {
                    console.log('Error status: ' + resp.status);
                }, function (evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    console.log('progress: ' + progressPercentage + '% ' + evt.config.data.image.name);
                });
            }
        });

        $scope.logOut = function () {
            localStorageService.clearAll();
            $state.go('intro');
        };

        var _init = function () {

            if (localStorageService.get('user')) {
                $scope.rootData.user = localStorageService.get('user');
                console.log($scope.rootData.user);
            }

            if (!$ionicPlatform.is('android') && !$ionicPlatform.is('ios')) {
                $http.get('./js/json/contacts.json').success(function (response) {
                    var result = ContactService.formatContact(response, localStorageService.get('country'));
                    updateContacts(result, localStorageService.get('country'))
                })
            } else {

                document.addEventListener("deviceready", function () {
                    getAllContacts();
                }, false);
            }

        };

        $scope.$on('$destroy', function () {
            socket.unsyncUpdates('user');
        });

        _init();
    });