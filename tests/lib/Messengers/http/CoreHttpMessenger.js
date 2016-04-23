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

describe.only('lib/Messengers/CoreHttpMessenger', function () {
	var TEST_SERVICE_DIR = Path.join(__dirname, '../../../fixtures/test-projects/project1/services/service1'),
		app,
		injector,
		coreHttpMessenger,
		messageOptions,
		httpBaseUrl,
		http;

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
				assert(response.headers['content-type'].indexOf('application/json') > -1, 'it shoulr return the correct content-type header');
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

		var values = {
			token: 'KSDF98ASDJHFL43P089AUF',
			id: '18',
			name: 'john',
			type: 'admin',
			sessionId: '123456'
		};

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

	it('should make sure set modules that are requestSingletons and values have a setScope === to scope')
	it('should handle errors consistently between in-process / http', function(){
		// with http when you will call you just get a bad statusCode, I need to make sure when one service calls the
		// other that the handling will be the same. ( I could have the outgoing messenger throw an error when it recieves a 500
		// but I'm not sure I like that
		assert(false);
	});


});
