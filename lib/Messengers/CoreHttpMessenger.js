'use strict';

var express = require('express');
var vhost = require('vhost');
var _ = require('lodash');
var Promise = require('bluebird');

class CoreHttpMessenger extends include('CoreMessenger'){
	constructor(CoreDispatcher){
		super();
		this.dispatcher = CoreDispatcher;
		this.servers = {};
	}
	getHostApp(port, host){
		return Promise.resolve(this.getPortApp(port))
			.then(function(portApp){
				var app = express();
				app.use(function(req,res){
					res.end('hello');
				});
				portApp.use(vhost(host, app));
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
			.then(function(res){
				return res;
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
