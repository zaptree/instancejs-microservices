'use strict';

// modules
var assert = require('chai').assert,
	Promise = require('bluebird'),
	_ = require('lodash');

// core modules
var Path = require('path');

// project modules
var MicroServices = require('../../lib/MicroServices');

describe('lib/CoreStartup', function(){

	var TEST_SERVICE_DIR = Path.join(__dirname, '../fixtures/test-projects/project1/services/service1'),
		injector;

	beforeEach(function(){
		var app = new MicroServices({
			root: TEST_SERVICE_DIR,
			environment: 'dev'
		});
		var loadedServices = app.loadServices([TEST_SERVICE_DIR]);
		app.initServices(loadedServices);
		injector = app.services['project1.service1'].injector;
	});

	it('should be able to get an instance of the CoreStartup class', function(){
		return injector.get('CoreStartup')
			.then(function(coreStartup){
				assert.isObject(coreStartup);
			});
	});

	/*it.only('should start the services', function(){
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
		var service = app.services[projectName];
		var injector = service.injector;
		var runStub = injector.stub('CoreStartup', 'run', function(){
			return Promise.resolve();
		});
		// todo: I will need to stub the start service using injector.stub make sure the run does not actually start
		return app.startServices()
			.then(function(){
				assert(runStub.calledOnce);
			});
	});*/

});
