'use strict';

class Start {
	constructor($config, $app){
		this.config = $config;
		this.app = $app;
	}
	run(){
		console.log('running the application');
	}
}

module.exports = Start;