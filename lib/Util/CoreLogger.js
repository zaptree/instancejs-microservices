'use strict';

class CoreLogger{
	constructor(){

	}
	error(error){
		console.error(error.stack);
	}
	info(message){
		console.log(info);
	}
}

module.exports = CoreLogger;
