'use strict';

class UsersController extends include('BaseController'){
	constructor($messenger){
		super();
		this.messenger = $messenger;
	}

	getData(message){
		return {
			message: message
		};
	}

	getUsers(){
		return {
			version: 1,
			users: [
				'john',
				'nick',
				'maria'
			]
		}
	}

	getUsers2(){
		return {
			version: 2,
			users: [
				'john',
				'nick',
				'maria'
			]
		}
	}

	getUsers3(){
		return {
			version: 3,
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
	getRemoteUsers(){

		return this.messenger.send('getUsers')
			.then(function(users){
				return users;
			})

	}
	createRemoteUser(){

		return this.messenger.send('createUser', {
			params: {
				type: 'admin'
			},
			query: {
				id: 15
			},
			body: {
				name: 'john'
			},
			headers: {
				token: 'token'
			},
			cookies: {
				'session-id': '123456'
			}

		})
			.then(function(resp){
				return resp;
			})

	}
	getRemoteUsersInProc(){

		return this.messenger.send('getUsersInProc')
			.then(function(users){
				return users.body;
			})

	}

	//*ActionWhatever(message){
	//	var user = yield this.usersModel.get(message.body.id);
	//	return {
	//		user: user
	//	};
	//}
}

module.exports = UsersController;
