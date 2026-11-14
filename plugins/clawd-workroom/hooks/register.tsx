// clawd-workroom：デスクトップアプリの会話の背景に、Clawd の作業部屋（62F）を描く。
//   - 背景の絵は scene.ts が作る SVG（5 場面）、アプリの色は palette.ts。ここは「どの場面を出すか」を決めて $.theme.set で頼むだけ。
//   - 選んだ場面・ガラスの濃さ・ヘッドホンの有無は $.store に置く（このマシンの全セッションで共通）。
//   - 「オート」は手元の時刻で場面を選ぶ（FLOW DESK のオートと同じ区切り）。
import type { EngineInterface, Register } from 'claude-code'

import { paletteOf } from './palette'
import { SCENES, SCENE_LABEL, sceneForHour, sceneName, sceneOf, sceneSvg } from './scene'
import type { Live, SceneId } from './scene'

const PLUGIN = 'clawd-workroom'
const COMMAND = 'workroom'
/** パネルの後ろで背景をぼかす量（CSS ピクセル） */
const BLUR = 9
/** パネルの濃さの既定値（%）。大きいほど背景が隠れて字が読みやすい */
const GLASS_DEFAULT = 50
const AUTO_CHECK_MS = 5 * 60_000
/** 計器（時刻と使用率）を確かめる間隔。描き直すのは、表示が変わったときだけ */
const LIVE_CHECK_MS = 15_000

export type Mode = SceneId | 'auto' | 'off'
type Saved = { mode: Mode; glass: number; headphones: boolean; live: boolean }

// 打ちやすい呼び名 → 場面
const WORDS: Record<string, Mode> = {
  auto: 'auto',
  オート: 'auto',
  自動: 'auto',
  off: 'off',
  オフ: 'off',
  消す: 'off',
  morning: 'morning',
  朝: 'morning',
  day: 'day',
  昼: 'day',
  sunset: 'sunset',
  dusk: 'sunset',
  夕暮れ: 'sunset',
  夕方: 'sunset',
  night: 'night',
  夜: 'night',
  rain: 'rain',
  雨: 'rain',
  雨の夜: 'rain',
}

export function modeOf(word: string): Mode | undefined {
  return WORDS[word.trim().toLowerCase()]
}

/** 「50」「50%」→ 50。0〜100 の整数でなければ undefined */
export function glassOf(word: string | undefined): number | undefined {
  const m = /^(\d{1,3})%?$/.exec((word ?? '').trim())

  if (m === null) return undefined

  const value = Number(m[1])

  return value <= 100 ? value : undefined
}

/** 「あり」「なし」など → つける／つけない。分からなければ undefined */
export function onOffOf(word: string | undefined): boolean | undefined {
  const w = (word ?? '').trim().toLowerCase()

  if (['on', 'あり', 'つける', '付ける', 'オン'].includes(w)) return true
  if (['off', 'なし', '外す', 'はずす', 'オフ'].includes(w)) return false

  return undefined
}

function isMode(value: unknown): value is Mode {
  return value === 'auto' || value === 'off' || SCENES.some(scene => scene === value)
}

async function load($: EngineInterface): Promise<Saved> {
  const mode = await $.store.get('mode')
  const glass = await $.store.get('glass')
  const headphones = await $.store.get('headphones')
  const live = await $.store.get('live')

  return {
    // ヘッドホンは、つけると選んだときだけ（既定はなし）
    headphones: headphones === true,
    // 計器は、外すと選ばない限り出す（試作中）
    live: live !== false,
    mode: isMode(mode) ? mode : 'auto',
    glass: typeof glass === 'number' && glass >= 0 && glass <= 100 ? glass : GLASS_DEFAULT,
  }
}

// このモジュールが覚えていること（再読み込みで初期化される）
let tzOffsetMin: number | undefined
let applied: string | undefined
// 最後に背景を頼んだときの、ウィンドウの返事（描かないなら、その理由）
let refusal: string | undefined
// 計器を出すか（最後に読んだ設定）と、最後に描いた計器の中身（変わったときだけ描き直す）
let liveOn = false
let liveShown = ''

