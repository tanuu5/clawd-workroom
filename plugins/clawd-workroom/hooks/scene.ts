// Clawd の作業部屋（62F）の背景。FLOW DESK の部屋を、窓の内側から街を見る 1 枚の SVG に描き直したもの。
// 文字列を組み立てるだけ（DOM なし・外から何も読まない）。同じ場面なら毎回同じ出力になる。
// 絵の約束：
//   - 会話が乗る中央は静かにする。街は中央で低く、端で高い。見せ場（机の Clawd）は右下。
//   - フィルタは使わない（にじみは、太くて薄い線や放射グラデーションで出す）。
//   - 動きは CSS だけ。「視差効果を減らす」設定では止まる。

export type SceneId = 'morning' | 'day' | 'sunset' | 'night' | 'rain'

export const SCENES: readonly SceneId[] = ['morning', 'day', 'sunset', 'night', 'rain']

export const SCENE_LABEL: Record<SceneId, string> = {
  morning: '朝',
  day: '昼',
  sunset: '夕暮れ',
  night: '夜',
  rain: '雨の夜',
}

type Glow = { x: number; y: number; rx: number; ry: number; color: string; peak: number }

type Palette = {
  /** 空の色：上・中ほど・地平 */
  sky: readonly [string, string, string]
  /** 地平のかすみ */
  haze: string
  hazeOpacity: number
  /** ビルの色：遠い・中ほど・手前 */
  far: string
  mid: string
  near: string
  /** 灯った窓の色と、灯っている割合 */
  lit: readonly string[]
  litRatio: number
  /** ネオンの強さ・星の強さ（0〜1） */
  neon: number
  stars: number
  /** 太陽や月の明かり */
  sun?: Glow
  clouds: number
  cloud: string
  rain: boolean
  /** 窓枠・天井・床・ラグ・机の天板 */
  frame: string
  ceiling: string
  floor: readonly [string, string]
  rug: string
  desk: string
  /** 中央を落ち着かせる暗さ・机の上のライトの強さ */
  calm: number
  lamp: number
}

// 空の色は FLOW DESK（src/scene/env.js）の時間帯の設定に合わせてある。
const PALETTES: Record<SceneId, Palette> = {
  morning: {
    sky: ['#2f5a9a', '#8aa6d2', '#f6cfae'],
    haze: '#f2c3a8',
    hazeOpacity: 0.5,
    far: '#7f93bd',
    mid: '#3c4a72',
    near: '#27304f',
    lit: ['#ffe0b8', '#b9c8ee', '#d6def5'],
    litRatio: 0.2,
    neon: 0.45,
    stars: 0,
    sun: { x: 250, y: 850, rx: 620, ry: 360, color: '#ffe2b0', peak: 0.75 },
    clouds: 0.5,
    cloud: '#f4dcd4',
    rain: false,
    frame: '#10131f',
    ceiling: '#161a29',
    floor: ['#232638', '#14161f'],
    rug: '#26386f',
    desk: '#c9b79c',
    calm: 0.36,
    lamp: 0.45,
  },
  day: {
    sky: ['#2d6cc8', '#6fa3de', '#c2d8ee'],
    haze: '#c9dcf0',
    hazeOpacity: 0.55,
    far: '#8ea6c8',
    mid: '#55688e',
    near: '#3a4a6c',
    lit: ['#8fb0dc', '#a9c4e8', '#748fbe'],
    litRatio: 0.34,
    neon: 0.3,
    stars: 0,
    sun: { x: 1150, y: 40, rx: 700, ry: 300, color: '#fff4e2', peak: 0.4 },
    clouds: 0.75,
    cloud: '#ffffff',
    rain: false,
    frame: '#111624',
    ceiling: '#191e2d',
    floor: ['#2a2c3c', '#171821'],
    rug: '#2b3f7c',
    desk: '#d4c3a8',
    calm: 0.36,
    lamp: 0.3,
  },
  sunset: {
    sky: ['#22306e', '#b85688', '#ffa266'],
    haze: '#ff9d6e',
    hazeOpacity: 0.55,
    far: '#7a4a7c',
    mid: '#2f2040',
    near: '#1c1428',
    lit: ['#ffb27a', '#ffd9a0', '#ff9ac0'],
    litRatio: 0.32,
    neon: 0.75,
    stars: 0.15,
    sun: { x: 330, y: 880, rx: 700, ry: 380, color: '#ffcf8a', peak: 0.85 },
    clouds: 0.45,
    cloud: '#ffc0a0',
    rain: false,
    frame: '#0c0a14',
    ceiling: '#120f1c',
    floor: ['#21182a', '#110d18'],
    rug: '#2a2a66',
    desk: '#c4a98f',
    calm: 0.44,
    lamp: 0.65,
  },
  night: {
    sky: ['#0b0a2a', '#1d1a52', '#4c3c7c'],
    haze: '#5a3f96',
    hazeOpacity: 0.5,
    far: '#2a2360',
    mid: '#14123a',
    near: '#0c0b22',
    lit: ['#ffd9a0', '#ffe9c4', '#ffc878', '#ff9fd0', '#cfd6ff'],
    litRatio: 0.55,
    neon: 1,
    stars: 1,
    sun: { x: 1420, y: 150, rx: 260, ry: 200, color: '#8ea0ff', peak: 0.22 },
    clouds: 0,
    cloud: '#3a3266',
    rain: false,
    frame: '#06050e',
    ceiling: '#0a0915',
    floor: ['#15132a', '#0a0914'],
    rug: '#1b2a6b',
    desk: '#b4a08a',
    calm: 0.5,
    lamp: 1,
  },
  rain: {
    sky: ['#090b16', '#1c2034', '#4a4766'],
    haze: '#55527a',
    hazeOpacity: 0.55,
    far: '#2a2c44',
    mid: '#141624',
    near: '#0b0c16',
    lit: ['#ffd9a0', '#ffe9c4', '#ffc878', '#ff9fd0'],
    litRatio: 0.46,
    neon: 0.95,
    stars: 0,
    clouds: 0.5,
    cloud: '#2e3048',
    rain: true,
    frame: '#05060c',
    ceiling: '#090a12',
    floor: ['#141624', '#090a12'],
    rug: '#1a2760',
    desk: '#a99a88',
    calm: 0.46,
    lamp: 1,
  },
}

