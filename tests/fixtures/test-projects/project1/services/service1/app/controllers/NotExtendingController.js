'use strict';

class NotExtendingController{
	getData(message){
		return {
			source: 'NotExtendingController',
			message: message
		};
	}
}

module.exports = NotExtendingController;
