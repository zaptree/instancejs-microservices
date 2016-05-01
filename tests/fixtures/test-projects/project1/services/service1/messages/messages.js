'use strict';

module.exports = {
	incoming: {
		'getUsers': {
			type: 'http',
			action: 'UsersController.getUsers',
			method: 'GET',
			match: '/users'
		},
		'getRemoteUsers': {
			type: 'http',
			action: 'UsersController.getRemoteUsers',
			method: 'GET',
			match: '/getRemoteUsers'
		},
		'createRemoteUser': {
			type: 'http',
			action: 'UsersController.createRemoteUser',
			method: 'GET',
			match: '/createRemoteUser'
		},
		'getRemoteUsersInProc': {
			type: 'http',
			action: 'UsersController.getRemoteUsersInProc',
			method: 'GET',
			match: '/getRemoteUsersInProc'
		},
		'getUsers2': {
			type: 'http2',
			action: 'UsersController.getUsers2',
			method: 'GET',
			match: '/users'
		},
		'getUsers3': {
			type: 'http3',
			action: 'UsersController.getUsers3',
			method: 'GET',
			match: '/users'
		},
		'createUser': {
			type:'http',
			action: 'UsersController.createUser',
			method: 'POST',
			match: '/users/create/:type',
			query: {
				id: true
			}
		},
		'loginUser': {
			type:'http',
			action: 'UsersController.loginUser',
			method: 'POST',
			match: '/users/login'
		},
		'example': {
			// filters will be classes that work like middleware with hooks for things like before and after and so on
			filters: [
				{
					name: 'auth',
					options: {
						whatever: 'hello'
					}
				}
			],
			// for the schema I will have mode = strict/loose/filter and should allow that on every level so that I can override for http headers and such
			// or maybe I pass the schema through http.schemaTransform that adds headers and such stuff. Then I have a schema for each type or just merge all transforms
			schema: 'filename/property.lodash.gettable',
			responseSchema: 'xxx',
			type: 'http',
			action: 'WhateverController.ActionWhatever',
			method: 'GET',
			match: '/whatever/:id'
		}
	},
	outgoing: {
		// the key must be name of service/incoming message name, I should automatically use in-memory communication if the service is available
		// also I need to make sure that I don't allow / in service names (and require that services have names)
		'createUser': {
			type: 'http',
			method: 'POST',
			url: 'http://localhost:3333/api/v1/users/create/:type',
			query: {
				id: true
			}
		},
		'getUsers': {
			type: 'http',
			method: 'GET',
			url: 'http://localhost:3333/api/v1/users'
		},
		'getUsersInProc': {
			target: 'project1.service1/getUsers',
			url: 'http://localhost:3333/api/v1/users/getUsers',
			type: 'http',
			method: 'GET'
		}
	},
	types: {
		incoming: {
			// we define the types of messengers available
			http: {
				messenger: 'CoreHttpMessenger',
				middleware: [],
				port: 3333,
				path: '/api/v1',
				host: 'localhost'
			},
			http2: {
				messenger: 'CoreHttpMessenger',
				middleware: [],
				port: 3232,
				path: '/api/v2',
				host: 'localhost'
			},
			http3: {
				messenger: 'CoreHttpMessenger',
				middleware: [],
				port: 3333,
				path: '/api/v2',
				host: '127.0.0.1'
			},
			static: {
				messenger: 'CoreHttpMessenger',
				middleware: [],
				port: 3333,
				staticFolders: {
					'/': './static'
				},
				host: '127.0.0.1'
			}
		},
		outgoing: {
			// we can have a generic http which would need full url specified
			http: {
				messenger: 'CoreHttpMessenger',
				url: ''
			},
			// we can have a preset for a specific service so only the path needs to be set in each message
			service1Http: {
				messenger: 'CoreHttpMessenger',
				options: {
					url: 'http://localhost:4444/api'
				}
			}
		}


	}
};


// sending messages will be done like this:

/*this.messenger.send('service/getUser', {
	params: {
		id: '1234'
	}
});
// this will be the internal implementation but it should never be used like this in the code although the ability will exist to do so
this.messenger.listen('service/getUser', function(message){

});*/
