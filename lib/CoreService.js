'use strict';

// after the refactoring this has become pretty much useless, probably will need to be removed if no use for it comes up

class CoreService {
	constructor(CoreBroker, $injector, $config){
		this.broker = CoreBroker;
		if($config.bootrap !== false){
			return $injector.get('Bootstrap')
				.then((bootstrap)=>{
					this.bootstrap = bootstrap;
				})
				.return(this);
		}

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

CoreService.$type = 'singleton';

module.exports = CoreService;
