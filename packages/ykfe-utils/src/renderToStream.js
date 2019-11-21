const renderToStream = async (ctx, config) => {
  const baseDir = config.baseDir || process.cwd()
  const isLocal = process.env.NODE_ENV === 'development'
  const serverJs = config.serverJs
  let csr
  if (ctx.request && ctx.request.query) {
    // 兼容express和koa的query获取
    csr = ctx.request.query.csr
  }
  if (config.type !== 'ssr' || csr) {
    const renderLayout = require('yk-cli/lib/renderLayout').default
    const str = await renderLayout(ctx)
    return str
  }

  if (!global.renderToNodeStream) {
    // for this issue https://github.com/ykfe/egg-react-ssr/issues/4
    global.renderToNodeStream = require(baseDir + '/node_modules/react-dom/server').renderToNodeStream
  }

  if (isLocal) {
    // 本地开发环境下每次刷新的时候清空require服务端文件的缓存，保证服务端与客户端渲染结果一致
    delete require.cache[serverJs]
  }

  if (!global.serverStream || isLocal) {
    global.serverStream = typeof serverJs === 'string' ? require(serverJs).default : serverJs
  }

  const serverRes = await global.serverStream(ctx)
  const stream = global.renderToNodeStream(serverRes)
  return stream
}

export default renderToStream
