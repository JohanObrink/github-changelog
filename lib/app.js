const express = require('express')
const {listReleases} = require('./releases')
const {join} = require('path')
const bodyParser = require('body-parser')
const favicon = require('serve-favicon')
const logger = require('morgan')

function createApp (options) {
  const app = express()
  app.set('views', join(__dirname, 'views'))
  app.set('view engine', 'ejs')

  app.use(favicon(join(`${process.cwd()}/public`, 'favicon.ico')))
  app.use(logger('dev'))
  app.use(bodyParser.json({ type: 'application/json' }))
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(express.static('public'))
  app.use('/styles', express.static(`${process.cwd()}/node_modules/primer-css/build`))

  app.get('/', (req, res, next) => {
    return listReleases(options)
      .then(releases => res.render('index', {releases}))
      .catch(err => next(err))
  })

  app.post('/webhook', (req, res, next) => {
    res.status(204).send()
  })

  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err = new Error('Not Found')
    err.status = 404
    next(err)
  })

  // error handler
  app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.render('error')
  })

  return app
}

module.exports = {createApp}
