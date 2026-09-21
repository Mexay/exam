/**
 * /ght/ks-home/rank 字段对照
 * pcId 批次id
 * type 1 个人 / 2 团体
 * lltYf / lltJqf     理论题原分 / 加权分
 * cjtYf / cjtJqf     场景题原分 / 加权分
 * ghsjscYf / ghsjscJqf 规划设计实操原分 / 加权分
 * qzqzf              权重前总分
 * qzhzf              权重后总分
 */

function toNumber(value, digits) {
  if (value == null || value === '') return null
  const number = Number(value)
  if (Number.isNaN(number)) return null
  return digits == null ? number : Number(number.toFixed(digits))
}

export function toRankView(source = {}, scope = 'personal') {
  const theory = toNumber(source.lltYf, 2)
  const theoryWeighted = toNumber(source.lltJqf, 2)
  const scenario = toNumber(source.cjtYf, 2)
  const scenarioWeighted = toNumber(source.cjtJqf, 2)
  const practiceRaw = source.ghsjscYf
  const complete = practiceRaw != null && practiceRaw !== ''
  const practice = complete ? toNumber(practiceRaw, 2) : null
  const practiceWeighted = complete ? toNumber(source.ghsjscJqf, 2) : null
  const name = source.userName || source.ssds || ''
  const org = source.ssds || ''
  return {
    id: source.accountId || source.ssdsId || name,
    accountId: source.accountId,
    ssdsId: source.ssdsId,
    name,
    org,
    detail: scope === 'team' ? (org || name) : org,
    theory,
    theoryWeighted,
    scenario,
    scenarioWeighted,
    practice,
    practiceWeighted,
    rawTotal: toNumber(source.qzqzf, 2),
    weightedTotal: toNumber(source.qzhzf, 2),
    complete,
    score: toNumber(source.qzhzf, 2)
  }
}

function compareRankView(first, second) {
  if (first.complete !== second.complete) return first.complete ? -1 : 1
  if ((second.weightedTotal || 0) !== (first.weightedTotal || 0)) return (second.weightedTotal || 0) - (first.weightedTotal || 0)
  if ((second.practice || 0) !== (first.practice || 0)) return (second.practice || 0) - (first.practice || 0)
  if ((second.theory || 0) !== (first.theory || 0)) return (second.theory || 0) - (first.theory || 0)
  return (second.scenario || 0) - (first.scenario || 0)
}

export function rankScoreViews(list, scope = 'personal') {
  const rows = (Array.isArray(list) ? list : []).map(item => toRankView(item, scope)).sort(compareRankView)
  let rank = 0
  return rows.map(item => {
    if (!item.complete) return { ...item, rank: null }
    rank += 1
    return { ...item, rank }
  })
}
