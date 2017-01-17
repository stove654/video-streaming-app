'use strict';

angular.module('starter')
    .controller('ContactDetailCtrl', function ($scope, $http, config, localStorageService, $state, $ionicModal, $ionicPlatform) {

        $scope.data = {
            contact: localStorageService.get('contactDetail'),
            user: localStorageService.get('contactDetail')
        };

        $scope.createPrivateChat = function () {
            var chanel = {
                users: [
                    {
                        user: $scope.rootData.user._id,
                        isRead: true
                    },
                    {
                        user: $scope.data.contact._id
                    }
                ],
                from: $scope.rootData.user._id,
                to: $scope.data.contact._id,
                isPrivate: true
            };

            $http.post(config.url + config.api.privateChanel, chanel).then(function (response) {
                angular.forEach(response.data.users, function (value) {
                    if (value.user._id != $scope.rootData.user._id) {
                        value.name =  $scope.data.contact.name.formatted
                    }
                });
                console.log(response.data.users)
                localStorageService.set('detailChanel', response.data);
                $state.go('tab.chat-detail', {chatId: response.data._id})
            })
        };

        var _init = function () {
            console.log($scope.data.contact)
            if ($scope.data.contact.active) {
                $scope.updateUserTo($scope.data.contact.phoneNumbers[0].value);
                $http.get(config.url + config.api.users + 'phone/' + $scope.data.contact.phoneNumbers[0].value).then(function (response) {
                    console.log(response.data);
                    $scope.data.user = response.data;
                });
            }

        };

        _init();
    });