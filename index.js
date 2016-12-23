var basic = require('township-auth/basic')
var Auth = require('township-auth')
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
  providers: { basic: basic }
})


function createAuth (ctx) {
}



createAuth({email: 'none@none.ca', password: '1234' })

app.router([
  [ '/', function (req, res, ctx, done) {
    done(null, assets.html(req, res))
  }],
  [ '/bundle.js', function (req, res, ctx, done) {
    done(null, assets.js(req, res))
  }],
  [ '/bundle.css', function (req, res, ctx, done) {
    done(null, assets.css(req, res))
  }],
  [ '/register', function (req, res, ctx, done) {
    auth.create({
      basic: {
        email: 'none@none.ca',
        password: '1234'
      }
    }, function (err, account) {
      if (err) return merry.error(400, 'cannot create a user account', err)
      done(null, 'ok')
    })
  }],
  [ '/logout', function (req, res, ctx, done) {
    done(null, assets.js(req, res))
  }],
  [ '/verify', function (req, res, ctx, done) {
    auth.verify('basic', {
      email: 'none@none.ca',
      password: '1234'
    }, function (err, result) {
      if (err) return merry.error(400, 'cannot verify user account', err)
      done(null, 'verified ok')
    })
  }],
  [ '/404', notFound() ]
])



// /login
// get user information, send to github for verification
// receive token back

// /redirect
// redirect url given to github to redirect to

// /logout
// removes token from loca storage

// /register
// /verify

app.listen(env.PORT)
