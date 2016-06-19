'use strict';

// modules
var assert = require('chai').assert;

// core modules
var Path = require('path');


// project modules
var MicroServices = require('../../../../lib/MicroServices');

describe('CoreInProcMessenger', function () {
	var TEST_SERVICE_DIR = Path.join(__dirname, '../../../fixtures/test-projects/project1/services/service1'),
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

	it('it should throw an error when trying to send a message inProc and target is a non-existent incoming message', function () {
		return tester
			.send('getRemote', {
				body: {
					messageKey: 'toMissing',
					messageBody: {

					}
				}

			})
			.then(function (result) {
				assert.equal(result.statusCode, 500);
				assert.equal(result.body.errors[0], 'Message not found: missing');
			});
	});

});
