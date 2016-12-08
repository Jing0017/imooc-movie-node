var express = require('express')
var bodyParser = require('body-parser')
var multiparty = require('connect-multiparty')
var cookieSession = require('cookie-session')
var session = require('express-session')
var mongoStore = require('connect-mongo')(session)
var path = require('path')
var mongoose = require('mongoose')
var logger = require('morgan')

var port = process.env.PORT || 3000
var app = express()
var fs = require('fs')
var dbUrl = 'mongodb://localhost/imooc'

mongoose.connect(dbUrl)

// models loading
var models_path = __dirname + '/app/models'
var walk = function (path) {
  fs.readdirSync(path)
    .forEach(function (file) {
      var newPath = path + '/' + file
      var stat = fs.statSync(newPath)

      if(stat.isFile()){
        if(/(.*)\.(js|coffee)/.test(file)){
          require(newPath)
        }
      }else if(stat.isDirectory){
        walk(newPath)
      }
    })
}
walk(models_path)

//allow custom header and CORS
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

  if (req.method == 'OPTIONS') {
    res.send(200); //让options请求快速返回
  } else {
    next()
  }
})

app.set('views', './app/views/pages')
app.set('view engine', 'jade')
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(multiparty())
app.use(session({
  secret: 'imooc',
  store: new mongoStore({
    url: dbUrl,
    collection: 'sessions'
  })
}))

if ('development' === app.get('env')) {
  app.set('showStackError', true)
  app.use(logger(':method :url :status'))
  app.locals.pretty = true
  mongoose.set('debug', true)
}

require('./config/routes')(app)

app.locals.moment = require('moment')
app.use(express.static(path.join(__dirname, 'public')))
app.listen(port)

console.log('imooc start on port ' + port)
