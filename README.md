# W3sockets Implementation
- From Retention to Conversion. Develop real-time web applications delivering the dynamism which indeed holds the potential to convert your website visitors!

```sh
npm i w3sockets
```

# Step:- 1

```sh
let w3sockets = require('w3sockets');
```
# Step:- 2

```sh
w3sockets.initialize({
	channel: 'channel_name',
	grant_type: 'client_credentials',
	public_key: 'your_public_key',
	secret_key: 'your_screte_key'
})
```
# For push socket notification

```sh
w3sockets.push('event_name', 'your_message_here')
```
# For push notification to firebase

```sh
w3sockets.pushFirebaseNotification('event_name', 'your_message_here')
```