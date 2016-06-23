'use strict';

var dnode = require('dnode'),
	Promise = require('bluebird');

function RpcClient(options) {
	this.options = options;
}

RpcClient.prototype.send = function (method, message) {
	return new Promise((resolve)=> {
		var d = dnode.connect(this.options.port, this.options.host);
		d.on('remote', (client)=> {
			client[method](JSON.stringify(message), function (response) {
				resolve(JSON.parse(response));
				d.end();
			});
		});
	});
};

RpcClient.prototype.stop = function(){

};

module.exports = RpcClient;
