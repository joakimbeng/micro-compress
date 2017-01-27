'use strict'

import http from 'http'
import {Z_BEST_COMPRESSION} from 'zlib'
import test from 'ava'
import request from 'supertest'
import compress from '../src'

test.cb('flush', t => {
	let chunks = 0
	let resp

	function write() {
		chunks++
		if (chunks === 2) {
			return resp.end()
		}
		if (chunks > 2) {
			return chunks--
		}
		resp.write(new Buffer(1024))
		resp.flush()
	}

	const server = http.createServer(compress((req, res) => {
		resp = res
		res.setHeader('Content-Type', 'text/plain')
		res.setHeader('Content-Length', '2048')
		write()
	}))

	request(server)
		.get('/')
		.set('Accept-Encoding', 'gzip')
		.request()
		.on('response', res => {
			t.is(res.headers['content-encoding'], 'gzip')
			res.on('data', write)
			res.on('end', () => {
				t.is(chunks, 2)
				t.end()
			})
		})
		.end()
})

test.cb('zlib', t => {
	const server = http.createServer(compress({level: Z_BEST_COMPRESSION}, (req, res) => {
		res.setHeader('Content-Type', 'application/json')
		res.end(JSON.stringify({foo: 'bar'}))
	}))

	request(server)
		.get('/')
		.set('Accept-Encoding', 'gzip')
		.end((err, res) => {
			if (err) {
				return t.end()
			}
			t.is(res.headers['transfer-encoding'], 'chunked')
			t.is(res.headers.vary, 'Accept-Encoding')
			t.end()
		})
})
