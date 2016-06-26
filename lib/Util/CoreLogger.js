'use strict';

class CoreLogger{
	constructor(){

	}
	error(error, extra){
		console.error(error.stack || error);
		console.error(extra);
	}
	info(info){
		console.log(info);
	}
}

module.exports = CoreLogger;
