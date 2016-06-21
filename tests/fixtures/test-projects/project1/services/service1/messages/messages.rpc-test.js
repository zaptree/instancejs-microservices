'use strict';

module.exports = {
	incoming: {
		'getData': {
			type: 'rpc',
			action: 'TestController.getData',
			match: 'getData'
		}
	},
	outgoing: {

	},
	types: {
		incoming: {
			// we define the types of messengers available
			rpc: {
				messenger: 'CoreRpcMessenger',
				port: 5003,
				host: 'localhost'
			}
		},
		outgoing: {

		}


	}
};
