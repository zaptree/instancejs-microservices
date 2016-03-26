'use strict';

class CoreStartup {
	constructor($config, $app, $messages){
		this.config = $config;
		this.app = $app;
		this.messages = $messages;
	}
	run(){
		// loop through all the mesages and if their type is a string replace it with the appropriate type
		// then group all the messages by messenger
		// for each messenger used pass in the list of messages (maybe group them by type before that)

		// get all the messages, and group them by type
		// get all types and group them

		console.log('running the application');
	}
}

module.exports = CoreStartup;
