'use strict';

var express = require('express');
var vhost = require('vhost');
var _ = require('lodash');
var Promise = require('bluebird');
var Cookies = require('cookies');
var Url = require('url');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

// classes
var CoreHttpRouter = include('CoreHttpRouter');

class CoreHttpMessenger extends include('CoreBaseMessenger'){
	constructor(CoreHttpRouter, $injector){
		super();
		this.injector = $injector;
		this.CoreHttpRouter = CoreHttpRouter;
		this.servers = {};
		this.apps = {};
	}

	incomingResponse(response, messenger){
		var message = super.incomingResponse(response, messenger);

		// cookies are not just key, value but also have options (i.e. path)
		var cookies = {};
		_.each(messenger.options.cookies, function(args){
			cookies[args[0]] = {
				value: args[1],
				options: args[2]
			}
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
				var p = port;
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
			return res.end(404, '404 Not Found');
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
			.then(function(_response){
				// fixme: maybe I should put this in incomingResponse so it's shared by all
				var response = _.assign({
					statusCode: 200,
					// you can have multiple headers with the same name but I can't think of anything
					// other than cookies which we have separate anyway
					headers: {},
					cookies: {},
					body: {}
				}, _response);

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
	startOne(config, key){
		return this.getHostApp(config.options.port, config.options.host)
			.then((app) => {

				var router = express.Router();

				router.use(bodyParser.json());
				router.use(bodyParser.urlencoded({
					extended: true
				}));

				router.use(cookieParser());

				/*//handle static folders
				 _.each(config.staticFolders, function (filePath, urlPath) {
				 var folderPath = filePath.replace(/\{\{([^\{\}]+)\}\}/g, function (match, configKey) {
				 return config[configKey];
				 });

				 router.use(urlPath, serveStatic(path.resolve(serverConfig.rootPath, folderPath)));
				 });


				 var module = require(config.paths.core);

				 module.init(config, router);*/

				// todo: add middleware specific to the type (need to think how that will work
				var middleware = config.options.middleware;

				// todo: add staticFolders
				var httpRouter = new this.CoreHttpRouter(config.messages);
				router.use((req, res) =>{
					this.handleRequest(req, res, httpRouter);
				});

				if(['', '*', '/'].indexOf(config.options.path) > -1){
					app.use(router)
				}else{
					app.use(config.options.path,router);
				}
				return app;
			});
		/*var app = express();
		app.use(connectTimeout(serverConfig.timeout));
		return this.getServer()*/
	}
	start(messageOptions){
		return Promise.all(_.map(messageOptions.incoming, this.startOne.bind(this)));
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
