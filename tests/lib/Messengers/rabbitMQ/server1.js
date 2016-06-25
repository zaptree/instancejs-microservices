'use strict';

const CONNECTION_STRING = 'amqp://wbazinkp:CLL57elF9hYanv5OE57mD9OpeSr09BxF@jellyfish.rmq.cloudamqp.com/wbazinkp';
let amqp = require('amqplib/callback_api');

amqp.connect(CONNECTION_STRING, function(err, conn) {
	conn.createChannel(function(err, ch) {
		var q = 'hello32';

		ch.assertQueue(q, {durable: true});
		// todo: this should be an available config options for incoming, will default to 1
		ch.prefetch(1);	// set this to the number of messages you want this worker to handle concurrently
		console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
		ch.consume(q, function(msg) {
			console.log(" [x] Received %s", msg.content.toString());
			var secs = msg.content.toString().length;

			//if(msg.content.toString()==='helen' && failed ===0){
			//	failed++;
			//	throw new Error();
			//}

			setTimeout(function() {
				console.log(" [x] Done");
				ch.ack(msg);
			}, secs * 100);
		}, {noAck: false});
	});
});
