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

	handleRequest(reqJSON, messageConfig) {
		var req;

		try {
			req = JSON.parse(reqJSON);
		} catch (error) {
			return this.incomingOnErrorResponse(error);
		}

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
				Promise.resolve(this.handleRequest(req, messageConfig))
					.then(function (response) {
						callback(JSON.stringify(response));
					})
					.catch(function (error) {
						callback(JSON.stringify(this.incomingOnErrorResponse(error)));
					});

			};

		});

		var app = dnode(methods);

		return new Promise((resolve) => {
			var server = app.listen(config.port, config.host, ()=> {
				var srv = {
					app: app,
					server: server
				};
				this.global.servers[config.port] = srv;
				resolve(srv);
			});
		});
	}

	start(messageOptions) {
		return Promise.all(_.map(messageOptions.incoming, this.startOne.bind(this)));
	}

	send(messageOptions, type, _message) {
		var message = _message || {};

		return this.getClient(type)
			.then(function (client) {
				return new Promise((resolve)=> {
					client[messageOptions.match](JSON.stringify(message), function (response) {
						resolve(JSON.parse(response));

					});
				});
			});


	}

	getClient(type) {
		var clientKey = type.host + ':' + type.port;
		if (this.global.clients[clientKey]) {
			return Promise.resolve(this.global.clients[clientKey].client);
		}
		return new Promise((resolve)=> {
			var d = dnode.connect(type.port, type.host);
			d.on('remote', (client)=> {
				this.global.clients[clientKey] = {
					client: client,
					d: d
				};
				resolve(client);
			});
		});
	}

	stop() {
		return Promise
			.all([
				this.stopServers(),
				this.stopClients()
			])
			.then(()=> {
				this.global.servers = {};
				this.global.clients = {};
			});
	}

	stopServers() {
		return Promise.all(_.map(this.global.servers, (server)=> {
			return new Promise((resolve)=> {
				server.app.destroy();
				server.server.close(()=> {
					resolve();
				});
			});
		}));
	}

	stopClients() {
		// this does not need to be a promise
		return Promise.all(_.map(this.global.clients, (client)=> {
			client.d.end();
		}));
	}
}

module.exports = CoreRpcMessenger;
