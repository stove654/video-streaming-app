'use strict';

angular.module('starter')
    .controller('VerifyCtrl', function ($scope, $ionicModal, $http, $location, $ionicScrollDelegate, config, $ionicLoading, $ionicPlatform, $state, localStorageService, ContactService) {

        $scope.data = {
            user: {
                phone: localStorageService.get('phoneNumber')
            }
        };

        $scope.verify = function () {
            $scope.data.err = false;
            $http.post(config.url + config.api.verify, $scope.data.user).then(function successCallback(response) {
                if (response.data.success) {
                    localStorageService.set('user', response.data);
                    $state.go('tab.contacts');
                    console.log('go contacts');
                } else {
                    $scope.data.err = true;
                }
                $ionicLoading.hide();
                console.log('done', response)
            }, function errorCallback(response) {
                $ionicLoading.hide();
                console.log('err', response)
            });
        };
    });