'use strict';

// modules
var assert = require('chai').assert,
	Promise = require('bluebird'),
	_ = require('lodash');

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

	it('should find all the services in a given path and recursively load them', function(){
		var settings = {
			root: TEST_PROJECTS_DIR,
			environment: 'dev'
		};
		var app = new MicroServices(settings);

		var services = app.findServices(TEST_PROJECTS_DIR);

		assert(services.length > 0);
		assert.equal(services.length, _.uniq(services).length, 'It should only have unique values');

	});

	it('should load the services', function(){
		var settings = {
			root: TEST_PROJECTS_DIR,
			environment: 'dev'
		};
		var app = new MicroServices(settings);

		var services = [
			Path.join(TEST_PROJECTS_DIR, '/project1/services/service1'),
			Path.join(TEST_PROJECTS_DIR, '/project1/services/service2')
		];

		var loadedServices = app.loadServices(services);

		assert.equal(_.keys(loadedServices).length, 2, 'It should have loaded 2 services');
		_.each(['project1.service1', 'project1.service2'], function(serviceName){
			assert.isObject(loadedServices[serviceName]);
			assert.isObject(loadedServices[serviceName].config);
			assert.isObject(loadedServices[serviceName].messages);
			assert.isObject(loadedServices[serviceName].diConfig);
		});

	});

	it('should throw an error when trying to load a service more than once', function(){
		var settings = {
			root: TEST_PROJECTS_DIR,
			environment: 'dev'
		};
		var app = new MicroServices(settings);

		var services = [
			Path.join(TEST_PROJECTS_DIR, '/project1/services/service1'),
			Path.join(TEST_PROJECTS_DIR, '/project1/services/service1')
		];

		var run = function(){
			app.loadServices(services);
		};
		assert.throws(run, 'Service project1.service1 has already been loaded');


	});



	it('should initialize the services', function(){
		var projectName = 'project1.service1';
		var settings = {
			root: TEST_PROJECTS_DIR,
			environment: 'dev'
		};
		var app = new MicroServices(settings);

		var services = [
			Path.join(TEST_PROJECTS_DIR, '/project1/services/service1')
		];

		var loadedServices = app.loadServices(services);
		app.initServices(loadedServices);
		var injector = app.services[projectName].injector;
		return Promise
			.all([
				injector.get('$config'),
				injector.get('$app'),
				injector.get('$messages')
			])
			.spread(function($config, $app, $messages){
				assert.equal($config.name, projectName, 'it should have set the merged config');
				assert.equal($app.services[projectName].options.config.name, projectName, 'it should have set the app object');
				assert.isObject($messages, 'it should have set the messages object');
			});
	});

	it('should start the services', function(){
		var projectName = 'project1.service1';
		var settings = {
			root: TEST_PROJECTS_DIR,
			environment: 'dev'
		};
		var app = new MicroServices(settings);

		var services = [
			Path.join(TEST_PROJECTS_DIR, '/project1/services/service1')
		];

		var loadedServices = app.loadServices(services);
		app.initServices(loadedServices);
		// todo: I will need to stub the start service using injector.stub make sure the run does not actually start
		return app.startServices()
			.then(function(){

			});
	});

});
