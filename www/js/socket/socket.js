/* global io */
'use strict';

angular.module('starter')
    .factory('socket', function (socketFactory, config, $timeout, localStorageService, ChatFactory, $ionicScrollDelegate, $http) {

        // socket.io now auto-configures its connection when we ommit a connection url
        var ioSocket = io(config.url, {
            // Send auth token on connection, you will need to DI the Auth service above
            // 'query': 'token=' + Auth.getToken()
            path: '/socket.io-client'
        });

        var socket = socketFactory({
            ioSocket: ioSocket
        });

        return {
            socket: socket,

            syncUpdateChat: function (modelName, array, object, cb) {
                cb = cb || angular.noop;

                socket.on(modelName + ':save', function (item) {

                    if (item.chanel == object._id && item.from != localStorageService.get('userInfo')._id) {

                        var oldItem = _.find(array, {_id: item._id});
                        var index = array.indexOf(oldItem);
                        var event = 'created';

                        // replace oldItem if it exists
                        // otherwise just add item to the collection
                        if (oldItem) {
                            array.splice(index, 1, item);
                            event = 'updated';
                        } else {
                            array.push(item);
                            $ionicScrollDelegate.scrollBottom();
                        }
                        ChatFactory.readMessage(item.chanel);
                    }
                    cb(event, item, array);
                });

                /**
                 * Syncs removed items on 'model:remove'
                 */
                socket.on(modelName + ':remove', function (item) {
                    var event = 'deleted';
                    _.remove(array, {_id: item._id});
                    cb(event, item, array);
                });
            },

            /**
             * Register listeners to sync an array with updates on a model
             *
             * Takes the array we want to sync, the model name that socket updates are sent from,
             * and an optional callback function after new items are updated.
             *
             * @param {String} modelName
             * @param {Array} array
             * @param {Function} cb
             */

            syncUpdates: function (modelName, array, cb) {
                cb = cb || angular.noop;

                /**
                 * Syncs item creation/updates on 'model:save'
                 */
                socket.on(modelName + ':save', function (item) {

                    if (modelName == 'user') {
                        var event = 'updated';
                        for (var i = 0; i < array.contacts.length; i++) {
                            for (var j = 0; j < array.contacts[i].users.length; j++) {
                                if (array.contacts[i].users[j].phoneNumbers.length && item.phone == array.contacts[i].users[j].phoneNumbers[0].value) {
                                    array.contacts[i].users[j].active = true;
                                    break;
                                }
                            }
                        }

                    } else {
                        var oldItem = _.find(array, {_id: item._id});
                        var index = array.indexOf(oldItem);
                        var event = 'created';

                        // replace oldItem if it exists
                        // otherwise just add item to the collection
                        if (oldItem) {
                            if (modelName == 'chanel') {
                                $http.get(config.url + config.api.getChanel + item._id, {
                                    params: {
                                        id: localStorageService.get('user')._id
                                    }
                                }).then(function (response) {
                                    for (var i = 0; i < response.data.users.length; i++) {
                                        item.users[i].name = response.data.users[i].name;
                                        item.users[i].read = response.data.users[i].read;
                                    }
                                    array.splice(index, 1, item);
                                    event = 'updated';
                                });
                            } else {
                                array.splice(index, 1, item);
                                event = 'updated';
                            }

                        } else {
                            if (modelName == 'chanel') {
                                var check = false;
                                for (var i = 0; i < item.users.length; i++) {
                                    if (item.users[i].user._id == localStorageService.get('user')._id) {
                                        check = true;
                                        break;
                                    }
                                }
                                if (check) {
                                    $http.get(config.url + config.api.getChanel + item._id, {
                                        params: {
                                            id: localStorageService.get('user')._id
                                        }
                                    }).then(function (response) {
                                        for (var i = 0; i < response.data.users.length; i++) {
                                            item.users[i].name = response.data.users[i].name;
                                            item.users[i].read = response.data.users[i].read;
                                        }
                                        array.push(item);
                                    });
                                }
                            }
                        }
                    }

                    cb(event, item, array);
                });

                /**
                 * Syncs removed items on 'model:remove'
                 */
                socket.on(modelName + ':remove', function (item) {
                    var event = 'deleted';
                    _.remove(array, {_id: item._id});
                    cb(event, item, array);
                });
            },

            /**
             * Removes listeners for a models updates on the socket
             *
             * @param modelName
             */
            unsyncUpdates: function (modelName) {
                socket.removeAllListeners(modelName + ':save');
                socket.removeAllListeners(modelName + ':remove');
            }
        };
    });