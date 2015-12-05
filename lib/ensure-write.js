var fs = require('fs-extra');
var dirname = require('path').dirname;
var Promise = require('bluebird');

var ensureDir = Promise.promisify(fs.ensureDir);

module.exports = function ensureWrite(filename) {
	var path = dirname(filename);
	return ensureDir(path);
};
