const Telegraf = require('telegraf')
const bot = new Telegraf('YOUR_TOKEN')
const axios = require('axios')
const Markup = require('telegraf/markup')
const users = require('./users')

bot.start((ctx) => {
  const username = ctx.message.from.username
  const foundUser = users.filter(user => user.usernameData === username)
  if (foundUser[0].projects.length > 1) {
    showMessageForManyProject(ctx, foundUser)
  } else {
    showMessageForOneProject(ctx, foundUser)
  }
})

function showMessageForOneProject (ctx, foundUser) {
  const nameProject = foundUser[0].projects[0].fullName
  getPipelines(ctx, nameProject)
}

function notFoundMessage (ctx) {
  return ctx.reply('Не найдено успешных пайплайнов')
}

function getPipelines (ctx, nameProject) {
  const username = ctx.update.callback_query.from.username
  const foundUser = users.filter(user => user.usernameData === username)
  const foundProject = foundUser[0].projects.filter(project => project.fullName === nameProject)
  const projectPipelinesEndpoint = foundProject[0].endpoint
  axios.get(projectPipelinesEndpoint, {
    headers: {
      'Content-Type': 'application/json',
      'Private-Token': 'YOUR_TOKEN'
    }
  }).then(res => {
    const merges = res.data
    const donePipelinesMerge = merges.filter(merge => merge.status === 'success')
    if (!donePipelinesMerge.length) {
      /* if success pipeline was not found */
      notFoundMessage(ctx)
    } else {
      /* if success pipeline was found */
      const groupBy = key => array =>
        donePipelinesMerge.reduce((objectsByKeyValue, obj) => {
          const value = obj[key]
          objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj)
          return objectsByKeyValue
        }, {})

      const groupByTitle = groupBy('ref')
      const groupByRef = groupByTitle(donePipelinesMerge)
      const arrayObjectPipeline = Object.entries(groupByRef)
      const l = arrayObjectPipeline.map(obj => {
        return {
          title: obj[1][0].ref
        }
      })
      const p = []
      p.push(l)

      p[0].map(pipeline => {
        const num = pipeline.title.substring(0, pipeline.title.indexOf('/'))
        const result = foundProject[0].link + num + '/index.html'
        console.log(result)
        return ctx.reply('<a href="' + `${result}` + `">${pipeline.title}</a>`, { parse_mode: 'HTML' })
      })
    }
  })
    .catch(error => {
      console.log(error)
    })
}

// show all projects for user with many project
function showMessageForManyProject (ctx, foundUser) {
  return ctx.reply('Выберите проект', {
    ...Markup.inlineKeyboard([
      foundUser[0].projects.map(project => Markup.callbackButton('' + project.fullName, project.fullName))
    ]).extra()
  })
}

bot.on('callback_query', (ctx) => {
  const nameProject = ctx.update.callback_query.data
  getPipelines(ctx, nameProject)
})

bot.launch()
