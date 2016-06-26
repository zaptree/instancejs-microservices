'use strict';

module.exports = {
	incoming: {
		'getData': {
			type: 'amqp',
			action: 'TestController.getData',
			queue: {
				name: ''	// we want an anonymous queue for testing so that it creates a new one each time
			},
			binding: 'getData'
		},
		//'postDataWithSet': {
		//	type:'amqp',
		//	action: 'TestController.postDataWithSet',
		//	match: 'postDataWithSet'
		//},
		//'getRemote': {
		//	type:'amqp',
		//	action: 'TestController.getRemote',
		//	match: 'getRemote'
		//},
	},
	outgoing: {
		//'sendData': {
		//	type: 'amqp',
		//	match: 'getData'
		//},
		//'sendDataInProc': {
		//	type: 'amqp',
		//	target: 'project1.service1/getData',
		//	match: 'getData'
		//},
	},
	types: {
		incoming: {
			// we define the types of messengers available
			amqp: {
				messenger: 'CoreRabbitMQMessenger',
				uri: 'amqp://wbazinkp:CLL57elF9hYanv5OE57mD9OpeSr09BxF@jellyfish.rmq.cloudamqp.com/wbazinkp'
			},
			//amqpNoMessages: {
			//	messenger: 'CoreRabbitMQMessenger',
			//	port: 5004,
			//	host: 'localhost'
			//}
		},
		outgoing: {
			//amqp: {
			//	messenger: 'CoreRabbitMQMessenger',
			//	port: 5003,
			//	host: 'localhost'
			//}
		}


	}
};
