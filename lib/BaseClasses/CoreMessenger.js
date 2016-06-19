'use strict';

var _ = require('lodash');

class CoreMessenger{
	dispatch(messageConfig, _message, injectables){
		// todo: I'm not to crazy with all this logic in the base class for messengers, this should be handled by the broker
		// todo: all communication between messenger and controller should happen by the broker
		var message = _message;
		// todo: I should do a check that the messenger that extended this has injected the required stuff like injector and so on

		return this.injector.get('CoreSchemaValidator')
			.then((schemaValidator)=>{

				message = schemaValidator.validate(messageConfig.schema, _message);


				var broker;

				// we are creating a injector that will only exist for the current request. This allows for having request singletons
				var requestInjector = this.injector.createChild({
					$scopeName: 'request'
				});

				requestInjector.value('$injector', requestInjector);

				_.each(injectables, function(injectable, key){
					requestInjector.value(key, injectable);
				});

				return requestInjector.get('CoreBroker')
					.then((coreBroker) => {
						broker = coreBroker;
						// give a friendly name to the coreBroker
						requestInjector.value('$broker', broker);
					})
					.then(() => {
						return this.incomingRequest(message, broker);
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
							set: function(key){
								var args = new Array(arguments.length - 1);
								for(var i = 1; i < arguments.length; ++i) {
									args[i - 1] = arguments[i];
								}

								if(!req.options[key]){
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
								if(controller.handleAction){
									return controller.handleAction(action, req);
								}
								return controller[action](req);
							})
							.then((response)=>{
								return this.incomingResponse(response, req.options);
							});
					})
					.then((response)=>{
						return schemaValidator.validate(messageConfig.responseSchema, response);
					})
					.then((response)=>{
						return _.assign({
							statusCode: 200,
							// you can have multiple headers with the same name but I can't think of anything
							// other than cookies which we have separate anyway
							headers: {},
							cookies: {},
							body: {}
						}, response);
					});
			})
			.catch((error) => {
				return this.incomingOnErrorResponse(error);
			});



	}

	// when using in process, outgoing and incoming are the only methods that get used so they should include all the appropriate logic
	/**
	 *
	 * @param request
	 * @param messenger
	 * @returns {request}
	 */
	incomingRequest(request){
		return request;
	}
	incomingOnErrorResponse(error){
		this.logger.error(error);
		return {
			statusCode: 500,
			body: {
				errors: [error.message]
			}
		};
	}
	incomingResponse(response, options){
		var message = {};

		_.each(options, function(values, key){
			message[key] = {};
			_.each(values, function(args){
				if(args.length === 1){
					// if there is only one value we assume this is the value you want to set instead of key value pairs. i.e. statusCoede
					message[key] = args[0];
				}else if(args.length >= 2){
					message[key][args[0]] = args[1];
				}

			});
		});

		message.body = response;
		return message;
	}
	close(){
		this.stop();
	}
}

module.exports = CoreMessenger;
