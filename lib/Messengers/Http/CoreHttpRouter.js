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
			this.messages = messages;
		}

		matchUrl(request) {

			var regex, route, match, matchedMessage, paramKeys, params;
			//fixme: with what I've done with the slashes I must remove the query stirng from the url first
			var url = request.url.replace(/\?.*/, '');
			url = '/' + (url.replace(/^\//, '').replace(/\/$/, '')) + '/';

			_.each(this.messages, function (message) {
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

				// fixme: I added the / for urls that
				match = (url).match(regex);

				if (match) {
					matchedMessage = message;
					params = match.slice(1);
					return false;
				}
			});
			if (matchedMessage) {
				var action = matchedMessage.action;
				if (_.isFunction(action)) {
					action = action.apply(this, params);
				}
				/*if (_.isObject(action)) {
				 params = action.params || params;
				 action = action.path;
				 }*/
				return {
					action: action,
					params: _.merge({}, _.zipObject(paramKeys, params)) 	// we do the merge to remove undefined values
				};
			}

			return false;


		}

		match(request) {
			// todo: I need to match method
			// todo: I need to match query string params from the query object
			return this.matchUrl(request);
		}
	}
};