const W = 1600
const H = 1000
/** 窓の下の枠の上端。街はここまで見える */
const SILL = 880
/** ビルの足もと（枠の裏） */
const BASE = 902
const NEON = ['#5ff0ff', '#7dffb0', '#ff5fd0', '#ffe45c'] as const
const CLAWD = '#C67D5F'
const HEADPHONE = '#f1f2f7'
const HP = '_hp'

/** 決まった種から、毎回同じ並びの乱数を返す */
function rng(seed: number): () => number {
  let a = seed >>> 0

  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const n = (v: number): string => String(Math.round(v * 10) / 10)

type Grid = { cw: number; ch: number; ww: number; wh: number; ox: number; oy: number; cols: number; rows: number }

// 窓の格子。ビルの位置をこの格子にそろえるので、窓がビルの端で切れない。
const GRID_MID: Grid = { cw: 11, ch: 14, ww: 6, wh: 8, ox: 2.5, oy: 3, cols: 9, rows: 10 }
const GRID_NEAR: Grid = { cw: 17, ch: 21, ww: 10, wh: 13, ox: 3.5, oy: 4, cols: 7, rows: 8 }

type Building = {
  x: number
  y: number
  w: number
  pattern: number
  neonColor?: number
  neonEdge?: 'l' | 'r'
  neonRoof?: boolean
}

type City = { far: Building[]; mid: Building[]; near: Building[] }

/** 街の形。どの時間帯でも同じ（色と灯りだけが変わる） */
function buildCity(): City {
  const r = rng(6202)
  const edgeOf = (cx: number): number => Math.min(1, Math.abs(cx - W / 2) / (W / 2))
  const far: Building[] = []
  const mid: Building[] = []
  const near: Building[] = []

  for (let x = -30; x < W + 20; ) {
    const w = 44 + r() * 72
    const h = 210 + r() * 300 + edgeOf(x + w / 2) * 130

    far.push({ x, y: BASE - h, w, pattern: 0 })
    x += w + (r() < 0.35 ? r() * 26 : -4)
  }

  for (let col = -2; col * GRID_MID.cw < W + 10; ) {
    const isTower = r() < 0.24
    const cells = isTower ? 5 + Math.floor(r() * 3) : 6 + Math.floor(r() * 7)
    const x = col * GRID_MID.cw
    const w = cells * GRID_MID.cw
    const edge = edgeOf(x + w / 2)
    let h = 190 + 330 * Math.pow(edge, 1.3) * (0.55 + 0.45 * r()) + r() * 140

    if (isTower) h += 110 + r() * 150 * (0.4 + edge)

    const y = Math.max(84, Math.floor((BASE - h) / GRID_MID.ch) * GRID_MID.ch)
    const b: Building = { x, y, w, pattern: Math.floor(r() * 3) }

    if (isTower || r() < 0.16) {
      b.neonColor = Math.floor(r() * NEON.length)
      b.neonEdge = r() < 0.5 ? 'l' : 'r'
      b.neonRoof = r() < 0.5
    }

    mid.push(b)
    col += cells + (r() < 0.3 ? Math.floor(r() * 3) : 0)
  }

  for (let col = -1; col * GRID_NEAR.cw < W + 10; ) {
    const cells = 7 + Math.floor(r() * 6)
    const x = col * GRID_NEAR.cw
    const w = cells * GRID_NEAR.cw
    const edge = edgeOf(x + w / 2)
    const h = 84 + 270 * Math.pow(edge, 1.5) * (0.6 + 0.4 * r()) + r() * 80
    const y = Math.floor((BASE - h) / GRID_NEAR.ch) * GRID_NEAR.ch
    const b: Building = { x, y, w, pattern: Math.floor(r() * 2) }

    if (r() < 0.55) {
      b.neonColor = Math.floor(r() * NEON.length)
      b.neonRoof = true
    }

    near.push(b)
    col += cells + Math.floor(r() * 4)
  }

  return { far, mid, near }
}

const CITY = buildCity()

/** 窓の模様（タイル）。階ごとに灯りの多さを変えて、同じ模様の繰り返しに見えにくくする */
function windowPattern(id: string, g: Grid, seed: number, p: Palette): string {
  const r = rng(seed)
  const paths: string[] = p.lit.map(() => '')
  const dim: string[] = p.lit.map(() => '')

  for (let row = 0; row < g.rows; row++) {
    const floor = p.litRatio * (0.35 + 1.3 * r())

    for (let col = 0; col < g.cols; col++) {
      if (r() >= floor) continue

      const c = Math.floor(r() * p.lit.length)
      const d = `M${n(col * g.cw + g.ox)} ${n(row * g.ch + g.oy)}h${g.ww}v${g.wh}h-${g.ww}z`

      if (r() < 0.6) paths[c] += d
      else dim[c] += d
    }
  }

  const body = p.lit
    .map(
      (color, i) =>
        (paths[i] === '' ? '' : `<path d="${paths[i]}" fill="${color}"/>`) +
        (dim[i] === '' ? '' : `<path d="${dim[i]}" fill="${color}" opacity=".55"/>`),
    )
    .join('')

  return `<pattern id="${id}" width="${g.cols * g.cw}" height="${g.rows * g.ch}" patternUnits="userSpaceOnUse">${body}</pattern>`
}

function soft(id: string, color: string, peak: number): string {
  return `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${peak}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`
}

function defs(p: Palette): string {
  return [
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2=".8"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset=".55" stop-color="${p.sky[1]}"/><stop offset="1" stop-color="${p.sky[2]}"/></linearGradient>`,
    `<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.haze}" stop-opacity="0"/><stop offset="1" stop-color="${p.haze}" stop-opacity="${p.hazeOpacity}"/></linearGradient>`,
    `<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.floor[0]}"/><stop offset="1" stop-color="${p.floor[1]}"/></linearGradient>`,
    `<linearGradient id="led" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5ff0ff" stop-opacity=".55"/><stop offset="1" stop-color="#5ff0ff" stop-opacity="0"/></linearGradient>`,
    `<radialGradient id="calm"><stop offset="0" stop-color="#05040f" stop-opacity="${p.calm}"/><stop offset=".55" stop-color="#05040f" stop-opacity="${n(p.calm * 0.72)}"/><stop offset="1" stop-color="#05040f" stop-opacity="0"/></radialGradient>`,
    `<radialGradient id="orb" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#f8ffb0"/><stop offset=".55" stop-color="#b9dc4c"/><stop offset="1" stop-color="#5f7d24"/></radialGradient>`,
    p.sun === undefined ? '' : soft('sun', p.sun.color, p.sun.peak),
    soft('lamp', '#fff1cf', 0.5 * p.lamp),
    soft('cloud', p.cloud, 0.5),
    soft('orbGlow', '#d8ff6a', 0.35),
    soft('warm', '#ffb060', 0.4),
    windowPattern('wm0', GRID_MID, 11, p),
    windowPattern('wm1', GRID_MID, 23, p),
    windowPattern('wm2', GRID_MID, 37, p),
    windowPattern('wn0', GRID_NEAR, 53, p),
    windowPattern('wn1', GRID_NEAR, 71, p),
    p.rain
      ? `<pattern id="rn" width="120" height="240" patternUnits="userSpaceOnUse"><path d="M20 6l-7 28M74 60l-9 36M106 130l-6 24M44 150l-9 36M8 204l-6 24M90 8l-5 20M58 214l-6 24" stroke="#cfd8ff" stroke-width="1.4" stroke-linecap="round" opacity=".42" fill="none"/></pattern>` +
        `<pattern id="rn2" width="90" height="180" patternUnits="userSpaceOnUse"><path d="M12 10l-4 16M50 70l-5 20M78 120l-4 16M30 140l-5 20M66 20l-3 12" stroke="#b9c4f0" stroke-width="1" stroke-linecap="round" opacity=".32" fill="none"/></pattern>`
      : '',
  ].join('')
}

