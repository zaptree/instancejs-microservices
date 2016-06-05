'use strict';

var _ = require('lodash');
var Promise = require('bluebird');

class CoreBaseMessenger{
	dispatch(message, request, injectables){

		var split = message.action.split('.');
		var action = split[1];
		var controller = split[0];

		var messenger;

		// we are creating a injector that will only exist for the current request. This allows for having request singletons
		var requestInjector = this.injector.createChild({
			$scopeName: 'request'
		});

		requestInjector.value('$injector', requestInjector);

		_.each(injectables, function(injectable, key){
			requestInjector.value(key, injectable);
		});

		return requestInjector.get('CoreMessenger')
			.then((coreMessenger) => {
				messenger = coreMessenger;
				// give a friendly name to the coreMessenger
				requestInjector.value('$messenger', messenger);
			})
			.then(() => {
				return this.incomingRequest(request, messenger);
			})
			.then((_request) => {
				var req = _.assign({
					body: {},
					headers: {},
					cookies: {},
					query: {},
					params: {}
				}, _request);
				// get the controller
				return requestInjector.get(controller)
					.then((controller) => {
						// if the controller extends the CoreBaseController then it will have a handleAction method to
						// handle running the action and the controller lifecycle
						if(controller.handleAction){
							return controller.handleAction(action, req);
						}
						return controller[action](req);
					});
			})
			.then((response)=>{
				return this.incomingResponse(response, messenger);
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
		// this code calls the dispatcher
		return request;
	}
	incomingOnErrorResponse(error){
		this.logger.error(error);
		return {
			statusCode: 500,
			body: {
				errors: [error]
			}
		};
	}
	incomingResponse(response, messenger){
		var message = {};

		_.each(messenger.options, function(values, key){
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

		// todo: I need to add an override for http cookies since they will also have extra expiration options

		message.body = response;
		return message;
	}
	outgoingRequest(request){
		// likely nothing will be needed here
		return request;
	}
	outgoingResponse(response){
		// likely nothing will be needed here
		return response;
	}
	//outgoing(message){
	//	// todo: is this actually getting used??
	//	// this get's called when doing messenger.send('name', message);
	//	// aggregate all the
	//}
	stop(){
		return Promise.resolve();
	}
	close(){
		this.stop();
	}
}

module.exports = CoreBaseMessenger;
