// 場面ごとの配色の「元」。ここを直したら tools/make-palette.mjs で hooks/palette-data.ts を作り直す。
// 場面はどれも暗い部屋なので、暗い表示の色だけを作る。

// ネオンの色を役割に当てる：水色＝アクセント、緑＝成功、ピンク寄りの赤＝危険、ニキシー管の橙＝注意、紫＝pro
export const ROLES = { accent: '#4fd6e8', danger: '#ff6f8f', success: '#6fe0a0', warning: '#ffb65c', pro: '#b79aff' }

export const LABEL = {
  morning: 'Clawd 62F・朝',
  day: 'Clawd 62F・昼',
  sunset: 'Clawd 62F・夕暮れ',
  night: 'Clawd 62F・夜',
  rain: 'Clawd 62F・雨の夜',
}

// 面（surface-0 がいちばん暗いページの色）と文字の色
export const ANCHORS = {
  morning: {
    'surface-0': '#10152a',
    'surface-1': '#151b33',
    'surface-2': '#1a213d',
    'surface-3': '#1f2746',
    'text-primary': '#eef0fb',
    'text-secondary': '#c9cee6',
    'text-muted': '#a3aacb',
  },
  day: {
    'surface-0': '#0f172b',
    'surface-1': '#141d36',
    'surface-2': '#192441',
    'surface-3': '#1e2a4a',
    'text-primary': '#eef3fc',
    'text-secondary': '#c8d3ea',
    'text-muted': '#a1afcf',
  },
  sunset: {
    'surface-0': '#1a1226',
    'surface-1': '#221830',
    'surface-2': '#2a1e3b',
    'surface-3': '#2d2140',
    'text-primary': '#f6edf6',
    'text-secondary': '#dac9de',
    'text-muted': '#b7a3c0',
  },
  night: {
    'surface-0': '#0e0d24',
    'surface-1': '#15143a',
    'surface-2': '#1b1a46',
    'surface-3': '#211f50',
    'text-primary': '#ecebff',
    'text-secondary': '#c8c6ea',
    'text-muted': '#a3a0d0',
  },
  rain: {
    'surface-0': '#0d0f1a',
    'surface-1': '#141726',
    'surface-2': '#1a1e30',
    'surface-3': '#20253a',
    'text-primary': '#e9ecf7',
    'text-secondary': '#c3c8dc',
    'text-muted': '#9da4be',
  },
}
