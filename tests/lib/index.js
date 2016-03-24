'use strict';

// modules
var assert = require('chai').assert;

// core modules
var Path = require('path');

// project modules
var MicroServices = require('../../lib');

describe('lib/index', function(){

	var TEST_PROJECTS_DIR = Path.join(__dirname, '../fixtures/test-projects');

	it('should create a new instance of the framework and apply the config settings passed in the constructor', function(){
		var settings = {
			root: TEST_PROJECTS_DIR,
			environment: 'dev'
		};
		var app = new MicroServices(settings);

		assert.deepEqual(app.settings, settings);
	});

	it('should require and extend with the appropriate modules when using environmentRequire', function(){
		var settings = {
			root: TEST_PROJECTS_DIR,
			environment: 'dev'
		};
		var app = new MicroServices(settings);
		var config = app.environmentRequire(Path.join(__dirname, '../fixtures/environment-require/config'));
		var messages = app.environmentRequire(Path.join(__dirname, '../fixtures/environment-require/messages'));
		assert.equal(config.type, 'local');
		assert.equal(config.base, true);
		assert.equal(config.dev, true);
		assert.equal(config.local, true);
		assert.equal(messages.type, 'dev');
		assert.equal(messages.base, true);
		assert.equal(messages.dev, true);

	});

	it('should throw an error when using environmentRequire and the require file has an error', function(){
		var settings = {
			root: TEST_PROJECTS_DIR,
			environment: 'dev'
		};
		var app = new MicroServices(settings);

		var run = function(){
			app.environmentRequire(Path.join(__dirname, '../fixtures/environment-require/throws'));
		};
		assert.throws(run, 'Test Error');

	});

	it.only('should find all the services in a given path and recursively load them', function(){
		var settings = {
			root: TEST_PROJECTS_DIR,
			environment: 'dev'
		};
		var app = new MicroServices(settings);

		var services = app.findServices(TEST_PROJECTS_DIR);

		asset(services.length > 0);

	});




	/*var Microservices = require('microservices');

	var app = new Microservices({
		root: __dirname,
		environment: 'dev',
		services: './index'
	});

	app.start();*/
});
