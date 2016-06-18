'use strict';

var vm = require('vm');
var istanbul = require('istanbul');
var originalRunInThisContext = vm.runInThisContext;
var through = require('through2').obj;

module.exports = function hookRunInThisContext(options) {
	var fileMap = {};
	var instrumenter = new istanbul.Instrumenter({
		coverageVariable: options.coverageVariable
	});
	global[options.coverageVariable] = global[options.coverageVariable] || {};

	vm.runInThisContext = function (_code, file) {
		var code = _code;
		if (fileMap[file]) {
			if (fileMap[file] === true) {
				instrumenter.instrument(_code, file, function (err, code) {
					var resultCode = new Buffer(code);
					fileMap[file] = resultCode.toString();
				});
			}
			code = fileMap[file];

		}
		return originalRunInThisContext(code, file);
	};

	return through(function (file, enc, cb) {
		fileMap[file.path] = true;
		return cb();
	});
}
