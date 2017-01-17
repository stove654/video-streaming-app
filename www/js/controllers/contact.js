'use strict';

angular.module('starter')
    .controller('ContactCtrl', function ($scope, $http, config, localStorageService, socket, $state, $ionicScrollDelegate) {

        $scope.data = {};

        $scope.scrollToTop = function () {
            $ionicScrollDelegate.scrollTop();
        };

        $scope.$watch('searchText.name.formatted', function (newValue, oldValue) {
            if (newValue) {
                $scope.searchChar = {
                    char: newValue[0]
                };
                $ionicScrollDelegate.scrollTop();
            } else {
                $scope.searchChar = {};
            }
        });

        var _init = function () {

        };

        _init();
    });