const STYLE = [
  '.tw{animation:tw 41s steps(1) infinite}',
  '.st{animation:st 5s ease-in-out infinite alternate}',
  '.ne{animation:ne 7s ease-in-out infinite alternate}',
  '.pl{animation:fly 150s linear infinite,bl 1.6s steps(1) infinite}',
  '.as{animation:drift 90s ease-in-out infinite alternate}',
  '.cl{animation:drift 140s ease-in-out infinite alternate}',
  '.r1{animation:rain 1.5s linear infinite}',
  '.r2{animation:rain2 2.3s linear infinite}',
  '.dr{animation:drip 13s ease-in infinite}',
  '.ho{animation:float 7s ease-in-out infinite alternate}',
  '.cu{animation:bl 1.1s steps(1) infinite}',
  '.eq{transform-box:fill-box;transform-origin:50% 100%;animation:eq 1.1s ease-in-out infinite alternate}',
  '.rg{animation:ring 60s linear infinite}',
  '.nx{animation:nx 3.7s steps(1) infinite}',
  '.ra{transform-box:view-box;transform-origin:1505px 852px;animation:sway 9s ease-in-out infinite alternate}',
  '.aL{transform-box:fill-box;transform-origin:100% 50%;transform:rotate(-30deg);animation:tyL 5.6s ease-in-out infinite}',
  '.aR{transform-box:fill-box;transform-origin:0% 50%;transform:rotate(30deg);animation:tyR 5.6s ease-in-out infinite}',
  '.ey{transform-box:fill-box;transform-origin:50% 50%;animation:blink 6.3s steps(1) infinite}',
  '@keyframes tw{0%{opacity:0}46%{opacity:1}93%{opacity:0}100%{opacity:0}}',
  '@keyframes st{from{opacity:.25}to{opacity:1}}',
  '@keyframes ne{from{opacity:.62}to{opacity:1}}',
  '@keyframes fly{from{transform:translateX(-80px)}to{transform:translateX(1700px)}}',
  '@keyframes bl{0%{opacity:1}50%{opacity:0}100%{opacity:1}}',
  '@keyframes drift{from{transform:translateX(-45px)}to{transform:translateX(45px)}}',
  '@keyframes rain{from{transform:translate(0,0)}to{transform:translate(-120px,480px)}}',
  '@keyframes rain2{from{transform:translate(0,0)}to{transform:translate(-90px,360px)}}',
  '@keyframes drip{0%{transform:translateY(0);opacity:0}8%{opacity:.6}80%{opacity:.5}100%{transform:translateY(110px);opacity:0}}',
  '@keyframes float{from{transform:translateY(-3px)}to{transform:translateY(3px)}}',
  '@keyframes eq{from{transform:scaleY(.3)}to{transform:scaleY(1)}}',
  '@keyframes ring{from{stroke-dashoffset:151}to{stroke-dashoffset:0}}',
  '@keyframes nx{0%{opacity:1}91%{opacity:.7}94%{opacity:1}}',
  '@keyframes sway{from{transform:rotate(-1.4deg)}to{transform:rotate(1.4deg)}}',
  '@keyframes tyL{0%,8%,16%,24%,32%,40%,100%{transform:rotate(-30deg)}4%,12%,20%,28%,36%{transform:rotate(-41deg)}}',
  '@keyframes tyR{0%,6%,14%,22%,30%,38%,100%{transform:rotate(30deg)}2%,10%,18%,26%,34%{transform:rotate(41deg)}}',
  '@keyframes blink{0%{transform:scaleY(1)}96%{transform:scaleY(.12)}98%{transform:scaleY(1)}}',
  '@media (prefers-reduced-motion: reduce){*{animation:none!important}}',
].join('')

function sky(p: Palette): string {
  const r = rng(404)
  let out = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`

  if (p.sun !== undefined) {
    out += `<ellipse cx="${p.sun.x}" cy="${p.sun.y}" rx="${p.sun.rx}" ry="${p.sun.ry}" fill="url(#sun)"/>`
  }

  if (p.stars > 0) {
    let stars = ''

    for (let i = 0; i < 80; i++) {
      const x = r() * W
      const y = 56 + r() * 470
      const size = 0.6 + r() * 1.1
      const twinkle = i % 6 === 0 ? ` class="st" style="animation-delay:-${n(r() * 5)}s"` : ''

      stars += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(size)}" opacity="${n(0.35 + r() * 0.6)}"${twinkle}/>`
    }

    out += `<g fill="#fff" opacity="${p.stars}">${stars}</g>`
  }

  if (p.clouds > 0) {
    out +=
      `<g opacity="${p.clouds}"><g class="cl"><ellipse cx="260" cy="170" rx="330" ry="46" fill="url(#cloud)"/><ellipse cx="1180" cy="120" rx="420" ry="52" fill="url(#cloud)"/></g>` +
      `<g class="cl" style="animation-duration:190s;animation-direction:alternate-reverse"><ellipse cx="700" cy="250" rx="380" ry="40" fill="url(#cloud)"/><ellipse cx="1480" cy="300" rx="300" ry="36" fill="url(#cloud)"/><ellipse cx="60" cy="330" rx="260" ry="34" fill="url(#cloud)"/></g></g>`
  }

  return out
}

