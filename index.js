var concat = require('concat-stream')
var qs = require('querystring')
var bankai = require('bankai')
var merry = require('merry')
var https = require('https')
var path = require('path')
var fs = require('fs')

var notFound = merry.notFound

var clientPath = path.join(__dirname, 'client.js')
var assets = bankai(clientPath)

var env = merry.env({ PORT: 8080 })
var app = merry()

var config = getConfig()

app.router([
  [ '/', merryAssets(assets.html.bind(assets)) ],
  [ '/bundle.js', merryAssets(assets.js.bind(assets)) ],
  [ '/bundle.css', merryAssets(assets.css.bind(assets)) ],
  [ '/github-success', merryAssets(assets.html.bind(assets)) ],
  [ '/register', {
    'post': register()
  }],
  [ '/login', login() ],
  [ '/404', notFound() ]
])

function register () {
  return function (req, res, ctx, done) {
    req.pipe(concat(function (buf) {
      try {
        var body = JSON.parse(buf)
      } catch (e) {
        return done(merry.error(400, 'error parsing json', e))
      }
      verify(body, done)
    }))
  }
}

function login () {
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

function merryAssets (assets) {
  return function (req, res, ctx, done) {
    done(null, assets(req, res))
  }
}

function verify (code, done) {
  var queryString = qs.stringify({
    client_id: config.access.oauth_client_id,
    client_secret: config.access.oauth_client_secret,
    code: code.code
  })

  var opts = {
    host: config.access.oauth_host,
    path: config.access.oauth_path,
    method: config.access.oauth_method,
    headers: { 'content-length': queryString.length }
  }

  var req = https.request(opts, function (response) {
    response.pipe(concat({ encoding: 'string' }, function (str) {
      try {
        var body = qs.parse(str)
      } catch (e) {
        return done(merry.error(400, 'error parsing body', e))
      }
      getUser(body, done)
    }))
  })

  req.write(queryString)
  req.end()
}

function getUser (token, done) {
  var queryString = qs.stringify({
    access_token: token.access_token
  })

  var opts = {
    host: 'api.github.com',
    path: '/user',
    method: 'GET',
    headers: { 
      'content-length': queryString.length,
      'User-Agent': 'lrlna'
    }
  } 

  var req = https.request(opts, function (response) {
    done(null, response)
  })

  req.write(queryString)
  req.end()
}

function getConfig () {
  var config = fs.readFileSync(path.join(__dirname, 'keys.json'), 'utf-8')
  return JSON.parse(config)
}

app.listen(env.PORT)
