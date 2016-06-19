'use strict';

// modules
var assert = require('chai').assert;

// core modules
var Path = require('path');


// project modules
var MicroServices = require('../../../lib/MicroServices');

describe('CoreTester', function () {
	var TEST_SERVICE_DIR = Path.join(__dirname, '../../fixtures/test-projects/project1/services/service1'),
		tester,
		app;


	beforeEach(function () {
		app = new MicroServices({
			root: TEST_SERVICE_DIR,
			config: {
				inProcOnly: true
			}
		});

		return app.start()
			.then(function () {
				tester = app.tester.get('project1.service1');
			});
	});
	afterEach(function () {
		return app.stop();
	});

	it('should throw an error when trying to get a tester for a non-existing service', function () {
		var run = function () {
			app.tester.get('project1.service333');
		};
		assert.throws(run, 'Service project1.service333 was not found to load ServiceTester');
	});

});
