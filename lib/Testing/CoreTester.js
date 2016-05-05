'use strict';

// we only need the class not a new instance so we do not inject
var CoreServiceTester = include('CoreServiceTester');

class CoreTester{
	// this class is not loaded through the injector so don't expect automatic injection of dependencies
	constructor(){
		this.loadedServiceTesters = {};
	}
	setServices(services){
		this.services = services;
	}
	get(service){

		if(!this.services[service]){
			throw new Error('Service ' + service + ' was not found to load ServiceTester');
		}

		if(!this.loadedServiceTesters[service]){
			this.loadedServiceTesters[service] = new CoreServiceTester(this.services[service]);
		}
		return this.loadedServiceTesters[service];
	}
}

module.exports = CoreTester;
