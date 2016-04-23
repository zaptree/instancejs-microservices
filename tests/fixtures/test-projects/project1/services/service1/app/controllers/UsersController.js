'use strict';

class UsersController extends include('BaseController'){

	// this will attach the following components to the class Instance. components should have the ability to decorate
	// the class they are attached 2
	//get components() {
	//	return {
	//
	//	}
	//}
	//
	//get decorators(){
	//	this.whatever;
	//	return [
	//		{
	//			method: ActionWhatever,		// allow for regexp to match mutliple methods ie SecureActionWhatever /^SecureAction/
	//			decorator: 'AwesomeDecoratorClass.decoratorMethod' // it could also be an actual method or a string with method name
	//		}
	//	]
	//}

	constructor($messenger){
		super();
		this.messenger = $messenger;
	}

	getUsers(message){
		return {
			users: [
				'john',
				'nick',
				'maria'
			]
		}
	}
	createUser(message){
		return {
			name: message.body.name,
			type: message.params.type,
			id: message.query.id,
			token: message.headers.token,
			sessionId: message.cookies['session-id']
		};
	}
	loginUser(message){
		this.messenger.response.set('headers', 'Content-Type', 'application/xml');
		this.messenger.response.set('cookies', 'username', message.body.username);
		this.messenger.response.set('statusCode', 401);
		return '<Response><username>'+ message.body.username +'</username></Response>';
	}

	//*ActionWhatever(message){
	//	var user = yield this.usersModel.get(message.body.id);
	//	return {
	//		user: user
	//	};
	//}
}

module.exports = UsersController;
