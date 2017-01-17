angular.module('starter')

    .constant('config', {
        url: 'http://5.196.76.143:8080/', //5.196.76.143
        pushBotId: '', // setting pustbot id https://pushbots.com/
        googleSenderId: '', // setting google sender id
        api: {
            login: 'auth/phone',
            verify: 'auth/verify',
            users: 'api/users/',
            profile: 'api/users/profile/',
            chat: 'api/chats/',
            chatUpload: 'api/chats/upload/',
            chanel: 'api/chanels/',
            getChanel: 'api/chanels/getChanel/',
            privateChanel: 'api/chanels/private',
            upload: 'api/uploads',
            webrtc: 'api/webrtcs/',
            call: 'api/calls/'
        }
    });