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

describe('message-validation', function () {
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


	it('it should properly filter out values in the message that are not part of the schema for outgoing requests when doing inProc', function(){
		var requestMessage = {
			body: {
				messageKey: 'createUser',
				messageBody: {
					body: {
						name: 'john',
						email: 'test@test.com',
						random: 'should not be here'
					}
				}
			}
		};
		return tester.send('getRemote', requestMessage)
			.then(function (result) {
				var message = result.body.body.message;
				assert.equal(result.statusCode, 200);
				assert.deepEqual(_.omit(requestMessage.body.messageBody.body, 'random'), message.body);
				assert.isUndefined(message.body.random);
			});
	});


	it('should return an error when making an invalid request', function(){
		// I should return the actual validation errors
		var requestMessage = {
			params: {
				id: 12
			},
			body: {
				wrong: 'values'
			}
		};
		return tester.send('createArticle', requestMessage)
			.then(function (result) {
				assert.equal(result.statusCode, 500);
				assert.equal(result.body.errors[0], 'Invalid Message');
			});
	});

	describe('inProcOnly disabled', function(){
		beforeEach(function(){
			app = new MicroServices({
				root: TEST_SERVICE_DIR,
				config: {
					inProcOnly: false
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

		it('it should properly filter out values in the message that are not part of the schema for outgoing requests when doing inProc', function(){
			var requestMessage = {
				body: {
					messageKey: 'createUserNoInProc',
					messageBody: {
						body: {
							name: 'john',
							email: 'test@test.com',
							random: 'should not be here'
						}
					}
				}
			};
			return tester.send('getRemote', requestMessage)
				.then(function (result) {
					var message = result.body.body.message;
					assert.equal(result.statusCode, 200);
					assert.deepEqual(_.omit(requestMessage.body.messageBody.body, 'random'), message.body);
					assert.isUndefined(message.body.random);
				});
		});



	})



});
