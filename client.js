const WebSocket = require('ws');
const util = require('util');
const EventEmitter = require('events');

module.exports.message_Queue = message_Queue = [];
const Client = (function () {
    function Client() {
        return this.Address = "ws://198.199.109.223:88";
    }

    Client.prototype.login = function (email, token) {
        this.Email = email;
        this.Token = token;
        return this.connect();
    };

    Client.prototype.connect = function () {
        this.startTime = Date.now();
        this.ws = new WebSocket(this.Address);

        this.ws.onopen = (() => {
            this.message_Queue_Sender();
            this.send(['authSignIn', {
                email: this.Email,
                token: this.Token,
                fingerprint: 'bot'
            }]);
            return this.send(['registerBot']);
        });

        this.ws.onclose = (() => {
            return this.emit("close", true);
        });

        this.ws.onmessage = ((e) => {
            let data = JSON.parse(e.data);
            let time = Date.now();
            if (data[0] == 'authError') {
                console.log('authError', ...data.slice(1));
                this.ws.close();
            } else if (data[0] == 'login') {
                this.emit("ready", true);
            }
            if (data[0][0] && data[0][0].serverName) {
                return this.emit('gameReport', Object.assign({
                    time: time,
                    reply: function (text, channel) {
                        message_Queue.push({
                            text,
                            channel: channel || data[1].channel
                        });
                    },
                }, data[0][0]));
            }
            if (data[0] === 'message') {
                return this.emit(data[0], Object.assign({
                    time: time,
                    reply: function (text, channel) {
                        message_Queue.push({
                            text,
                            channel: channel || data[1].channel
                        });
                    },
                }, ...data.slice(1)));
            } else return this.emit(data[0], Object.assign(...data.slice(1)));
        });

        return this.ws.onerror = ((e) => {
            return this.emit("error", e.data);
        });

    };

    Client.prototype.send = function (args) {
        return this.ws.send(JSON.stringify(args));
    };

    Client.prototype.message_Queue_Sender = function () {
        return setInterval(() => {
            if (message_Queue[0]) return this.send(['message', message_Queue.shift()]);
        }, 500);
    };

    return Client;

})();

util.inherits(Client, EventEmitter);
module.exports.Client = Client;
