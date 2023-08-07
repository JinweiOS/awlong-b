const axios = require('axios')

function routerInject(router) {
  router.get('/qingyunke', async (ctx) => {
    const { msg } = ctx.query
    if (!msg) {
      ctx.body = {
        code: -1,
        msg: '参数错误'
      }
      return;
    }
    const { data } = await axios.get('http://api.qingyunke.com/api.php', {
      params: {
        key: 'free',
        appid: 0,
        msg
      }
    })

    if (data.result !== 0) {
      ctx.body = {
        code: -1,
        msg: '请求失败'
      }
      return;
    }

    ctx.body = {
      code: 0,
      data: {
        msg: data.content
      }
    }
  })
}

module.exports = routerInject


