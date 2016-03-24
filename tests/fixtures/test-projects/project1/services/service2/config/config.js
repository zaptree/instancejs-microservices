module.exports = {
	name: 'project1.service2',	// this is required and will identify the service when another service is trying to communicate in-process
	modules: [
		// a list of modules that can be attached
		'mongo-orm'
	],
	// pass any extra configurations to the di module (these extend the ones used in the core)
	// I need to think how things like factories and stuff get stored so they don't cause conflicts if multiple projects have them
	// I probably want the factories stored in the /project injector
	di: {
		paths: [
			'/app'
		]
	}
};