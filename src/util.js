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
    currentTurn: -1, // 默认第0轮，后续没投完一次票，递增
    currentTurnType: turnType.nottask, // 默认非任务轮次
    currentTurnPeoCount: 0,
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
  broadcastUserInfo(serverId)
  return user
}

function broadcastVoteInfo(serverId) {
  const server = table.get(serverId);
  if (server) {
    console.log('广播')
    Object.keys(server.users).forEach((userId) => {
      const ws = wsPool.get(userId);
      if (ws) {
        ws.send(JSON.stringify({
          type: 'voteinfo',
          data: server.voteStatus
        }))
      }
    })
  }
}

function broadcastUserInfo(serverId) {
  
  const server = table.get(serverId);
  if (server) {
    console.log('广播')
    Object.keys(server.users).forEach((userId) => {
      const ws = wsPool.get(userId);
      if (ws) {
        ws.send(JSON.stringify({
          type: 'useradd',
          data: Object.values(server.users)
        }))
      }
    })
  }
}

// votion: agreee, disagree
// turnType: 任务轮和非任务轮，'nottask', 'task'
// 轮次信息不需要，turnT不需要
function vote(userId, votion, serverId) {
  const server = table.get(serverId)
  const user = server.users[userId]
  const turn = server.currentTurn
  const turnT = server.currentTurnType
  user.votion[turn] = votion
  // 轮次信息
  if (!server.voteStatus[turn]) {
    server.voteStatus[turn] = {
      type: turnType[turnT],
      turnsInfo: []
    }
  }
  server.voteStatus[turn].turnsInfo.push(votion === 'agree')
  console.log(server.voteStatus[turn])
  // 如果是非任务轮次，投票结束标志为 所有人都投票了
  if (turnT === turnType.nottask) {
    if (server.voteStatus[turn].turnsInfo.length === server.personCount) {
      // TODO: 发送websocket，通知客户端获取投票结果
      console.log('非任务轮投票结束')
      broadcastVoteInfo(serverId)
    }
  } else {
    // 非任务轮投票结束标志为 所有被选中人都投票了
    if (server.voteStatus[turn].turnsInfo.length === server.personCount - 1) {
      console.log('任务轮投票结束')
      broadcastVoteInfo(serverId)
    }
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
function launchTaskVote(userIds, turnType, serverId) {
  const server = table.get(serverId)
  if (server) {
    server.currentTurnType = turnType
    if (turnType === turnType.task) {
      server.currentTurnPeoCount = userIds.length
    }
    server.currentTurn = Object.keys(server.voteStatus).length
  }
  if (userIds) {
    userIds.forEach(user => {
      if (wsPool.has(user)) {
        wsPool.get(user).send(JSON.stringify({
          vote: true
        }))
      }
    });
  }
}

function clearVotion(serverId) {
  const server = table.get(serverId)
  if (server) {
    Object.keys(server.users).forEach(userId => {
      server.users[userId].votion = []
    })
    server.currentTurn = -1
    server.voteStatus = {}
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
  turnType: Object.freeze(turnType),
  clearVotion,
  broadcastUserInfo
}