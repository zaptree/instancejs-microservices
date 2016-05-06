'use strict';

class CoreServiceTester{
	constructor(service){
		this.service = service;
	}
	stub(){
		return this.service.injector.stub.apply(this.service.injector, arguments);
	}
	restore(){
		return this.service.injector.restore.apply(this.service.injector, arguments);
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
