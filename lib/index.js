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
		this.settings = settings;
		this.services = {};
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
				console.log(filePath);
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
			var config = _.cloneDeep(this.environmentRequire(Path.join(path, 'config/config')));
			var messages = _.cloneDeep(this.environmentRequire(Path.join(path, 'messages/messages')));

			var diConfig = {
				paths: {
					'core/': __dirname
				},
				types: {
					'value': {
						'singleton': true,
						'setScope': '/',			// this defaults to scope
						'scope': '/',
						factory: 'value'
					}
				},
				factories: {
					value: [function () {
						return function Factory(module, resolvedDependencies) {
							return module.$constructor;
						}
					}]
				}
			};
			// todo: when I implement the modules I will need to also merge di options from the modules
			var diConfig = _.merge(diConfig, config.di);
			_.each(diConfig.paths, function(pathValue, pathKey){
				if(!Path.isAbsolute(pathValue)){
					diConfig.paths[pathKey] = Path.join(path, pathValue);
				}
			});

			var service = {
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
			if(!this.services[serviceName]){
				var injector = new Di(options.diConfig);
				injector.value('$app', this);
				injector.value('$config', options.config);
				injector.value('$messages', options.config);

				this.services[serviceName] = {
					options: options,
					injector: injector
				}
			}
		})
	}

	startServices(){
		var promises = _.map(this.services, function(service){
			if(!service.started){
				service.started = true;
				return service.injector.get('CoreStartup')
					.then(function(startup){
						return startup.run();
					});
			}
		});
		return Promise.all(promises);
	}

	start() {
		var servicePaths = this.findServices(this.root);
		var loadedServices = this.loadServices(servicePaths);
		this.initServices(loadedServices);
		this.startServices();

	}
}

module.exports = MicroServices;
