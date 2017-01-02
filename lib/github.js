var explain = require('explain-error')
var concat = require('concat-stream')
var request = require('request')
var qs = require('querystring')
var assert = require('assert')
var xtend = require('xtend')
var pump = require('pump')

module.exports.verify = verify
module.exports.login = login

function login (config) {
  assert.equal(typeof config, 'object', 'github.login: config should be an object')
  assert.equal(typeof config.githubClientId, 'string', 'github.login: config.githubClientId should be a string')

  return function (req, res, ctx, done) {
    res.statusCode = 302
    var url = 'https://github.com/login?client_id=0fe9211b16ef295c52d9&amp;return_to=%2Flogin%2Foauth%2Fauthorize%3Fclient_id%3D0fe9211b16ef295c52d9'
    var body = `
      <html>
        <body>
          You are being <a href=${url}>redirected</a>.
        </body>
      </html>
    `
    done(null, body)
  }
}

function verify (config) {
  assert.equal(typeof config, 'object', 'github.verify: config should be an object')
  assert.equal(typeof config.githubClientId, 'string', 'github.verify: config.githubClientId should be a string')
  assert.equal(typeof config.githubClientSecret, 'string', 'github.verify: config.githubClientSecret should be a string')
  assert.equal(typeof config.githubApplicationName, 'string', 'github.verify: config.githubApplicationName should be a string')

  var verifyOpts = {
    uri: 'https://github.com/login/oauth/access_token',
    method: 'POST'
  }

  var userOpts = {
    uri: 'https://api.github.com/user',
    method: 'GET',
    headers: {
      'User-Agent': config.githubApplicationName
    }
  }

  return function (code, cb) {
    assert.equal(typeof code, 'object', 'github.verify: code should be a object')
    assert.equal(typeof code.code, 'string', 'github.verify: code.code should be a string')
    assert.equal(typeof cb, 'function', 'github.verify: cb should be a function')

    var opts = xtend(verifyOpts, {
      qs: {
        client_secret: config.githubClientSecret,
        client_id: config.githubClientId,
        code: code.code
      }
    })

    var req = request(opts)
    _parseBody(req, function (err, obj) {
      if (err) return cb(err)
      if (!obj) return cb(new Error('github.verify: no response body received'))
      if (!obj.access_token) return cb(new Error('github.verify: no access_token in body received'))
      getUser(obj, cb)
    })
  }

  function getUser (token, cb) {
    assert.equal(typeof token, 'object', 'github.getUser: token should be an object')
    assert.equal(typeof token.access_token, 'string', 'github.getUser: token.access_token should be a string')
    assert.equal(typeof cb, 'function', 'github.getUser: cb should be a function')

    var opts = xtend(userOpts, {
      qs: { access_token: token.access_token }
    })

    var req = request(opts)
    pump(req, concat({ encoding: 'string' }, function (str) {
      console.log('STRONK ', str)
      cb(null, str)
    }), function (err) {
      if (err) return cb(explain(err, 'pipe error'))
    })
  }
}

function _parseBody (res, cb) {
  pump(res, concat({ encoding: 'string' }, function (str) {
    try {
      var obj = qs.parse(str)
    } catch (err) {
      return cb(explain(err, 'error parsing string'))
    }
    cb(null, obj)
  }), function (err) {
    if (err) return cb(explain(err, 'pipe error'))
  })
}
