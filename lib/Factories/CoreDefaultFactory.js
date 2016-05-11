'use strict';

var _ = require('lodash');
var Promise = require('bluebird');

function wrapGenerators(instance) {

	var props = [];
	var proto = Object.getPrototypeOf(instance);
	while (proto) {
		if (proto.hasOwnProperty('hasOwnProperty')) {
			break;
		}
		_.each(Object.getOwnPropertyNames(proto), (prop)=> {
			if (prop !== 'constructor') {
				props.push(prop);
			}
		});

		proto = Object.getPrototypeOf(proto);
	}

	//wrap any methods that are generators with the gen
	// TODO:: When val is a bool it throws error, doesn't have constructor prop.
	_.each(props, function (key) {
		try {
			var val = instance[key];
		} catch (errror) {
			console.log(errror);
		}

		if (val && val.constructor && val.constructor.name === 'GeneratorFunction') {
			instance[key] = Promise.coroutine(val);
		}

	});
	return instance;

}

function attachComponents(instance){
	if(instance.components){
		throw new Error('Looks like we have a serious issue, the factory gets created by the injector for each class or something. need to investigate. This should only happen once');
		// fixme: after I fix issue above, I should be injecting the current injector in the factory method (or can I have it as a dependency??)
		return Promise.resolve(instance);
	}
	return Promise.resolve(instance);
}

module.exports = function(){

	return function Factory(module, resolvedDependencies) {
		var $constructor = module.$constructor;
		var instance;
		if (_.isFunction($constructor)) {
			// using the global injector is not the safest option since the scope might not match what we want. In this
			// case it is probably ok unless we declare types in a child injector
			if (injector.$options.types[module.type].static) {
				return $constructor.apply($constructor, resolvedDependencies);
			}else{
				// construct might return a promise so we need to resolve that first
				return Promise.resolve(new ($constructor.bind.apply($constructor, [$constructor].concat(resolvedDependencies))))
					.then(function(instance){
						// only if the instance actually is an instance do we wrapGenerators. Since a constructor can return
						// whatever it wants such as another function we are not guaranteed it's an instance so we check
						if(!_.isFunction(instance) && _.isObject(instance)){
							instance = wrapGenerators(instance);

							return attachComponents(instance);

						}
						return instance;
					});

			}
		}
		// if $constructor is not a method then it was not really a constructor but just a value
		return $constructor;
	}

};
