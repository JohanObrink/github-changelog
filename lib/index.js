const nconf = require('nconf')
const {createApp} = require('./app')

nconf.argv().env().file(`${process.cwd()}/config.json`)

const port = nconf.get('port')
const app = createApp(nconf.get('github'))

app.listen(port, () => console.log(`Listening on port ${port}`))
