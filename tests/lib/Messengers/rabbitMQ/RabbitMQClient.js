'use strict';

var amqp = require('amqplib'),
	Promise = require('bluebird');

function RabbitMQClient(options) {
	this.options = options;
}

RabbitMQClient.prototype.send = function (routingKey, message) {

	return this.getChannel()
		.then(()=>{
			this.connection.channel.publish(this.options.exchange, routingKey, new Buffer(JSON.stringify(message)));
		});

};

RabbitMQClient.prototype.getChannel = function () {

	if (!this.connection) {
		this.connection = amqp.connect(this.options.uri)
			.then((conn)=> {
				return conn.createChannel()
					.then((channel)=>{
						this.connection = {
							connection: conn,
							channel: channel
						};
						return this.connection;
					})

			})
	}
	return Promise.resolve(this.connection);
};

RabbitMQClient.prototype.stop = function () {
	if(this.connection){
		return this.connection.connection.close();
	}
};


module.exports = RabbitMQClient;
