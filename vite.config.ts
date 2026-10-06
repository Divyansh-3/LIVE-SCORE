import { defineConfig, type Plugin, type Connect } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'

// Tiny local state relay. OBS's browser has its own storage, separate from Chrome/Edge,
// so BroadcastChannel/localStorage can't link them. This keeps ONE copy of the state
// (saved to data/state.json) and pushes changes to every open overlay via Server-Sent Events.
function api(): Plugin {
  const file = 'data/state.json'
  let state = ''
  try { state = fs.readFileSync(file, 'utf8') } catch {}
  const clients = new Set<any>()
  const mw: Connect.NextHandleFunction = (req, res, next) => {
    if (req.url === '/api/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' })
      if (state) res.write(`data: ${state}\n\n`)
      clients.add(res); req.on('close', () => clients.delete(res)); return
    }
    if (req.url === '/api/state' && req.method === 'GET') { res.setHeader('Content-Type', 'application/json'); res.end(state || 'null'); return }
    if (req.url === '/api/state' && req.method === 'POST') {
      const parts: Buffer[] = []
      req.on('data', c => parts.push(c))
      req.on('end', () => {
        state = Buffer.concat(parts).toString()
        try { fs.mkdirSync('data', { recursive: true }); fs.writeFileSync(file, state) } catch {}
        clients.forEach(c => c.write(`data: ${state}\n\n`))
        res.end('ok')
      })
      return
    }
    next()
  }
  return { name: 'state-relay', configureServer: s => { s.middlewares.use(mw) }, configurePreviewServer: s => { s.middlewares.use(mw) } }
}

export default defineConfig({ plugins: [react(), api()], server: { watch: { ignored: ['**/data/**'] } } })
