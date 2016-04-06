'use strict';

// this pattern is a little different since we want the injector to return the class of CoreHttpRouter and not an instance
module.exports = function(){
	return class CoreHttpRouter {
		constructor(config) {
			this.config = config;
		}

		route() {

		}
	}
};