function neonOf(list: readonly Building[], strength: number): string {
  let out = ''

  NEON.forEach((color, index) => {
    let d = ''

    for (const b of list) {
      if (b.neonColor !== index) continue

      if (b.neonEdge !== undefined) {
        d += `M${n(b.neonEdge === 'l' ? b.x + 2 : b.x + b.w - 2)} ${n(b.y)}V${BASE}`
      }

      if (b.neonRoof === true) d += `M${n(b.x + 3)} ${n(b.y + 2)}h${n(b.w - 6)}`
    }

    if (d === '') return

    out +=
      `<g class="ne" style="animation-delay:-${index * 1.7}s" stroke="${color}" fill="none" stroke-linecap="round" opacity="${strength}">` +
      `<path d="${d}" stroke-width="11" opacity=".2"/><path d="${d}" stroke-width="3"/></g>`
  })

  return out
}

function twinkles(list: readonly Building[], g: Grid, seed: number, count: number, p: Palette, body: string): string {
  const r = rng(seed)
  let out = ''

  for (let i = 0; i < count; i++) {
    const b = list[Math.floor(r() * list.length)]

    if (b === undefined) continue

    const cols = Math.round(b.w / g.cw)
    const rows = Math.floor((SILL - b.y) / g.ch)

    if (rows < 2) continue

    const x = b.x + Math.floor(r() * cols) * g.cw + g.ox
    const y = b.y + Math.floor(r() * rows) * g.ch + g.oy
    // 半分は「点く」窓、半分は「消える」窓（ビルの色で上から塗る）
    const fill = i % 2 === 0 ? p.lit[Math.floor(r() * p.lit.length)] : body

    out += `<rect class="tw" x="${n(x)}" y="${n(y)}" width="${g.ww}" height="${g.wh}" fill="${fill}" style="animation-duration:${Math.round(27 + r() * 44)}s;animation-delay:-${Math.round(r() * 60)}s"/>`
  }

  return out
}

function city(p: Palette): string {
  let far = ''
  let mid = ''
  let near = ''

  for (const b of CITY.far) {
    far += `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${n(BASE - b.y)}"/>`
  }

  for (const b of CITY.mid) {
    const size = `x="${b.x}" y="${b.y}" width="${b.w}" height="${BASE - b.y}"`

    mid += `<rect ${size} fill="${p.mid}"/><rect ${size} fill="url(#wm${b.pattern})"/>`
  }

  for (const b of CITY.near) {
    const size = `x="${b.x}" y="${b.y}" width="${b.w}" height="${BASE - b.y}"`

    near += `<rect ${size} fill="${p.near}"/><rect ${size} fill="url(#wn${b.pattern})"/>`
  }

  return (
    `<g fill="${p.far}">${far}</g>` +
    `<rect y="430" width="${W}" height="${BASE - 430}" fill="url(#haze)"/>` +
    mid +
    twinkles(CITY.mid, GRID_MID, 808, 26, p, p.mid) +
    neonOf(CITY.mid, p.neon) +
    `<rect y="640" width="${W}" height="${BASE - 640}" fill="url(#haze)" opacity=".5"/>` +
    near +
    twinkles(CITY.near, GRID_NEAR, 909, 12, p, p.near) +
    neonOf(CITY.near, p.neon)
  )
}

function air(p: Palette): string {
  // 飛行船と、遠くを横切る機体の灯り
  let out =
    `<g class="as"><ellipse cx="1240" cy="168" rx="56" ry="13" fill="${p.near}" opacity=".9"/><rect x="1228" y="180" width="24" height="5" rx="2" fill="${p.near}" opacity=".9"/><circle class="cu" cx="1186" cy="168" r="1.8" fill="#ff6a6a"/></g>` +
    `<circle class="pl" cx="0" cy="236" r="2" fill="#ff7272"/>`

  if (p.rain) {
    const r = rng(77)
    let drops = ''

    for (let i = 0; i < 54; i++) {
      const slide = i % 7 === 0 ? ` class="dr" style="animation-delay:-${n(r() * 13)}s;animation-duration:${Math.round(9 + r() * 9)}s"` : ''

      drops += `<ellipse cx="${n(r() * W)}" cy="${n(70 + r() * 780)}" rx="${n(1.4 + r() * 1.8)}" ry="${n(3 + r() * 4.5)}" opacity="${n(0.2 + r() * 0.35)}"${slide}/>`
    }

    out +=
      `<rect class="r2" x="-200" y="-400" width="2000" height="1700" fill="url(#rn2)"/>` +
      `<rect class="r1" x="-200" y="-520" width="2000" height="1900" fill="url(#rn)"/>` +
      `<g fill="#dfe6ff">${drops}</g>`
  }

  return out
}

function room(p: Palette): string {
  const mullions = [88, 512, 936, 1360]
    .map(
      x =>
        `<rect x="${x}" y="44" width="16" height="${SILL - 40}" fill="${p.frame}"/><rect x="${x + 1.5}" y="54" width="1.5" height="${SILL - 54}" fill="#a9b8ff" opacity=".13"/>`,
    )
    .join('')

  return (
    `<ellipse cx="720" cy="610" rx="720" ry="480" fill="url(#calm)"/>` +
    // 天井と窓枠
    `<rect width="${W}" height="46" fill="${p.ceiling}"/><rect y="42" width="${W}" height="12" fill="${p.frame}"/>` +
    mullions +
    // 机の上のライト（天井から吊った細い棒）
    `<g opacity="${n(0.35 + 0.65 * p.lamp)}"><path d="M1014 54V93M1296 54V93" stroke="${p.frame}" stroke-width="1.5"/>` +
    `<ellipse cx="1155" cy="96" rx="280" ry="46" fill="url(#lamp)"/><rect x="990" y="93" width="330" height="5" rx="2.5" fill="#fff3d6"/></g>` +
    // 床・窓の下の枠・ラグ
    `<rect y="${BASE - 4}" width="${W}" height="${H - BASE + 4}" fill="url(#floor)"/>` +
    `<rect y="${SILL}" width="${W}" height="20" fill="${p.frame}"/>` +
    `<path d="M860 1000L975 928H1600V1000Z" fill="${p.rug}" opacity=".85"/>` +
    // 左下：ひじ掛けのないソファと観葉植物
    `<rect x="26" y="772" width="120" height="96" rx="12" fill="#6b382f"/><rect x="14" y="846" width="144" height="38" rx="9" fill="#834638"/>` +
    `<path d="M30 884v24M142 884v24" stroke="#1a1418" stroke-width="5" stroke-linecap="round"/>` +
    `<g fill="none" stroke-linecap="round" stroke-width="8"><path d="M252 838Q236 760 186 706M252 838Q250 742 222 664M252 838Q262 730 262 640M252 838Q280 742 306 676M252 838Q296 778 336 728" stroke="#1d5a3c"/>` +
    `<path d="M252 838Q214 800 172 772M252 838Q302 806 338 792" stroke="#17482f"/></g>` +
    `<path d="M216 836h72l-9 68h-54z" fill="#5d5c6c"/>`
  )
}

