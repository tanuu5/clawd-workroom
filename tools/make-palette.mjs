// hooks/palette-data.ts を作り直す。
// 使い方：node tools/make-palette.mjs <make-colors.js のパス>
//   make-colors.js は、Claude Code の plugin-authoring スキルのフォルダにある（デザインシステムから生成されたファイル）。
//   このリポジトリには入れていないので、手元の Claude Code のものを指す。Claude Code が上がったら作り直す。
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { ANCHORS, LABEL, ROLES } from './palette-source.mjs'

const maker = process.argv[2]

if (maker === undefined) {
  console.error('使い方：node tools/make-palette.mjs <make-colors.js のパス>')
  process.exit(1)
}

const { makeColors } = await import(pathToFileURL(resolve(maker)).href)
const out = {}
let unpainted = 0

for (const scene of Object.keys(ANCHORS)) {
  const { theme, problems } = makeColors({
    label: LABEL[scene],
    id: `clawd-workroom-${scene}`,
    only: 'dark',
    roles: ROLES,
    dark: { gray: { anchors: ANCHORS[scene] } },
  })
  const stops = problems.filter(line => line.startsWith("Desktop won't paint"))

  unpainted += stops.length
  console.log(`${scene}: ${Object.keys(theme.inputs.dark ?? {}).length} 色、指摘 ${problems.length} 件（塗られない ${stops.length} 件）`)
  for (const line of stops) console.log(`  ${line}`)
  out[scene] = theme
}

const here = dirname(fileURLToPath(import.meta.url))
const file = resolve(here, '../plugins/clawd-workroom/hooks/palette-data.ts')
const text =
  `// tools/make-palette.mjs が作るファイル。手で直さない（色を変えるときは tools/palette-source.mjs を直して作り直す）。\n` +
  `import type { ThemeColors } from 'claude-code'\n\n` +
  `import type { SceneId } from './scene'\n\n` +
  `export const PALETTES: Record<SceneId, ThemeColors> = ${JSON.stringify(out, null, 2)}\n`

writeFileSync(file, text)
console.log(`書き出し：${file}`)
process.exit(unpainted === 0 ? 0 : 2)
