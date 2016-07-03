'use strict';

// modules
var assert = require('chai').assert,
	Promise = require('bluebird'),
	sinon = require('sinon');

// core modules
var Path = require('path');

// project modules
var RabbitMQClient = require('./RabbitMQClient'),
	MicroServices = require('../../../../lib/MicroServices');

describe('lib/Messengers/CoreRabbitMQMessenger', function () {
	var TEST_SERVICE_DIR = Path.join(__dirname, '../../../fixtures/test-projects/project1/services/service1'),
		app,
		tester;

	function proxyMessage(controller, action){
		var promise = new Promise((resolve)=>{
			tester.injector.stub(controller, action, function(message){
				// adding a small timeout so that the consumer finishes up
				setTimeout(function(){
					resolve(message);
				},100);

			});
		});
		return function(){
			return promise;
		};

	}

	describe('rabbitMQ tests', function () {
		beforeEach(function () {
			app = new MicroServices({
				root: TEST_SERVICE_DIR,
				environment: 'amqp-test'
			});
			return app.start()
				.then(() => {
					tester = app.tester.get('project1.service1');
					return tester.injector.get('$messages');
				})
				.then((messages)=>{
					this.client = new RabbitMQClient({
						uri: messages.types.incoming.amqp.uri,
						exchange: 'instance_default_topic_exchange'
					});
				});
		});

		afterEach(function () {
			return Promise.all([
				app.stop(),
				this.client.stop()
			]);
		});

		it('should successfully start the rabbitMQ consumers and receive messages', function () {
			var request = {
				query: {
					source: 'simpleRequest'
				}
			};
			return this.client.send('getData', request)
				.then(proxyMessage('TestController', 'getData'))
				.then(function (request) {
					assert.equal(request.query.source, 'simpleRequest');
				});
		});

		it('should try twice to get a message that fails the first time', function(done){
			var tries = 0;

			tester.injector.stub('TestController', 'getData', function(){
				if(!tries){
					tries++;
					return Promise.reject('It failed');
				}
				// adding a small timeout so that the consumer finishes up
				setTimeout(function(){
					done();
				},100);

			});

			var request = {
				query: {
					source: 'simpleRequest'
				}
			};
			this.client.send('getData', request);
		});

		it('should catch the error when failing to parse a message', function(done){

			// since the coreLogger was already injected in the CoreRabbitMQMessenger we can't use the injector.stub since that only works if stubbed before hand
			tester.injector.get('CoreLogger')
				.then((coreLogger)=>{
					sinon.stub(coreLogger, 'error', function(error){
						assert(error.message.indexOf('Unexpected token') > -1);
						// adding a small timeout so that the consumer finishes up
						setTimeout(function(){
							done();
						},100);
					});
					var badJson = '{badJson,';
					this.client.send('getDataNoAck', badJson, true);
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
				.then(proxyMessage('TestController', 'getData'))
				.then(function (request) {
					assert.equal(request.body.name, values.name);
					assert.equal(request.headers.token, values.token);
					assert.equal(request.query.id, values.id);
					assert.equal(request.params.type, values.type);
					assert.equal(request.cookies['session-id'], values.sessionId);
				});
		});

		it('should communicate with an another service using rpc if no inProc service is specified and reverse match the url params', function () {
			var inProcSendStub = tester.injector.spy('CoreInProcMessenger', 'send');
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
			return tester.send('getRemote', request)
				.then(proxyMessage('TestController', 'getData'))
				.then(function (request) {
					assert.equal(inProcSendStub.callCount, 1, 'it should not use the inProc messenger');
					assert.equal(request.params.type, 'proxy');
					assert.equal(request.cookies['session-id'], '123456', 'it should properly send cookies');
				});
		});

		it('should communicate with an another service using inProc if a service is specified', function () {
			var rabbitMQSendStub = tester.injector.stub('CoreRabbitMQMessenger', 'send', function () {
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
			return tester.send('getRemote', request)
				.then(function(response){
					assert(!response.body, 'it should not have a body even with inProc');
				})
				.then(proxyMessage('TestController', 'getData'))
				.then(function (request) {
					assert.equal(request.params.type, 'proxy');
					assert.equal(rabbitMQSendStub.callCount, 0, 'it should not use the rpc messenger');
				});
		});



	});

});

