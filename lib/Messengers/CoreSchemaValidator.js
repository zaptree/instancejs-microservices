'use strict';

var Path = require('path');

var _ = require('lodash'),
	SchemaValidator = require('instancejs-schema-validator');

class CoreSchemaValidator{
	constructor($messages, $paths){
		this.paths = $paths;
		this.loadSchemas($messages);
	}
	loadSchemas(messages){
		var schemas = {};
		_.each(['incoming', 'outgoing'], (direction)=>{
			_.each(messages[direction], (message)=>{
				// todo: I should add the ability to add an inline schema
				if(message.schema && !schemas[message.schema]){
					var schemaOptions =  require(Path.join(this.paths.root, 'schemas', message.schema));
					var schema = new SchemaValidator(schemaOptions);
					schemas[message.schema] = schema;
				}
			});
		});

		this.schemas = schemas;

	}
	validate(schemaName, message){
		var schema = this.schemas[schemaName];

		if(schema){
			var result = schema.validate(message);
			if(!result.success){
				console.error(result);
				throw new Error('Invalid Message');
			}
			return result.data;
		}
		return message;
	}
}

module.exports = CoreSchemaValidator;
