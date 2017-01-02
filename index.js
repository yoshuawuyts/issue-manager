var explain = require('explain-error')
var concat = require('concat-stream')
var bankai = require('bankai')
var merry = require('merry')
var path = require('path')
var fs = require('fs')

var github = require('./lib/github')

var notFound = merry.notFound

var clientPath = path.join(__dirname, 'client.js')
var assets = bankai(clientPath)

var env = merry.env({ PORT: 8080 })
var app = merry()

var config = fs.readFileSync(path.join(__dirname, 'keys.json'), 'utf8')
config = JSON.parse(config)
var githubConfig = {
  githubClientId: config.id,
  githubClientSecret: config.secret
}

app.router([
  [ '/', _merryAssets(assets.html.bind(assets)) ],
  [ '/bundle.js', _merryAssets(assets.js.bind(assets)) ],
  [ '/bundle.css', _merryAssets(assets.css.bind(assets)) ],
  [ '/github-success', _merryAssets(assets.html.bind(assets)) ],
  [ '/register', {
    'post': register(githubConfig)
  }],
  [ '/login', github.login(githubConfig) ],
  [ '/404', notFound() ]
])

app.listen(env.PORT)

function register (githubConfig) {
  var verify = github.verify(githubConfig)

  return function (req, res, ctx, done) {
    _parseJson(req, res, function (err, json) {
      if (err) return done(merry.error(400, 'error parsing JSON', err))

      verify(json, function (err) {
        if (err) {
          return done(merry.error(400, 'error verifying github response', err))
        }
        done(null, 'all is good')
      })
    })
  }
}

function _merryAssets (assets) {
  return function (req, res, ctx, done) {
    done(null, assets(req, res))
  }
}

function _parseJson (req, res, cb) {
  req.pipe(concat(function (buf) {
    try {
      var json = JSON.parse(buf)
    } catch (err) {
      return cb(explain(err, 'error parsing JSON'))
    }
    cb(null, json)
  }))
}