type CodeLine = readonly (readonly [number, string])[]

function lines(x: number, y: number, step: number, rows: readonly (readonly [number, CodeLine])[]): string {
  let out = ''

  rows.forEach(([indent, parts], row) => {
    let at = x + indent

    for (const [width, color] of parts) {
      out += `<rect x="${at}" y="${y + row * step}" width="${width}" height="4" rx="2" fill="${color}"/>`
      at += width + 6
    }
  })

  return out
}

/**
 * 部屋に出す実際の数字（計器）。右のパネルに、時刻とコンテキスト・利用枠を出す。
 * `elapsed` は、描き直してもアニメが頭に戻らないように、開始時刻をずらす秒数。
 */
export type Live = {
  /** 手元の時刻 "HH:MM" */
  clock: string
  /** コンテキストの使用率（%）。まだ計測がなければ undefined */
  context?: number
  /** 5 時間枠の使用率（%） */
  fiveHour?: number
  /** 7 日枠の使用率（%） */
  sevenDay?: number
  /** アニメを進めておく秒数 */
  elapsed: number
  /** パネルのすりガラス（会話の列のガラスと同じ設定）。ぼかし（点）・濃さ（0〜1）・色 */
  glass?: { blur: number; opacity: number; tint: string }
}

const MONO = 'ui-monospace,SFMono-Regular,Menlo,monospace'

/** 計器のパネルの位置（右のターミナル） */
const PANEL = { x: 1384, y: 612, w: 186, h: 126 }

/**
 * 計器のパネルの後ろを、会話の列と同じすりガラスにする：背景（#bg）の写しをぼかして切り抜き、パネルの色を重ねる。
 * ぼかすのはパネルのまわりだけ（フィルタの範囲を絞って、絵全体を毎回ぼかさない）。
 */
function frost(glass: NonNullable<Live['glass']>): string {
  const { x, y, w, h } = PANEL
  const m = 24

  return (
    `<clipPath id="pc"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/></clipPath>` +
    `<filter id="fr" filterUnits="userSpaceOnUse" x="${x - m}" y="${y - m}" width="${w + m * 2}" height="${h + m * 2}"><feGaussianBlur stdDeviation="${n(glass.blur * 0.8)}"/></filter>` +
    `<g clip-path="url(#pc)"><use href="#bg" filter="url(#fr)"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${glass.tint}" fill-opacity="${n(glass.opacity)}"/></g>`
  )
}

/** 右のパネル（ターミナル）の中身：見出しの行に時刻、下に 3 行の計器。80% 以上は赤 */
function meters(live: Live): string {
  const Wt = '#e8ecff'
  const rows: [string, number | undefined][] = [
    ['ctx', live.context],
    ['5h', live.fiveHour],
    ['7d', live.sevenDay],
  ]
  let out = `<text x="1560" y="632" font-family="${MONO}" font-size="13" fill="#ff7ac8" text-anchor="end">${live.clock}</text>`

  rows.forEach(([label, value], i) => {
    const y = 662 + i * 27
    const color = value === undefined ? '#8a8fb0' : value >= 80 ? '#ff6b7a' : '#8dffb0'
    const width = value === undefined ? 0 : Math.max(2, Math.min(100, value) * 0.7)

    out +=
      `<text x="1396" y="${y}" font-family="${MONO}" font-size="14" fill="${Wt}" opacity=".85">${label}</text>` +
      `<rect x="1428" y="${y - 10}" width="70" height="10" rx="2" fill="${Wt}" opacity=".12"/>` +
      `<rect x="1428" y="${y - 10}" width="${n(width)}" height="10" rx="2" fill="${color}" opacity=".9"/>` +
      `<text x="1560" y="${y}" font-family="${MONO}" font-size="14" fill="${color}" text-anchor="end">${value === undefined ? '--' : `${Math.round(value)}%`}</text>`
  })

  return out
}

function holograms(live?: Live): string {
  const C = '#6fe8ff'
  const P = '#ff7ac8'
  const G = '#8dffb0'
  const Y = '#ffe08a'
  const Wt = '#e8ecff'
  const r = rng(1627)
  let bars = ''

  for (let i = 0; i < 24; i++) {
    const h = 5 + r() * 15

    bars += `<rect class="eq" x="${1208 + i * 7}" y="${n(545 - h)}" width="4" height="${n(h)}" style="animation-duration:${n(0.6 + r() * 1.1)}s;animation-delay:-${n(r() * 2)}s"/>`
  }

  // 上：曲とタイマー　左：コード　右：ターミナル
  const music =
    `<g class="ho"><rect x="1190" y="478" width="272" height="78" rx="6" fill="${C}" fill-opacity=".07" stroke="${C}" stroke-opacity=".75" stroke-width="1.5"/>` +
    `<circle cx="1210" cy="500" r="4" fill="${Wt}"/><path d="M1214 500v-12l8 3" stroke="${Wt}" stroke-width="1.6" fill="none"/>` +
    `<rect x="1230" y="493" width="112" height="6" rx="3" fill="${Wt}" opacity=".9"/><rect x="1230" y="507" width="150" height="4" rx="2" fill="${Wt}" opacity=".4"/>` +
    `<g fill="${C}" opacity=".8">${bars}</g>` +
    `<circle cx="1424" cy="517" r="24" fill="#0b0a22" fill-opacity=".5" stroke="${Wt}" stroke-opacity=".18" stroke-width="4"/>` +
    `<circle class="rg" cx="1424" cy="517" r="24" fill="none" stroke="#ff7ab0" stroke-width="4" stroke-linecap="round" stroke-dasharray="151" stroke-dashoffset="52" transform="rotate(-90 1424 517)"/>` +
    `<rect x="1412" y="514" width="24" height="6" rx="3" fill="${Wt}" opacity=".85"/></g>`

  const code =
    `<g class="ho" style="animation-delay:-2.5s"><rect x="1078" y="578" width="204" height="150" rx="6" fill="${C}" fill-opacity=".06" stroke="${C}" stroke-opacity=".7" stroke-width="1.5"/>` +
    `<rect x="1090" y="590" width="46" height="5" rx="2.5" fill="${Wt}" opacity=".8"/><rect x="1142" y="590" width="38" height="5" rx="2.5" fill="${Wt}" opacity=".3"/>` +
    `<g opacity=".85">${lines(1090, 610, 13, [
      [0, [[30, P], [44, Wt], [26, C]]],
      [0, [[30, P], [52, Wt], [34, C]]],
      [0, []],
      [0, [[38, P], [26, P], [56, Y]]],
      [12, [[26, P], [40, Wt], [48, C]]],
      [12, [[20, P], [62, Wt]]],
      [24, [[30, P], [70, Y]]],
      [24, [[30, P], [46, Y]]],
    ])}</g><rect class="cu" x="1226" y="700" width="5" height="9" fill="${Wt}"/></g>`

  const terminal =
    `<g class="ho" style="animation-delay:-4.5s">` +
    (live?.glass === undefined ? '' : frost(live.glass)) +
    `<rect x="1384" y="612" width="186" height="126" rx="6" fill="${P}" fill-opacity=".06" stroke="${P}" stroke-opacity=".75" stroke-width="1.5"/>` +
    `<rect x="1396" y="624" width="54" height="5" rx="2.5" fill="${P}" opacity=".9"/>` +
    (live === undefined
      ? `<g opacity=".85">${lines(1396, 644, 13, [
          [0, [[8, Wt], [34, Wt], [40, C]]],
          [10, [[52, Wt], [60, Wt]]],
          [0, [[8, Wt], [24, Wt], [24, Wt]]],
          [10, [[6, G], [86, G]]],
          [10, [[6, G], [102, G]]],
          [10, [[6, G], [74, G]]],
          [10, [[70, Wt], [28, G]]],
        ])}</g>`
      : meters(live)) +
    `</g>`

  return music + code + terminal
}

