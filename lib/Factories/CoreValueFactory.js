'use strict';

class CoreValueFactory extends include('CoreFactory'){
	constructor(){
		return function Factory(module, resolvedDependencies) {
			return module.$constructor;
		}
	}
}

module.exports = CoreValueFactory;
