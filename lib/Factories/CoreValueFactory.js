'use strict';

module.exports = function(){

	/**
	 *
	 * @param module
	 * @param resolvedDependencies
	 * @returns {value}
	 */
	return function Factory(module) {
		return module.$constructor;
	};

};
