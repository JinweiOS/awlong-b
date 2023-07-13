import Koa from 'koa'
import KoaCors from '@koa/cors'
import http from 'http'
import router from './src/router.js'
import { koaBody } from 'koa-body'
import koaMount from 'koa-mount'
import path from 'path'

// 主应用
const mainApp = new Koa()

// 子应用1: 静态服务器
import { staticServer } from './src/static.js'
// 子应用2: 阿瓦隆服务器
const app = new Koa();
import { initSocketServer } from './src/socket.js'
app.use(koaBody({
  multipart: true,
  formidable: {
    uploadDir: './upload',
    maxFieldsSize: 20 * 1024 * 1024 // 20mb
  }
}))
app.use(KoaCors())
app.use(router.routes());
app.use(router.allowedMethods());
app.use(async ctx => {
  ctx.body = 'Hello World';
});

// 挂载1
mainApp.use(koaMount('/static', staticServer))
mainApp.use(koaMount('/api', app))
const server = http.createServer(mainApp.callback())
// todo: websocket init
await initSocketServer(server)

const host = '127.0.0.1'
const realHost = '10.3.10.142'
server.listen(8000, realHost, () => {
  console.log('Server running on port 8000')
});