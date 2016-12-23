var bankai = require('bankai')
// var Github = require('github')
var merry = require('merry')
var path = require('path')

var notFound = merry.notFound

var clientPath = path.join(__dirname, 'client.js')
var assets = bankai(clientPath)
// var github = new Github()

var env = merry.env({ PORT: 8080 })
var app = merry()

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
  [ '/404', notFound() ]
])

app.listen(env.PORT)
