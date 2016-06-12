'use strict';

// modules
var assert = require('chai').assert,
	Promise = require('bluebird'),
	_ = require('lodash');

// core modules
var Path = require('path');


// project modules
var MicroServices = require('../../../lib/MicroServices'),
	userSchemaOptions = require('../../fixtures/test-projects/project1/services/service1/schemas/user'),
	articleSchemaOptions = require('../../fixtures/test-projects/project1/services/service1/schemas/article');

describe('lib/Messengers/CoreHttpMessenger', function () {
	var TEST_SERVICE_DIR = Path.join(__dirname, '../../fixtures/test-projects/project1/services/service1'),
		tester,
		app;


	beforeEach(function(){
		app = new MicroServices({
			root: TEST_SERVICE_DIR,
			config: {
				inProcOnly: true
			}
		});

		return app.start()
			.then(function(){
				tester = app.tester.get('project1.service1');
			});
	});
	afterEach(function(){
		return app.stop();
	});

	it('should load schemas', function(){
		return tester.injector.get('$schemas')
			.then(function(schemas){
				assert.deepEqual(articleSchemaOptions, schemas.article.schema);
				assert.deepEqual(userSchemaOptions, schemas.user.schema);
			});
	});

	it('it should properly filter out values in the message that are not part of the schema for incoming requests', function(){
		var requestMessage = {
			params: {
				id: 12
			},
			body: {
				title: 'hello',
				text: 'world',
				random: 'should not be here'
			}
		};
		return tester.send('createArticle', requestMessage)
			.then(function (result) {
				var message = result.body.message;
				assert.equal(result.statusCode, 200);
				assert.deepEqual(_.omit(requestMessage.body, 'random'), message.body);
				assert.isUndefined(message.body.random);
			});
	});

	it.only('it should properly filter out values in the message that are not part of the schema for outgoing requests', function(){
		assert(false, 'not implemented');
	});

	it('should return an error when making an invalid request', function(){
		assert(false, 'not implmenetd');
	})



});
