'use strict';

var Promise = require('bluebird');

class CoreInProcMessenger extends include('CoreBaseMessenger'){
	constructor($services, $injector, CoreLogger){
		super();
		this.logger = CoreLogger;
		this.injector = $injector;
		this.services = $services;
	}
	send(options, type, _request){
		var request = _request ? JSON.parse(JSON.stringify(_request)) : _request;
		var service = this.services[options.service];
		// we need to get the instance of the CoreInProcMessenger of the corresponding service

		return Promise
			.all([
				service.injector.get('CoreInProcMessenger'),
				service.injector.get('$messages')
			])
			.spread(function(inProcMessenger, messages){
				var message = messages.incoming[options.message];
				if(!message){
					throw new Error('Message not found: ' + options.message);
				}
				return inProcMessenger.dispatch(message, request, {});
			});

	}
}

module.exports = CoreInProcMessenger;
