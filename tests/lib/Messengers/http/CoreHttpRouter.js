'use strict';

// modules
var Request = require('request'),
	assert = require('chai').assert,
	Promise = require('bluebird'),
	_ = require('lodash');

// core modules
var Path = require('path');

Promise.promisifyAll(Request);
var request = Promise.promisify(Request);


// project modules
var MicroServices = require('../../../../lib/MicroServices');

describe('lib/Messengers/Http/CoreHttpRouter', function () {
	var TEST_SERVICE_DIR = Path.join(__dirname, '../../../fixtures/test-projects/project1/services/service1'),
		app,
		injector,
		CoreHttpRouter;

	beforeEach(function () {
		app = new MicroServices({
			root: TEST_SERVICE_DIR,
			environment: 'dev'
		});
		var loadedServices = app.loadServices([TEST_SERVICE_DIR]);
		app.initServices(loadedServices);
		injector = app.services['project1.service1'].injector;

		return Promise
			.all([
				injector.get('CoreHttpRouter')
			])
			.spread(function (_CoreHttpRouter) {
				CoreHttpRouter = _CoreHttpRouter;
			});
	});

	it('should match the request correctly depending on the method', function(){
		var router = new CoreHttpRouter({
			'msg1': {
				action: 'controller.msg1',
				method: 'GET',
				match: '/user/(:id)'
			},
			'msg2': {
				action: 'controller.msg2',
				match: '/news/(:id)'
			},
			'msg3': {
				action: 'controller.msg3',
				method: 'POST',
				match: '/user/(:id)'
			}
		});
		var requestExpectations = [
			{
				request: {
					method: 'DELETE',
					url: '/user/14'
				},
				expectation: false
			},
			{
				request: {
					method: 'GET',
					url: '/user/14'
				},
				expectation: {
					action: 'controller.msg1',
					params: {
						id: '14'
					}
				}
			},
			{
				request: {
					method: 'DELETE',
					url: '/news/14'
				},
				expectation: {
					action: 'controller.msg2',
					params: {
						id: '14'
					}
				}
			},
			{
				request: {
					method: 'POST',
					url: '/user/14'
				},
				expectation: {
					action: 'controller.msg3',
					params: {
						id: '14'
					}
				}
			}
		];

		_.each(requestExpectations, (requestExpectation, i) => {
			var result = router.matchUrl(requestExpectation.request);
			assert.deepEqual(result, requestExpectation.expectation, 'Test ' + i + ' should pass');
		});

	});

	it('should match the request correctly depending on the query params', function(){
		var router = new CoreHttpRouter({
			'msg1': {
				action: 'controller.msg1',
				method: 'GET',
				query: {
					name: true
				},
				match: '/user/(:id)'
			},
		});
		var requestExpectations = [
			{
				request: {
					method: 'GET',
					url: '/user/14',
					query: {
					}
				},
				expectation: false
			},
			{
				request: {
					method: 'GET',
					url: '/user/14',
					query: {
						name: 'john'
					}
				},
				expectation: {
					action: 'controller.msg1',
					params: {
						id: '14'
					}
				}
			}
		];

		_.each(requestExpectations, (requestExpectation, i) => {
			var result = router.matchUrl(requestExpectation.request);
			assert.deepEqual(result, requestExpectation.expectation, 'Test ' + i + ' should pass');
		});

	});

	it('should match the request and return the correct action/params when passing it through the matchUrl', function () {
		var router = new CoreHttpRouter({
			'msg1': {
				action: 'controller.msg1',
				method: 'GET',
				match: '/user/(:id)'
			},
			'msg2': {
				action: 'controller.msg2',
				method: 'GET',
				match: '/(optional)/home/'
			},
			'msg3': {
				action: 'controller.msg3',
				method: 'GET',
				match: 'hello/(optional)/home'
			},
			'msg4': {
				action: 'controller.msg4',
				method: 'GET',
				match: 'hello/(optional)/'
			},
			'msg5': {
				action: 'controller.msg5',
				method: 'GET',
				match: 'products/(:title)/:id'
			},
			'msg6': {
				action: 'controller.msg6',
				method: 'GET',
				match: 'pages/(:id)/*url'
			},
			'msg7': {
				action: 'controller.msg7',
				method: 'GET',
				match: 'videos/:id/*url'
			},
			'msg8': {
				action: 'controller.msg8',
				method: 'GET',
				match: 'news/*title/:id'
			}
		});
		var requestExpectations = [
			{
				request: {
					method: 'GET',
					url: '/news/stocks/plummet/14'
				},
				expectation: {
					action: 'controller.msg8',
					params: {
						id: '14',
						title: 'stocks/plummet'
					}
				}
			},
			{
				request: {
					method: 'GET',
					url: '/news/stocks-plummet/14'
				},
				expectation: {
					action: 'controller.msg8',
					params: {
						id: '14',
						title: 'stocks-plummet'
					}
				}
			},
			{
				request: {
					method: 'GET',
					url: '/videos/11/hello/world/?qs1=1&qs2=2'
				},
				expectation: {
					action: 'controller.msg7',
					params: {
						id: '11',
						url: 'hello/world'
					}
				}
			},
			{
				request: {
					method: 'GET',
					url: '/videos/11/hello/world/?qs1=1&qs2=2'
				},
				expectation: {
					action: 'controller.msg7',
					params: {
						id: '11',
						url: 'hello/world'
					}
				}
			},
			{
				request: {
					method: 'GET',
					url: '/videos/11/'
				},
				expectation: {
					action: 'controller.msg7',
					params: {
						id: '11',
						url: ''
					}
				}
			},
			{
				request: {
					method: 'GET',
					url: '/pages/11/'
				},
				expectation: {
					action: 'controller.msg6',
					params: {
						id: '11',
						url: ''
					}
				}
			},
			{
				request: {
					method: 'GET',
					url: '/pages/11/whatever/else'
				},
				expectation: {
					action: 'controller.msg6',
					params: {
						id: '11',
						url: 'whatever/else'
					}
				}
			},
			{
				request: {
					method: 'GET',
					url: '/products/11'
				},
				expectation: {
					action: 'controller.msg5',
					params: {
						id: '11'
					}
				}
			},
			{
				request: {
					method: 'GET',
					url: '/products/tire/11'
				},
				expectation: {
					action: 'controller.msg5',
					params: {
						title: 'tire',
						id: '11'
					}
				}
			},
			{
				request: {
					method: 'GET',
					url: '/user/14'
				},
				expectation: {
					action: 'controller.msg1',
					params: {
						id: '14'
					}
				}
			},
			{
				request: {
					method: 'GET',
					url: '/optional/home'
				},
				expectation: {
					action: 'controller.msg2',
					params: {}
				}
			},
			{
				request: {
					method: 'GET',
					url: '/home'
				},
				expectation: {
					action: 'controller.msg2',
					params: {}
				}
			},
			{
				request: {
					method: 'GET',
					url: 'optional/home'
				},
				expectation: {
					action: 'controller.msg2',
					params: {}
				}
			},
			{
				request: {
					method: 'GET',
					url: '/hello/optional/home'
				},
				expectation: {
					action: 'controller.msg3',
					params: {}
				}
			},
			{
				request: {
					method: 'GET',
					url: '/hello/home'
				},
				expectation: {
					action: 'controller.msg3',
					params: {}
				}
			},
			{
				request: {
					method: 'GET',
					url: '/hello/home/'
				},
				expectation: {
					action: 'controller.msg3',
					params: {}
				}
			},
			{
				request: {
					method: 'GET',
					url: '/hello/optional/'
				},
				expectation: {
					action: 'controller.msg4',
					params: {}
				}
			},
			{
				request: {
					method: 'GET',
					url: '/hello'
				},
				expectation: {
					action: 'controller.msg4',
					params: {}
				}
			}
		];

		_.each(requestExpectations, (requestExpectation, i) => {
			var result = router.matchUrl(requestExpectation.request);
			assert.deepEqual(result, requestExpectation.expectation, 'Test ' + i + ' should pass');
		});
	});


});
