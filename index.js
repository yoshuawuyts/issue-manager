var Auth = require('township-auth')
var request = require('request')
var bankai = require('bankai')
var merry = require('merry')
var memdb = require('memdb')
var path = require('path')

var notFound = merry.notFound

var clientPath = path.join(__dirname, 'client.js')
var assets = bankai(clientPath)

var env = merry.env({ PORT: 8080 })
var app = merry()

var db = memdb()

var auth = Auth(db, {
  providers: { github: githubProvider }
})

app.router([
  [ '/', merryAssets(assets.html.bind(assets)) ],
  [ '/bundle.js', merryAssets(assets.js.bind(assets)) ],
  [ '/bundle.css', merryAssets(assets.css.bind(assets)) ],
  [ '/register', register() ],
  [ '/logout', logout() ],
  [ '/verify', verify() ],
  [ '/404', notFound() ]
])

function register () {
  return function (req, res, ctx, done) {
    auth.create({
      github: {
        email: 'none@none.ca',
        password: '1234'
      }
    }, function (err, account) {
      if (err) return merry.error(400, 'cannot create a user account', err)
      done(null, 'ok')
    })
  }
}

function verify () {
  return function (req, res, ctx, done) {
    var url = "https://github.com/login/oauth/authorize?client_id='0fe9211b16ef295c52d9'&redirect_url=http://localhost:8080/verify"
    request(url, function (err, res, body) {
      if (err) console.log(err)
    })

    auth.verify('github', {
      email: 'none@none.ca',
      password: '1234'
    }, function (err, result) {
      if (err) return merry.error(400, 'cannot verify user account', err)
      done(null, 'verified ok')
    })
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

app.listen(env.PORT)
