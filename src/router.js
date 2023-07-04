const KoaRouter = require('koa-router')
const router = new KoaRouter()
const {
  createServer,
  createUser,
  getServerStatus,
  vote,
  getTurnInfo,
  getAllUserInfo,
  turnType,
  launchTaskVote
} = require('./util')

router.get('/server/create', (ctx) => {
  const peopleCount = ctx.query.peopleCount
  if (!peopleCount) {
    ctx.body = {
      code: -1,
      msg: '参数错误'
    }
    return;
  }
  const serverId = createServer(peopleCount)
  ctx.body = {
    code: 0,
    data: {
      serverId
    }
  }
})

router.get('/user/add', (ctx) => {
  const { serverId, userName } = ctx.query
  if (!serverId || !userName) {
    ctx.body = {
      code: -1,
      msg: '参数错误'
    }
    return;
  }
  const user = createUser(userName, serverId)

  if (!user) {
    ctx.body = {
      code: -1,
      msg: '服务器不存在'
    }

    return;
  }


  ctx.body = {
    code: 0,
    data: user
  }
})

router.get('/server/status', (ctx) => {
  const data = getServerStatus()
  ctx.body = {
    code: 0,
    data,
  }
})

router.get('/user/vote', (ctx) => {
  const { userId, serverId, turn, votion, turnT } = ctx.query
  if (!userId || !serverId || !turn || !votion || !turnT) {
    ctx.body = {
      code: -1,
      msg: '参数不完整',
    }
    return;
  }
  vote(userId, turn, votion, serverId, turnT)
  ctx.body = {
    code: 0,
    data: {
      vote: 0
    }
  }
})

router.post('/task/launch', (ctx) => {
  // turnT: 任务类型，非任务轮，任务轮
  const userIds = ctx.request.body.ids
  if (!userIds) {
    ctx.body = {
      code: -1,
      msg: '参数错误'
    }
  }
  launchTaskVote(userIds)
  ctx.body = {
    code: 0,
    data: {
      msg: '任务发起成功'
    }
  }
})

router.get('/turns/info', (ctx) => {
  const serverId = ctx.query.serverId
  if (!serverId) {
    ctx.body = {
      code: -1,
      msg: '参数错误'
    }
    return;
  }
  const data = getTurnInfo(serverId)
  if (!data) {
    ctx.body = {
      code: -1,
      msg: '没有服务器id'
    }
    return;
  }
  ctx.body = {
    code: 0,
    data,
  }
})

router.get('/user/info/all', (ctx) => {
  const serverId = ctx.query.serverId
  if (!serverId) {
    ctx.body = {
      code: -1,
      msg: '参数错误'
    }
    return;
  }
  ctx.body = {
    code: 0,
    data: getAllUserInfo(serverId)
  }
})


module.exports = router