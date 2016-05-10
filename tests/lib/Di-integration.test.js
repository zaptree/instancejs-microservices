'use strict';

// modules
var assert = require('chai').assert,
	Promise = require('bluebird'),
	_ = require('lodash');

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

	it.skip('should test that the controllers are requestSingletons', function(){
		// also test that messengers are serviceSingletons
		// also test CoreService
		// also test a plain class that is the defaultFactory
		// also test GlovalWhatever
		//todo: this should probably go in a test file on it's own that tests injector integration
		assert(false);
		//return test
		//	.send('getData', {
		//
		//	})
		//	.then(function(result){})
	});

});
