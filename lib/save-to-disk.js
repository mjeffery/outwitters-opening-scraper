var fs = require('fs-extra');
var Promise = require('bluebird');
var _ = require('lodash');

var ensureWrite = require('./ensure-write');

var writeFile = Promise.promisify(fs.writeFile);

module.exports = function saveToDisk(filename) {
	return function(obj) {
		var data = _.isString(obj) ? obj : JSON.stringify(obj, null, 4);

		return ensureWrite(filename)
			.then(function() { return writeFile(filename, data); })
			.then(function() { return obj; });
	}
}
