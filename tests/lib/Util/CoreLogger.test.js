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

	it('should log an info message', function () {
		return tester
			.send('logMessage', {
				body: {
					type:'info',
					text: 'hello world'
				}

			})
			.then(function (result) {
				assert.equal(result.statusCode, 200);
			});
	});

	it('should log an error message', function () {
		return tester
			.send('logMessage', {
				body: {
					type:'error',
					text: 'hello world'
				}

			})
			.then(function (result) {
				assert.equal(result.statusCode, 200);
			});
	});

	it('should log an error message stack', function () {
		return tester
			.send('logMessage', {
				body: {
					passInError: true,
					type:'error',
					text: 'hello world'
				}

			})
			.then(function (result) {
				assert.equal(result.statusCode, 200);
			});
	});

});
