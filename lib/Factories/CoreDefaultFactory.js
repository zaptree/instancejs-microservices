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

function attachComponents(instance, injector){
	if(instance.components){
		//throw new Error('Looks like we have a serious issue, the factory gets created by the injector for each class or something. need to investigate. This should only happen once');

		return Promise
			.all(_.map(instance.components, (settings, key)=>{
				return injector.get(settings.component)
					.then((component)=>{
						//todo: add code for the decorators
						_.each(component.decorators, (_decoratorMethods, method)=>{
							var decoratorMethods = _.isArray(_decoratorMethods) ? _decoratorMethods : [_decoratorMethods];

							for (var i = decoratorMethods.length - 1; i >= 0; i--) {
								var decoratorMethod = decoratorMethods[i];
								if(instance[method]){
									instance[method] = component[decoratorMethod](instance[method]);
								}
							}

						});
						instance[key] = component;
					})
			}))
			.return(instance);
	}
	return Promise.resolve(instance);
}

function Factory(module, resolvedDependencies, injector) {
	var $constructor = module.$constructor;
	if (_.isFunction($constructor)) {
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

						return attachComponents(instance, injector);

					}
					return instance;
				});

		}
	}
	// if $constructor is not a method then it was not really a constructor but just a value
	return $constructor;
}

module.exports = function(){
	// since we don't have any dependencies might as well put the factory outside to save some memory
	return Factory;

};
