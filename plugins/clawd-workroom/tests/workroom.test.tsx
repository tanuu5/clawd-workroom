import { expect, test } from 'claude-code/testing'

import { sceneForHour, sceneSvg, SCENES } from '../hooks/scene'
import { paletteOf } from '../hooks/palette'
import { glassOf, modeOf, onOffOf } from '../hooks/register'

// /bin/date +%z の返事（日本時間）
const DATE = { stdout: '+0900\n', stderr: '', exitCode: 0, isStdoutTruncated: false, isStderrTruncated: false }

// 入力欄から打った /workroom
const typed = (args: string) =>
  ({
    command: 'workroom',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 100 },
  }) as const

const BACKDROP = {
  plugin: 'clawd-workroom',
  component: 'Backdrop',
  requestId: 'backdrop',
} as const

test('どの場面も、上限に収まる SVG になる', () => {
  for (const id of SCENES) {
    const svg = sceneSvg(id) ?? ''

    expect(svg.startsWith('<svg ')).toBe(true)
    expect(svg.endsWith('</svg>')).toBe(true)
    expect(svg.length < 131072).toBe(true)
    // 同じ場面は毎回同じ絵
    expect(sceneSvg(id)).toBe(svg)
  }

  expect(sceneSvg('nowhere')).toBe(undefined)
})

test('時刻から場面を選ぶ（FLOW DESK のオートと同じ区切り）', () => {
  expect(sceneForHour(4)).toBe('night')
  expect(sceneForHour(5)).toBe('morning')
  expect(sceneForHour(9)).toBe('day')
  expect(sceneForHour(16)).toBe('sunset')
  expect(sceneForHour(19)).toBe('night')
  expect(sceneForHour(23)).toBe('night')
})

test('コマンドの言葉を読む', () => {
  expect(modeOf('夜')).toBe('night')
  expect(modeOf('Rain')).toBe('rain')
  expect(modeOf('オート')).toBe('auto')
  expect(modeOf('オフ')).toBe('off')
  expect(modeOf('宇宙')).toBe(undefined)
  expect(glassOf('40')).toBe(40)
  expect(glassOf('40%')).toBe(40)
  expect(glassOf('140')).toBe(undefined)
  expect(glassOf(undefined)).toBe(undefined)
  expect(onOffOf('あり')).toBe(true)
  expect(onOffOf('なし')).toBe(false)
  expect(onOffOf('たぶん')).toBe(undefined)
})

