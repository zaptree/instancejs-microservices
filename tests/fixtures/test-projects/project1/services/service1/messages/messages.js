'use strict';

module.exports = {
	incoming: {
		'getUser': {
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
			controller: 'WhateverController',
			action: 'ActionWhatever',
			types: [
				{
					type: 'http',
					options: {
						method: 'GET',
						match: '/whatever/:id'
					}
				}
			]
		}
	},
	outgoing: {
		// the key must be name of service/incoming message name, I should automatically use in-memory communication if the service is available
		// also I need to make sure that I don't allow / in service names (and require that services have names)
		'service1/getUser': {
			schema: 'xxx',	// if using our own services you don't necessarily need this since the endpoint will throw an error when receiving the message
			types: [
				{
					type: 'http',
					options: {
						method: 'GET',
						match: '/whatever/:id', 	// I will need to reverse engineer the matching to allow passing params
					}
				}
			]
		}
	},
	messengers: {
		// we define the types of messengers available
		http: {
			// this can either be a module in the core, in node_modules or a direct path to the said module. It's
			// probably going to be preferred to have it from core/node_modules so that when running multiple services
			// they can share the module. Or I can build the modules in a way that they work with each other.
			// I should probably have like a used ports list or something of the sorts
			module: 'http',
			options: {
				port: 3333,
				path: '/api',
				domain: 'localhost'
			}
		}
	}
};


// sending messages will be done like this:

this.messenger.send('service/getUser', {
	params: {
		id: '1234'
	}
});
// this will be the internal implementation but it should never be used like this in the code although the ability will exist to do so
this.messenger.listen('service/getUser', function(message){

});
