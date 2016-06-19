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
	constructor($broker, $message, CoreLogger){
		super();
		this.message = $message;
		this.logger = CoreLogger;
		// make sure promise based constructor works
		return Promise.resolve()
			.then(()=>{
				this.broker = $broker;
			})
			// you must not forget to return this
			.return(this);
	}

	getData(message){
		if(message.body.throws){
			throw new Error('getData forced error');
		}
		message.response.set('cookies', 'name', 'get-data');
		return message.body.respondWith || {
			message: message
		};
	}

	postDataWithSet(message){
		// message and this.message are the same thing
		message.response.set('headers', 'Content-Type', 'application/xml');
		this.message.response.set('cookies', 'name', message.body.name);
		message.response.set('statusCode', 401);
		return '<Response><name>'+ message.body.name +'</name></Response>';
	}

	getHtml(message){
		return message.body.html;
	}

	logMessage(message){
		if(message.body.passInError){
			this.logger[message.body.type](new Error(message.body.text));
		}
		this.logger[message.body.type](message.body.text);
		return {
			success: true
		};
	}

	getRemote(message){
		return this.broker.send(message.body.messageKey, message.body.messageBody)
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
