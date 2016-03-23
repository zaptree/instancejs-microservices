'use strict';

var assert = require('chai').assert;

var MicroServices = require('../../lib');

describe('lib/index', function(){

	it('should create a new instance of the framework and apply the config settings passed in the constructor', function(){
		var settings = {
			root: __dirname,
			environment: 'dev',
			services: '../fixtures/test-projects'
		};
		var app = new MicroServices(settings);

		assert.deepEqual(app.settings, settings);
	});

	it.only('should require and extend with the appropriate modules when using environmentRequire', function(){
		var settings = {
			root: __dirname,
			environment: 'dev',
			services: '../fixtures/environment-require'
		};
		var app = new MicroServices(settings);
		var config = app.environmentRequire('config');
		var messages = app.environmentRequire('messages');

	});


	/*var Microservices = require('microservices');

	var app = new Microservices({
		root: __dirname,
		environment: 'dev',
		services: './index'
	});

	app.start();*/
});
