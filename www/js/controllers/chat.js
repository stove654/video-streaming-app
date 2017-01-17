'use strict';

angular.module('starter')
    .controller('ChatCtrl', function ($scope, $http, config, localStorageService, socket, $state, $ionicModal, $ionicLoading) {

        $scope.data = {
            contacts: $scope.rootData.user.contacts
        };

        $scope.detailChanel = function (chanel) {
            localStorageService.set('detailChanel', chanel);
            $state.go('tab.chat-detail', {chatId: chanel._id})
        };

        $scope.isReadChat = function (users) {
            for (var i = 0; i < users.length; i++) {
                if ($scope.rootData.user._id == users[i].user._id) {
                    return users[i].read;
                }
            }
            return 0;
        };

        $ionicModal.fromTemplateUrl('./templates/modals/create-group.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalGroup = modal;
        });

        $scope.createGroup = function () {


            var chanel = {
                users: [],
                from: $scope.rootData.user._id,
                isPrivate: false,
                lastMessage: 'No message'
            };
            angular.forEach($scope.data.contacts, function (value) {
                angular.forEach(value.users, function (user) {
                    if (user.selected) {
                        chanel.users.push({
                            user: user._id
                        })
                    }
                })
            });
            chanel.users.push({
                user: $scope.rootData.user._id
            });

            if (chanel.users.length > 1) {
                $ionicLoading.show();
                $http.post(config.url + config.api.privateChanel, chanel).then(function (response) {
                    $ionicLoading.hide();
                    localStorageService.set('detailChanel', response.data);
                    $state.go('tab.chat-detail', {chatId: response.data._id});
                    $scope.modalGroup.hide();
                })
            }

        };

        $scope.delete = function (item, index) {
            $ionicLoading.show();
            $http.delete(config.url + config.api.chanel + item._id).then(function () {
                $ionicLoading.hide();
            })
        };

        var _init = function () {

            $http.get(config.url + config.api.chanel + $scope.rootData.user._id).then(function (response) {
                $scope.data.chats = response.data;
                socket.syncUpdates('chanel', $scope.data.chats);
            });

        };

        $scope.$on('$destroy', function () {
            socket.unsyncUpdates('chanel');
        });

        _init();
    });