/**
 * Clawd がしていること。`work` は机で作業（いつもの絵）、`window` は手すきで窓辺へ行って外を眺める、
 * `back` は手すきが終わって（ターンが始まって）、急いでいすへ戻る。
 * `exercise` は会話の圧縮のあいだ、いすに座ったまま体操する。
 */
export type Activity = 'work' | 'window' | 'back' | 'exercise'

/**
 * 机の Clawd の動き。`since` は、その動きを始めてからの秒数（描き直しても、動きの続きから描く）。
 * `from` は back のときだけ：戻り始めた位置（窓辺への道のりのうち、歩いた割合 0〜1）
 */
export type Act = { activity: Activity; since: number; from?: number }

// Clawd（PC 作業中のポーズ）。胴体・目・脚の比率は clawd-mascot のまま、1.9 倍で机の向こうのいすに座らせる。
// 手の先は、画面上で x≈1206 と x≈1434、y≈863 に来る（腕を肩から 30° 下げたとき）。キーボードはその真下に置く。
const PLACE = 'translate(1177.5 739.4) scale(1.9)'
/** 立ち上がると、座っていたときより上がる量（画面の px） */
const RISE = 16
/**
 * 窓辺へ歩く距離（画面の px、左向きが負）。左の観葉植物の右隣で止まる。
 * 足の下端は y≈906 で、植木鉢の底（904）とそろう（窓ぎわは奥なので、机の前より床が上に見える）
 */
const WALK = -888
/** 窓辺へ行くまでの秒数：立つ（〜0.8 秒）→ 歩く（〜9.5 秒）→ 窓のほうへ向き直る（〜10 秒） */
const TO_WINDOW = 11
/** 窓辺へ向かい始めて `since` 秒の Clawd が、道のりのどこまで歩いたか（0〜1）。wk のキーフレーム（7%〜86% を一定の速さ）に合わせる */
export function walkProgress(since: number): number {
  return Math.min(1, Math.max(0, (since / TO_WINDOW - 0.07) / 0.79))
}

/** 窓辺への道のりを `from`（0〜1）歩いたところから、いすへ戻って座るまでの秒数。行きのおよそ 4 倍の速さで走る */
export function backSeconds(from: number): number {
  return Math.round((0.5 + 2.2 * Math.min(1, Math.max(0, from))) * 10) / 10
}

/** 体操の 1 回分の秒数（腕を上げて下ろす） */
const BEAT = 2.4

/** ヘッドホン（FLOW DESK の Clawd がつけているもの）。既定ではつけない。clawd-mascot の座標で返す */
function headphoneParts(headphones: boolean): { band: string; cups: string } {
  if (!headphones) return { band: '', cups: '' }

  return {
    band: `<rect x="27" y="2.5" width="96" height="6.5" rx="3" fill="#e4e5ee"/>`,
    cups:
      `<rect x="23" y="20" width="11" height="27" rx="3.5" fill="${HEADPHONE}"/><rect x="116" y="20" width="11" height="27" rx="3.5" fill="${HEADPHONE}"/>` +
      `<circle cx="28.5" cy="33.5" r="3" fill="none" stroke="#5ff0ff" stroke-width="1.4"/><circle cx="121.5" cy="33.5" r="3" fill="none" stroke="#5ff0ff" stroke-width="1.4"/>`,
  }
}

const EYES = `<g class="ey" fill="#141414"><rect x="50" y="28" width="13" height="13"/><rect x="88" y="28" width="13" height="13"/></g>`
const LEGS = 'M32 74h11v22h-11zM53 74h11v22h-11zM86 74h11v22h-11zM107 74h11v22h-11z'

/**
 * 動きのアニメ。ふだんの規則（STYLE）とは別の <style> に書き、遅れはショートハンドの中に書く
 * （shiftAnimations の「時刻ぶんずらす」から外すため。こちらは、動きを始めてからの秒数でずらす）。
 * アニメが止まる設定（視差効果を減らす）では、最後の姿勢で見えるよう、変形の既定値を最後の形にしてある。
 */
