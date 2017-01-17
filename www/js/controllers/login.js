'use strict';

angular.module('starter')
    .controller('LoginCtrl', function ($scope, $ionicModal, $http, $location, $ionicScrollDelegate, config, $ionicLoading, $ionicPlatform, $state, localStorageService, ContactService) {

        $scope.data = {
            user: {}
        };

        $ionicModal.fromTemplateUrl('./templates/modals/country.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modal = modal;
        });

        $scope.openModal = function () {
            $scope.modal.show();
        };

        $scope.closeModal = function () {
            $scope.modal.hide();
        };

        $scope.selectCountry = function (country) {
            $scope.data.country = country;
            localStorageService.set('country', $scope.data.country);
            $scope.closeModal();
        };

        $scope.goTo = function(id){
            $location.hash('group-'+id);
            $ionicScrollDelegate.anchorScroll();
        };

        $scope.login = function () {
            if ($scope.data.country) {
                var user = angular.copy($scope.data.user);
                user.country = $scope.data.country;
                user.contacts = ContactService.formatContact(user.contacts, $scope.data.country);
                user.phone = user.phone.replace(/\s/g, '');
                if (user.phone[0] == 0) {
                    user.phone = user.phone.substr(1);
                }
                user.phone = '+' + $scope.data.country.callingCodes[0] + user.phone;
                $ionicLoading.show();
                $http.post(config.url + config.api.login, user).then(function successCallback(response) {
                    //localStorageService.set('user', response.data);
                    localStorageService.set('phoneNumber', response.data.phone)
                    $ionicLoading.hide();
                    $state.go('verify');
                    console.log('done', response)
                }, function errorCallback(response) {
                    $ionicLoading.hide();
                    console.log('err', response)
                });
            }
        };

        var getAllContacts = function() {
            function onSuccess(contacts) {
                $scope.data.user.contacts = contacts;
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

        var _init = function () {
            $http.get('./js/json/countries.json').success(function (response) {
                $scope.data.countries = response;
                $http.get('http://ip-api.com/json').success(function (response) {
                    var indexGroupCountry = _.findIndex($scope.data.countries, function(o) { return o.char == response.country[0]; });
                    var indexCountry = _.findIndex($scope.data.countries[indexGroupCountry].data, function(o) { return o.altSpellings == response.countryCode; });
                    if (indexGroupCountry !== -1 && indexCountry !== -1) {
                        $scope.data.country = $scope.data.countries[indexGroupCountry].data[indexCountry];
                        localStorageService.set('country', $scope.data.country);

                    }
                });
            });

            if (!$ionicPlatform.is('android') && !$ionicPlatform.is('ios')) {
                console.log('browser');
                $http.get('./js/json/contacts.json').success(function (response) {
                    $scope.data.user.contacts = response;
                    console.log($scope.data.user);
                })
            } else {
                console.log('device');
                document.addEventListener("deviceready", function () {
                    getAllContacts();
                }, false);
            }
        };
        _init();
    });