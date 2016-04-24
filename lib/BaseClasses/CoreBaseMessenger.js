'use strict';

var _ = require('lodash');
var Promise = require('bluebird');

class CoreBaseMessenger{
	dispatch(message, request, injectables){
		// I added the injectables that I might use for injecting things like $request, $response
		// todo: create childInjector
		// todo: use the life cycle
		// todo: think of a good lifecycle method that can be used for setting the $request $response that has access to new injector
		// todo: call the controller action, set the $messenger, $message, $request, $response,


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
			.then(() => {
				// get the controller
				return requestInjector.get(controller);
			})
			.then((controller) => {
				return controller[action](request);
			})
			.then((response)=>{
				return this.incomingResponse(response, messenger);
			})
			.catch((error) => {
				return this.incomingOnErrorResponse(error);
			});
	}

	// when using in process, outgoing and incoming are the only methods that get used so they should include all the appropriate logic
	incomingRequest(request, messenger){
		// this code calls the dispatcher
		return request;
	}
	incomingOnErrorResponse(error){
		return {
			status: 500,
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
	outgoing(message){
		// this get's called when doing messenger.send('name', message);
		// aggregate all the
	}
	stop(){
		return Promise.resolve();
	}
	close(){
		this.stop();
	}
}

module.exports = CoreBaseMessenger;
