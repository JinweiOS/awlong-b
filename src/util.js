const { v4: uuidv4 } = require('uuid')
const randomString = require('random-string');
const { parse } = require('path');
const { wsPool } = require('./socket')

const table = new Map();

const turnType = {
  nottask: 'nottask', // 非任务轮次
  task: 'task', // 任务轮次
}

function getServerId() {
  const serverId = randomString({ length: 6, letters: false })
  if (table.has(serverId)) {
    getServerId()
  } else {
    return serverId
  }
}
// 整体流程
// 1. 创建服务器，返回桌面ID
// 2. 用户创建角色，用户名称，返回用户序号
// 3. 加入桌面
// 4. 展示当前队友数据（队友名称，序号）

// 创建服务器时，需要传递本局游戏人数
function createServer(personCount) {
  const serverId = getServerId()
  table.set(serverId, {
    personCount: parseInt(personCount),
    currentTurn: 0, // 默认第0轮，后续没投完一次票，递增
    // 记录所有轮次投票数据 {1: [true, true,false]}
    // 用于辅助判断是否所有人都投票了
    voteStatus: {},
    users: {},
  });
  return serverId;
}

// 用户创建
function createUser(userName, serverId) {
  const user = {
    userId: uuidv4(),
    userName: userName,
    votion: [],
    serverId,
  }
  const server = table.get(serverId)
  if (!server) {
    return;
  }
  server.users[user.userId] = user
  // 发送事件，通知websocket
  return user
}

// votion: agreee, disagree
// turnType: 任务轮和非任务轮，'nottask', 'task'
// 轮次信息不需要，turnT不需要
function vote(userId, turn, votion, serverId, turnT) {
  const server = table.get(serverId)
  const user = server.users[userId]
  user.votion[turn] = votion
  // 轮次信息
  server.voteStatus[turn] = {
    type: turnType[turnT],
    turnsInfo: []
  }
  console.log(server.voteStatus[turn])
  server.voteStatus[turn].turnsInfo.push(votion === 'agree')
  if (server.voteStatus[turn].turnsInfo.length === server.personCount) {
    // TODO: 发送websocket，通知客户端获取投票结果
    console.log('投票结束')
    server.currentTurn++
  }
}

function getServerStatus() {
  return [...table]
}

function getTurnInfo(serverId) {
  const server = table.get(serverId)
  if (server) {
    return server.voteStatus
  }
  return null
}

function getAllUserInfo(serverId) {
  const server = table.get(serverId)
  if (!server) {
    return []
  } else {
    return Object.values(server.users)
  }
}

// 发起投票任务，userId数组
function launchTaskVote(userId) {
  if (userId) {
    userId.forEach(user => {
      wsPool.get(user).send(JSON.stringify({
        vote: true
      }))
    });
  }
}

module.exports = {
  createServer,
  createUser,
  getServerStatus,
  vote,
  getTurnInfo,
  getAllUserInfo,
  launchTaskVote,
  turnType: Object.freeze(turnType)
}