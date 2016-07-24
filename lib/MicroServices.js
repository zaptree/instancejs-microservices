'use strict';

// modules
var Promise = require('bluebird'),
	Di = require('instancejs-di'),
	_ = require('lodash');

// core modules
var Path = require('path');

class MicroServices {
	constructor(settings) {
		// settings.root -> required
		// settings.environment -> required
		// settings.services -> require, type array
		this.setSettings(settings);
		this.services = {};
		this.injector = new Di({
			paths: {
				'core/': __dirname
			},
			// change all the default types to not save at root but at request
			types: {
				// Note that the typeFactory has a scope set to service thus we can't specify a custom factory here (not sure why that was done, maybe to get access to service config)
				'root': {
					'singleton': true,
					'setScope': '/',			// this defaults to scope
					'scope': '/'
				},
				//// fixme: I don't think I need any of the types not specific to the root scope specified here
				//// create is the default type that gets used when not specifying a type and is an alias for static basically
				//'create': {
				//	'singleton': true,
				//	'setScope': '/service/',			// this defaults to scope
				//	'scope': '/service/'
				//	// factory is not needed we use default implementation
				//},
				//'singleton': {
				//	'singleton': true,
				//	'setScope': '/service/',			// this defaults to scope
				//	'scope': '/service/'
				//	// factory is not needed we use default implementation
				//},
				//// this will be a singleton only for the scope that it was created in (i.e. when using child injectors will only be cached in the child injector it was created from)
				//'scopedSingleton': {
				//	'singleton': true,
				//	'setScope': '/service/',
				//	// factory is not needed we use default implementation
				//},
				//'instance': {
				//	singleton: false,
				//	'setScope': '/service/',
				//	// factory: 'default' (factory defaults to default factory)
				//},
				// the typeFactory is the type used for all the factory methods added in types (they can need DI also)
				'typeFactory': {
					singleton: true,
					//looseScope: true,
					'setScope': '/service/',
					scope: '/service/',
				}
			}
		});

		// create a global variable that can be used to store cross-service variables
		this.injector.root('$global', {});

		var CoreTester = this.injector.include('CoreTester');

		this.tester = new CoreTester();

	}

	setSettings(settings) {
		this.settings = settings;
	}

	environmentRequire(fullPath) {
		// todo: I could check if the path is absolute and if it isn't join it with settings.root

		var parts = [];
		var modifiedParts = _.map(this.settings.environment ? this.settings.environment.split('.') : null, (part)=>{
			parts.push(part);
			return parts.join('.');
		});
		var hierarchy = _.concat([''], modifiedParts, 'local');
		var result = {};

		_.each(hierarchy, function (ext) {
			var extendedPath = ext ? fullPath + '.' + ext : fullPath;
			try {
				_.merge(result, require(extendedPath));
			} catch (error) {
				// we want to throw an error if it is the original file or it is not a module_not_found error
				if (error.code !== 'MODULE_NOT_FOUND' || !ext) {
					throw error;
				}
			}
		});

		return result;

	}

	findServices(rootPath) {
		var loaded = new Set();

		// var absoluteRootPath = Path.isAbsolute(rootPath) ? rootPath : Path.join(this.settings.root, rootPath);

		var load = (path) => {
			var filePath = Path.join(path, 'index');

			var services = [];
			if (!loaded.has(filePath)) {
				loaded.add(filePath);
				var options = this.environmentRequire(filePath);
				_.each(options.services, (service) => {
					if (service.include) {
						services = services.concat(load(Path.join(path, service.include)));
					} else if (service.root) {
						services.push(Path.join(path, service.root).replace(/(\/|\\)$/, ''));
					}
				});
			}
			return services;
		};

		return _.uniq(load(rootPath));

	}

