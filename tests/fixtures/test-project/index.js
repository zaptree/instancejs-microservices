'use strict';

var Microservices = require('microservices');

var register = require('./register');

var app = new Microservices();

app.register({
	root: __dirname,
	services: './register'
});

app.start({
	// an option that we can pass in which services we want to run should be available. If left empty it will run all of them
	scope: [
		'system.project1.users-service'
	]
});

