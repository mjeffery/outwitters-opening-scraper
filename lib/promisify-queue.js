var Promise = require('bluebird');
var async = require('async');
var _ = require('lodash');

module.exports = function promisifyQueue(tasks, worker, concurrency) {
	var realWorker = function(task, callback) {
		Promise.resolve(worker(task))
			.asCallback(callback);
	};

	var queue = async.queue(realWorker, concurrency);	
	var pushJob = Promise.promisify(queue.push, { context: queue });

	queue.pause();
	var promise = Promise.all(
		_.map(tasks, function(task) {
			return pushJob(task);
		})
	);
	queue.resume();

	return promise;
}

