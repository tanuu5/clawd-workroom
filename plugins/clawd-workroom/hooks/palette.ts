// アプリの色（パネル・文字・線）を、時間帯ごとの部屋の色に合わせる。
// 場面はどれも暗い部屋なので、暗い表示の色だけを渡す。色そのものは palette-data.ts（tools/make-palette.mjs が作る）。
import type { ThemeColors } from 'claude-code'

import { PALETTES } from './palette-data'
import type { SceneId } from './scene'

/** 場面の配色 */
export function paletteOf(scene: SceneId): ThemeColors {
  return PALETTES[scene]
}