	loadServices(servicePaths) {
		// loop through each of the services add them to this.services
		var loadedServices = {};
		_.map(servicePaths, (path) => {
			// search all the services if they have a service with the same path and skip if that is the case
			// get config values, merge the messages, load external modules, merge configurations
			var config = _.merge(this.environmentRequire(Path.join(path, 'config/config')), this.settings.config);
			var messages = this.environmentRequire(Path.join(path, 'messages/messages'), this.settings.messages);

			var diConfig = {
				$scopeName: 'service',
				paths: {
					//'core/': __dirname
				},
				// I think I put the types here because they have custom factories which won't exist without th paths: ... set
				types: {
					'value': {
						'singleton': true,
						factory: 'CoreValueFactory'
					},
					'serviceValue': {
						'singleton': true,
						'scope': '/service/',
						factory: 'CoreValueFactory'
					},
					'globalValue': {
						'singleton': true,
						'scope': '/',
						factory: 'CoreValueFactory'
					},

					// controller, requestSingleton, messageSingleton (are all the same)
					'controller': {
						'singleton': true,
						'setScope': '/service/',
						'scope': '/service/request/',
						factory: 'CoreDefaultFactory'
					},
					'service': {
						'singleton': true,
						'setScope': '/service/',
						'scope': '/service/request/',
						factory: 'CoreDefaultFactory'
					},
					'requestSingleton': {
						'singleton': true,
						'setScope': '/service/',
						'scope': '/service/request/',
						factory: 'CoreDefaultFactory'
					},
					'messageSingleton': {
						'singleton': true,
						'setScope': '/service/',
						'scope': '/service/request/',
						factory: 'CoreDefaultFactory'
					},

					// default, create, singleton (are all the same)
					'messenger': {
						'singleton': true,
						'scope': '/service/',
						factory: 'CoreDefaultFactory'
					},
					'default': {
						'singleton': true,
						'scope': '/service/',
						factory: 'CoreDefaultFactory'
					},
					'create': {
						'singleton': true,
						'scope': '/service/',
						factory: 'CoreDefaultFactory'
					},
					'singleton': {
						'singleton': true,
						'scope': '/service/',
						factory: 'CoreDefaultFactory'
					},

					// this will be a singleton only for the scope that it was created in (i.e. when using child injectors will only be cached in the child injector it was created from)
					'scopedSingleton': {
						'singleton': true,
						'setScope': '/service/',
						// no scope we let that be whatever injector it was created in
						'factory': 'CoreDefaultFactory'
					},
					// instance, new
					'instance': {
						singleton: false,
						'setScope': '/service/',
						'factory': 'CoreDefaultFactory'
					},
					'component': {
						// components need
						singleton: false,
						setScope: '/service/',
						factory: 'CoreDefaultFactory'
					},
					'new': {
						singleton: false,
						'setScope': '/service/',
						'factory': 'CoreDefaultFactory'
					},
					// this is a real singleton that get's shared by all services, use with caution
					'global': {
						'singleton': true,
						'scope': '/',
						'factory': 'CoreDefaultFactory'			// todo: factories can only be created in the service or higher scope because of typeFactory settings, thus I'm not sure if this is ok
					},
					'static': {
						static: true,
						'singleton': false,
						'setScope': '/service/',
						'factory': 'CoreDefaultFactory'
					},
					'staticSingleton': {
						static: true,
						'singleton': true,
						'setScope': '/service/',
						'scope': '/service/',
						'factory': 'CoreDefaultFactory'
					}



				},
				typeMatcher: {
					'controller': /Controller$/,
					'messenger': /Messenger$/,
					'service': /Service/,
					'component': /Component/
				},
				factories: {
					// value: 'CoreValueFactory'
					/*value: [function () {
					 return function Factory(module, resolvedDependencies) {
					 return module.$constructor;
					 }
					 }]*/
				}
			};
			// todo: when I implement the modules I will need to also merge di options from the modules
			diConfig = _.merge(diConfig, config.di);
			diConfig.typeMatcher.default= /.*/;
			_.each(diConfig.paths, function (pathValue, pathKey) {
				if (!Path.isAbsolute(pathValue)) {
					diConfig.paths[pathKey] = Path.join(path, pathValue);
				}
			});

			var service = {
				path: path,
				config: config,
				messages: messages,
				diConfig: diConfig
			};
			if (loadedServices[config.name]) {
				throw new Error('Service ' + config.name + ' has already been loaded');
			}
			loadedServices[config.name] = service;

			// todo: throw an error if duplicate config.name (not in existing ones but the ones passed in servicePaths)
		});
		return loadedServices;
	}

	initServices(services) {
		_.each(services, (options, serviceName) => {
			if (!this.services[serviceName]) {
				var injector = this.injector.createChild(options.diConfig);
				injector.value('$app', this);
				injector.value('$injector', injector);
				injector.value('$config', options.config);
				injector.value('$messages', options.messages);
				injector.value('$paths', {
					root: options.path
				});

				this.services[serviceName] = {
					name: serviceName,
					options: options,
					injector: injector
				};
			}
		});
	}

	startServices(services) {
		var promises = _.map(services, function (service) {
			if (!service.running) {
				service.running = true;
				return service.injector.get('CoreService')
					.then(function (coreService) {
						return coreService.start();
					});
			}
		});
		return Promise.all(promises);
	}

	initialize(){
		var servicePaths = this.findServices(this.settings.root);
		var loadedServices = this.loadServices(servicePaths);
		this.injector.value('$services', this.services);
		this.initServices(loadedServices);
		this.tester.setServices(this.services);
	}

	start() {
		this.initialize();
		return this.startServices(this.services);

	}

	stop() {
		// todo: maybe I should also call injector.restore after service has stopped. (not that it matters if we are not use this intance anymore)
		// todo: actually this causes my unit test that uses stubs to make sure this works fail. Try to test in a different way.
		var promises = _.map(this.services, function (service) {
			if (service.running) {
				service.running = false;
				// service.injector.restore();
				return service.injector.get('CoreService')
					.then(function (coreService) {
						return coreService.close();
					});
			}
		});
		// this.injector.restore();
		return Promise.all(promises);
	}

	close() {
		this.stop();
	}
}

module.exports = MicroServices;
