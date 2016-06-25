'use strict';

// modules
var assert = require('chai').assert,
	Promise = require('bluebird'),
	sinon = require('sinon'),
	amqp = require('amqplib/callback_api'),
	_ = require('lodash');

// core modules
var Path = require('path');

// project modules
var MicroServices = require('../../../../lib/MicroServices');

describe('testing rabbitMQ', function(){
	this.timeout(10000);
	const CONNECTION_STRING = 'amqp://wbazinkp:CLL57elF9hYanv5OE57mD9OpeSr09BxF@jellyfish.rmq.cloudamqp.com/wbazinkp';

	/**
	 * so a client should publish to a specific exchange. the server should bind it's queue to that exchange. Each server
	 * should use use as a queue name something like: exchangeName_serviceName_extraSomething. the extraSomething can be the
	 * key of the incomming type in case we want more that one action on same server consuming the same message (highly unlikely but whatever)
	 * also we need to consider for testing how do we create random exchange/queue names (or maybe queues that delete themselves) This can be done with exclusive: true -
	 * basically I should have an option for using random queue or fixed queue, random will delete after closing connection
	 *
	 * TODO: the example messages are lost if client sends a message to the exchange and no queue is bound to it. What we will want is for a new queue to get all old messages (at least as an option)
	 * TODO: I need to run a test with durable: true/false exchange and random deletable queue and see if a new queue will recieve all the old messages
	 * TODO: SUPER IMPORTANT I will need to respond with a negative acknowledgment when an error happens otherwise it won't try again (I should add an ignoreErrors flag)
	 *
	 * https://www.cloudamqp.com/blog/2015-09-03-part4-rabbitmq-for-beginners-exchanges-routing-keys-bindings.html
	 * http://blog.thedigitalcatonline.com/blog/2013/08/21/some-tips-about-amqp-direct-exchanges/#.V231umQrJUc
	 */

	function getChannel(){
		return new Promise(function(resolve, reject){
			amqp.connect(CONNECTION_STRING, function(err, conn) {
				conn.createChannel(function(err, ch) {
					if(err){
						reject(err);
					}
					resolve({
						channel: ch,
						connection: conn
					});
				});
			});
		});
	}
	before(function(){

		return getChannel()
			.then((channel)=>{
				this.channel = channel;
			})
	});
	after(function(done){
		setTimeout(()=> {
			this.channel.connection.close();
			done();
		}, 500);
	});


	//function server(done){
	//	var amqp = require('amqplib/callback_api');
	//
	//	amqp.connect(CONNECTION_STRING, function(err, conn) {
	//		conn.createChannel(function(err, ch) {
	//			var q = 'hello';
	//
	//			ch.assertQueue(q, {durable: false});
	//			console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
	//			ch.consume(q, function(msg) {
	//				console.log(" [x] Received %s", msg.content.toString());
	//				done();
	//			}, {noAck: true});
	//		});
	//	});
	//}

	it('should send a simple message', function(){
		var channel = this.channel.channel;

		return Promise.resolve()
			.bind(this)
			.then(_.partial(sendMessage, 'nick'))
			.then(_.partial(sendMessage, 'helen_really_'))
			.then(_.partial(sendMessage, 'robert'))
			.then(_.partial(sendMessage, 'lena'))
			.then(_.partial(sendMessage, 'alex'))
			.then(_.partial(sendMessage, 'maria'));

		function sendMessage(name){

			var queue = 'hello32';
			var msg = name || 'Hello World!';

			channel.assertQueue(queue, {durable: true});
			channel.sendToQueue(queue, new Buffer(msg), {persistent: true});
			console.log(" [x] Sent %s", msg);

		}

	});

	it('should send a message using an exchange', function(){
		var settings = {
			exchange: {
				name: 'logs2',
				type: 'fanout',
				options: {
					durable: true
				}
			},
			routingKey: ''		// this is the the name of the binding for the queue to the exchange
		};
		var channel = this.channel.channel;
		return Promise.resolve()
			.bind(this)
			.then(_.partial(sendMessage, 'nick'))
			.then(_.partial(sendMessage, 'helen_really_'))
			.then(_.partial(sendMessage, 'robert'))
			.then(_.partial(sendMessage, 'lena'))
			.then(_.partial(sendMessage, 'alex'))
			.then(_.partial(sendMessage, 'maria'));

		function sendMessage(name){

			var msg = name || 'Hello World!';

			channel.assertExchange(settings.exchange.name, settings.exchange.type, settings.exchange.options);
			channel.publish(settings.exchange.name, settings.routingKey, new Buffer(msg));
			console.log(" [x] Sent %s", msg);

		}

	});

	it.only('should send a message direct exchange', function(){
		var settings = {
			exchange: {
				name: 'direct1',
				type: 'direct',
				options: {
					durable: true
				}
			},
			routingKey: 'logs'		// this is the the name of the binding for the queue to the exchange
		};
		var channel = this.channel.channel;
		return Promise.resolve()
			.bind(this)
			.then(_.partial(sendMessage, 'nick'))
			.then(_.partial(sendMessage, 'helen_really_'))
			.then(_.partial(sendMessage, 'robert'))
			.then(_.partial(sendMessage, 'lena'))
			.then(_.partial(sendMessage, 'alex'))
			.then(_.partial(sendMessage, 'maria'));

		function sendMessage(name){

			var msg = name || 'Hello World!';
			let exchangeName;
			// exchange does not need to be created in the producer as long as it was already created by the consumer
			// setting the exchange property to a string will just publish to that exchange and not create it
			if(_.isString(settings.exchange)){
				exchangeName = settings.exchange;
			}else{
				exchangeName = settings.exchange.name;
				channel.assertExchange(settings.exchange.name, settings.exchange.type, settings.exchange.options);
			}
			channel.publish(exchangeName, settings.routingKey, new Buffer(msg));
			console.log(" [x] Sent %s", msg);

		}

	});


});


