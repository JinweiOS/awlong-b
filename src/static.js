const Koa = require('koa')
const staticServer = new Koa()
const koaStatic = require('koa-static')

const staticPath = require('path').join(__dirname, '../upload')
console.log(staticPath)

staticServer.use(koaStatic(staticPath))

module.exports = {
    staticServer
}