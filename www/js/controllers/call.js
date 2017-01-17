'use strict';

angular.module('starter')
    .controller('CallCtrl', function ($scope, $http, config, $ionicLoading) {

        $scope.data = {
            calls: []
        };


        $scope.delete = function (item, index) {
            $ionicLoading.show();
            $http.delete(config.url + config.api.call + item._id).then(function () {
                $scope.data.calls.splice(index, 1);
                $ionicLoading.hide();
            })
        };


        var _init = function () {
            $http.get(config.url + config.api.call, {
                params: {
                    id: $scope.rootData.user._id
                }
            }).then(function (response) {
                console.log(response)
                $scope.data.calls = response.data;
            })
        };

        _init();
    });