function actStyle(act: Act): string {
  const at = (start: number): string => `${n(start - act.since)}s`

  if (act.activity === 'back') {
    const total = backSeconds(act.from ?? 0)
    const steps = Math.max(1, Math.ceil((total * 0.85) / 0.25))

    return (
      `.wk{transform:translate(0,0);animation:bk ${total}s ease-in ${at(0)} 1 both}` +
      `.l1{animation:lp .25s steps(1) ${at(0)} ${steps} both}.l2{animation:lp .25s steps(1) ${at(0.125)} ${steps} both}` +
      `.sw{animation:sw .45s ease-in ${at(0)} infinite}` +
      `@keyframes bk{0%{transform:translate(${n(WALK * (act.from ?? 0))}px,-${RISE}px)}85%{transform:translate(0,-${RISE}px)}100%{transform:translate(0,0)}}` +
      `@keyframes lp{0%{transform:translateY(-4px)}50%,100%{transform:translateY(0)}}` +
      `@keyframes sw{0%{opacity:0;transform:translate(0,0)}30%{opacity:1}100%{opacity:0;transform:translate(3px,8px)}}`
    )
  }

  if (act.activity === 'window') {
    return (
      `.wk{transform:translate(${WALK}px,-${RISE}px);animation:wk ${TO_WINDOW}s linear ${at(0)} 1 both}` +
      `.l1{animation:lp .5s steps(1) ${at(0.8)} 17 both}.l2{animation:lp .5s steps(1) ${at(1.05)} 17 both}` +
      `.wf{opacity:0;animation:wf ${TO_WINDOW}s linear ${at(0)} 1 both}` +
      `.lk{transform-box:fill-box;transform-origin:50% 100%;animation:lk 7s ease-in-out ${at(TO_WINDOW)} infinite alternate}` +
      `@keyframes wk{0%{transform:translate(0,0)}7%{transform:translate(0,-${RISE}px)}86%,100%{transform:translate(${WALK}px,-${RISE}px)}}` +
      `@keyframes lp{0%{transform:translateY(-4px)}50%,100%{transform:translateY(0)}}` +
      `@keyframes wf{0%,88%{opacity:1}92%,100%{opacity:0}}` +
      `@keyframes lk{from{transform:rotate(-1.2deg)}to{transform:rotate(1.2deg)}}`
    )
  }

  return (
    `.xb{animation:xb ${BEAT}s ease-in-out ${at(0)} infinite}` +
    `.xL{transform-box:fill-box;transform-origin:100% 50%;animation:xL ${BEAT}s ease-in-out ${at(0)} infinite}` +
    `.xR{transform-box:fill-box;transform-origin:0% 50%;animation:xR ${BEAT}s ease-in-out ${at(0)} infinite}` +
    `.n1{opacity:0;animation:xn 3.2s ease-out ${at(0)} infinite}.n2{opacity:0;animation:xn 3.2s ease-out ${at(1.6)} infinite}` +
    `@keyframes xb{0%,50%,100%{transform:translateY(0)}25%,75%{transform:translateY(-3px)}}` +
    `@keyframes xL{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(40deg)}}` +
    `@keyframes xR{0%,100%{transform:rotate(12deg)}50%{transform:rotate(-40deg)}}` +
    `@keyframes xn{0%{opacity:0;transform:translate(0,0)}20%{opacity:.9}100%{opacity:0;transform:translate(14px,-46px)}}`
  )
}

/**
 * 立ち上がって窓辺へ行く Clawd。最初の姿勢（変形なし）は、座っていた Clawd と同じ位置・同じ脚の位置になる。
 * 立つ → 左の観葉植物の横まで歩く → 窓のほうへ向き直り（目が見えなくなる）、ゆっくり揺れながら外を眺める。
 * `isHurrying` のときは、歩いたところから、こちらを向いて汗を飛ばしながら走っていすへ戻り、座る。
 */
function toWindow(headphones: boolean, isHurrying: boolean): string {
  const { band, cups } = headphoneParts(headphones)

  return (
    `<g class="wk"><g class="${isHurrying ? '' : 'lk'}"><g transform="${PLACE}">` +
    band +
    `<g class="l1"><path d="M32 74h11v22h-11zM86 74h11v22h-11z" fill="${CLAWD}"/></g>` +
    `<g class="l2"><path d="M53 74h11v22h-11zM107 74h11v22h-11z" fill="${CLAWD}"/></g>` +
    // 腕は体の横に下ろす
    `<rect x="18" y="46" width="16" height="20" fill="${CLAWD}"/><rect x="116" y="46" width="16" height="20" fill="${CLAWD}"/>` +
    `<rect x="32" y="8" width="86" height="66" fill="${CLAWD}"/>` +
    (isHurrying
      ? // 急いで戻るときは、こちらを向いて汗を飛ばす
        `${EYES}<path class="sw" d="M124 6c3 4 5 7 5 9a5 5 0 0 1-10 0c0-2 2-5 5-9z" fill="#8fd8ff"/>`
      : `<g class="wf">${EYES}</g>`) +
    cups +
    `</g></g></g>`
  )
}

