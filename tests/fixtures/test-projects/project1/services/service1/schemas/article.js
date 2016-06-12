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
				title: {
					type: 'string',
					required: true
				},
				text: {
					type: 'string',
					require: true
				},
				date: {
					type: 'string'
				}
			}
		}
	}
};
