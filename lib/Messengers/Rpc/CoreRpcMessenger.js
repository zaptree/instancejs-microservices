'use strict';

var _ = require('lodash'),
	Promise = require('bluebird'),
	dnode = require('dnode');

// https://github.com/substack/dnode
// https://www.npmjs.com/package/dnode

class CoreRpcMessenger extends include('CoreMessenger') {
	constructor(CoreHttpRouter, $paths, CoreLogger, CoreBroker, $global) {
		super();
		this.CoreHttpRouter = CoreHttpRouter;
		this.logger = CoreLogger;
		this.paths = $paths;
		this.broker = CoreBroker;

		// we want to share the servers and clients object between all services
		$global.CoreRpcMessenger = $global.CoreRpcMessenger || {servers: {}, clients: {}};
		this.global = $global.CoreRpcMessenger;

	}

	handleRequest(req, messageConfig) {


		var msg = {
			headers: req.headers || {},
			cookies: req.cookies || {},
			body: req.body || {},
			query: req.query || {},
			params: req.params || {}
		};

		var injectables = {};

		// dispatch will call the lifecycle stuff and dispatcher
		return this.broker.dispatch(this, messageConfig, msg, injectables)
			.then(function (response) {
				return _.assign({
					statusCode: 200,
					cookies: {},
					headers: {},
					body: {}
				}, response);
			});
	}

	startOne(config) {
		var hasMessages = _.keys(config.messages).length > 0;
		if (!hasMessages) {
			return Promise.resolve();
		}
		var uri = config.host + ':' + config.port;
		if (this.global.servers[uri]) {
			throw new Error('Error, uri ' + uri + ' is already in use');
		}

		var methods = {};
		_.each(config.messages, (messageConfig)=> {
			// this.handleRequest(req, res, httpRouter);
			methods[messageConfig.match] = (req, callback)=> {
				var parsedRequest;
				Promise.resolve()
					.then(()=>{
						parsedRequest = JSON.parse(req);
						return this.handleRequest(parsedRequest, messageConfig);
					})
					.then((response)=> {
						this.logResponse(response, parsedRequest);
						callback(JSON.stringify(response));
					})
					.catch((error)=> {
						this.logger.error(error, parsedRequest);
						callback(JSON.stringify(this.incomingOnErrorResponse(error)));
					});

			};

		});

		var app = dnode(methods);

		this.global.servers[uri] = new Promise((resolve) => {
			var server = app.listen(config.port, config.host, ()=> {
				this.global.servers[uri] = {
					app: app,
					server: server
				};
				resolve(this.global.servers[uri]);
			});
		});

		return this.global.servers[uri];
	}

	start(messageOptions) {
		return Promise.all(_.map(messageOptions.incoming, this.startOne.bind(this)));
	}

	send(messageOptions, type, _message) {
		var message = _message || {};

		return this.getClient(type)
			.then(function (client) {
				return new Promise((resolve)=> {
					client.client[messageOptions.match](JSON.stringify(message), function (response) {
						resolve(JSON.parse(response));

					});
				});
			});


	}

	getClient(type) {
		var clientKey = type.host + ':' + type.port;
		if (!this.global.clients[clientKey]) {
			this.global.clients[clientKey] = new Promise((resolve)=> {
				var d = dnode.connect(type.port, type.host);
				d.on('remote', (client)=> {
					this.global.clients[clientKey] = {
						client: client,
						d: d
					};
					resolve(this.global.clients[clientKey]);
				});
			});
		}
		return Promise.resolve(this.global.clients[clientKey]);
	}

	stop() {
		return Promise
			.all([
				this.stopServers(),
				this.stopClients()
			]);
	}

	stopServers() {
		// make sure mutliple services don't try to close the same servers
		var servers = this.global.servers;
		this.global.servers = {};
		return Promise.all(_.map(servers, (server)=> {
			return new Promise((resolve)=> {
				server.app.destroy();
				server.server.close(()=> {
					resolve();
				});
			});
		}));
	}

	stopClients() {
		var clients = this.global.clients;
		this.global.clients = {};
		// this does not need to be a promise
		return Promise.all(_.map(clients, (client)=> {
			client.d.end();
		}));
	}
}

module.exports = CoreRpcMessenger;
