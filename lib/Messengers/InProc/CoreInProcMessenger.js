'use strict';

var Promise = require('bluebird');

class CoreInProcMessenger extends include('CoreMessenger') {
	constructor($services, CoreLogger, CoreBroker) {
		super();
		this.logger = CoreLogger;
		this.services = $services;
		this.broker = CoreBroker;
	}

	dispatch(messageConfig, _message, injectables) {
		return this.broker.dispatch(this, messageConfig, _message, injectables);
	}

	send(options, type, _request) {
		var request = _request ? JSON.parse(JSON.stringify(_request)) : _request;
		var service = this.services[options.service];
		// we need to get the instance of the CoreInProcMessenger of the corresponding service

		return Promise
			.all([
				service.injector.get('CoreInProcMessenger'),
				service.injector.get('$messages')
			])
			.spread(function (inProcMessenger, messages) {
				var messageConfig = messages.incoming[options.message];
				if (!messageConfig) {
					throw new Error('Message not found: ' + options.message);
				}
				// we can't directly use the broker since it's not the same service as the target thus a different instance
				return inProcMessenger.dispatch(messageConfig, request, {});
			});

	}
}

module.exports = CoreInProcMessenger;
