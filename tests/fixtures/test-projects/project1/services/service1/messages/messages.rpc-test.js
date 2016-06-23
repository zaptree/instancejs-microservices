'use strict';

module.exports = {
	incoming: {
		'getData': {
			type: 'rpc',
			action: 'TestController.getData',
			match: 'getData'
		},
		'postDataWithSet': {
			type:'rpc',
			action: 'TestController.postDataWithSet',
			match: 'postDataWithSet'
		},
		'getRemote': {
			type:'rpc',
			action: 'TestController.getRemote',
			match: 'getRemote'
		},
	},
	outgoing: {
		'sendData': {
			type: 'rpc',
			match: 'getData'
		},
		'sendDataInProc': {
			type: 'rpc',
			target: 'project1.service1/getData',
			match: 'getData'
		},
	},
	types: {
		incoming: {
			// we define the types of messengers available
			rpc: {
				messenger: 'CoreRpcMessenger',
				port: 5003,
				host: 'localhost'
			},
			rpcNoMessages: {
				messenger: 'CoreRpcMessenger',
				port: 5004,
				host: 'localhost'
			}
		},
		outgoing: {
			rpc: {
				messenger: 'CoreRpcMessenger',
				port: 5003,
				host: 'localhost'
			}
		}


	}
};
