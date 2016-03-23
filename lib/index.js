'use strict';

// modules
var Di = require('instance-di'),
	_ = require('lodash');

// core modules
var	Path = require('path'),
	fs = require('fs');

class MicroServices {
	constructor(settings){
		// settings.root -> required
		// settings.environment -> required
		// settings.services -> require, type array
		this.settings = settings;
	}
	environmentRequire(path){
		var heirarchy = ['', this.settings.environment, 'local'];
		var result = {};

		_.each(heirarchy, function(ext){
			var fullPath = [path, ext].join('.');
			var stats = fs.statSync(fullPath);
			if(stats){
				_.merge(result, require(fullPath));
			}
		});

	}
	findServices(path){
		var options = require(path);
		var env_options
		// recursively find all the services that exist
	}
	start(){
		var root = Path.relative(this.settings.root, this.settings.services);
		this.findServices(root);
	}
}

module.exports = MicroServices;
