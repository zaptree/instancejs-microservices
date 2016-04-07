'use strict';

// this pattern is a little different since we want the injector to return the class of CoreHttpRouter and not an instance
module.exports = function(){
	return class CoreHttpRouter {
		constructor(config) {
			this.config = config;
		}
		matchUrl (url,mapping){
			var optionalParam = /\((.*?)\)/g,
				namedParam    = /(\(\?)?:\w+/g,
				splatParam    = /\*\w+/g,
				escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g,
				regex,route,match,requestPath,params;
			url = url.replace(/^\//,'').replace(/\/$/,'');
			_.each(mapping,function(request,path){
				route= path.replace(escapeRegExp, '\\$&')
					.replace(optionalParam, '(?:$1)?')
					.replace(namedParam, function(match, optional) {
						//todo: what is this?
						//added a ? to not match query strings
						return optional ? match : '([^\/?]+)';
					})
					.replace(splatParam, '(.*?)');
				//make sure all routes start with / regardless of how they where specified in the routes
				route = route.replace(/^\//,'').replace(/\/$/,'');

				regex = new RegExp('^' + route + '$');

				match = (url).match(regex);
				if(match){
					requestPath = request;
					params = match.slice(1);
					return false;
				}
			});

			if(_.isFunction(requestPath)){
				requestPath = requestPath.apply(this,params);
			}
			if(_.isObject(requestPath)){
				params = requestPath.params || params;
				requestPath = requestPath.path;
			}
			return requestPath ? [requestPath,params] : false;


		}
		route() {

		}
	}
};
