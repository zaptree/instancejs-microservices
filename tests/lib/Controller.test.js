'use strict';

// modules
var assert = require('chai').assert,
	Promise = require('bluebird');

// core modules
var Path = require('path');

// project modules
var MicroServices = require('../../lib/MicroServices');

describe('lib/Controller', function(){

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

	it('it should call the controller action', function(){

		return tester
			.send('getData', {
				body: {
					name: 'john'
				}
			})
			.then(function (result) {
				assert.equal(result.body.message.body.name, 'john');
			});
	});

	it('it should delegate calling the action to the handleAction method of the controller', function(){

		tester.stub('TestController', 'handleAction', function(action, message){
			return Promise.resolve({
				action: action,
				name: message.body.name
			});
		});

		return tester
			.send('getData', {
				body: {
					name: 'john'
				}
			})
			.then(function (result) {
				assert.equal(result.statusCode, 200);
				assert.equal(result.body.action, 'getData');
				assert.equal(result.body.name, 'john');
			});
	});

	it('it should call the before and after methods which can filter the data', function(){

		tester.stub('TestController', 'before', function(message){
			message.body.beforeMessage = 'Hello ';
			return message;
		});

		tester.stub('TestController', 'after', function(response){
			response.combined = response.message.body.beforeMessage + response.message.body.name;
			return response;
		});

		return tester
			.send('getData', {
				body: {
					name: 'john'
				}
			})
			.then(function (result) {
				assert.equal(result.statusCode, 200);
				assert.equal(result.body.combined, 'Hello john');
			});
	});

	it('should call the action directly when there is not handleAction method to delegate to', function(){
		return tester
			.send('notExtendedGetData', {
				body: {
					name: 'alex'
				}
			})
			.then(function(result){
				assert.equal(result.statusCode, 200);
				assert.equal(result.body.message.body.name, 'alex');
				assert.equal(result.body.source, 'NotExtendingController');
			});
	});

	describe('factory', function(){
		it('should wrap generator methods', function(){
			return tester
				.send('generatorMethod')
				.then(function(result){
					assert.equal(result.statusCode, 200);
					assert.equal(result.body.msg, 'hello world');
				});
		});
	});

});
