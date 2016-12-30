var qs = require('querystring')
var Auth = require('township-auth')
var bankai = require('bankai')
var merry = require('merry')
var memdb = require('memdb')
var https = require('https')
var path = require('path')
var fs = require('fs')

var notFound = merry.notFound

var clientPath = path.join(__dirname, 'client.js')
var assets = bankai(clientPath)

var env = merry.env({ PORT: 8080 })
var app = merry()

var db = memdb()

var auth = Auth(db, {
  providers: { github: githubProvider }
})

var cors = merry.cors({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE'
})

var config = getConfig()

app.router([
  [ '/', merryAssets(assets.html.bind(assets)) ],
  [ '/bundle.js', merryAssets(assets.js.bind(assets)) ],
  [ '/bundle.css', merryAssets(assets.css.bind(assets)) ],
  [ '/register', {
    'get': register(),
    'post': register(),
    'options': register()
  }],
  [ '/login', login() ],
  [ '/logout', logout() ],
  [ '/verify', verify() ],
  [ '/404', notFound() ]
])

function register () {
  return function (req, res, ctx, done) {
    done(null, 'register')
  }
}

function verify () {
  return function (req, res, ctx, done) {
    done(null, 'verify')
  }
}

function login () {
  return function (req, res, ctx, done) {
    var queryString = qs.stringify({
      client_id: config.authorize.oauth_client_id,
      redirect_uri: config.authorize.oauth_redirect_uri
    })

    var requestOpts = {
      host: config.authorize.oauth_host,
      port: config.authorize.oauth_port,
      path: config.authorize.oauth_path,
      method: config.authorize.oauth_method,
      headers: { 'content-length': queryString.length }
    }

    var request = https.request(requestOpts, function (response) {
      done(null, response)
    })

    request.write(queryString)
    request.end()
  }
}

function logout () {
  return function (req, res, ctx, done) {
    done(null, 'logout')
  }
}

function merryAssets (assets) {
  return function (req, res, ctx, done) {
    done(null, assets(req, res))
  }
}

function notFound () {
  return function (req, res, ctx, done) {
    done(null, assets(req, res))
  }
}

function githubProvider (auth, options) {
  return {
    key: 'github.username',
    create: function (key, opts) {
      return {
        username: ''
      }
    },
    verify: function (opts, done) {
      done()
    }
  }
}

function getConfig () {
  var config = fs.readFileSync(__dirname+ '/keys.json', 'utf-8')
  return JSON.parse(config)
}

app.listen(env.PORT)
