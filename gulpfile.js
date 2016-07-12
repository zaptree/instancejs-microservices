'use strict';

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var microservicesInstabul = require('./microservicesIstanbul')
var jshint = require('gulp-jshint');

var folders = {
	istanbul: ['./lib/**/*.js', 'index.js'],
	test: ['./tests/**/*.test.js'],
	lint: ['lib/**/*.js', 'tests/**/*.js', 'index.js']
};



gulp.task('test', ['lint'], function (done) {

	var istanbulOptions = {
		coverageVariable: '$$cov_' + new Date().getTime() + '$$',
		thresholds: {global: 80}
	};
	gulp.src(folders.istanbul)
		.pipe(istanbul(istanbulOptions)) // Covering files
		.pipe(microservicesInstabul(istanbulOptions))
		//.pipe(istanbul.hookRunInThisContext(istanbulOptions))
		.pipe(istanbul.hookRequire(istanbulOptions)) // Force `require` to return covered files
		.on('finish', function () {
			// this does not include subfolders so fixtures wont be considered test folder
			gulp.src(folders.test, {read: false})
				.pipe(mocha())
				.pipe(istanbul.writeReports(istanbulOptions)) // Creating the reports after tests ran
				.pipe(istanbul.enforceThresholds(istanbulOptions)) // Enforce a coverage of at least 100%
				.on('finish', done);
		});

});

gulp.task('lint', function () {
	// https://github.com/jshint/jshint/blob/master/examples/.jshintrc
	return gulp.src(folders.lint)
		.pipe(jshint()) // Covering files
		.pipe(jshint.reporter('jshint-stylish'))
		.pipe(jshint.reporter('fail'));
});

gulp.task('default', ['test']);