describe.skip('lib/Messengers/CoreRabbitMQMessenger', function () {
	var TEST_SERVICE_DIR = Path.join(__dirname, '../../../fixtures/test-projects/project1/services/service1'),
		app,
		tester;



	describe('rpc tests', function () {

		beforeEach(function () {
			app = new MicroServices({
				root: TEST_SERVICE_DIR,
				environment: 'rpc-test'
			});
			return app.start()
				.then(() => {
					tester = app.tester.get('project1.service1');
					this.client = new RpcClient({
						port: 5003,
						host: 'localhost'
					});
				});
		});

		afterEach(function () {
			return Promise.all([
				app.stop(),
				this.client.stop()
			]);
		});

		it.skip('should be able to share port with different services when host is not the same, or actually throw an error when they are', function () {
			assert(false, 'I think this will not work unless I make coreMessenger files global');
		});

		it('should successfully start the rpc servers and respond to rpc requests', function () {
			var request = {
				query: {
					source: 'simpleRequest'
				}
			};
			return this.client.send('getData', request)
				.then(function (response) {
					assert.equal(response.statusCode, 200);
					//assert(response.headers['content-type'].indexOf('application/json') > -1, 'it should return the correct content-type header');
					assert.equal(response.body.message.query.source, 'simpleRequest');
				});
		});

		it('should pass in the controller a message with headers, cookies, body, query and params set', function () {
			var values = {
				token: 'KSDF98ASDJHFL43P089AUF',
				id: '18',
				name: 'john',
				type: 'admin',
				sessionId: '123456'
			};

			var request = {
				params: {
					type: values.type
				},
				cookies: {
					'session-id': values.sessionId
				},
				headers: {
					token: values.token
				},
				query: {
					id: values.id
				},
				body: {
					name: values.name
				}
			};

			return this.client.send('getData', request)
				.then(function (response) {
					assert.equal(response.statusCode, 200);
					assert.equal(response.body.message.body.name, values.name);
					assert.equal(response.body.message.headers.token, values.token);
					assert.equal(response.body.message.query.id, values.id);
					assert.equal(response.body.message.params.type, values.type);
					assert.equal(response.body.message.cookies['session-id'], values.sessionId);
				});
		});

		it('should allow for setting response headers', function () {
			// check for response headers and specifically cookies (multiple ones)

			var request = {
				body: {
					name: 'nick'
				}
			};
			return this.client.send('postDataWithSet', request)

				.then(function (response) {

					assert.equal(response.statusCode, 401);
					assert.equal(response.cookies.name, 'nick', 'it should return the name cookie');
					assert.equal(response.headers['Content-Type'], 'application/xml', 'it should have the properly set content-type header');
				});

		});

		it('should communicate with an another service using rpc if no inProc service is specified and reverse match the url params', function () {
			var inProcSendStub = tester.injector.stub('CoreInProcMessenger', 'send', function () {
				return Promise.resolve();
			});
			var request = {
				body: {
					messageKey: 'sendData',
					messageBody: {
						params: {
							type: 'proxy'
						},
						cookies: {
							'session-id': '123456'
						}
					}
				}
			};
			return this.client.send('getRemote', request)
				.then(function (response) {
					assert.equal(response.statusCode, 200);
					assert.equal(inProcSendStub.callCount, 0, 'it should not use the inProc messenger');
					var remoteResponse = response.body;
					assert.equal(remoteResponse.statusCode, 200);
					assert.equal(remoteResponse.source, 'remote');
					assert.equal(remoteResponse.cookies.name, 'get-data');
					assert.equal(remoteResponse.body.message.params.type, 'proxy');
					assert.equal(remoteResponse.body.message.cookies['session-id'], '123456', 'it should properly send cookies');
				});
		});

		it('should re-use the same client connection when sending rpc messages', function () {
			var _this = this;
			sinon.spy(dnode, 'connect');

			var request = {
				body: {
					messageKey: 'sendData',
					messageBody: {}
				}
			};
			function sendAndAssert(){
				return _this.client.send('getRemote', request)
					.then(function (response) {
						assert.equal(response.statusCode, 200);
						var remoteResponse = response.body;
						assert.equal(remoteResponse.statusCode, 200);
						assert.equal(remoteResponse.source, 'remote');
						return response;
					});
			}
			return sendAndAssert()
				.then(function(){
					// once from using the test client and once from the CoreRpcMessenger
					assert.equal(dnode.connect.callCount, 2);
				})
				.then(sendAndAssert)
				.then(function(){
					// once from using the client + the 2 previous times
					assert.equal(dnode.connect.callCount, 3);
				})
				.finally(function(){
					dnode.connect.restore();
				});
		});

		it('should communicate with an another service using inProc if a service is specified', function () {
			var rpcSendStub = tester.injector.stub('CoreRpcMessenger', 'send', function () {
				return Promise.resolve();
			});
			var request = {
				body: {
					messageKey: 'sendDataInProc',
					messageBody: {
						params: {
							type: 'proxy'
						}
					}
				}
			};
			return this.client.send('getRemote', request)
				.then(function (response) {
					assert.equal(response.statusCode, 200);
					assert.equal(rpcSendStub.callCount, 0, 'it should not use the rpc messenger');
					var remoteResponse = response.body;
					assert.equal(remoteResponse.statusCode, 200);
					assert.equal(remoteResponse.source, 'remote');
					assert.equal(remoteResponse.cookies.name, 'get-data');
					assert.equal(remoteResponse.body.message.params.type, 'proxy');
				});
		});

		it('should handle throwing an error remotely the same inProc and rpc', function () {
			var messageBody = {
				body: {
					messageKey: 'sendData',
					messageBody: {
						body: {
							throws: true
						},
						params: {
							type: 'proxy'
						}
					}
				}
			};
			var messageBody2 = _.cloneDeep(messageBody);
			messageBody2.body.messageKey = 'sendDataInProc';
			return Promise
				.all([
					this.client.send('getRemote', messageBody),
					this.client.send('getRemote', messageBody2)
				])
				.then(function (responses) {
					assert.equal(responses.length, 2);
					_.each(responses, function (response) {
						assert.equal(response.statusCode, 200);
						var remoteResponse = response.body;
						assert.equal(remoteResponse.statusCode, 500);
					});
				});
		});

	});

});

