'use strict';

var _ = require('lodash');
var Promise = require('bluebird');

class CoreMessenger{
	constructor($services, $config, $messages, $injector){
		this.services = $services;
		this.config = $config;
		this.messages = $messages;
		this.injector = $injector;
		this.options = {};
		this.response = {
			set: function(key){
				var args = new Array(arguments.length - 1);
				for(var i = 1; i < arguments.length; ++i) {
					args[i - 1] = arguments[i];
				}

				if(!this.options[key]){
					this.options[key] = [];
				}
				this.options[key].push(args);
			}.bind(this)
		};
	}
	send(messageKey, message){
		// call the proper messenger and call it's method
		// load the message from the
		var options = this.messages.outgoing[messageKey];
		var type = this.messages.types.outgoing[options.type];
		var target = options.target;

		if(target){
			var targets = _.isArray(target) ? target : [target];

			var availableTargets = [];
			_.each(targets, (_target)=>{
				var split = _target ? _target.split('/') : [];
				var serviceName = split[0];

				// todo: check for the service and if the method exists in the messages and if not throw an error
				var messageKey = split[1];

				if(this.services[serviceName]){
					availableTargets.push({
						service: serviceName,
						message: messageKey
					});
				}
			});
			// only if all targets are available do we use in-proc (with the exception of if inProcOnly option is set)
			if(availableTargets.length && (availableTargets.length === targets.length || this.options.inProcOnly)){
				return Promise.resolve(availableTargets)
					.map((_target)=>{
						return this.injector.get('CoreInProcMessenger')
							.then(function(messenger){
								return messenger.send( _target, type, message);
							});
					})
					.then(function(results){
						if(!_.isArray(target)){
							return results[0];
						}
						return results;
					});
			}
		}

		// the inProcOnly option is for development and prevents from any messengers starting up servers
		if(this.options.inProcOnly){
			throw new Error('Targets not available inProc');
		}

		return this.injector.get(type.messenger)
			.then(function(messenger){
				return messenger.send(options, type, message);
			});
	}

}

module.exports = CoreMessenger;