/** 手元の時刻 "HH:MM" */
function clockOf(now: number): string {
  const d = new Date(now + (tzOffsetMin ?? 0) * 60_000)

  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

/** 計器の中身：時刻・コンテキスト・5 時間枠・7 日枠。アニメを進める秒数は、時刻から決める（描き直しても続きから動く） */
async function readLive($: EngineInterface): Promise<Live> {
  // 時差を一度だけ調べる（オートでないときは、まだ調べていない）
  await localHour($)

  const now = await $.clock.now()
  const { context, rateLimits } = await $.session.usage()
  const used = (kind: string) => rateLimits.find(limit => limit.kind === kind)?.percentUsed

  return {
    clock: clockOf(now),
    context: context.percent,
    fiveHour: used('five_hour'),
    sevenDay: used('seven_day'),
    elapsed: (now % 86_400_000) / 1000,
  }
}

/** 表示が変わったときだけ背景を描き直す */
async function refreshLive($: EngineInterface): Promise<void> {
  if (!liveOn || applied === undefined || applied === 'off') return

  const live = await readLive($)
  const key = `${live.clock}|${live.context}|${live.fiveHour}|${live.sevenDay}`

  if (key === liveShown) return
  liveShown = key
  $.ui.invalidate('ui.render')
}

/** 手元の時刻（時）。時差は /bin/date で 1 回だけ調べる */
async function localHour($: EngineInterface): Promise<number> {
  if (tzOffsetMin === undefined) {
    try {
      const { stdout } = await $.process.run(['/bin/date', '+%z'])
      const m = /^([+-])(\d\d)(\d\d)$/.exec(stdout.trim())

      if (m !== null) tzOffsetMin = (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]))
    } catch {
      // 調べられなければ UTC のまま進む
    }
  }

  return new Date((await $.clock.now()) + (tzOffsetMin ?? 0) * 60_000).getUTCHours()
}

type Shown = { scene: SceneId | undefined; isDrawn: boolean; reason?: string }

/** 保存してある選び方のとおりに背景を出す。前と同じなら何もしない */
async function apply($: EngineInterface, saved: Saved, again = false): Promise<Shown> {
  if (liveOn !== saved.live) {
    liveOn = saved.live
    liveShown = ''
    $.ui.invalidate('ui.render')
  }

  if (saved.mode === 'off') {
    // 消すのは、このモジュールが出した背景があるときだけ（ほかの mod のテーマを巻き込まない）
    if (applied !== undefined && applied !== 'off') await $.theme.clear()
    applied = 'off'

    return { scene: undefined, isDrawn: false }
  }

  const scene = saved.mode === 'auto' ? sceneForHour(await localHour($)) : saved.mode
  const key = `${scene}|${saved.glass}|${saved.headphones}`

  if (key === applied && !again) {
    return refusal === undefined ? { scene, isDrawn: true } : { scene, isDrawn: false, reason: refusal }
  }

  // 場面はどれも暗い部屋。配色も暗い表示の分だけ渡すので、アプリは暗い表示として描く
  const set = await $.theme.set({
    backdrop: { scene: sceneName(scene, saved.headphones), glass: { blur: BLUR, opacity: saved.glass / 100 } },
    colors: paletteOf(scene),
    overrideColorScheme: 'dark',
  })

  applied = key
  refusal = set.isDrawn ? undefined : set.reason

  return set.isDrawn ? { scene, isDrawn: true } : { scene, isDrawn: false, reason: set.reason }
}

/** 背景のせいで本来の処理を止めない：失敗は 1 行の通知だけにする */
async function quietly($: EngineInterface, work: () => Promise<unknown>): Promise<void> {
  try {
    await work()
  } catch (error) {
    void $.ui.toast(`${PLUGIN}: ${String(error)}`)
  }
}