test('始まったら時刻に合う場面を頼み、コマンドで選び直せる', async ($, on) => {
  const store = new Map<string, unknown>()
  const sets: { id: string; opacity: number }[] = []
  let clears = 0

  on('command.register', () => ({ value: { command: 'workroom' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('store.get', (_, e) => ({ value: store.get(e.key) }))
  on('store.set', (_, e) => {
    store.set(e.key, e.value)

    return { value: undefined }
  })
  // 2026-11-14 12:30 UTC ＝ 日本時間 21:30 → 夜
  on('clock.now', () => ({ value: Date.UTC(2026, 10, 14, 12, 30) }))
  on('process.run', () => ({ value: DATE }))
  on('theme.set', (_, e) => {
    const glass = e.backdrop?.scene === undefined ? undefined : e.backdrop.glass

    sets.push({ id: e.backdrop?.scene ?? '', opacity: glass === false || glass === undefined ? -1 : (glass.opacity ?? -1) })

    return { value: { isDrawn: true, requestId: 'backdrop' } }
  })
  on('theme.clear', () => {
    clears++

    return { value: { isDrawn: false, reason: 'cleared' } }
  })

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(sets.at(-1)).toEqual({ id: 'night', opacity: 0.5 })

  const rain = await $.command.run(typed('雨'))
  expect(sets.at(-1)).toEqual({ id: 'rain', opacity: 0.5 })
  expect(String(rain.text).includes('雨の夜')).toBe(true)

  await $.command.run(typed('ガラス 30'))
  expect(sets.at(-1)).toEqual({ id: 'rain', opacity: 0.3 })

  // 引数なしは、いまの状態を答える（ウィンドウの返事を確かめるために頼み直す）
  const status = await $.command.run(typed(''))
  expect(sets.at(-1)).toEqual({ id: 'rain', opacity: 0.3 })
  expect(String(status.text).includes('描くと答えています')).toBe(true)

  // ヘッドホンは既定でなし。つけると、背景の名前の末尾に _hp がつく
  await $.command.run(typed('ヘッドホン あり'))
  expect(sets.at(-1)).toEqual({ id: 'rain_hp', opacity: 0.3 })
  await $.command.run(typed('ヘッドホン なし'))
  expect(sets.at(-1)).toEqual({ id: 'rain', opacity: 0.3 })

  await $.command.run(typed('オフ'))
  expect(clears).toBe(1)
  expect(store.get('mode')).toBe('off')
})

test('背景はデスクトップでだけ描き、ほかの mod の背景は通す', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  const props = { scene: 'night', plugin: 'clawd-workroom', glass: { blur: 9, opacity: 0.5 } }
  const mine = await $.ui.mount({ ...BACKDROP, surface: 'desktop', props })
  const svg = await mine.find({ type: 'Svg' })

  expect(svg === undefined).toBe(false)
  await mine.unmount()

  const other = await $.ui.mount({ ...BACKDROP, surface: 'desktop', props: { ...props, plugin: 'someone-else' } })

  expect((await other.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine')
  await other.unmount()
})

test('ウィンドウが背景を描かないときは、その理由を伝える', async ($, on) => {
  on('command.register', () => ({ value: { command: 'workroom' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('store.get', () => ({ value: undefined }))
  on('clock.now', () => ({ value: Date.UTC(2026, 10, 14, 12, 30) }))
  on('process.run', () => ({ value: DATE }))
  on('theme.set', () => ({ value: { isDrawn: false, reason: 'no surface draws backdrops' } }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const status = await $.command.run(typed(''))

  expect(String(status.text).includes('背景を描いていません（no surface draws backdrops）')).toBe(true)
})

test('どの場面の配色も、暗い表示の分だけを持つ', () => {
  for (const id of SCENES) {
    const theme = paletteOf(id)
    const dark = theme.inputs.dark ?? {}

    expect(Object.keys(theme.inputs)).toEqual(['dark'])
    expect(Object.keys(dark).length > 50).toBe(true)
    expect(Object.values(dark).every(color => /^#[0-9a-f]{6}$/i.test(color))).toBe(true)
  }
})

test('背景を頼めなくても、コマンドは理由を返す', async ($, on) => {
  on('command.register', () => ({ value: { command: 'workroom' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('store.get', () => ({ value: undefined }))
  on('clock.now', () => ({ value: Date.UTC(2026, 10, 14, 12, 30) }))
  on('process.run', () => ({ value: DATE }))
  on('theme.set', () => {
    throw new Error('refused')
  })

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const status = await $.command.run(typed(''))

  expect(String(status.text).includes('背景を出せませんでした')).toBe(true)
})

test('ヘッドホンは既定では描かず、_hp のついた名前のときだけ描く', () => {
  const cup = '#f1f2f7'

  for (const id of SCENES) {
    expect((sceneSvg(id) ?? '').includes(cup)).toBe(false)
    expect((sceneSvg(`${id}_hp`) ?? '').includes(cup)).toBe(true)
  }
})

test('計器ありの絵：パネルに時刻と使用率、後ろはすりガラス。アニメは経過秒だけ先へずれる', () => {
  const glass = { blur: 9, opacity: 0.5, tint: '#151b33' }
  const live = { clock: '21:30', context: 36, fiveHour: 85, sevenDay: undefined, elapsed: 100, glass }

  for (const id of SCENES) {
    const svg = sceneSvg(id, live) ?? ''

    expect(svg.length < 131072).toBe(true)
    expect(svg.includes('>21:30</text>')).toBe(true)
    expect(svg.includes('>36%</text>')).toBe(true)
    // 80% 以上は赤
    expect(svg.includes('fill="#ff6b7a" text-anchor="end">85%</text>')).toBe(true)
    expect(svg.includes('>--</text>')).toBe(true)
    // パネルの後ろは、背景の写しをぼかして、ガラスの色を重ねる
    expect(svg.includes('<use href="#bg" filter="url(#fr)"/>')).toBe(true)
    expect(svg.includes('stdDeviation="7.2"')).toBe(true)
    expect(svg.includes('fill="#151b33" fill-opacity="0.5"')).toBe(true)
    // クラスの規則に遅れが足され、要素ごとの遅れ（-2.5s）は 102.5s になる
    expect(svg.includes('animation:tw 41s steps(1) infinite;animation-delay:-100s}')).toBe(true)
    expect(svg.includes('animation-delay:-102.5s')).toBe(true)
  }

  // 計器なしの絵には、計器もすりガラスも出ない
  const plain = sceneSvg('night') ?? ''

  expect(plain.includes('animation-delay:-100s')).toBe(false)
  expect(plain.includes('filter="url(#fr)"')).toBe(false)
})
