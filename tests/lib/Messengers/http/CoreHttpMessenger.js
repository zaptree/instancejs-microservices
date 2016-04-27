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
		coreHttpMessenger,
		messageOptions,
		httpBaseUrl,
		http,
		http2BaseUrl,
		http2,
		http3BaseUrl,
		http3;

	beforeEach(function () {
		app = new MicroServices({
			root: TEST_SERVICE_DIR,
			environment: 'dev'
		});
		var loadedServices = app.loadServices([TEST_SERVICE_DIR]);
		app.initServices(loadedServices);
		injector = app.services['project1.service1'].injector;

		return Promise
			.all([
				injector.get('CoreHttpMessenger'),
				injector.get('CoreService'),
			])
			.spread(function (coreHttpMessengerInstance, coreService) {
				var groupedMessages = coreService.groupMessages(coreService.messages);
				messageOptions = groupedMessages.CoreHttpMessenger;
				http = messageOptions.incoming.http;
				httpBaseUrl = `http://${http.options.host}:${http.options.port}${http.options.path}`;
				http2 = messageOptions.incoming.http2;
				http2BaseUrl = `http://${http2.options.host}:${http2.options.port}${http2.options.path}`;
				http3 = messageOptions.incoming.http3;
				http3BaseUrl = `http://${http3.options.host}:${http3.options.port}${http3.options.path}`;
				coreHttpMessenger = coreHttpMessengerInstance;
			});
	});

	afterEach(function(){
		return coreHttpMessenger.stop();
	});

	it('should successfully start the http servers and respond to http requests', function () {

		return coreHttpMessenger
			.start({
				incoming: {
					http: http
				}
			})
			.then(function(){
				return request({
					url: httpBaseUrl + '/users',
					json: true
				})
			})
			.spread(function(response, result){
				assert.equal(response.statusCode, 200);
				assert(response.headers['content-type'].indexOf('application/json') > -1, 'it should return the correct content-type header');
				assert.isArray(result.users, 'It should return the list of users');
			});
	});

	it('should pass in the controller a message with headers, cookies, body, query and params set', function(){
		var values = {
			token: 'KSDF98ASDJHFL43P089AUF',
			id: '18',
			name: 'john',
			type: 'admin',
			sessionId: '123456'
		};

		return coreHttpMessenger
			.start({
				incoming: {
					http: http
				}
			})
			.then(function(){

				var jar = request.jar();
				var cookie = request.cookie('session-id=' + values.sessionId);
				jar.setCookie(cookie, httpBaseUrl);

				return request({
					url: httpBaseUrl + '/users/create/' + values.type,
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
			})
			.spread(function(response, result){
				assert.equal(response.statusCode, 200);
				assert.deepEqual(result, values, 'it should have got all the values');
			});
	});

	it('should allow for setting response headers', function(){
		// check for response headers and specifically cookies (multiple ones)

		var jar = request.jar();

		return coreHttpMessenger
			.start({
				incoming: {
					http: http
				}
			})
			.then(function(){



				return request({
					url: httpBaseUrl + '/users/login',
					method: 'POST',
					jar: jar,
					body: {
						username:'test@test.com',
						password:'1234'
					},
					json: true
				})
			})
			.spread(function(response, result){
				var cookies = jar.getCookies(httpBaseUrl);
				var usernameCookie = _.find(cookies, {key:'username'});

				assert.equal(response.statusCode, 401);
				assert.equal(_.get(usernameCookie, 'value'), 'test@test.com', 'it should return the username cookie');
				assert.equal(response.headers['content-type'], 'application/xml', 'it should have the properly set content-type header');
			});

	});

	it.skip('should make sure set modules that are requestSingletons and values have a setScope === to scope',function(){
		// run a couple of request that have a timeout that after x time uses the injector to get $request and make sure it is different
	});
	it.skip('should handle errors consistently between in-process / http', function(){
		// with http when you will call you just get a bad statusCode, I need to make sure when one service calls the
		// other that the handling will be the same. ( I could have the outgoing messenger throw an error when it recieves a 500
		// but I'm not sure I like that
		assert(false);
	});

	it('should reuse the server port when multiple domains are used on same port and run servers on different ports', function(){
		return coreHttpMessenger
			.start({
				incoming: {
					http: http,
					http2: http2,
					http3: http3
				}
			})
			.then(function(){
				return Promise
					.all([
						request({
							url: httpBaseUrl + '/users',
							json: true
						}),
						request({
							url: http2BaseUrl + '/users',
							json: true
						}),
						request({
							url: http3BaseUrl + '/users',
							json: true
						})
					])
			})
			.then(function(results){

				assert.equal(results.length, 3);
				_.each(results, function(res, i){
					var response = res[0];
					var result = res[1];
					assert.equal(result.version, i + 1);
					assert.equal(response.statusCode, 200);
					assert(response.headers['content-type'].indexOf('application/json') > -1, 'it should return the correct content-type header');
					assert.isArray(result.users, 'It should return the list of users');
				});

			});
	});

	it('should communicate with an another service using http if no inProc service is specified', function(){
		return coreHttpMessenger
			.start({
				incoming: {
					http: http
				}
			})
			.then(function(){
				return request({
					url: httpBaseUrl + '/getRemoteUsers',
					json: true
				})
			})
			.spread(function(response, result){
				assert.equal(response.statusCode, 200);
				assert.isArray(result.users, 'It should return the list of users');
			});
	});

	it('should communicate with an another service using http and reverse match the url params', function(){
		return coreHttpMessenger
			.start({
				incoming: {
					http: http
				}
			})
			.then(function(){
				return request({
					url: httpBaseUrl + '/createRemoteUser',
					json: true
				})
			})
			.spread(function(response, result){
				assert.equal(response.statusCode, 200);
				assert.deepEqual(result, {
					"name": "john",
					"type": "admin",
					"id": "15",
					"token": "token",
					"sessionId": "123456"
				});
			});
	});

	it('should communicate with an another service using inProc is a service is specified', function(){

	});

	it.skip('should cleanly run the tests', function(){
		// I should be able to initialize the new Microsevices() and then stub the $messages values to only have the ones that we want,
		// also I'll make sure that I use production environment as to never load more than one service for these tests.

		// maybe I need to add a tester class thas is in the main app so app.tester.send('CoreHttpRequest', ) ... app.tester.listen('CoreHttpRequest', )
		assert(false);
	})


});
