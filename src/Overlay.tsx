import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { cdLeft, fmtT, rgba, useNow, useRemote, type Style } from './model'

const CENTER = new Set(['btitle', 'bsub', 'cd', 'board', 'binfo'])
const FMT = { BO1: 'BEST OF 1', BO3: 'BEST OF 3', BO5: 'BEST OF 5' }

function Logo({ src, abbr, size, s }: { src: string; abbr: string; size: number; s: Style }) {
  return src
    ? <img src={src} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />
    : <div className="badge" style={{ width: size, height: size, fontSize: size * 0.34, borderColor: s.accent }}>{abbr}</div>
}

export default function Overlay() {
  const st = useRemote(), now = useNow()
  const [k, setK] = useState(1)
  useEffect(() => { const f = () => setK(Math.min(innerWidth / 1920, innerHeight / 1080)); f(); addEventListener('resize', f); return () => removeEventListener('resize', f) }, [])
  if (!st || !st.pages || !st.matches) return <div className="ovr" />
  const pid = new URLSearchParams(location.hash.slice(1)).get('page') || st.airId
  const p = st.pages.find(x => x.id === pid)
  if (!p) return <div className="ovr" />

  const mt = st.matches.find(x => x.id === (p.matchId || st.curId)) || st.matches[0], sc = p.scene, s = sc.style, L = sc.layout
  const left = cdLeft(sc.cd, now), done = left <= 0 && sc.cd.total > 0
  const col = (id: string) => (id === 'cd' ? s.scoreC : id === 'btitle' ? s.accent : s.text)
  const E = (id: string, node: ReactNode, css: CSSProperties = {}) => {
    const e = L[id]
    if (!e || e.on === false || !node) return null
    const glow = id === 'cd' ? `0 0 ${s.glow}px ${s.accent}, ` : ''
    return <div key={id} className={'el ' + id} style={{ left: e.x, top: e.y, fontSize: e.s, color: col(id), transform: CENTER.has(id) ? 'translateX(-50%)' : undefined, textShadow: `${glow}0 2px ${s.shadow / 4}px rgba(0,0,0,.85)`, ...css }}>{node}</div>
  }
  const box: CSSProperties = { background: rgba(s.panel, s.panelA), border: `${s.bw}px solid ${s.accent}`, borderRadius: s.radius, boxShadow: `0 0 ${s.glow}px ${s.accent}, 0 ${s.shadow / 2}px ${s.shadow}px rgba(0,0,0,.6)` }
  const sceneCss = { fontFamily: s.font, fontWeight: s.weight, color: s.text, letterSpacing: s.ls + 'px', opacity: s.opacity, '--accent': s.accent } as CSSProperties
  const ls = (L.board?.s || 48) * 1.4
  const blink = done ? { animation: 'blink .6s 4 alternate' } : {}

  return (
    <div className="ovr">
      <div className={'stage' + (st.anim ? '' : ' noanim')} style={{ transform: `translate(-50%,-50%) scale(${k})` }}>
        <div key={p.id} className="scene" style={sceneCss}>
          {sc.bg && <img className="abs" src={sc.bg} style={{ left: sc.bgX, top: sc.bgY, width: (1920 * sc.bgSize) / 100 }} />}
          {p.banner && L.banner && L.banner.on !== false && <img className="abs" src={p.banner} style={{ left: L.banner.x, top: L.banner.y, width: L.banner.s, height: L.banner.h, objectFit: 'cover' }} />}
          {E('btitle', p.title)}
          {E('bsub', done ? p.done : p.sub)}
          {p.showCd && E('cd', fmtT(left), blink)}
          {p.showBoard && E('board', (
            <div className="card" style={box}>
              <Logo src={mt.a.logo} abbr={mt.a.abbr} size={ls} s={s} />
              <span style={{ color: s.nameC }}>{mt.a.name}</span>
              <span key={mt.a.score + '-' + mt.b.score} className="vs pop" style={{ color: s.scoreC }}>{mt.a.score} — {mt.b.score}</span>
              <span style={{ color: s.nameC }}>{mt.b.name}</span>
              <Logo src={mt.b.logo} abbr={mt.b.abbr} size={ls} s={s} />
            </div>))}
          {p.showBoard && E('binfo', [FMT[mt.fmt], p.info, mt.tour].filter(Boolean).join(' · '))}
        </div>
      </div>
    </div>
  )
}