function desk(p: Palette, headphones: boolean, live?: Live, act?: Act): string {
  const leg = '#aeb2c6'
  const { band, cups } = headphoneParts(headphones)
  // 圧縮中は、いすに座ったまま体操する（腕を上げ下げし、体を少し弾ませる）
  const isExercise = act?.activity === 'exercise'
  const clawd =
    (isExercise ? '<g class="xb">' : '') +
    `<g transform="${PLACE}">` +
    band +
    `<g class="${isExercise ? 'xL' : 'aL'}"><rect x="12" y="42" width="24" height="22" fill="${CLAWD}"/></g>` +
    `<g class="${isExercise ? 'xR' : 'aR'}"><rect x="114" y="42" width="24" height="22" fill="${CLAWD}"/></g>` +
    `<rect x="32" y="8" width="86" height="66" fill="${CLAWD}"/>` +
    EYES +
    cups +
    `</g>` +
    (isExercise
      ? '</g><text class="n1" x="1452" y="800" font-size="22" fill="#ffe08a">♪</text><text class="n2" x="1474" y="788" font-size="18" fill="#8dffb0">♪</text>'
      : '')
  const isAway = act?.activity === 'window' || act?.activity === 'back'
  // 脚は座面の手前に垂らす（座っているように見せる）
  const legs = `<path transform="${PLACE}" d="${LEGS}" fill="${CLAWD}"/>`

  let tubes = ''

  for (let i = 0; i < 4; i++) {
    const x = 1069 + i * 16 + (i > 1 ? 4 : 0)

    tubes +=
      `<rect x="${x}" y="842" width="11" height="23" rx="4.5" fill="#ff9a3c" fill-opacity=".2" stroke="#ffb066" stroke-opacity=".6"/>` +
      `<rect class="nx" x="${x + 3.5}" y="848" width="4" height="12" rx="1.5" fill="#ffc36a" style="animation-delay:-${i * 0.9}s"/>`
  }

  return (
    // いすの脚 → 背もたれ → Clawd → 座面 → Clawd の脚 → 机（立っているときは、座面の手前に Clawd を丸ごと描く）
    `<path d="M1320 900v62M1266 986l54-24 54 24" stroke="#20212d" stroke-width="7" fill="none" stroke-linecap="round"/>` +
    `<rect x="1224" y="738" width="192" height="150" rx="18" fill="#2a2b3c"/><rect x="1232" y="744" width="176" height="5" rx="2.5" fill="#3d3f57"/>` +
    (isAway ? '' : clawd) +
    `<rect x="1234" y="886" width="172" height="16" rx="7" fill="#34364b"/><rect x="1240" y="887" width="160" height="3" rx="1.5" fill="#4a4d69"/>` +
    (isAway ? toWindow(headphones, act?.activity === 'back') : legs) +
    `<rect x="1096" y="884" width="13" height="104" fill="${leg}"/><rect x="1523" y="884" width="13" height="104" fill="${leg}"/>` +
    `<rect x="1080" y="984" width="46" height="8" rx="3" fill="${leg}"/><rect x="1506" y="984" width="46" height="8" rx="3" fill="${leg}"/>` +
    `<rect x="1070" y="885" width="492" height="18" fill="url(#led)"/>` +
    `<rect x="1056" y="872" width="520" height="13" rx="3" fill="${p.desk}"/>` +
    `<rect x="1070" y="884.5" width="492" height="2.5" rx="1" fill="#9af7ff"/>` +
    // ニキシー管の時計・光る玉
    `<ellipse cx="1097" cy="856" rx="50" ry="26" fill="url(#warm)"/><rect x="1062" y="864" width="74" height="8" rx="2" fill="#2a2622"/>${tubes}` +
    `<circle cx="1155" cy="852" r="27" fill="url(#orbGlow)"/><ellipse cx="1155" cy="869" rx="16" ry="4" fill="#cfd3e6" opacity=".75"/><circle cx="1155" cy="852" r="14" fill="url(#orb)"/>` +
    // 左右に分かれたキーボード（それぞれ手の真下）
    `<rect x="1175" y="863" width="64" height="9" rx="2" fill="#1c1d2b"/><rect x="1175" y="870.5" width="64" height="2.5" fill="#7dffb0"/>` +
    `<rect x="1401" y="863" width="64" height="9" rx="2" fill="#1c1d2b"/><rect x="1401" y="870.5" width="64" height="2.5" fill="#5ff0ff"/>` +
    // 輪っかのライトがついたアーム
    `<rect x="1486" y="852" width="34" height="20" rx="4" fill="#d7d9e4"/><rect x="1486" y="859" width="34" height="3" fill="#5ff0ff"/>` +
    `<g class="ra"><path d="M1505 852L1500 790" stroke="#2b2f3d" stroke-width="10" stroke-linecap="round"/><path d="M1500 790L1480 764" stroke="#2b2f3d" stroke-width="8" stroke-linecap="round"/>` +
    `<circle cx="1500" cy="790" r="6.5" fill="#d7d9e4"/><circle cx="1472" cy="755" r="11" fill="none" stroke="#5ff0ff" stroke-opacity=".22" stroke-width="12"/><circle cx="1472" cy="755" r="11" fill="none" stroke="#8ff6ff" stroke-width="4"/></g>` +
    // ふた付きのカップ
    `<path d="M1547 846l5-20" stroke="#9aa0b8" stroke-width="2" stroke-linecap="round"/><rect x="1538" y="848" width="18" height="24" rx="3" fill="#3a3d4d"/><rect x="1536" y="845" width="22" height="5" rx="2" fill="#565b72"/>` +
    holograms(live)
  )
}

/**
 * 描き直してもアニメが頭に戻らないように、すべてのアニメの開始を `elapsed` 秒ぶん前へずらす。
 * クラスの規則には遅れを足し、要素ごとに書いた遅れ（animation-delay:-Xs）にはその分を足す。
 */
function shiftAnimations(svg: string, elapsed: number): string {
  if (elapsed <= 0) return svg

  const style = STYLE.replace(/(\{[^{}]*animation:[^{}]*)\}/g, `$1;animation-delay:-${n(elapsed)}s}`)

  return svg
    .replace(`<style>${STYLE}</style>`, `<style>${style}</style>`)
    .replace(/animation-delay:-([\d.]+)s(?=[;"])/g, (_, x: string) => `animation-delay:-${n(Number(x) + elapsed)}s`)
}

/** 背景に頼むときの名前：場面の名前、ヘッドホンをつけるなら末尾に `_hp` */
export function sceneName(scene: SceneId, headphones: boolean): string {
  return headphones ? `${scene}${HP}` : scene
}

/** 背景の名前 → 場面とヘッドホンの有無。知らない名前には undefined */
export function sceneOf(name: string): { scene: SceneId; headphones: boolean } | undefined {
  const headphones = name.endsWith(HP)
  const id = headphones ? name.slice(0, -HP.length) : name
  const scene = SCENES.find(one => one === id)

  return scene === undefined ? undefined : { scene, headphones }
}

/**
 * 場面の SVG を返す。知らない名前には undefined。
 * `live` を渡すと、時刻と使用率を部屋に描く。`act` を渡すと、Clawd がその動き（窓辺・体操）をする（work は机の絵のまま）
 */
export function sceneSvg(name: string, live?: Live, act?: Act): string | undefined {
  const named = sceneOf(name)

  if (named === undefined) return undefined

  const p = PALETTES[named.scene]
  const { headphones } = named
  const moving = act !== undefined && act.activity !== 'work' ? act : undefined

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">` +
    `<style>${STYLE}</style>` +
    (moving === undefined ? '' : `<style>${actStyle(moving)}</style>`) +
    `<defs>${defs(p)}</defs>` +
    // 机より奥（空・街・部屋）。計器のパネルのすりガラスは、この写しをぼかして作る
    `<g id="bg">` +
    sky(p) +
    city(p) +
    air(p) +
    room(p) +
    `</g>` +
    desk(p, headphones, live, moving) +
    `</svg>`

  return live === undefined ? svg : shiftAnimations(svg, live.elapsed)
}

/** 時刻（0〜23 時）に合う場面。FLOW DESK の「オート」と同じ区切り */
export function sceneForHour(hour: number): SceneId {
  if (hour >= 5 && hour < 9) return 'morning'
  if (hour >= 9 && hour < 16) return 'day'
  if (hour >= 16 && hour < 19) return 'sunset'

  return 'night'
}
