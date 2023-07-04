const { WebSocketServer } = require('ws');

function parseBuf(jBuf) {
  const jsonStr = jsonBuf.toString('utf-8');
  return JSON.parse(jsonStr);
}

// c->s 协议类型
const protocolType = {
  /**
   * {type: 'online', userId: 'xxxx'}
   */
  online: {
    desc: 'online', // 协议描述
    key: ['userId', 'type'] // 协议中包含字段
  },
}

// key: userid, value: ws
const wsPool = new Map();

async function initSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
  });

  wss.on('connection', (ws) => {
    // 将websocket链接保存连接池中
    ws.on('message', (jsonBuf) => {
      const data = parseBuf(jsonBuf)
      // 初始化逻辑
      if (data.type === protocolType.online.desc) {
        console.log('成功push')
        wsPool.set(data.userId, ws)
      }
      setInterval(() => {
        ws.send('hello')
      }, 1000)
    });
  });
}

module.exports = { initSocketServer, wsPool }
