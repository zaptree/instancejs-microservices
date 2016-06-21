'use strict';

var _ = require('lodash'),
	Promise = require('bluebird'),
	dnode = require('dnode');

// https://github.com/substack/dnode
// https://www.npmjs.com/package/dnode

class CoreRpcMessenger extends include('CoreMessenger'){
	constructor(CoreHttpRouter, $paths, CoreLogger, CoreBroker) {
		super();
		this.CoreHttpRouter = CoreHttpRouter;
		this.servers = {};
		this.logger = CoreLogger;
		this.paths = $paths;
		this.broker = CoreBroker;
	}

	getHostApp(port, host) {
		return Promise.resolve(this.getPortApp(port))
			.then((server) => {
				if (!server.domainApps[host]) {
					var domainApp = express();
					server.app.use(vhost(host, domainApp));
					server.domainApps[host] = domainApp;
				}
				return server.domainApps[host];
			});
	}

	getApp(hostname, port) {
		var uri = hostname + ':' + port;
		if (this.servers[uri]) {
			throw new Error('Error, uri ' + uri + ' is already in use');
		}

		var app = dnode({
			transform: function (s, cb) {
				cb(s.replace(/[aeiou]{2,}/, 'oo').toUpperCase())
			}
		});

		return new Promise((resolve) => {
			var server = app.listen(port, hostname, function () {
				var srv = {
					app: app,
					server: server
				};
				this.servers[port] = srv;
				resolve(srv);
			});
		});

		var server = dnodeServer.listen(5004, function () {

			callback({
				dnode: dnodeServer,
				server: server
			});
		});


	}

	handleRequest(reqJSON,  messageConfig) {
		var req;

		try{
			req = JSON.parse(reqJSON);
		}catch(error){
			return this.incomingOnErrorResponse(error);
		}

		var msg = {
			headers: req.headers || {},
			cookies: req.cookies || {},
			body: req.body || {},
			query: req.query || {},
			params: req.params || {}
		};

		// adding some injectables that should not be used unless you don't want multi message type compatibility or
		// in-process only testing. Just adding them for flexibility although it might be best to remove them.
		var injectables = {
		};

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
		if (this.servers[uri]) {
			throw new Error('Error, uri ' + uri + ' is already in use');
		}

		var methods = {};
		_.each(config.messages, (messageConfig)=>{
			// this.handleRequest(req, res, httpRouter);
			methods[messageConfig.match] = (req, callback)=> {
				Promise.resolve(this.handleRequest(req, messageConfig))
					.then(function(response){
						callback(JSON.stringify(response));
					})
					.catch(function(error){
						callback(JSON.stringify(this.incomingOnErrorResponse(error)));
					});

			}

		});

		var app = dnode(methods);

		return new Promise((resolve) => {
			var server = app.listen(config.port, config.host, ()=> {
				var srv = {
					app: app,
					server: server
				};
				this.servers[config.port] = srv;
				resolve(srv);
			});
		});
	}

	start(messageOptions) {
		return Promise.all(_.map(messageOptions.incoming, this.startOne.bind(this)));
	}

	send(options, type, _message) {
		var message = _message || {};
		var baseUrl = type.url || '';

		var url = baseUrl + this.CoreHttpRouter.createUrl(options, message);

		var jar = request.jar();
		var cookieUrl = url.match(/https?:\/\/[^\/]+/)[0];
		if (message.cookies && _.keys(message.cookies).length) {

			_.each(message.cookies, function (val, key) {
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
			.spread(function (response, result) {
				var cookies = {};
				_.each(jar.getCookies(cookieUrl), function (cookie) {
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

	stop() {
		return Promise.all(_.map(this.servers, function (server) {
			return new Promise(function (resolve) {
				server.app.destroy();
				server.server.close(function () {
					resolve();
				});
			});
		}));
	}
}

module.exports = CoreRpcMessenger;
