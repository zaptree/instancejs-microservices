'use strict';

// modules
var assert = require('chai').assert,
	Promise = require('bluebird'),
	_ = require('lodash');

// core modules
var Path = require('path');

// project modules
var MicroServices = require('../../lib/MicroServices');

describe('lib/index', function(){

	var TEST_PROJECTS_DIR = Path.join(__dirname, '../fixtures/test-projects'),
		app;

	beforeEach(function(){
		app = new MicroServices();
	});

	afterEach(function(){
		// app.close();
	});

	it('should create a new instance of the framework and apply the config settings passed in the constructor', function(){
		var settings = {
			root: TEST_PROJECTS_DIR,
			environment: 'dev'
		};
		app.setSettings(settings);

		assert.deepEqual(app.settings, settings);
	});

	it('should require and extend with the appropriate modules when using environmentRequire', function(){
		var settings = {
			root: TEST_PROJECTS_DIR,
			environment: 'dev'
		};
		app.setSettings(settings);
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
		app.setSettings(settings);

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
		app.setSettings(settings);

		var services = app.findServices(TEST_PROJECTS_DIR);

		assert(services.length > 0);
		assert.equal(services.length, _.uniq(services).length, 'It should only have unique values');

	});

	it('should load the services', function(){
		var settings = {
			// these config options are ovverides that will be applied to all services. Primarily for overriding config during testing
			config: {
				test: 'hello'
			},
			root: TEST_PROJECTS_DIR,
			environment: 'dev'
		};
		app.setSettings(settings);

		var services = [
			Path.join(TEST_PROJECTS_DIR, '/project1/services/service1'),
			Path.join(TEST_PROJECTS_DIR, '/project1/services/service2')
		];

		var loadedServices = app.loadServices(services);

		assert.equal(_.keys(loadedServices).length, 2, 'It should have loaded 2 services');
		_.each(['project1.service1', 'project1.service2'], function(serviceName){
			assert.isObject(loadedServices[serviceName]);
			assert.equal(loadedServices[serviceName].config.test, 'hello', 'it should merge config overrides passed in the app settings');
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
		app.setSettings(settings);

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
		app.setSettings(settings);

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

	it('should start the services when calling startServices', function(){
		var projectName = 'project1.service1';
		var settings = {
			root: TEST_PROJECTS_DIR,
			environment: 'dev'
		};
		app.setSettings(settings);

		var services = [
			Path.join(TEST_PROJECTS_DIR, '/project1/services/service1')
		];

		var loadedServices = app.loadServices(services);
		app.initServices(loadedServices);
		var service = app.services[projectName];
		var injector = service.injector;
		var startStub = injector.stub('CoreService', 'start', function(){
			return Promise.resolve();
		});
		return app.startServices(app.services)
			.then(function(){
				assert(startStub.calledOnce);
			});
	});

	it('should load, initialize and start the services when calling start', function(){
		var settings = {
			root: TEST_PROJECTS_DIR,
			environment: 'dev'
		};
		app.setSettings(settings);

		// when stubbing on the root injector it stubs it for all services
		var startStub = app.injector.stub('CoreService', 'start', function(){
			return Promise.resolve();
		});
		return app.start()
			.then(function(){
				assert(startStub.calledTwice);
			});
	});

	it('should stop all running services when calling stop', function(){
		var settings = {
			root: TEST_PROJECTS_DIR,
			environment: 'dev'
		};
		app.setSettings(settings);

		// when stubbing on the root injector it stubs it for all services
		var startStub = app.injector.stub('CoreService', 'start', function(){
			return Promise.resolve();
		});
		var stopStub = app.injector.stub('CoreService', 'stop', function(){
			return Promise.resolve();
		});
		return app.start()
			.then(function(){
				assert(startStub.calledTwice);
			})
			.return(app)
			.call('stop')
			.then(function(){
				assert(stopStub.calledTwice);
			});
	});

});
