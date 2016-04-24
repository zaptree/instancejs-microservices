'use strict';

var _ = require('lodash');

// this pattern is a little different since we want the injector to return the class of CoreHttpRouter and not an instance
module.exports = function () {

	var optionalParam = /\/\((.*?)\)/g,
		namedParam = /(\(\?)?:\w+/g,
		splatParam = /\*\w+/g,
		escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

	return class CoreHttpRouter {
		constructor(messages) {
			//this.messages = messages;

			var routes = [], regex, route, paramKeys;

			_.each(messages, function (message) {
				paramKeys = _.map(message.match.match(/(:\w+)|(\*\w+)/g),function(param){
					return param.replace(/^\*|:/, '');
				});
				route = ('/' + message.match.replace(/^\//, '')) // make sure that the route starts with a slash
					.replace(escapeRegExp, '\\$&')
					.replace(optionalParam, '(?:/$1)?')
					.replace(namedParam, function (match, optional) {
						// there is a scenario where we have /hello/(maybe)/world, this means that maybe might be there,
						// the optionalParam regex will have converted it so that it matches in here but it is not a real
						// named param so we just return match as is
						if(optional){
							return match;
						}else{
							//added a ? to not match query strings
							return '([^\/?]+)';
						}
					})
					.replace(splatParam, '(.*?)')
					.replace(/\/$/, '');


				regex = new RegExp('^' + route + '/?$');

				routes.push({
					paramKeys: paramKeys,
					regex: regex,
					message: message
				});
			});

			this.routes = routes;
		}

		matchUrl(request) {

			var match, matchedMessage, paramKeys, params;
			var url = request.url.replace(/\?.*/, '');
			url = '/' + (url.replace(/^\//, '').replace(/\/$/, '')) + '/';

			_.each(this.routes, function (route) {

				match = (url).match(route.regex);

				if (match) {
					if(route.message.method && route.message.method !== request.method){
						return;
					}
					if(route.message.query){
						var missing = _.find(route.message.query, (val, key) => {
							if(!request.query[key]){
								return true;
							}
						});
						if(missing){
							return;
						}
					}

					paramKeys = route.paramKeys;
					matchedMessage = route.message;
					params = match.slice(1);
					return false;
				}
			});
			if (matchedMessage) {
				return {
					message: matchedMessage,
					params: _.merge({}, _.zipObject(paramKeys, params)) 	// we do the merge to remove undefined values
				};
			}
			return false;
		}

		match(request) {
			return this.matchUrl(request);
		}
	}
};
