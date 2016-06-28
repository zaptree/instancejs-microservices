'use strict';

var _ = require('lodash');
var Promise = require('bluebird');

class CoreBroker {
	constructor($services, $config, $paths, $app, $messages, $injector, CoreSchemaValidator) {
		//this.broker = CoreBroker;
		this.paths = $paths;
		this.app = $app;
		this.messengers = {};

		this.schemaValidator = CoreSchemaValidator;
		this.services = $services;
		this.config = $config;
		this.messages = $messages;
		this.injector = $injector;
		// give a friendly name to the coreBroker
		this.injector.value('$broker', this);
	}

	dispatch(messenger, messageConfig, _message, injectables) {
		var message = _message;

		// we are creating a injector that will only exist for the current request. This allows for having request singletons
		var requestInjector = this.injector.createChild({
			$scopeName: 'request'
		});

		requestInjector.value('$injector', requestInjector);

		_.each(injectables, function (injectable, key) {
			requestInjector.value(key, injectable);
		});

		return Promise.resolve()
			.then(()=> {
				// todo: should I be doing the validation before or after the incomingRequest?
				message = this.schemaValidator.validate(messageConfig.schema, _message);
			})
			.then(() => {
				return messenger.incomingRequest(message);
			})
			.then((_request) => {

				var split = messageConfig.action.split('.');
				var action = split[1];
				var controller = split[0];

				var req = _.assign({
					body: {},
					headers: {},
					cookies: {},
					query: {},
					params: {}
				}, _request);

				req.options = {};

				req.response = {
					set: function (key) {
						var args = new Array(arguments.length - 1);
						for (var i = 1; i < arguments.length; ++i) {
							args[i - 1] = arguments[i];
						}

						if (!req.options[key]) {
							req.options[key] = [];
						}
						req.options[key].push(args);
					}
				};

				requestInjector.set('$message', req);

				// get the controller
				return requestInjector.get(controller)
					.then((controller) => {
						// if the controller extends the CoreController then it will have a handleAction method to
						// handle running the action and the controller lifecycle
						if (controller.handleAction) {
							return controller.handleAction(action, req);
						}
						return controller[action](req);
					})
					.then((response)=> {
						return messenger.incomingResponse(response, req.options);
					});
			})
			.then((response)=> {
				return this.schemaValidator.validate(messageConfig.responseSchema, response);
			})
			.then((response)=> {
				return _.assign({
					statusCode: 200,
					// you can have multiple headers with the same name but I can't think of anything
					// other than cookies which we have separate anyway
					headers: {},
					cookies: {},
					body: {}
				}, response);
			})
			.catch((error) => {
				return messenger.incomingOnErrorResponse(error);
			});
	}

	send(messageKey, _message) {
		var message = _message;
		// call the proper messenger and call it's method
		// load the message from the
		var messageOptions = this.messages.outgoing[messageKey];
		var type = this.messages.types.outgoing[messageOptions.type];
		var target = messageOptions.target;

		if (target) {
			var targets = _.isArray(target) ? target : [target];

			var availableTargets = [];
			_.each(targets, (_target)=> {
				var split = _target ? _target.split('/') : [];
				var serviceName = split[0];

				// todo: check for the service and if the method exists in the messages and if not throw an error
				var messageKey = split[1];

				if (this.services[serviceName]) {
					availableTargets.push({
						service: serviceName,
						message: messageKey
					});
				}
			});
			// only if all targets are available do we use in-proc (with the exception of if inProcOnly option is set)
			if (availableTargets.length && (availableTargets.length === targets.length || this.config.inProcOnly)) {
				return Promise.resolve(availableTargets)
					.map((_target)=> {
						return this.injector.get('CoreInProcMessenger')
							.then((messenger)=> {
								message = this.schemaValidator.validate(messageOptions.schema, _message);
								var promise = messenger.send(_target, type, message);
								// todo: A better way to do this for custom messengers is needed
								// if messenger is CoreRabbitMQMessenger we don't want to return the response.
								if(type.messenger !== 'CoreRabbitMQMessenger'){
									return promise;
								}
							});
					})
					.then(function (results) {
						return results[0];
					});
			}
		}

		// the inProcOnly option is for development and prevents from any messengers starting up servers
		if (this.config.inProcOnly) {
			throw new Error('Targets not available inProc');
		}

		return this.injector.get(type.messenger)
			.then((messenger)=> {
				message = this.schemaValidator.validate(messageOptions.schema, _message);
				return messenger.send(messageOptions, type, message);
			});
	}
	groupMessages(_messages){
		// todo, maybe I will want to clone deep the messages since I'm mutating them
		var messages = _.cloneDeep(_messages);

		var grouped = {};

		_.each(['incoming', 'outgoing'], (direction)=> {
			_.each(messages.types[direction], function(type, typeKey){
				var messengerName = type.messenger;
				if(!grouped[messengerName]){
					grouped[messengerName] = {
						incoming: {},
						outgoing: {}
					};
				}
				grouped[messengerName][direction][typeKey] = type;
				type.messages = {};
			});
			_.each(messages[direction], (message, key) => {
				messages.types[direction][message.type].messages[key] = message;

			});
		});

		return grouped;
	}
	startMessenger(options, messengerName){
		return this.injector.get(messengerName)
			.then((messenger) => {
				this.messengers[messengerName] = messenger;
				return messenger.start(options);
			});
	}
	start(){

		// todo: I need to move all this logic
		// when the inProcOnly options is specified we don't start any servers and all communication is done inProc only
		if(this.config.inProcOnly){
			return Promise.resolve();
		}

		// loop through all the mesages and if their type is a string replace it with the appropriate type
		// then group all the messages by messenger
		// for each messenger used pass in the list of messages (maybe group them by type before that)
		var groupedMessages = this.groupMessages(this.messages);

		// get all the messages, and group them by type
		// get all types and group them

		return Promise.all(_.map(groupedMessages, this.startMessenger.bind(this)));

	}
	stop(){
		var removed = [];
		var p = Promise.all(_.map(this.messengers, function(messenger, messengerName){
			removed.push(messengerName);
			return messenger.close();
		}));
		this.messengers = _.omit(this.messengers, removed);
		return p;
	}
}

module.exports = CoreBroker;
