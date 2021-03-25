var request = require('request');
var fs = require('fs');
const path = require('path');
const accessTokenFile = path.join(__dirname, 'access-token.text');

let grant_type = '';
let public_key = '';
let secret_key = '';


exports.initialize = async function (data) {
    grant_type = data.grant_type;
    public_key = data.public_key;
    secret_key = data.secret_key;
}

exports.push = async function (channel, event, message) {
    const ref = this;

    return await new Promise(async (resolve, reject) => {
        return await ref.getAccessToken().then(async (accessToken) => {

            let data = {
                channel: `${public_key}-${channel}`,
                event: event,
                message: message
            };

            await request.post({
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                url: `https://www.w3sockets.com/api/v1/push/notify`,
                form: {
                    access_token: accessToken,
                    data: data
                }
            }, async function (error, response, body) {
                if (error) {
                    return reject(null)
                }

                if (!body) {
                    return reject(null)
                }

                let notification_response = JSON.parse(body);
                resolve(notification_response)
            });
        })
    })
}

exports.getAccessToken = async function () {
    return await new Promise(async (resolve, reject) => {

        let accessTokenFromStorage = fs.readFileSync(accessTokenFile, 'utf8');

        if (!!accessTokenFromStorage) {

            const accessTokens = JSON.parse(accessTokenFromStorage);

            const currentTime = parseInt(Date.now() / 1000);

            const expireTime = accessTokens.created_at + accessTokens.expires_in;

            if (expireTime > currentTime) {
                resolve(accessTokens.access_token);
                return
            }
        }

        await request.post({
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },

            url: `https://www.w3sockets.com/oauth/token`,
            form: {
                client_id: public_key,
                client_secret: secret_key,
                grant_type: grant_type
            },
        }, function (error, response, body) {
            if (error) {
                return reject(null)
            }

            if (!body) {
                return reject(null)
            }

            fs.writeFile(accessTokenFile, body, function () { });

            let notification_response = JSON.parse(body);
            resolve(notification_response.access_token)
        });
    })
};

exports.pushFirebaseNotification = async function (channel, message_title, message_body) {
    const ref = this;

    return await new Promise(async (resolve, reject) => {
        return await ref.getAccessToken().then(async (accessToken) => {
            let data = {
                channel: `https://www.w3sockets.com/-${channel}`,
                receiver_id: message.body.receiver,
                message: {
                    name: message_title,
                    body: message_body
                }
            };

            await request.post({
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                url: `https://www.w3sockets.com/api/v1/push/push_notification`,
                form: {
                    access_token: accessToken,
                    data: data
                }
            }, function (error, response, body) {
                if (error) {
                    return reject(null)
                }

                if (!body) {
                    return reject(null)
                }
                console.log('Firebase push notification_response', body);
                let notification_response = JSON.parse(body);
                resolve(notification_response)
            });
        })
    })
}
