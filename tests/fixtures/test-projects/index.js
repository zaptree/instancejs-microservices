'use strict';

var Path = require('path');

// the inheritance will be reversed so children options get overriden by parent

module.exports = {
	key: 'system',	// this is required
	services: [
		{
			include: './project1/register'
		},
		{
			include: './project2/register'
		}
	]
};

