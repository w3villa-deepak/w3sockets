var channel = function (name, w3socket) {
  var self = this;
  this.w3socket = w3socket || null;
  this.bindEvent = function (eventName) {
    // this.log('I am inside channel: ' + eventName);
  }
  return this;
}
// SOCKET EVENTS AND PROTOTYPES //
function Socket(url, options, w3socket) {
  this.socketObj = io(url, options);
  this.w3socket = w3socket;
  // this.w3socket.log(url + JSON.stringify(options) + JSON.stringify(w3socket));
}
Socket.prototype.emit = function (eventName, data) {
  // this.w3socket.log('Socket.prototype.emit: Emitting socket event: ' + eventName + ' data: ' + JSON.stringify(data));
  if (!eventName) {
    return false;
  }
  // this.w3socket.log("Emitting socket event from front end!");
  this.socketObj.emit(eventName, data);
}
Socket.prototype.on = function (eventName, cb) {
  var self = this;
  // this.w3socket.log('Socket.prototype.on: Listening socket on for event: ' + eventName);
  this.socketObj.on(eventName, function (data) {
    // self.w3socket.log('Socket.prototype.on: Data received from server for : ' + eventName, data);
    cb(data);
  });
}

Socket.prototype.off = function(eventName, cb) {
	var self = this;
	console.log('Socket.prototype.off: Listening socket off for event: ' + eventName);
	this.socketObj.off(eventName);
}

// CHANNEL EVENTS AND PROTOTYPES //
function Channel(name, w3socket) {
  this.name = name;
  this.w3socket = w3socket;
}
Channel.prototype.join = function (channelName) {
  // this.w3socket.log('Channel.prototype.join: Join channel request for: ' + channelName);
}
Channel.prototype.bindEvent = function (eventName, callback) {
  var self = this;
  // this.w3socket.log('Channel.prototype.bindEvent: bind event request for: ' + eventName);
  this.w3socket.socket.on(eventName, function (data) {
    // self.w3socket.log('Channel.prototype.bindEvent: Data transfered for channel ' + this.name + ' : ' + data);
    callback(data)
  });
}

// Socket unBindEvent event
Channel.prototype.unBindEvent = function(eventName) {
	console.log('Channel.prototype.unBindEvent: unbind event request for: ' + eventName);
	this.w3socket.socket.off(eventName);
}

