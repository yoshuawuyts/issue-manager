var mount = require('choo/mount')
var html = require('choo/html')
var log = require('choo-log')
var css = require('sheetify')
var choo = require('choo')
var xhr = require('xhr')

css('tachyons')

var app = choo()
app.use(log())

app.router([
  ['/', mainView],
  ['/github-success', successView]
])

mount('body', app.start())

function mainView () {
  var buttonClass = 'f6 f5-ns fw6 dib ba b--black-20 bg-blue white ph3 ph4-ns pv2 pv3-ns br2 grow no-underline pointer'
  return html`
    <body class="">
      <main class="mw6 center">
        <h1>Login</h1>
        <button onclick=${login} class=${buttonClass}>
          Continue with GitHub
        </button>
      </main>
    </body>
  `
}

function successView (state, prev, send) {
  register()
  return html`
    <body>
      <p>all good</p>
    </body>
  `
}

function register () {
  var code = window.location.href.match(/\?code=(.*)/)[1]
  var body = {
    code: code
  }
  var opts = {
    uri: '/register',
    body: body,
    json: true,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  xhr(opts, function (err, res, body) {
    if (err) return console.log(err)
    console.log(res)
  })
}

function login () {
  var url = '/login'
  xhr(url, function (err, res, body) {
    if (err) return console.log(err)

    document.body.innerHTML = body
    var url = document.querySelector('a')
    window.location = url
  })
}
