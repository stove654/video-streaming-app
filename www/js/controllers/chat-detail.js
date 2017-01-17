'use strict';

angular.module('starter')
    .controller('ChatDetailCtrl', function ($scope, $http, config, localStorageService, socket, $state, $ionicScrollDelegate, $ionicModal, Upload, $ionicLoading, ChatFactory, $ionicPopup) {

        $scope.data = {
            chanel: localStorageService.get('detailChanel'),
            message: {
                text: ''
            },
            messages: [],
            icons: []
        };

        console.log($scope.data.chanel, $scope.rootData.user._id);

        $ionicModal.fromTemplateUrl('./templates/modals/bottom-sheet.html', {
            scope: $scope,
            viewType: 'bottom-sheet',
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modal = modal;
        });

        $scope.selectGroupIcon = function (index) {
            $scope.data.selectEmoji = $scope.data.icons[index];
        };

        $scope.$watch('data.file', function (file) {
            if (file && file != null) {
                $ionicLoading.show();
                Upload.upload({
                    url: config.url + config.api.chatUpload,
                    data: {image: file}
                }).then(function (resp) {
                    console.log('Success ', resp.data);
                    createMessage(resp.data);
                    $ionicLoading.hide();
                }, function (resp) {
                    console.log('Error status: ' + resp.status);
                }, function (evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    console.log('progress: ' + progressPercentage + '% ' + evt.config.data.image.name);
                });
            }
        });

        $scope.addMessage = function () {
            if ($scope.data.message.text) {
                createMessage();
            }
        };

        $scope.addIcon = function (icon) {
            if (!$scope.data.message.text) {
                $scope.data.message.text = '';
            }
            console.log($scope.data.message.text)
            $scope.data.message.text += ':' + icon.name + ':';
            $scope.modal.hide();
        };

        var createMessage = function (image) {

            var message = angular.copy($scope.data.message);
            message.from = $scope.rootData.user._id;
            message.chanel = $scope.data.chanel._id;
            message.fromName = $scope.rootData.user.phone;
            message.updatedAt = new Date();

            if (image) {
                message.image = config.url + image;
            }

            $scope.data.messages.push(message);
            $ionicScrollDelegate.scrollBottom();
            $http.post(config.url + config.api.chat, message).then(function (response) {
                $scope.data.message = {};
            });
        };

        $scope.leaveGroup = function () {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Do you want leave group?'
            });
            confirmPopup.then(function(res) {
                if(res) {
                    $http.put(config.url + config.api.chanel + 'leaveGroup/' + $scope.data.chanel._id, {
                        id: $scope.rootData.user._id
                    }).then(function (response) {
                        console.log(response.data);
                        $state.go('tab.chats');
                    })
                } else {

                }
            });
        };

        $scope.clearChat = function () {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Do you want clear messages?'
            });
            confirmPopup.then(function(res) {
                if(res) {
                    $http.delete(config.url + config.api.chanel + 'messages/' + $scope.data.chanel._id).then(function (response) {
                        console.log(response.data);
                        $scope.data.messages = [];
                    })
                } else {

                }
            });
        };

        var _init = function () {

            $http.get(config.url + config.api.chat + $scope.data.chanel._id).then(function (response) {
                $scope.data.messages = response.data;
                socket.syncUpdateChat('chat', $scope.data.messages, $scope.data.chanel);
                $ionicScrollDelegate.scrollBottom();
            });

            $http.get('./js/json/emoji.json').then(function (response) {
                $scope.data.icons = response.data;
                $scope.data.selectEmoji = $scope.data.icons[0];
            });

            if (!$scope.data.chanel.isRead) {
                ChatFactory.readMessage($scope.data.chanel._id);
            }

            $scope.updateState($state.current.name);
        };

        _init();

        $scope.$on('$destroy', function () {
            socket.unsyncUpdates('chat');
            $scope.modal.hide();
        });
    });