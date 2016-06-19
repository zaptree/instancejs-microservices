'use strict';

// modules
var Request = require('request'),
	assert = require('chai').assert,
	Promise = require('bluebird'),
	_ = require('lodash');

// core modules
var Path = require('path');

Promise.promisifyAll(Request);
var request = Promise.promisify(Request);


// project modules
var MicroServices = require('../../../../lib/MicroServices');

describe('lib/Messengers/CoreHttpMessenger', function () {
	var TEST_SERVICE_DIR = Path.join(__dirname, '../../../fixtures/test-projects/project1/services/service1'),
		app,
		injector,
		staticBaseUrl = 'http://127.0.0.1:3333',
		httpBaseUrl = 'http://localhost:3333/api/v1',
		http2BaseUrl = 'http://localhost:3232/api/v2',
		http3BaseUrl = 'http://127.0.0.1:3333/api/v2';

	describe('http tests', function () {

		beforeEach(function () {
			app = new MicroServices({
				root: TEST_SERVICE_DIR,
				environment: 'http-test'
			});
			return app.start()
				.then(function () {
					injector = app.services['project1.service1'].injector;
				});
		});

		afterEach(function () {
			return app.stop();
		});

		it('should successfully start the http servers and respond to http requests', function () {

			return request({
				url: httpBaseUrl + '/getData?source=simpleRequest',
				json: true
			})
				.spread(function (response, result) {
					assert.equal(response.statusCode, 200);
					assert(response.headers['content-type'].indexOf('application/json') > -1, 'it should return the correct content-type header');
					assert.equal(result.message.query.source, 'simpleRequest');
				});
		});

		it('should return 404 when calling an non-existing route', function () {

			return request({
				url: httpBaseUrl + '/notExisting',
				json: true
			})
				.spread(function (response, result) {
					assert.equal(response.statusCode, 404);
					assert.equal(result, '404 Not Found');
				});
		});

		it('should set the response headers to html when a string is returned by the controller unless headers set otherwise', function () {

			return request({
				url: httpBaseUrl + '/getHtml',
				json: {
					html: '<h1>Hello</h1>'
				}
			})
				.spread(function (response, result) {
					assert.equal(response.statusCode, 200);
					assert.equal(response.headers['content-type'], 'text/html; charset=utf-8', 'it should return the correct content-type header');
					assert.equal(result, '<h1>Hello</h1>');
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

			var jar = request.jar();
			var cookie = request.cookie('session-id=' + values.sessionId);
			jar.setCookie(cookie, httpBaseUrl);

			return request({
				url: httpBaseUrl + '/getData/' + values.type,
				method: 'POST',
				jar: jar,
				headers: {
					token: values.token
				},
				qs: {
					id: values.id
				},
				body: {
					name: values.name
				},
				json: true
			})
				.spread(function (response, result) {
					assert.equal(response.statusCode, 200);
					assert.equal(result.message.body.name, values.name);
					assert.equal(result.message.headers.token, values.token);
					assert.equal(result.message.query.id, values.id);
					assert.equal(result.message.params.type, values.type);
					assert.equal(result.message.cookies['session-id'], values.sessionId);
				});
		});

		it('should allow for setting response headers', function () {
			// check for response headers and specifically cookies (multiple ones)

			var jar = request.jar();

			return request({
				url: httpBaseUrl + '/postDataWithSet',
				method: 'POST',
				jar: jar,
				body: {
					name: 'nick'
				},
				json: true
			})
				.spread(function (response) {
					var cookies = jar.getCookies(httpBaseUrl);
					var nameCookie = _.find(cookies, {key: 'name'});

					assert.equal(response.statusCode, 401);
					assert.equal(_.get(nameCookie, 'value'), 'nick', 'it should return the name cookie');
					assert.equal(response.headers['content-type'], 'application/xml', 'it should have the properly set content-type header');
				});

		});

		it('should reuse the server port when multiple domains are used on same port and run servers on different ports', function () {
			return Promise
				.all([
					request({
						url: httpBaseUrl + '/getData',
						body: {
							source: 1
						},
						json: true
					}),
					request({
						url: http2BaseUrl + '/getData2',
						body: {
							source: 2
						},
						json: true
					}),
					request({
						url: http3BaseUrl + '/getData3',
						body: {
							source: 3
						},
						json: true
					})
				])
				.then(function (results) {

					assert.equal(results.length, 3);
					_.each(results, function (res, i) {
						var response = res[0];
						var result = res[1];
						assert.equal(result.message.body.source, i + 1);
						assert.equal(response.statusCode, 200);
						assert(response.headers['content-type'].indexOf('application/json') > -1, 'it should return the correct content-type header');
					});

				});
		});

		it('should communicate with an another service using http if no inProc service is specified and reverse match the url params', function () {
			var inProcSendStub = injector.stub('CoreInProcMessenger', 'send', function () {
				return Promise.resolve();
			});
			return request({
				url: httpBaseUrl + '/getRemote',
				method: 'POST',
				json: {
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
			})
				.spread(function (response, result) {
					assert.equal(response.statusCode, 200);
					assert.equal(inProcSendStub.callCount, 0, 'it should not use the inProc messenger');
					var remoteResponse = result;
					assert.equal(remoteResponse.statusCode, 200);
					assert.equal(remoteResponse.source, 'remote');
					assert.equal(remoteResponse.cookies.name, 'get-data');
					assert.equal(remoteResponse.body.message.params.type, 'proxy');
					assert.equal(remoteResponse.body.message.cookies['session-id'], '123456', 'it should properly send cookies');
				});
		});

		it('should communicate with an another service using inProc if a service is specified', function () {
			var httpSendStub = injector.stub('CoreHttpMessenger', 'send', function () {
				return Promise.resolve();
			});
			return request({
				url: httpBaseUrl + '/getRemote',
				method: 'POST',
				json: {
					messageKey: 'sendDataInProc',
					messageBody: {
						params: {
							type: 'proxy'
						}
					}
				}
			})
				.spread(function (response, result) {
					assert.equal(response.statusCode, 200);
					assert.equal(httpSendStub.callCount, 0, 'it should not use the http messenger');
					var remoteResponse = result;
					assert.equal(remoteResponse.statusCode, 200);
					assert.equal(remoteResponse.source, 'remote');
					assert.equal(remoteResponse.cookies.name, 'get-data');
					assert.equal(remoteResponse.body.message.params.type, 'proxy');
				});
		});

		it('should handle throwing an error remotely the same inProc and http', function () {
			var messageBody = {
				url: httpBaseUrl + '/getRemote',
				method: 'POST',
				json: {
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
			messageBody2.json.messageKey = 'sendDataInProc';
			return Promise
				.all([
					request(messageBody),
					request(messageBody2)
				])
				.then(function (responses) {
					assert.equal(responses.length, 2);
					_.each(responses, function (res) {
						var response = res[0];
						var result = res[1];
						assert.equal(response.statusCode, 200);
						var remoteResponse = result;
						assert.equal(remoteResponse.statusCode, 500);
					});
				});
		});

		it('should successfully serve static files', function () {
			return request({
				url: staticBaseUrl + '/info.txt'
			})
				.spread(function (response, result) {
					assert.equal(result.trim(), 'static file');
				});
		});

	});

	describe('inProcOnly tests', function () {
		it('should not start any servers when using the inProcOnly option', function () {
			var app = new MicroServices({
				root: TEST_SERVICE_DIR,
				config: {
					inProcOnly: true
				},
				environment: 'http-test'
			});

			var httpStartStub = app.injector.stub('CoreHttpMessenger', 'start', function () {
				return Promise.resolve();
			});

			return app.start()
				.then(function () {
					injector = app.services['project1.service1'].injector;
				})
				.then(function () {
					assert.equal(httpStartStub.callCount, 0);
				})
				.then(function () {
					var tester = app.tester.get('project1.service1');
					return tester.send('getData', {
						params: {
							type: 'test'
						},
						body: {
							name: 'john'
						}
					});
				})
				.then(function (result) {
					assert.equal(result.statusCode, 200);
					assert.equal(result.body.message.params.type, 'test');
					assert.equal(result.body.message.body.name, 'john');
				})
				.finally(function () {
					app.stop();
				});
		});
	});


});
