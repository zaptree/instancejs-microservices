'use strict';

class UsersController extends include('BaseController'){

	// this will attach the following components to the class Instance. components should have the ability to decorate
	// the class they are attached 2
	get components() {
		return {

		}
	}

	get decorators(){
		this.whatever;
		return [
			{
				method: ActionWhatever,		// allow for regexp to match mutliple methods ie SecureActionWhatever /^SecureAction/
				decorator: 'AwesomeDecoratorClass.decoratorMethod' // it could also be an actual method or a string with method name
			}
		]
	}

	constructor($messenger){
		super();
		this.messenger = $messenger;
	}

	getUsers(){
		return {
			users: [
				'john',
				'nick',
				'maria'
			]
		}
	}

	*ActionWhatever(message){
		var user = yield this.usersModel.get(message.body.id);
		return {
			user: user
		};
	}
}

module.exports = UsersController;
