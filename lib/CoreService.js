'use strict';

var _ = require('lodash');
var Promise = require('bluebird');

class CoreService {
	constructor($config, $app, $messages, $injector){
		this.config = $config;
		this.app = $app;
		this.messages = $messages;
		this.injector = $injector;
		this.messengers = {};
	}
	groupMessages(_messages){
		// todo, maybe I will want to clone deep the messages since I'm mutating them
		var messages = _.cloneDeep(_messages);

		var grouped = {};
		_.each(['incoming', 'outgoing'], (direction)=> {
			_.each(messages[direction], (message, key) => {
				// todo: if there is not type then we want in-proc only
				var typeKey = message.type;
				var messenger = messages.types[direction][typeKey].messenger;
				if(!grouped[messenger]){
					grouped[messenger] = {
						incoming: {},
						outgoing: {}
					};
				}
				if(!grouped[messenger][direction][typeKey]){
					var type = messages.types[direction][typeKey];
					type.messages = {};
					grouped[messenger][direction][typeKey] = type;
				}
				grouped[messenger][direction][typeKey].messages[key] = message;

			});
		});

		return grouped;
	}
	startMessenger(options, messengerName){
		return this.injector.get(messengerName)
			.then((messenger) => {
				this.messengers[messengerName] = messenger;
				return messenger.start(options);
			});
	}
	start(){
		// loop through all the mesages and if their type is a string replace it with the appropriate type
		// then group all the messages by messenger
		// for each messenger used pass in the list of messages (maybe group them by type before that)
		var groupedMessages = this.groupMessages(this.messages);

		// get all the messages, and group them by type
		// get all types and group them

		return Promise.all(_.map(groupedMessages, this.startMessenger.bind(this)));

	}
	stop(){
		var removed = [];
		var p = Promise.all(_.map(this.messengers, function(messenger, messengerName){
			removed.push(messengerName);
			return messenger.close();
		}));
		this.messengers = _.omit(this.messengers, removed);
		return p;
	}
	close(){
		this.stop();
	}
}

module.exports = CoreService;
