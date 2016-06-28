'use strict';

var _ = require('lodash');

class CoreMessenger {
	incomingRequest(requestMessage) {
		return requestMessage;
	}

	incomingOnErrorResponse(error) {
		this.logger.error(error);
		return {
			statusCode: 500,
			body: {
				errors: [error.message]
			}
		};
	}

	incomingResponse(response, options) {
		var message = {};

		_.each(options, function (values, key) {
			message[key] = {};
			_.each(values, function (args) {
				if (args.length === 1) {
					// if there is only one value we assume this is the value you want to set instead of key value pairs. i.e. statusCoede
					message[key] = args[0];
				} else if (args.length >= 2) {
					message[key][args[0]] = args[1];
				}

			});
		});

		message.body = response;
		return message;
	}

	logResponse(response, request){
		if(response.statusCode >= 400 && [401, 403].indexOf(response.statusCode) === -1){
			this.logger.error(new Error(this.constructor.name + ' ['+response.statusCode+']'), request);
		}
	}

	close() {
		return this.stop();
	}
}

module.exports = CoreMessenger;
