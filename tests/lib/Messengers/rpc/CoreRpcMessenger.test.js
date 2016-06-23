'use strict';

// modules
var assert = require('chai').assert,
	Promise = require('bluebird'),
	sinon = require('sinon'),
	dnode = require('dnode'),
	_ = require('lodash');

// core modules
var Path = require('path');

// project modules
var RpcClient = require('./RpcClient'),
	MicroServices = require('../../../../lib/MicroServices');


describe('lib/Messengers/CoreRpcMessenger', function () {
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
