
var dnode = require('dnode');


function createServer(callback){
	var dnodeServer = dnode({
		transform : function (s, cb) {
			cb(s.replace(/[aeiou]{2,}/, 'oo').toUpperCase())
		}
	});
	var server = dnodeServer.listen(5004, function(){

		callback({
			dnode: dnodeServer,
			server: server
		});
	});
}

function createClient(callback){
	var d = dnode.connect(5004);
	d.on('remote', function (remote) {
		console.log('remote ready');
		callback({
			client: remote,
			dnode: d
		});
	});
}


createServer(function(server){
	console.log('server ready');
	//server.dnode.destroy();
	//server.server.close(function(){
	//	createServer(function(server){
	//		console.log('created server again');
	//	})
	//});
	createClient(function(client){
		client.client.transform('beep', function(result){
			console.log('beep =>' + result);
			// calling .end will cause the next transform to not work
			client.dnode.end();
			client.client.transform('beep', function(result){
				console.log('beep =>' + result);
			});
		});
	})

});



//var server = dnode({
//	transform : function (s, cb) {
//		cb(s.replace(/[aeiou]{2,}/, 'oo').toUpperCase())
//	}
//});
//server.listen(5004, function(){
//	console.log('server ready');
//
//});
//
//
//var d = dnode.connect(5004);
//d.on('remote', function (remote) {
//	console.log('remote ready');
//	remote.transform('beep', function (s) {
//		console.log('beep => ' + s);
//		d.end();
//		server.end(function(){
//			console.log('server closed')
//		});
//	});
//});



//var dnode = require('dnode');
//var server = dnode({
//	transform : function (s, cb) {
//		cb(s.replace(/[aeiou]{2,}/, 'oo').toUpperCase())
//	}
//});
//server.listen(5004, function(){
//	console.log('server ready');
//
//});
//
//
//var d = dnode.connect(5004);
//d.on('remote', function (remote) {
//	console.log('remote ready');
//	remote.transform('beep', function (s) {
//		console.log('beep => ' + s);
//		d.end();
//		server.end(function(){
//			console.log('server closed')
//		});
//	});
//});


/*
function createServer(callback){
	const net = require('net');
	const server = net.createServer((c) => {
		// 'connection' listener
		console.log('client connected');
		c.on('end', () => {
			console.log('client disconnected');
		});
		c.write('hello\r\n');
		c.pipe(c);
	});
	server.on('error', (err) => {
		throw err;
	});
	server.listen(8124, () => {
		console.log('server bound');
		callback(server);

	});
}

function createClient(){

}

createServer(function(server){
	//createServer(function(){
	//	console.log('created server again!!!');
	//});
	server.close(function(error){
		console.log('server closed');
		createServer(function(){
			console.log('created server again!!!');
		});
	});
});*/
