'use strict';

var Promise = require('Bluebird');

class CoreController{
	handleAction(action, message){
		return Promise.resolve(this.before(message))
			.then((filteredMessage) =>{
				return this[action](filteredMessage);
			})
			.then((response)=>{
				return this.after(response);
			});
	}
	before(message){
		return message;
	}
	after(response){
		return response;
	}
}

module.exports = CoreController;
