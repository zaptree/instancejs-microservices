'use strict';

var _ = require('lodash');

class CoreDefaultFactory extends include('CoreBaseFactory'){
	constructor(){
		return function Factory(module, resolvedDependencies) {
			var $constructor = module.$constructor;
			if (_.isFunction($constructor)) {
				if (injector.$options.types[module.type].static) {
					return $constructor.apply($constructor, resolvedDependencies);
				}
				return new ($constructor.bind.apply($constructor, [$constructor].concat(resolvedDependencies)));
			}
			// if $constructor is not a method then it was not really a constructor but just a value
			return $constructor;
		}
	}
}

module.exports = CoreDefaultFactory;
