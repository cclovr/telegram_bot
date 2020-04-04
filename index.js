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
      if (!donePipelinesMerge.length) {
        return ctx.reply('Не найдено успешных пайплайнов')
      } else {
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
            title: obj[1][0].ref
          }
        })
        const p = []
        p.push(l)

        p[0].map(pipeline => {
          const num = pipeline.title.substring(0, pipeline.title.indexOf('/'))
          const firstWordTask = num.substring(0, num.indexOf('-'))
          function generateUrl () {
            if (firstWordTask === 'BM') {
              return 'dev.btm.idl.local/' + num + '/index.html'
            } else if (firstWordTask === 'DOF') {
              return 'doc-dev.telemed.care/' + num + '/analyses'
            }
          }
          const result = generateUrl()
          return ctx.reply('<a href="' + `${result}` + `">${pipeline.title}</a>`, { parse_mode: 'HTML' })
        })
      }
    })
      .catch(error => {
        if (error.toString() === 'Error: Request failed with status code 404') {
          return ctx.reply('Проект с таким ID не найден')
        }
      })
  } else {
    ctx.reply('ID должен состоять из цифр')
  }
})

bot.launch()
