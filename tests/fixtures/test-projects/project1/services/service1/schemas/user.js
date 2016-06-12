'use strict';

module.exports = {
	mode: 'filter', // strict || loose || filter(default)
	cast: false, // false(default)
	properties: {
		headers: {
			type: 'object',
			properties: {

			}
		},
		query: {
			type: 'object',
			cast: true, // everything is a string in the query when using http so we would want to cast the values
			properties: {
				id: {
					type: 'integer'
				}
			}
		},
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					required: true
				},
				email: {
					type: 'string',
					require: true
				}
			}
		}
	}
};
