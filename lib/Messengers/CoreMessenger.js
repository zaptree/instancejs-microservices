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
	}

}

module.exports = CoreMessenger;
