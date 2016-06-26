'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
const CONNECTION_STRING = 'amqp://wbazinkp:CLL57elF9hYanv5OE57mD9OpeSr09BxF@jellyfish.rmq.cloudamqp.com/wbazinkp';
let amqp = require('amqplib');

// my default implementation will be a direct or topic, with binding being the only thing that needs to be set. queue
// will be named after the binding and the exchange will be called default_direct_exchange or default_topic_exchange depending on what I choose to go for

var settingsTypes = {
	'type1': {
		prefetch: 1,
		consumerOptions: {
			noAck: false
		},
		exchange: {
			name: 'logs',
			type: 'fanout',
			options: {
				durable: false
			}
		},
		queue: {
			name: '',
			options: {
				exclusive: true
			}

		},
		binding: ['']
	},
	'type2': {
		prefetch: 1,
		consumerOptions: {
			noAck: false
		},
		exchange: {
			name: 'logs2',
			type: 'fanout',
			options: {
				durable: true
			}
		},
		queue: {
			// when using a names queue, after the queue is created and bound to the exchange messages won't be lost, a new queue though won't get old messages, not sure how to do that
			name: 'randomName333',
			options: {
				exclusive: false,
				durable: true
			}

		},
		binding: ['']
	},
	'type3': {
		prefetch: 1,
		consumerOptions: {
			noAck: false
		},
		exchange: {
			name: 'instance_default_topic_exchange',
			type: 'topic',
			options: {
				durable: true
			}
		},
		queue: {
			// when using a names queue, after the queue is created and bound to the exchange messages won't be lost, a new queue though won't get old messages, not sure how to do that
			name: 'random_ccc',
			options: {
				exclusive: false,
				durable: true
			}

		},
		binding: 'products.*'
	}
}


var settings = settingsTypes.type3;

amqp.connect(CONNECTION_STRING)
	.then((conn)=>{
		return conn.createChannel();
	})
	.then((channel)=>{
		var exchange = settings.exchange.name;
		channel.assertExchange(exchange, settings.exchange.type, settings.exchange.options);
		channel.prefetch(settings.prefetch);
		channel.assertQueue(settings.queue.name, settings.queue.options)
			.then((queue)=>{
				console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue.queue);

				var bindings = _.isArray(settings.binding) ? settings.binding : [settings.binding];
				// there can be multiple bindings in a  queue
				_.each(bindings, function(binding){
					channel.bindQueue(queue.queue, exchange, binding);
				});

				channel.consume(queue.queue, function(msg) {

					handleRequest(msg)
						.then(function(){
							if(!settings.consumerOptions.noAck){
								channel.ack(msg);
							}
						});
				}, settings.consumerOptions);
			})
	});

function handleRequest(msg){
	return new Promise(function(resolve, reject){
		console.log(" [x] Received %s", msg.content.toString());
		var secs = msg.content.toString().length;
		setTimeout(function() {
			console.log(" [x] Done");
			resolve();
		}, secs * 100);
	});
}

//amqp.connect(CONNECTION_STRING, function(err, conn) {
//	conn.createChannel(function(err, ch) {
//
//		var exchange = 'logs';
//
//		ch.assertExchange(exchange, 'fanout', {durable: false});
//
//		// todo: this should be an available config options for incoming, will default to 1
//		ch.prefetch(1);	// set this to the number of messages you want this worker to handle concurrently
//
//		ch.assertQueue('', {exclusive: true}, function(err, q) {
//			console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
//			ch.bindQueue(q.queue, exchange, '');
//
//			ch.consume(q.queue, function(msg) {
//				console.log(" [x] Received %s", msg.content.toString());
//				var secs = msg.content.toString().length;
//				setTimeout(function() {
//					console.log(" [x] Done");
//					ch.ack(msg);
//				}, secs * 100);
//			}, {noAck: false});
//		});
//
//		var queue = 'queue123';
//
//
//
//
//		//var q = 'hello32';
//		//
//		//ch.assertQueue(q, {durable: true});
//		//// todo: this should be an available config options for incoming, will default to 1
//		//ch.prefetch(1);	// set this to the number of messages you want this worker to handle concurrently
//		//console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
//		//ch.consume(q, function(msg) {
//		//	console.log(" [x] Received %s", msg.content.toString());
//		//	var secs = msg.content.toString().length;
//		//
//		//	//if(msg.content.toString()==='helen' && failed ===0){
//		//	//	failed++;
//		//	//	throw new Error();
//		//	//}
//		//
//		//	setTimeout(function() {
//		//		console.log(" [x] Done");
//		//		ch.ack(msg);
//		//	}, secs * 100);
//		//}, {noAck: false});
//	});
//});
