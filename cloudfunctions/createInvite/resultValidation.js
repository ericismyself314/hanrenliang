const DIMENSIONS = ['R', 'S', 'P', 'E', 'F', 'A']
const RESULT_ID_PATTERN = /^B[0-3]-(R|S|P|E|F|A)$/

function validText(value, maxLength) {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength
}

function validScore(value) {
  return Number.isInteger(value) && value >= 0 && value <= 100
}

/** 验证结果快照，拒绝缺字段、越界值和互相矛盾的结果标识。 */
function validateSnapshot(snapshot, fieldName) {
  if (!snapshot || typeof snapshot !== 'object') return `${fieldName}格式不正确`
  if (!validText(snapshot.contentVersion, 80)) return `${fieldName}缺少内容版本`
  if (!validScore(snapshot.humanScore)) return `${fieldName}综合分数不正确`
  if (!Number.isInteger(snapshot.band) || snapshot.band < 0 || snapshot.band > 3) return `${fieldName}档位不正确`
  if (!DIMENSIONS.includes(snapshot.keyDimension)) return `${fieldName}关键维度不正确`
  if (typeof snapshot.resultId !== 'string' || !RESULT_ID_PATTERN.test(snapshot.resultId)) return `${fieldName}结果编号不正确`
  if (snapshot.resultId !== `B${snapshot.band}-${snapshot.keyDimension}`) return `${fieldName}结果编号与档位不一致`
  if (typeof snapshot.title !== 'string' || snapshot.title.length > 80) return `${fieldName}称号不正确`
  if (!snapshot.dimensionScores || typeof snapshot.dimensionScores !== 'object') return `${fieldName}缺少六维分数`
  for (const code of DIMENSIONS) {
    if (!validScore(snapshot.dimensionScores[code])) return `${fieldName}六维分数不正确`
  }
  return ''
}

function validateExpectedResult(resultId) {
  return resultId === '' || (typeof resultId === 'string' && RESULT_ID_PATTERN.test(resultId))
}

module.exports = { DIMENSIONS, RESULT_ID_PATTERN, validateSnapshot, validateExpectedResult }
