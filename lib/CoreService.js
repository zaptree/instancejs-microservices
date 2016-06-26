'use strict';

// after the refactoring this has become pretty much useless, probably will need to be removed if no use for it comes up

class CoreService {
	constructor(CoreBroker){
		this.broker = CoreBroker;
	}
	start(){
		return this.broker.start();
	}
	stop(){
		return this.broker.stop();
	}
	close(){
		return this.stop();
	}
}

module.exports = CoreService;
