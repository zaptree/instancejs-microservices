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
var MicroServices = require('../../../lib/MicroServices');

describe('lib/Messengers/CoreHttpMessenger', function () {
	var TEST_SERVICE_DIR = Path.join(__dirname, '../../fixtures/test-projects/project1/services/service1'),
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
				httpBaseUrl = `http://${http.options.host}:${http.options.port}${http.options.path}/`;
				coreHttpMessenger = coreHttpMessengerInstance;
			});
	});

	it.only('should ', function () {

		return coreHttpMessenger
			.start({
				incoming: {
					http: http
				}
			})
			.then(function(){
				return request({
					'url': httpBaseUrl
				})
			})
			.spread(function(response, result){
				return result;
			});
	});


});
