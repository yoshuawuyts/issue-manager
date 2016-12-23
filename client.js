var mount = require('choo/mount')
var html = require('choo/html')
var log = require('choo-log')
var css = require('sheetify')
var choo = require('choo')

css('tachyons')

var app = choo()
app.use(log())

app.router(['/', mainView])

mount('body', app.start())

function mainView () {
  return html`
    <body>
      <head></head>
      <main>
      hello world
      </main>
    </body>
  `
}
