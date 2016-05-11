'use strict';

class TestComponent {
	get decorators(){
		return {
			handleAction: ['switch', 'augment']
		}
	}
	switch(){
		// original function get's replaced with whatever we return here
		return function(action, message){
			if(action==='switch'){
				action='switched';
			}
			return func(action, message);
		}
	}
	augment(func){
		// original function get's replaced with whatever we return here
		return function(action, message){
			return func(action, message)
				.then(function(res){
					res.extra = 'augmented';
				});
		}
	}
	constructor(){

	}
}

module.exports = TestComponent;
