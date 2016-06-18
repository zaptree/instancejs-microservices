'use strict';

// modules
var assert = require('chai').assert,
	Promise = require('bluebird');

// core modules
var Path = require('path');

// project modules
var MicroServices = require('../../lib/MicroServices');

describe('Di Integration', function(){

	var app,
		tester,
		injector;

	beforeEach(function () {
		app = new MicroServices({
			root: Path.join(__dirname, '../fixtures/test-projects/project1/services/service1'),
			environment: 'test'
		});

		return app.start()
			.then(function(){
				tester = app.tester.get('project1.service1');
				injector = tester.injector;
			});
	});

	afterEach(function(){
		tester.restore();
		return app.stop();
	});

	it('should create static types properly using the CoreDefaultFactory', function(){
		injector.set('staticSingleton', 'staticFunction', function () {
			return 'hello';
		});
		injector.set('singleton', 'nonStaticFunction', function () {
			return 'hello';
		});

		return Promise.all([
				injector.get('staticFunction'),
				injector.get('nonStaticFunction')
			])
			.spread(function (valueStatic, valueNonStatic) {
				assert.equal(valueStatic, 'hello', 'it should return the string value');
				assert.isObject(valueNonStatic, 'it should return an object when not using static');
			});
	});

	it('should be able to create a value even whith the CoreDefaultFactory when not a function or class', function(){
		injector.set('hello', 'world');
		return injector.get('hello')
			.then(function(val){
				assert.equal(val, 'world');
			});
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

	it.skip('should test global singletons', function(){
		assert(false, 'why is the global not use the ');
	});

});
