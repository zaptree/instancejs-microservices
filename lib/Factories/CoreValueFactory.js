'use strict';

module.exports = function(){

	return function Factory(module, resolvedDependencies) {
		return module.$constructor;
	}

};
