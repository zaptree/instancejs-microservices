'use strict';

var amqp = require('amqplib'),
	_ = require('lodash'),
	Promise = require('bluebird');

class CoreRabbitMQMessenger extends include('CoreMessenger'){
	constructor($config, CoreLogger, CoreBroker, $global) {
		super();
		this.config = $config;
		this.logger = CoreLogger;
		this.broker = CoreBroker;

		this.defaultExchange = 'instance_default_topic_exchange';
		// we want to share the servers and clients object between all services
		$global.CoreRabbitMQMessenger = $global.CoreRabbitMQMessenger || {connections: {}};
		this.global = $global.CoreRabbitMQMessenger;

	}

	handleRequest(req, messageConfig) {

		var msg = {
			headers: req.headers || {},
			cookies: req.cookies || {},
			body: req.body || {},
			query: req.query || {},
			params: req.params || {}
		};

		var injectables = {};

		// dispatch will call the lifecycle stuff and dispatcher
		return this.broker.dispatch(this, messageConfig, msg, injectables)
			.then(function (response) {
				return _.assign({
					statusCode: 200,
					cookies: {},
					headers: {},
					body: {}
				}, response);
			});
	}

	getConnection(uri){

		if(!this.global.connections[uri]){
			this.global.connections[uri] = amqp.connect(uri)
				.then((conn)=>{
					return conn.createChannel()
						.then((channel)=>{
							this.global.connections[uri] = {
								connection: conn,
								channel: channel
							};
							return this.global.connections[uri];
						});

				})
		}
		return Promise.resolve(this.global.connections[uri]);

	}
	startOne(config) {
		var hasMessages = _.keys(config.messages).length > 0;
		if (!hasMessages) {
			return Promise.resolve();
		}

		return this.getConnection(config.uri)
			.then((connection)=>{
				var channel = connection.channel;
				return Promise.resolve(_.values(config.messages))
					.map((messageConfig)=>{
						var settings = _.merge({
							prefetch: 1,
							consumerOptions: {
								noAck: false
							},
							exchange: {
								name: this.defaultExchange,
								type: 'topic',
								options: {
									durable: true
								}
							},
							queue: {
								// by default we use the name of the binding as the queue name combined with the name of the service
								// so the queue is unique to to the service+binding
								name:  _.isArray(messageConfig.binding) ? '' : this.config.name + '-' + messageConfig.binding,
								options: {
									exclusive: false,
									durable: true
								}

							},
							binding: ''
						}, config, messageConfig);

						var exchange = settings.exchange.name;
						channel.assertExchange(exchange, settings.exchange.type, settings.exchange.options);
						channel.prefetch(settings.prefetch);
						return channel.assertQueue(settings.queue.name, settings.queue.options)
							.then((queue)=>{

								var bindings = _.isArray(settings.binding) ? settings.binding : [settings.binding];
								// there can be multiple bindings in a  queue
								_.each(bindings, (binding)=>{
									channel.bindQueue(queue.queue, exchange, binding);
								});

								channel.consume(queue.queue, (msg)=> {
									let parsedRequest;
									return Promise.resolve()
										.then(()=>{
											parsedRequest = JSON.parse(msg.content.toString());
											return this.handleRequest(parsedRequest, settings)
										})
										.then((response)=>{
											this.logResponse(response, parsedRequest);
											if(!settings.consumerOptions.noAck){
												if(response.statusCode < 400){
													channel.ack(msg);
												}else{
													console.error('RabbitMQ consumer returned status code ' + response.statusCode + ' for bindings: ' + bindings.join(','));
													// http://www.squaremobius.net/amqp.node/channel_api.html#channel_nack
													channel.nack(msg);
												}

											}
										})
										.catch((error)=>{
											this.logger.error(error, parsedRequest);
											console.error('RabbitMQ consumer threw an error for bindings: ' + bindings.join(','));
											console.error(error.stack);
											if(!settings.consumerOptions.noAck){
												channel.nack(msg);
											}
										});
								}, settings.consumerOptions);
							})

					})
			});

	}

	start(messageOptions) {
		return Promise.all(_.map(messageOptions.incoming, this.startOne.bind(this)));
	}

	send(messageOptions, type, _message) {
		var message = _message || {};

		return this.getConnection(type.uri)
			.then((connection)=> {

				var exchange = messageOptions.exchange || this.defaultExchange;
				var routingKey = messageOptions.routingKey || messageOptions.binding;

				connection.channel.publish(exchange, routingKey, new Buffer(JSON.stringify(message)));

			});


	}

	stop() {
		// make sure multiple instances don't try to close same servers since they are stored globally
		var connections = this.global.connections;
		this.global.connections = {};
		return Promise.all(_.map(connections, (connection)=> {
			return new Promise((resolve)=> {
				connection.connection.close();
				resolve();
			});
		}));
	}
}

module.exports = CoreRabbitMQMessenger;
