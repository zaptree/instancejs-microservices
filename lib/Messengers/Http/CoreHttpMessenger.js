'use strict';

var express = require('express');
var vhost = require('vhost');
var _ = require('lodash');
var Promise = require('bluebird');

// classes
var CoreHttpRouter = include('CoreHttpRouter');

class CoreHttpMessenger extends include('CoreMessenger'){
	constructor(CoreDispatcher, CoreHttpRouter){
		super();
		this.dispatcher = CoreDispatcher;
		this.CoreHttpRouter = CoreHttpRouter;
		this.servers = {};
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
				var httpRouter = new this.CoreHttpRouter(config);
				router.use((req, res) =>{
					var controllerOptions = httpRouter.route(req);
					res.end('woot');
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
