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

describe('lib/Messengers/Http/CoreHttpRouter', function () {
	var TEST_SERVICE_DIR = Path.join(__dirname, '../../../fixtures/test-projects/project1/services/service1'),
		app,
		injector,
		CoreHttpRouter;

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
				injector.get('CoreHttpRouter')
			])
			.spread(function (_CoreHttpRouter) {
				CoreHttpRouter = _CoreHttpRouter;
			});
	});

	it.skip('should ', function () {
		var router = new CoreHttpRouter();
		var request = {
			method: 'GET',
			url: '/whater?you=hello',
			query: {
				you: 'hello'
			},
			body: {}
		};
		return router.route(request);
	});


});
