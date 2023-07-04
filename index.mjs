import Koa from 'koa'
import KoaCors from '@koa/cors'
import http from 'http'
import router from './src/router.js'
import {koaBody} from 'koa-body'
const app = new Koa();
import { initSocketServer } from './src/socket.js'
app.use(koaBody())
app.use(KoaCors())
app.use(router.routes());
app.use(router.allowedMethods());
app.use(async ctx => {
  ctx.body = 'Hello World';
});

const server = http.createServer(app.callback())
// todo: websocket init
await initSocketServer(server)
server.listen(3000, () => {
  console.log('Server running on port 3000')
});