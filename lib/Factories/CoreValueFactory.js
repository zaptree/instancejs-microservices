'use strict';

class CoreValueFactory extends include('CoreBaseFactory'){
	constructor(){
		return function Factory(module, resolvedDependencies) {
			return module.$constructor;
		}
	}
}

module.exports = CoreValueFactory;
