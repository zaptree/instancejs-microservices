'use strict';

// modules
var assert = require('chai').assert,
	Promise = require('bluebird'),
	_ = require('lodash');

// core modules
var Path = require('path');

// project modules
var MicroServices = require('../../../lib/MicroServices');

describe('lib/CoreService', function(){
	var messageOptions = {
		"incoming": {
			"http": {
				"messenger": "CoreHttpMessenger",
				"options": {
					"port": 3333,
					"path": "/api",
					"host": "localhost"
				},
				"messages": {
					"getUser": {
						"filters": [
							{
								"name": "auth",
								"options": {
									"whatever": "hello"
								}
							}
						],
						"schema": "filename/property.lodash.gettable",
						"responseSchema": "xxx",
						"controller": "WhateverController",
						"action": "ActionWhatever",
						"type": "http",
						"options": {
							"method": "GET",
							"match": "/whatever/:id"
						}
					}
				}
			}
		},
		"outgoing": {
			"http": {
				"messenger": "CoreHttpMessenger",
				"options": {
					"uri": "http://localhost:4444/api"
				},
				"messages": {
					"service1/getUser": {
						"schema": "xxx",
						"type": "http",
						"options": {
							"method": "GET",
							"match": "/whatever/:id"
						}
					}
				}
			}
		}
	};
	var TEST_SERVICE_DIR = Path.join(__dirname, '../../fixtures/test-projects/project1/services/service1'),
		app,
		injector,
		coreHttpMessenger;

	beforeEach(function(){
		app = new MicroServices({
			root: TEST_SERVICE_DIR,
			environment: 'dev'
		});
		var loadedServices = app.loadServices([TEST_SERVICE_DIR]);
		app.initServices(loadedServices);
		injector = app.services['project1.service1'].injector;

		return injector
			.get('CoreHttpMessenger')
			.then(function(coreHttpMessengerInstance){
				coreHttpMessenger = coreHttpMessengerInstance;
			});
	});

	it.only('should ', function(){

		return coreHttpMessenger
			.start(messageOptions);
	});




});
