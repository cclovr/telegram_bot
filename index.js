const Telegraf = require('telegraf')
const bot = new Telegraf('YOUR_TOKEN')
const axios = require('axios')

bot.start((ctx) => ctx.reply('Введите ID проекта gitlab'))

bot.on('message', (ctx) => {
  const idProject = ctx.message.text
  const regexIdProject = new RegExp(/^[0-9]+$/)
  const v = regexIdProject.test(idProject)

  if (v) {
    const projectPipelinesEndpoint = 'https://gitlab.indevlab.com/api/v4/projects/' + idProject.toString() + '/pipelines/?per_page=100'
    axios.get(projectPipelinesEndpoint, {
      headers: {
        'Content-Type': 'application/json',
        'Private-Token': 'TOKEN_GITLAB'
      }
    }).then(res => {
      const merges = res.data
      const donePipelinesMerge = merges.filter(merge => merge.status === 'success')
      const groupBy = key => array =>
        array.reduce((objectsByKeyValue, obj) => {
          const value = obj[key]
          objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj)
          return objectsByKeyValue
        }, {})

      const groupByTitle = groupBy('ref')
      const groupByRef = groupByTitle(donePipelinesMerge)
      const arrayObjectPipeline = Object.entries(groupByRef)
      const l = arrayObjectPipeline.map(obj => {
        return {
          title: obj[1][0].ref,
          link: 'https://www.google.com/'
        }
      })
      const p = []
      p.push(l)

      p[0].map(pipeline => {
        var num = parseInt(pipeline.title.replace(/\D+/g, ''))
        const result = 'dev.btm.idl.local/BM-' + num + '/index.html'
        return ctx.reply('<a href="' + `${result}` + `">${pipeline.title}</a>`, { parse_mode: 'HTML' })
      })
    })

      .catch(e => {
        console.log('Ошибка ' + e.name + ':' + e.message + '\n' + e.stack)
      })
  } else {
    ctx.reply('ID должен состоять из цифр')
  }
})

bot.launch()