function usage(saved: Saved, shown: Shown): string {
  const now =
    saved.mode === 'off'
      ? 'いまはオフ'
      : `いまは「${shown.scene === undefined ? '?' : SCENE_LABEL[shown.scene]}」${saved.mode === 'auto' ? '（オート）' : ''}・ガラス ${saved.glass}%・ヘッドホン${saved.headphones ? 'あり' : 'なし'}・計器${saved.live ? 'あり' : 'なし'}`

  const drawn =
    saved.mode === 'off'
      ? []
      : shown.isDrawn
        ? ['このウィンドウは背景を描くと答えています。']
        : [`このウィンドウは背景を描いていません（${shown.reason ?? '理由は不明'}）。アプリを最新版にして開き直すと出るかもしれません。`]

  return [
    `Clawd の作業部屋 62F：${now}`,
    ...drawn,
    `/${COMMAND} オート｜朝｜昼｜夕暮れ｜夜｜雨｜オフ … 場面を選ぶ（オートは時刻に合わせる）`,
    `/${COMMAND} ガラス 0〜100 … パネルの濃さ（小さいほど背景がよく見える。既定 ${GLASS_DEFAULT}）`,
    `/${COMMAND} ヘッドホン あり｜なし … Clawd にヘッドホンをつける（既定はなし）`,
    `/${COMMAND} 計器 あり｜なし … ニキシー管に時刻、右のパネルにコンテキストと利用枠を出す（試作）`,
  ].join('\n')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await quietly($, () =>
      $.command.register({
        name: COMMAND,
        description:
          '背景を Clawd の作業部屋 62F にする：オート／朝／昼／夕暮れ／夜／雨／オフ、「ガラス 0〜100」でパネルの濃さ、「ヘッドホン あり／なし」',
      }),
    )
    await quietly($, async () => apply($, await load($)))
    // オートのとき、時間帯が変わったら場面を替える
    $.clock.every(AUTO_CHECK_MS, () => void quietly($, async () => apply($, await load($))))
    // 計器：分が変わったときと、使用率が変わったときに描き直す
    $.clock.every(LIVE_CHECK_MS, () => void quietly($, () => refreshLive($)))

    return next(e)
  })

  // ほかのセッションで選び直した結果を、次に送るときに取り込む
  on('prompt.submit', async ($, e, next) => {
    await quietly($, async () => apply($, await load($)))

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    try {
      return await run($, e.args)
    } catch (error) {
      // 背景を頼めなかったときも、黙って終わらせずに理由を返す
      return { text: `${PLUGIN}: 背景を出せませんでした（${String(error)}）` }
    }
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    // 背景を描けるのはデスクトップのウィンドウだけ。ほかの mod の背景には手を出さない
    if (e.props.plugin !== PLUGIN || e.surface !== 'desktop') return next(e)

    let live: Live | undefined

    if (liveOn) {
      try {
        live = await readLive($)
        // 計器のパネルも、会話の列と同じガラス（ぼかし・濃さ）にする。色はアプリの面の色に合わせる
        const named = sceneOf(e.props.scene)
        const glass = e.props.glass

        if (named !== undefined && glass !== undefined && glass !== false) {
          live.glass = {
            blur: glass.blur ?? 16,
            opacity: glass.opacity ?? GLASS_DEFAULT / 100,
            tint: glass.tint ?? paletteOf(named.scene).inputs.dark?.['gray-850'] ?? '#151b33',
          }
        }
        liveShown = `${live.clock}|${live.context}|${live.fiveHour}|${live.sevenDay}`
      } catch {
        // 読めなければ、計器なしの絵にする
      }
    }

    const source = sceneSvg(e.props.scene, live)

    if (source === undefined) return next(e)

    const { Svg } = $.ui.resolve(e)
    const named = sceneOf(e.props.scene)
    const label = named === undefined ? '' : SCENE_LABEL[named.scene]

    return (
      <Svg
        isInteractive
        alt={`Clawd の作業部屋 62F（${label}）：高層階の窓の外に街が広がり、右下の机で Clawd が作業している`}
        source={source}
      />
    )
  })
}

/** /workroom の中身 */
async function run($: EngineInterface, args: string): Promise<{ text: string }> {
  const words = args.trim().split(/\s+/).filter(word => word !== '')
  const saved = await load($)
  const first = (words[0] ?? '').toLowerCase()

  // 引数なしは「いまどうなっているか」。同じ場面でも頼み直して、ウィンドウの返事を確かめる
  if (first === '') {
    return { text: usage(saved, await apply($, saved, true)) }
  }

  if (first === 'glass' || first === 'ガラス') {
    const glass = glassOf(words[1])

    if (glass === undefined) {
      return { text: `ガラスは 0〜100 の数で指定します（例：/${COMMAND} ガラス 40）` }
    }

    await $.store.set('glass', glass)
  } else if (first === 'headphones' || first === 'ヘッドホン' || first === 'ヘッドフォン') {
    const headphones = onOffOf(words[1])

    if (headphones === undefined) {
      return { text: `ヘッドホンは「あり」か「なし」で指定します（例：/${COMMAND} ヘッドホン あり）` }
    }

    await $.store.set('headphones', headphones)
  } else if (first === 'meters' || first === '計器') {
    const live = onOffOf(words[1])

    if (live === undefined) {
      return { text: `計器は「あり」か「なし」で指定します（例：/${COMMAND} 計器 なし）` }
    }

    await $.store.set('live', live)
  } else {
    const mode = modeOf(first)

    if (mode === undefined) {
      return { text: `「${words[0]}」という場面はありません。\n${usage(saved, await apply($, saved))}` }
    }

    await $.store.set('mode', mode)
  }

  const now = await load($)

  return { text: usage(now, await apply($, now, true)) }
}
