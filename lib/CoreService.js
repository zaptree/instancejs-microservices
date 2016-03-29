'use strict';

var _ = require('lodash');

class CoreService {
	constructor($config, $app, $messages){
		this.config = $config;
		this.app = $app;
		this.messages = $messages;
	}
	groupMessages(_messages){
		// todo, maybe I will want to clone deep the messages since I'm mutating them
		var messages = _.cloneDeep(_messages);
		var group = (direction) =>{
			var grouped = {};
			_.each(messages[direction], (message, key) => {
				// todo: if there is not type then we want in-proc only
				var typeKey = message.type;
				var messenger = messages.types[direction][typeKey].messenger;
				if(!grouped[messenger]){
					grouped[messenger] = {};
				}
				if(!grouped[messenger][typeKey]){
					var type = messages.types[direction][typeKey];
					type.messages = {};
					grouped[messenger][typeKey] = type;
				}
				grouped[messenger][typeKey].messages[key] = message;

			});
			return grouped;
		};
		return {
			incoming: group('incoming'),
			outgoing: group('outgoing')
		}
	}
	start(){
		// loop through all the mesages and if their type is a string replace it with the appropriate type
		// then group all the messages by messenger
		// for each messenger used pass in the list of messages (maybe group them by type before that)
		var groupedMessages = this.groupMessages(this.messages);

		// get all the messages, and group them by type
		// get all types and group them

		console.log('running the application');
	}
	stop(){

	}
}

module.exports = CoreService;
