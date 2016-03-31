'use strict';

class CoreControllerFactory extends include('CoreFactory'){
	constructor(){
		return function Factory(module, resolvedDependencies) {
			var $constructor = module.$constructor;
			return new ($constructor.bind.apply($constructor, [$constructor].concat(resolvedDependencies)));
		}
	}
}

module.exports = CoreControllerFactory;
