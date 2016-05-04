'use strict';

// modules
var Promise = require('bluebird'),
	Di = require('instance-di'),
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
			// change all the default types to not save at root but at request
			types: {
				'root': {
					'singleton': true,
					'setScope': '/',			// this defaults to scope
					'scope': '/'
				},
				// create is the default type that gets used when not specifying a type and is an alias for static basically
				'create': {
					'singleton': true,
					'setScope': '/service/',			// this defaults to scope
					'scope': '/service/'
					// factory is not needed we use default implementation
				},
				'singleton': {
					'singleton': true,
					'setScope': '/service/',			// this defaults to scope
					'scope': '/service/'
					// factory is not needed we use default implementation
				},
				// this will be a singleton only for the scope that it was created in (i.e. when using child injectors will only be cached in the child injector it was created from)
				'scopedSingleton': {
					'singleton': true,
					'setScope': '/service/',
					// factory is not needed we use default implementation
				},
				'instance': {
					singleton: false,
					'setScope': '/service/',
					// factory: 'default' (factory defaults to default factory)
				},
				// the typeFactory is the type used for all the factory methods added in types (they can need DI also)
				'typeFactory': {
					singleton: true,
					//looseScope: true,
					'setScope': '/service/',
					scope: '/service/',
				}
			}
		});
	}

	setSettings(settings) {
		this.settings = settings;
	}

	environmentRequire(fullPath) {
		// todo: I could check if the path is absolute and if it isn't join it with settings.root
		var heirarchy = ['', this.settings.environment, 'local'];
		var result = {};

		_.each(heirarchy, function (ext) {
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
					'core/': __dirname
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
					'controller': {
						'singleton': true,
						'setScope': '/service/',
						'scope': '/service/request/',
						factory: 'CoreControllerFactory'
					},
					'messenger': {
						'singleton': true,
						'scope': '/service/',
						factory: 'CoreMessengerFactory'
					},
					'default': {
						'singleton': true,
						'scope': '/service/',
						factory: 'CoreDefaultFactory'
					},
					'global': {
						'singleton': true,
						'scope': '/'
					}
				},
				typeMatcher: {
					'controller': /Controller$/,
					'messenger': /Messenger$/,
					'default': /.*/
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
			var diConfig = _.merge(diConfig, config.di);
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
				throw new Error('Service ' + config.name + ' has already been loaded')
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
					options: options,
					injector: injector
				}
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
		this.initServices(loadedServices);
		this.injector.value('$services', this.services);
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
						return coreService.stop();
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
