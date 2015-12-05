var fs = require('fs-extra');
var dirname = require('path').dirname;
var Promise = require('bluebird');
var _ = require('lodash');

var writeFile = Promise.promisify(fs.writeFile);
var ensureDir = Promise.promisify(fs.ensureDir);

function saveToDisk(filename) {
	return function(obj) {
		var data = _.isString(obj) ? obj : JSON.stringify(obj, null, 4);
		var path = dirname(filename);

		return ensureDir(path)
			.then(function() { return writeFile(filename, data); })
			.then(function() { return obj; });
	}
}

module.exports = {
	saveToDisk: saveToDisk
};