function W3sockets(APPKEY, options) {
  var self = this;
  this.options = options || {};
  this.socket = null // Socket object
  // this.host = "http://192.168.0.198";
  this.host = "https://www.w3sockets.com";
  this.port = "8000";
  this.initiated = false;
  this.appLoaded = false;
  this.appName = "W3sockets";
  this.APPKEY = APPKEY // Store APPKEY for current client
  this.socketConnected = false;
  this.channels = [];
  this.debugMode = false;

  // Process after connection
  this.processConnection = function () {
      self.socket.on("connected", function (data) { // Listen connected event from server
        options.appId = self.APPKEY
        self.socket.emit("appDetails", options); // Send app details to server
      })
      self.socket.on("disconnect", function (event) {
        console.log('socket disconnect', event);
        self.socketConnected = true;
        self.processConnection();
      })
    },
    this.connectSocket = function () { // Create socket connection if all fine
      if (!self.socketConnected) {
        console.log('self.socketConnected', self.socketConnected)

        //this.log('Connecting socket to: ' + self.host + {secure: true, reconnect: true});
        // self.socket = new Socket(self.host, {secure: true, reconnect: true});
        self.socket = new Socket(self.host, {
          secure: true,
          reconnect: true
        }, self);
        self.socketConnected = true;
        self.processConnection();
      }
    }
  this.validateAppKey = function (APPKEY) { // Validate if APPKEY is available
    self.APPKEY = APPKEY;
    return !!APPKEY;
  }
  this.validateSocketIo = function () { // Validate if Socket IO is available (included previous to this library)
    return (typeof (io) != 'undefined');
  }
  // Register this user on running socket
  this.registerSocket = function () {
    self.socket.emit("add-user", {
      uniqueId: self.APPKEY
    });
  }
  // Handle join channel event from client app
  this.joinChannel = function (channelData) {
    if (!self.validateAppLoad(self.APPKEY)) {
      return false;
    }
    // this.log('Channel join: ', channelData);
    if (!channelData.channelName || !channelData.uniqueId) {
      return false;
    }
    // this.log('joinChannel: ', channelData);
    self.socket.emit("joinChannel", {
      name: channelData.channelName,
      uniqueId: channelData.uniqueId
    });
  }
  this.emitSocketEvent = function (eventName, data) { // Emit socket event to server socket
    if (!eventName) {
      return false;
    }
    self.socket.emit(eventName, data);
  }
  this.removeChannel = function (channelName) {
    var channelIndex = this.channels.indexOf(channelName);
    if (channelIndex > -1) {
      this.channels.splice(channelIndex, 1);
    }
  }
  this.addUserToApp = function (userId) {
    self.socket.emit("add-app-user", {
      appId: self.APPKEY,
      userId: userId
    });
  }
  this.removeUserFromApp = function (userId) {
    self.socket.emit("remove-app-user", {
      appId: self.APPKEY,
      userId: userId
    });
  }
  this.validateAppLoad = function (APPKEY) { // Validate all the requirements on app initialize
      if (!self.validateAppKey(APPKEY)) {
        // this.log('Please pass APPKEY, provided by ' + self.appName + '!');
        return self.appLoaded;
      }
      if (!self.validateSocketIo()) {
        // this.log('Please include socket library (https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.4/socket.io.js)!');
        return self.appLoaded;
      }
      self.appLoaded = true;
      if (self.appLoaded) {
        // this.log('App loaded, connecting socket!');
        self.connectSocket();
        self.registerSocket();
      }
      return self.appLoaded;
    },
  this.init = function (APPKEY) { // Initialize APP
    if (this.initiated) {
      // self.log('Loading ' + this.appName + ' multiple times!');
    }
    this.initiated = true;
    // self.log('Initializing ' + this.appName + ' for APPKEY: ', APPKEY);
    self.validateAppLoad(APPKEY);
  }
  if (!!APPKEY) {
    this.init(APPKEY);
  }
}
// Channel subscribe event
W3sockets.prototype.subscribe = function (channelName) {
  // this.log('Subscribing channel from ' + this.appName + ': ', channelName);
  if (!channelName) {
    // this.log('Unable to subscribe, missing channel name!');
    return false
  }
  channelName = this.APPKEY + "-" + channelName;
  this.emitSocketEvent("joinChannel", {
    name: channelName
  });
  this.channels[channelName] = new Channel(channelName, this);
  this.channels.push(channelName);
  // this.log('Channel: ', this.channels[channelName]);
  return this.channels[channelName];
}
// Channel unsubscribe event
W3sockets.prototype.unsubscribe = function (channelName) {
  // this.log('Unsubscribing channel from ' + this.appName + ': ' + channelName);
  if (!channelName) {
    // this.log('Unable to unsubscribe, missing channel name!');
    return false;
  }
  // this.log('Existing channels: ' + this.channels);
  channelName = this.APPKEY + "-" + channelName;
  // this.log('Unsubscribing channel: ' + channelName);
  var channelIndex = this.channels.indexOf(channelName);
  if (channelIndex < 0) {
    // this.log('Unable to unsubscribe, channel name does not exist!');
    return false;
  }
  this.emitSocketEvent("leaveChannel", {
    name: channelName
  });
  this.removeChannel(channelName)
  // this.log('Channels remaining: ' + this.channels);
  return true;;
}
// Unsubscribe all channels
W3sockets.prototype.unsubscribeAll = function () {
  // this.log('Unsubscribing channel from ' + this.appName + ': all channels.');
  // this.log('Existing channels: ' + this.channels);
  var channelName = "";
  var totalChannels = this.channels.length;
  for (var i = 0; i < totalChannels; i++) {
    channelName = this.channels[i];
    // this.log('Unsubscribing channel: ' + channelName);
    this.emitSocketEvent("leaveChannel", {
      name: channelName
    });
  }
  // for (var i = 0; i < totalChannels; i++) {
  //   channelName = this.channels[i];
  //   this.log('Removing channel: ' + channelName);
  //   this.channels.splice(0, ar.length)
  //   // this.removeChannel(channelName);
  // }
  this.channels.splice(0, this.channels.length)
  // this.log('Channels remaining: ' + this.channels);
  return true;;
}
// Socket disconnect event
W3sockets.prototype.disconnect = function (callback) {
  // this.log('Subscribing disconnect event for ' + this.appName + ': ');
  this.socket.on("disconnect", function (data) {
    this.socketConnected = false;
    callback();
  })
}
// Socket connect event
W3sockets.prototype.connect = function (callback) {
  var self = this;
  // this.log('Subscribing connect event for ' + this.appName + ': ');
  this.socket.on("connected", function (data) {
    // self.log('Firing connect callback.');
    callback();
  });
}