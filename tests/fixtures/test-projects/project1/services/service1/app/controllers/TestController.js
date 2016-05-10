'use strict';

class TestController extends include('BaseController'){
	constructor($messenger){
		super();
		this.messenger = $messenger;
	}

	getData(message){
		if(message.body.throws){
			throw new Error('getData forced error');
		}
		this.messenger.response.set('cookies', 'name', 'get-data');
		return {
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
			})
	}
	*generatorMethod(message){
		var result = yield Promise.resolve({msg: 'hello world'});
		return {
			msg: result.msg
		};
    }
}

module.exports = TestController;
