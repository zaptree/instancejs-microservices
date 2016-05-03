'use strict';

module.exports = {
	incoming: {
		'getData': {
			type: 'http',
			action: 'UsersController.getData',
			match: '/getData/(:type)'
		},
		'getData2': {
			type: 'http2',
			action: 'UsersController.getData',
			match: '/getData2/(:type)'
		},
		'getData3': {
			type: 'http3',
			action: 'UsersController.getData',
			match: '/getData3/(:type)'
		},
		'postDataWithSet': {
			type:'http',
			action: 'UsersController.postDataWithSet',
			method: 'POST',
			match: '/postDataWithSet'
		},
		'getRemote': {
			type:'http',
			action: 'UsersController.getRemote',
			method: 'POST',
			match: '/getRemote'
		},
		//'example': {
		//	// filters will be classes that work like middleware with hooks for things like before and after and so on
		//	filters: [
		//		{
		//			name: 'auth',
		//			options: {
		//				whatever: 'hello'
		//			}
		//		}
		//	],
		//	// for the schema I will have mode = strict/loose/filter and should allow that on every level so that I can override for http headers and such
		//	// or maybe I pass the schema through http.schemaTransform that adds headers and such stuff. Then I have a schema for each type or just merge all transforms
		//	schema: 'filename/property.lodash.gettable',
		//	responseSchema: 'xxx',
		//	type: 'http',
		//	action: 'WhateverController.ActionWhatever',
		//	method: 'GET',
		//	match: '/whatever/:id'
		//}
	},
	outgoing: {
		'sendData': {
			type: 'http',
			url: 'http://localhost:3333/api/v1/getData/:type',
		},
		'sendDataInProc': {
			type: 'http',
			target: 'project1.service1/getData',
			url: 'http://localhost:3333/api/v1/getData/:type',
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
