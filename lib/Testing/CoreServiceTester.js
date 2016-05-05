'use strict';

class CoreServiceTester{
	constructor(service){
		this.service = service;
	}
	send(messageKey, message){
		return this.service.injector
			.get('CoreInProcMessenger')
			.then((inProcMessenger) =>{
				var target = {
					service: this.service.name,
					message: messageKey
				};
				return inProcMessenger.send(target , null , message);
			});
	}
}

module.exports = CoreServiceTester;
