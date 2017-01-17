angular.module('starter.services', [])

    .service('ContactService', function () {

        this.formatContact = function (contacts, country) {
            var contactsResult = [];
            angular.forEach(contacts, function (value) {
                var phoneNumbers = [];
                if (value.phoneNumbers != null) {
                    angular.forEach(value.phoneNumbers, function (value1) {
                        var number = value1;
                        number.value = number.value.replace(/\s/g, '');
                        if (number.value.indexOf('+') === -1) {
                            if (number.value[0] == 0) {
                                number.value = number.value.substr(1);
                            }
                            number.value = '+' + country.callingCodes[0] + number.value;
                        }

                        phoneNumbers.push(number);
                    });
                }
                contactsResult.push({
                    photos: value.photos,
                    phoneNumbers: phoneNumbers,
                    name: value.name
                })
            });

            return contactsResult;
        }
    })

    .directive('ionBottomSheet', [function() {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            controller: [function() {}],
            template: '<div class="modal-wrapper" ng-transclude></div>'
        };
    }])

    .directive('recordVoiceMessage', ['$document', '$ionicGesture', function($document, $ionicGesture) {
        return {
            link: function(scope, element, attr) {
                console.log(scope, element, attr, $ionicGesture);
                var isRecoding = false;
                var data = {};

                var startUserMedia = function (stream) {
                    var input = data.audio_context.createMediaStreamSource(stream);
                    console.log('Media stream created.');

                    data.recorder = new Recorder(input);
                    console.log('Recorder initialised.');

                    data.recorder && data.recorder.record();
                    console.log('Recording...');
                };

                $ionicGesture.on('hold', function (event) {
                    console.log('test');
                    isRecoding = true;
                    element.addClass('recording');

                    try {
                        // webkit shim
                        window.AudioContext = window.AudioContext || window.webkitAudioContext;
                        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
                        window.URL = window.URL || window.webkitURL;

                        data.audio_context = new AudioContext;
                        console.log(data.audio_context);
                        console.log('Audio context set up.');
                        console.log('navigator.getUserMedia ' + (navigator.webkitGetUserMedia ? 'available.' : 'not present!'));


                    } catch (e) {
                        alert('No web audio support in this browser!');
                    }

                    navigator.webkitGetUserMedia({audio: true}, startUserMedia, function (e) {
                        console.log('No live audio input: ' + e);
                    });

                }, element);

                $ionicGesture.on('release', function (event) {
                    if (isRecoding) {
                        console.log('test off');
                        element.addClass('recorded');
                        isRecoding = false;

                        console.log('End recording', data.recorder);
                        data.recorder && data.recorder.stop();
                        data.recorder.exportWAV(function (blob) {
                            var voiceMessage = URL.createObjectURL(blob);
                            console.log(voiceMessage);
                        })

                    }
                }, element);
            }
        };
    }])


    .directive('ionBottomSheetView', function() {
        return {
            restrict: 'E',
            compile: function(element) {
                element.addClass('bottom-sheet modal');
            }
        };
    })

    .factory('ChatFactory', function ($http, config, localStorageService) {
        // Might use a resource here that returns a JSON array

        // Some fake testing data
        var api = {};

        api.readMessage = function (chanel) {
            $http.put(config.url + config.api.chanel + 'read/' + chanel, {
                user: localStorageService.get('userInfo')._id
            }).then(function (response) {

            })
        };

        return api;
    });
