'use strict';

var Promise = require('bluebird');
var _ = require('lodash');

class TestComponent {
	get decorators(){
		return {
			handleAction: ['switch', 'augment']
		};
	}
	switch(func){
		let options = this.settings.options;
		// original function get's replaced with whatever we return here
		return function(action, message){
			if(action===options.to){
				action=options.from;
			}
			return Promise.resolve(func.call(this, action, message))
				.then(function(res){
					if(_.isObject(res)){
						// if this was the first to run since it wraps the method this part will be the last to run
						res.ranFirst = 'switch';
					}
					return res;
				});
		};
	}
	augment(func){
		// original function get's replaced with whatever we return here
		return function(action, message){
			return Promise.resolve(func.call(this, action, message))
				.then(function(res){
					if(_.isObject(res)){
						res.ranFirst = 'augment';
						res.extra = 'augmented';
					}
					return res;
				});
		};
	}
	constructor(){

	}
}

module.exports = TestComponent;
