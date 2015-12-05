var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var _ = require('lodash');

var readdir = Promise.promisify(fs.readdir);
var stat = Promise.promisify(fs.stat);

module.exports = function walkDir(dir, filterExp) {
	var filter = !_.isRegExp(filterExp) ? _.constant(true) : function(val) { return val.match(filterExp) };
	
	return readdir(dir)
		.then(function(filenames) { return _.filter(filenames, filter) })
		.then(function(filenames) {
			return Promise.all(
				_.map(filenames, function(filename) {
					var fullpath = path.join(dir, filename);
					return stat(fullpath)
						.then(function(stat) {
							return {
								filename: filename,
								stat: stat 
							};
						});
				})
			);
		})
		.then(function(files) { 
			return _(files)
				.filter(function(file) { return file.stat.isFile() })
				.pluck('filename')
				.value();
		});
}
