'use strict';

var Promise = require('bluebird');

class TestController extends include('BaseController'){
	get components(){
		return {
			testComponent: {
				component: 'TestComponent',
				options: {
					switchMethod: 'switched'
				}
			}
		};
	}
	constructor($messenger){
		super();
		// make sure promise based constructor works
		return Promise.resolve()
			.then(()=>{
				this.messenger = $messenger;
			})
			// you must not forget to return this
			.return(this);
	}

	getData(message){
		if(message.body.throws){
			throw new Error('getData forced error');
		}
		this.messenger.response.set('cookies', 'name', 'get-data');
		return message.body.respondWith || {
			message: message
		};
	}

	postDataWithSet(message){
		this.messenger.response.set('headers', 'Content-Type', 'application/xml');
		this.messenger.response.set('cookies', 'name', message.body.name);
		this.messenger.response.set('statusCode', 401);
		return '<Response><name>'+ message.body.name +'</name></Response>';
	}

	getRemote(message){
		return this.messenger.send(message.body.messageKey, message.body.messageBody)
			.then(function(response){
				response.source = 'remote';
				return response;
			});
	}
	*generatorMethod(){
		var result = yield Promise.resolve({msg: 'hello world'});
		return {
			msg: result.msg
		};
    }
	switched(){
		return {
			location: 'switched'
		};
	}
}

module.exports = TestController;
