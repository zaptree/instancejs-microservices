'use strict';

var express = require('express');
var vhost = require('vhost');
var _ = require('lodash');
var Promise = require('bluebird');
var Cookies = require('cookies');
var Url = require('url');
var bodyParser = require('body-parser');

// classes
var CoreHttpRouter = include('CoreHttpRouter');

class CoreHttpMessenger extends include('CoreBaseMessenger'){
	constructor(CoreDispatcher, CoreHttpRouter, $injector){
		super();
		this.injector = $injector;
		this.dispatcher = CoreDispatcher;
		this.CoreHttpRouter = CoreHttpRouter;
		this.servers = {};
	}

	dispatch(controllerAction, request, injectables){
		// I added the injectables that I might use for injecting things like $request, $response
		// todo: create childInjector
		// todo: use the life cycle
		// todo: think of a good lifecycle method that can be used for setting the $request $response that has access to new injector
		// todo: call the controller action, set the $messenger, $message, $request, $response,

		var split = controllerAction.split('.');
		var action = split[1];
		var controller = split[0];

		var messenger;

		// we are creating a injector that will only exist for the current request. This allows for having request singletons
		var requestInjector = this.injector.createChild({
			$scopeName: 'request'
		});

		return requestInjector.get('CoreMessenger')
			.then((coreMessenger) => {
				messenger = coreMessenger;
				// give a friendly name to the coreMessenger
				requestInjector.set('$messenger', messenger);
			})
			.then(() => {
				return this.incomingRequest(request, messenger);
			})
			.then(() => {
				// get the controller
				return requestInjector.get(controller);
			})
			.then((controller) => {
				return controller[action](request);
			})
			.then((response)=>{
				return this.incomingResponse(response, messenger);
			})
			.catch((error) => {
				return this.incomingOnErrorResponse(error);
			});
	}

	// when using in process, outgoing and incoming are the only methods that get used so they should include all the appropriate logic
	incomingRequest(request, messenger){
		// this code calls the dispatcher
		return request;
	}
	incomingOnErrorResponse(error){
		return {
			status: 500,
			body: {
				errors: [error]
			}
		};
	}
	incomingResponse(response, messenger){
		// todo: I should probably at least give some of those
		var example = {
			statusCode: 200,
			// you can have multiple headers with the same name but I can't think of anything other than cookies which we have separate anyway
			headers: {},
			cookies: {
			},
			body: {}
		};
		// here we will want to aggregate all the sets used in the messenger
		return {
			body: response
		};
	}
	outgoingRequest(request){
		// likely nothing will be needed here
		return request;
	}
	outgoingResponse(response){
		// likely nothing will be needed here
		return response;
	}
	outgoing(message){
		// this get's called when doing messenger.send('name', message);
		// aggregate all the
	}

	getHostApp(port, host){
		return Promise.resolve(this.getPortApp(port))
			.then((portApp) => {
				if(!this.servers[port][host]){
					var app = express();
					portApp.use(vhost(host, app));

					this.servers[port][host] = app;
				}

				return app;
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
				app.listen(port, () => {
					this.servers[port] = app;
					resolve(app);
				});
			});
		}
		return this.servers[port];
	}
	startOne(config, key){
		return this.getHostApp(config.options.port, config.options.host)
			.then((app) => {

				var router = express.Router();

				router.use(bodyParser.json());
				router.use(bodyParser.urlencoded({
					extended: true
				}));

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
					var context = {
						query: req.query,
						// todo: this probably will need changing to getting all cookies since it won't work with non http implementations as raw data
						cookies: new Cookies( req, res ),
						body: req.body,
						params: {},
						headers: req.headers
					};
					/*var whatever = {
						context:_.extend(URL.parse('http://' + req.headers.host + req.url,true),{
							method:req.method,
							headers:req.headers,
							body:req.body
						}),
							cookies:new Cookies( req, res ),
						request:req,
						response:res,
						config:serverConfig
					}*/

					var msg = {
						method: req.method,
						url: req.url,
						query: req.query,
						body: req.body
					};

					var match = httpRouter.match(msg);

					if(!match){
						return res.end(404, '404 Not Found');
					}

					msg.params = match.params;

					var injectables = {
						$request: req,
						$response: res
					};

					// dispatch will call the lifecycle stuff and dispatcher
					this.dispatch(match.action, msg, injectables)
						.then(function(_response){
							// fixme: maybe I should put this in incomingResponse so it's shared by all
							var response = _.assign({
								statusCode: 200,
								// you can have multiple headers with the same name but I can't think of anything other than cookies which we have separate anyway
								headers: {},
								cookies: {
								},
								body: {}
							}, _response);

							// todo: depending on the type the body is if not header is set for Content-type set it
							if(_.isString(response.body)){
								res.end(response.body);
							}else if(_.isObject(response.body)){
								res.json(response.body);
							}
						});
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
}

module.exports = CoreHttpMessenger;
