import { ResultDefinition, RESULTS } from './results'

export type AvatarAccessory =
  | 'blanket'
  | 'ghost'
  | 'planner'
  | 'route'
  | 'mute'
  | 'robot'
  | 'barrier'
  | 'phone'
  | 'dice'
  | 'map'
  | 'spark'
  | 'camera'
  | 'plant'
  | 'coffee'
  | 'compass'
  | 'star'
  | 'headphones'
  | 'cap'
  | 'flag'
  | 'moon'
  | 'paper'
  | 'rainbow'
  | 'clock'
  | 'pin'

export interface AvatarStyle {
  background: string
  skin: string
  hair: string
  shirt: string
  accent: string
  accessory: AvatarAccessory
  pose: number
}

const STYLES: AvatarStyle[] = [
  { background: '#e9e7ff', skin: '#f7c9ad', hair: '#26365c', shirt: '#7f78dc', accent: '#62e6d2', accessory: 'blanket', pose: 0 },
  { background: '#e5f6f2', skin: '#f2b995', hair: '#243149', shirt: '#4ebaa9', accent: '#9c8cff', accessory: 'ghost', pose: 1 },
  { background: '#fff0d9', skin: '#ffd0ac', hair: '#5a3e3a', shirt: '#e59b4f', accent: '#697be6', accessory: 'planner', pose: 2 },
  { background: '#e5efff', skin: '#d99f7e', hair: '#18253e', shirt: '#5f8fd8', accent: '#62e6d2', accessory: 'route', pose: 3 },
  { background: '#f4e8ff', skin: '#f4c4a7', hair: '#402d52', shirt: '#b184d6', accent: '#f28e79', accessory: 'mute', pose: 0 },
  { background: '#e7edf5', skin: '#c88768', hair: '#182b3b', shirt: '#73849b', accent: '#62e6d2', accessory: 'robot', pose: 1 },
  { background: '#ffe6e1', skin: '#ffd4bc', hair: '#4a2941', shirt: '#e88487', accent: '#9c8cff', accessory: 'barrier', pose: 2 },
  { background: '#e2f4ff', skin: '#e8b18e', hair: '#1f3d55', shirt: '#4aabc9', accent: '#ffbd6d', accessory: 'phone', pose: 3 },
  { background: '#fff4ca', skin: '#f7c7a8', hair: '#6c3d27', shirt: '#d6a63f', accent: '#6576d9', accessory: 'dice', pose: 0 },
  { background: '#e7f4e7', skin: '#d49b7b', hair: '#284d3f', shirt: '#68a878', accent: '#ff9d69', accessory: 'map', pose: 1 },
  { background: '#f1e9ff', skin: '#f4c5a6', hair: '#3b2863', shirt: '#9277cf', accent: '#62e6d2', accessory: 'spark', pose: 2 },
  { background: '#e5f3f1', skin: '#dca17f', hair: '#1d3c3a', shirt: '#5fb3a6', accent: '#f29380', accessory: 'camera', pose: 3 },
  { background: '#fff0df', skin: '#ffd1b4', hair: '#5b3d2c', shirt: '#d99162', accent: '#7d72dc', accessory: 'plant', pose: 0 },
  { background: '#e9f0ff', skin: '#c9896b', hair: '#233963', shirt: '#6689d6', accent: '#ffba68', accessory: 'coffee', pose: 1 },
  { background: '#e3f7f3', skin: '#efb28e', hair: '#174b51', shirt: '#51bba9', accent: '#987fff', accessory: 'compass', pose: 2 },
  { background: '#ffe8f0', skin: '#f7c9ad', hair: '#633249', shirt: '#d981a2', accent: '#62e6d2', accessory: 'star', pose: 3 },
  { background: '#e7eaff', skin: '#d69b79', hair: '#2d315e', shirt: '#717fd0', accent: '#ff9b79', accessory: 'headphones', pose: 0 },
  { background: '#fff1d7', skin: '#f4c29f', hair: '#684124', shirt: '#dda456', accent: '#6879de', accessory: 'cap', pose: 1 },
  { background: '#e1f2fa', skin: '#d79572', hair: '#1d4256', shirt: '#559cbe', accent: '#ff9c75', accessory: 'flag', pose: 2 },
  { background: '#ece8ff', skin: '#f6c9ad', hair: '#392b5a', shirt: '#8977d1', accent: '#62e6d2', accessory: 'moon', pose: 3 },
  { background: '#e6f5e9', skin: '#cf916e', hair: '#28543e', shirt: '#5ea676', accent: '#ffba6b', accessory: 'paper', pose: 0 },
  { background: '#fff0e8', skin: '#f0b692', hair: '#6c3c34', shirt: '#e58b76', accent: '#7e75dd', accessory: 'rainbow', pose: 1 },
  { background: '#e4f1ff', skin: '#dba17e', hair: '#254c70', shirt: '#6192cb', accent: '#62e6d2', accessory: 'clock', pose: 2 },
  { background: '#f3eaff', skin: '#f4c4a5', hair: '#4c3261', shirt: '#a27bd0', accent: '#ff9c79', accessory: 'pin', pose: 3 },
]

const RESULT_IDS = RESULTS.map((result: ResultDefinition) => result.id)

export function getAvatarStyle(resultId: string): AvatarStyle {
  const index = RESULT_IDS.indexOf(resultId)
  return STYLES[index >= 0 ? index : 0]
}
