'use strict';

// the inheritance should be reversed so children options get overriden by parent

module.exports = {
	key: 'system',	// this is required
	services: [
		{
			include: './project1'
		},
		//{
		//	include: './project2'
		//}
	]
};

