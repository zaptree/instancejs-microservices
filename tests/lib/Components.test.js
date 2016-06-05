'use strict';

// modules
var assert = require('chai').assert;

// core modules
var Path = require('path');

// project modules
var MicroServices = require('../../lib/MicroServices');

describe('lib/CoreService', function(){

	var app,
		tester;

	beforeEach(function () {
		app = new MicroServices({
			root: Path.join(__dirname, '../fixtures/test-projects/project1/services/service1'),
			environment: 'test'
		});

		return app.start()
			.then(function(){
				tester = app.tester.get('project1.service1');
			});
	});

	afterEach(function(){
		tester.restore();
		return app.stop();
	});

	it('it should attach the component and add the decorators', function(){

		return tester
			.send('switch', {
				body: {
					name: 'john'
				}
			})
			.then(function (result) {
				assert.equal(result.body.location, 'switched');
				assert.equal(result.body.extra, 'augmented');
				assert.equal(result.body.ranFirst, 'switch');
			});
	});

});
