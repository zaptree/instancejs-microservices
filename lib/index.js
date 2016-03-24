'use strict';

// modules
var Di = require('instance-di'),
	_ = require('lodash');

// core modules
var Path = require('path');

class MicroServices {
	constructor(settings) {
		// settings.root -> required
		// settings.environment -> required
		// settings.services -> require, type array
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
		_.each(servicePaths, (path) => {
			// search all the services if they have a service with the same path and skip if that is the case
			// get config values, merge the messages, load external modules, merge configurations
			var config = {};

			var service = {
				config: config,
				diConfig: {}
			};
			loadedServices[config.name] = this.services[config.name] = service;

			// todo: throw an error if duplicate config.name (not in existing ones but the ones passed in servicePaths)
		});
	}
	startServices(services){
		var servicesToLoad = services || this.services;

	}
	start() {
		var servicePaths = this.findServices(this.root);
		this.loadServices(servicePaths);
		this.startServices();

	}
}

module.exports = MicroServices;
