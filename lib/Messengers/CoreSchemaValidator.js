'use strict';

class CoreSchemaValidator{
	constructor($schemas){
		this.schemas = $schemas;
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
