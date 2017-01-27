'use strict'

const compression = require('compression')

function compress(opts, fn) {
	if (!fn) {
		fn = opts
		opts = {}
	}
	const compressionHandler = compression(opts)
	return (req, res) => {
		return new Promise(resolve => compressionHandler(req, res, resolve))
			.then(() => fn(req, res))
	}
}

module.exports = exports = compress
