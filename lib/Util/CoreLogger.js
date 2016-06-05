'use strict';

class CoreLogger{
	constructor(){

	}
	error(error){
		console.error(error.stack);
	}
	info(info){
		console.log(info);
	}
}

module.exports = CoreLogger;
