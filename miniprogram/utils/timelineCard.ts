import { ResultDefinition } from '../config/results'
import { buildResultCard } from './resultCardCanvas'

export function buildTimelineCard(def: ResultDefinition, score: number, page: WechatMiniprogram.Page.TrivialInstance): Promise<string> {
  return buildResultCard(def, score, page, true)
}
