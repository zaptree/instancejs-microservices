'use strict';

class CoreMessenger{
	constructor($config, $messages, $injector){
		this.config = $config;
		this.messages = $messages;
		this.injector = $injector;
		this.options = {};
		this.response = {
			set: function(key, one, two, three){
				var args = new Array(arguments.length - 1);
				for(var i = 1; i < arguments.length; ++i) {
					args[i - 1] = arguments[i];
				}

				if(!this.options[key]){
					this.options[key] = [];
				}
				this.options[key].push(args);
			}.bind(this)
		}
	}
	send(messageKey, message){
		// call the proper messenger and call it's method
		// load the message from the
		var options = this.messages.outgoing[messageKey];
		var type = this.messages.types.outgoing[options.type];
		var service = options.service || type.service;
		if(service){
			// todo: see if the service is runnin in process and if it is use the CoreInProcMessenger
		}
		return this.injector.get(type.messenger)
			.then(function(messenger){
				return messenger.send(options, type, message);
			});
	}

}

module.exports = CoreMessenger;
