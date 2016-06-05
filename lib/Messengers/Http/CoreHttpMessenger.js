'use strict';

var express = require('express');
var vhost = require('vhost');
var _ = require('lodash');
var Promise = require('bluebird');
var Cookies = require('cookies');
var Path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var serveStatic = require('serve-static');
var Request = require('request');

Promise.promisifyAll(Request);
var request = Promise.promisify(Request);

class CoreHttpMessenger extends include('CoreBaseMessenger'){
	constructor(CoreHttpRouter, $paths, $injector, CoreLogger){
		super();
		this.injector = $injector;
		this.CoreHttpRouter = CoreHttpRouter;
		this.servers = {};
		this.logger = CoreLogger;
		this.paths = $paths;
	}

	incomingResponse(response, messenger){
		var message = super.incomingResponse(response, messenger);

		// cookies are not just key, value but also have options (i.e. path)
		var cookies = {};
		_.each(messenger.options.cookies, function(args){
			cookies[args[0]] = {
				value: args[1],
				options: args[2]
			};
		});
		message.cookies = cookies;
		return message;
	}

	outgoingResponse(response){
		// fixme: when doing in-proc communication I will need to undo what was done in incommingResponse
		// fixme: I think maybe in-proc communication should completely circumvent the messengers and be it's own
		// fixme: messenger that uses the default coreMessenger stuff
		return response;
	}

	getHostApp(port, host){
		return Promise.resolve(this.getPortApp(port))
			.then((server) => {
				if(!server.domainApps[host]){
					var domainApp = express();
					server.app.use(vhost(host, domainApp));
					server.domainApps[host] = domainApp;
				}
				return server.domainApps[host];
			});
	}
	getPortApp(port){
		if(!this.servers[port]){
			var app = express();
			//app.use(function(){})

			// this will override the default error handler, we will want to use a method that will be used from here and from the domain module
			// I don't think adding the error here will work since it needs to be last in the stack
			/*app.use(function(error,req,res,next){
				res.send('ERROR YO');
				// handleError(error,req,res,{});
			});*/

			this.servers[port] = new Promise((resolve) => {
				var server = app.listen(port, () => {
					var srv = {
						app: app,
						server: server,
						domainApps: {}
					};
					this.servers[port] = srv;
					resolve(srv);
				});
			});
		}
		return this.servers[port];
	}
	handleRequest(req, res, httpRouter){
		var context = {
			method: req.method,
			url: req.url,
			headers: req.headers,
			cookies: req.cookies,
			body: req.body,
			query: req.query
		};

		var match = httpRouter.match(context);

		if(!match){
			res.status(404);
			return res.end('404 Not Found');
		}

		// I don't add method and url since those are not passed in as part of the message and are just used
		// for matching so that would break cross message type compatibility. If they are needed they can
		// be used through the injectables i.e. inject $context and get them so it's more of a hidden option
		// since it's not recommended
		var msg = {
			headers: context.headers,
			cookies: context.cookies,
			body: context.body,
			query: context.query,
			params: match.params
		};

		// I use 2 cookie middleware... this one is better for setting cookies but I also use the other for
		// getting a simple object with the cookies so that it's easier to be compatible with non-http messengers
		var $cookies = new Cookies(req, res);

		// adding some injectables that should not be used unless you don't want multi message type compatibility or
		// in-process only testing. Just adding them for flexibility although it might be best to remove them.
		var injectables = {
			$context: context,
			$request: req,
			$response: res,
			$cookies: $cookies
		};

		// dispatch will call the lifecycle stuff and dispatcher
		this.dispatch(match.message, msg, injectables)
			.then(function(response){
				// fixme: maybe I should put this in incomingResponse so it's shared by all


				_.each(response.headers, (val, header) => {
					res.set(header, val);
				});

				_.each(response.cookies, (cookie, cookieName) => {
					$cookies.set(cookieName, cookie.value, _.assign({
						path: '/'
					}, cookie.options));
				});

				if (response.statusCode) {
					res.status(response.statusCode);
				}

				// todo: depending on the type the body is if not header is set for Content-type set it
				if(_.isString(response.body)){
					if(!res.get('content-type')){
						res.set('Content-Type', 'text/html; charset=utf-8');
					}
					res.end(response.body);
				}else if(_.isObject(response.body)){
					//throw new Error();
					res.json(response.body);
				}
			});
	}
	startOne(config){
		var hasMessages = _.keys(config.messages).length > 0;
		var hasStaticFolders = _.keys(config.staticFolders).length > 0;
		if(!hasMessages && !hasStaticFolders){
			return Promise.resolve();
		}
		return this.getHostApp(config.port, config.host)
			.then((app) => {

				var router = express.Router();

				router.use(bodyParser.json());
				router.use(bodyParser.urlencoded({
					extended: true
				}));

				router.use(cookieParser());


				// todo: add middleware specific to the type (need to think how that will work
				// var middleware = config.middleware;
				if(config.middleware && config.middleware.length){
					throw new Error('need to implement middleware option');
				}


				// todo: add staticFolders

				//handle static folders
				if(hasStaticFolders){
					_.each(config.staticFolders, (filePath, urlPath) => {
						var folderPath = filePath.replace(/\{\{([^\{\}]+)\}\}/g, function (match, configKey) {
							return config[configKey];
						});

						if(folderPath.match(/^\./)){
							folderPath = Path.join(this.paths.root, folderPath);
						}

						router.use(urlPath, serveStatic(folderPath));

					});
				}







				if(hasMessages){
					var httpRouter = new this.CoreHttpRouter(config.messages);
					router.use((req, res) =>{
						this.handleRequest(req, res, httpRouter);
					});
				}


				if(!config.path || ['', '*', '/'].indexOf(config.path) > -1){
					app.use(router);
				}else{
					app.use(config.path,router);
				}
				return app;
			});
	}
	start(messageOptions){
		return Promise.all(_.map(messageOptions.incoming, this.startOne.bind(this)));
	}
	send(options, type, _message){
		var message = _message || {};
		var baseUrl = type.url || '';

		var url = baseUrl + this.CoreHttpRouter.createUrl(options, message);

		var jar = request.jar();
		var cookieUrl = url.match(/https?:\/\/[^\/]+/)[0];
		if(message.cookies && _.keys(message.cookies).length){

			_.each(message.cookies, function(val, key){
				var cookie = request.cookie(key + '=' + encodeURIComponent(val));
				jar.setCookie(cookie, cookieUrl);
			});


		}

		return request({
			url: url,
			jar: jar,
			method: options.method,
			//body: message.body,
			qs: message.query,
			headers: message.headers,
			json: message.body || true
		})
			.spread(function(response, result){
				var cookies = {};
				_.each(jar.getCookies(cookieUrl), function(cookie){
					cookies[cookie.key] = cookie.value;
				});
				return {
					headers: response.headers,
					statusCode: response.statusCode,
					cookies: cookies,
					body: result
				};
			});

	}
	stop(){
		return Promise.all(_.map(this.servers, function(server){
			return new Promise(function(resolve){
				server.server.close(function(){
					resolve();
				});
			});
		}));
	}
}

module.exports = CoreHttpMessenger;
