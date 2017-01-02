var explain = require('explain-error')
var concat = require('concat-stream')
var qs = require('querystring')
var https = require('https')

module.exports.verify = verify
module.exports.login = login

function login (config) {
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
  var verifyOpts = {
    host: 'github.com',
    path: '/login/oauth/access_token',
    method: 'POST'
  }

  var userOpts = {
    host: 'api.github.com',
    path: '/user',
    method: 'GET',
    headers: {
      'User-Agent': 'lrlna'
    }
  }

  return function (code, cb) {
    var queryString = qs.stringify({
      client_id: config.githubClientId,
      client_secret: config.githubClientSecret,
      code: code.code
    })

    var req = https.request(verifyOpts)
    req.end(queryString)
    req.on('response', function (res) {
      _parseBody(res, function (err, obj) {
        if (err) return cb(err)
        getUser(obj, cb)
      })
    })
  }

  function getUser (token, cb) {
    var queryString = qs.stringify({
      access_token: token.access_token
    })

    var req = https.request(userOpts)
    req.end(queryString)
    req.on('response', function (res) {
      res.pipe(concat(function (buf) {
        var str = buf.toString()
        console.log(str)
        cb(null, str)
      }))
    })
  }
}

function _parseBody (res, cb) {
  res.pipe(concat({ encoding: 'string' }, function (str) {
    try {
      var obj = qs.parse(str)
    } catch (err) {
      return cb(explain(err, 'error parsing string'))
    }
    cb(null, obj)
  }))
}
