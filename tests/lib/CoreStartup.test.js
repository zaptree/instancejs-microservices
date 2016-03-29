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

	var TEST_SERVICE_DIR = Path.join(__dirname, '../fixtures/test-projects/project1/services/service1'),
		injector,
		coreService;

	beforeEach(function(){
		var app = new MicroServices({
			root: TEST_SERVICE_DIR,
			environment: 'dev'
		});
		var loadedServices = app.loadServices([TEST_SERVICE_DIR]);
		app.initServices(loadedServices);
		injector = app.services['project1.service1'].injector;

		return injector.get('CoreService')
			.then(function(coreServiceInstance){
				coreService = coreServiceInstance;
			});
	});

	it('should be able to get an instance of the CoreService class', function(){
		assert.isObject(coreService);
	});

	it('should do something', function(){
		var groupedMessages = coreService.groupMessages(coreService.messages);
		assert.equal(_.get(groupedMessages, 'incoming.CoreHttpMessenger.http.messenger'), 'CoreHttpMessenger');
		assert(_.keys(_.get(groupedMessages, 'incoming.CoreHttpMessenger.http.messages')).length > 0);
	});


});
