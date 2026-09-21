export const SCORE_RULE = {
  theory: { key: 'theory', label: '基础理论考试', short: '理论题', weight: 0.3, percent: 30, tone: 'blue' },
  scenario: { key: 'scenario', label: '业务系统应用', short: '场景题', weight: 0.2, percent: 20, tone: 'green' },
  practice: { key: 'practice', label: '规划设计实操', short: '实操', weight: 0.5, percent: 50, tone: 'orange' }
}

export const SCORE_TIE_BREAK = ['practice', 'theory', 'scenario']

const PAPERS = [
  { id: 'P-QA-2026-01', title: '2026年配电网规划理论竞赛卷', name: '2026年配电网规划理论竞赛卷', paperType: 'QA', status: 'IN_PROGRESS' },
  { id: 'P-QA-2026-02', title: '县域网架分析专项理论卷', name: '县域网架分析专项理论卷', paperType: 'QA', status: 'FINISHED' },
  { id: 'P-SC-2026-01', title: '迎峰度夏场景题竞赛卷', name: '迎峰度夏场景题竞赛卷', paperType: 'SCENARIO', status: 'IN_PROGRESS' },
  { id: 'P-SC-2026-02', title: '新能源接入场景分析卷', name: '新能源接入场景分析卷', paperType: 'SCENARIO', status: 'NOT_START' }
]

const UNITS = [
  { ssds: '合肥', bmrs: 48, wcrs: 41 },
  { ssds: '芜湖', bmrs: 42, wcrs: 36 },
  { ssds: '滁州', bmrs: 39, wcrs: 31 },
  { ssds: '安庆', bmrs: 41, wcrs: 33 },
  { ssds: '阜阳', bmrs: 36, wcrs: 28 },
  { ssds: '宿州', bmrs: 35, wcrs: 26 },
  { ssds: '淮南', bmrs: 33, wcrs: 24 },
  { ssds: '六安', bmrs: 32, wcrs: 22 },
  { ssds: '蚌埠', bmrs: 30, wcrs: 21 },
  { ssds: '马鞍山', bmrs: 28, wcrs: 20 },
  { ssds: '宣城', bmrs: 26, wcrs: 18 },
  { ssds: '铜陵', bmrs: 22, wcrs: 15 },
  { ssds: '淮北', bmrs: 21, wcrs: 14 },
  { ssds: '黄山', bmrs: 19, wcrs: 12 },
  { ssds: '池州', bmrs: 18, wcrs: 11 },
  { ssds: '亳州', bmrs: 24, wcrs: 16 }
]

const PERSONAL = [
  { id: 'P01', name: '张伟', org: '合肥供电公司', code: 'AH20260126', theory: 99.0, scenario: 96.5, practice: 98.0 },
  { id: 'P02', name: '李娜', org: '芜湖供电公司', code: 'AH20260118', theory: 98.5, scenario: 97.0, practice: 97.2 },
  { id: 'P03', name: '王强', org: '省公司培训中心', code: 'AH20260086', theory: 97.8, scenario: 98.2, practice: 96.0 },
  { id: 'P04', name: '赵敏', org: '安庆供电公司', code: 'AH20260032', theory: 100.0, scenario: 95.0, practice: 94.0 },
  { id: 'P05', name: '陈晨', org: '滁州供电公司', code: 'AH20260105', theory: 96.0, scenario: 94.0, practice: 96.0 },
  { id: 'P06', name: '刘洋', org: '阜阳供电公司', code: 'AH20260163', theory: 90.0, scenario: 100.0, practice: 96.0 },
  { id: 'P07', name: '周磊', org: '宿州供电公司', code: 'AH20260142', theory: 100.0, scenario: 100.0, practice: 90.0 },
  { id: 'P08', name: '孙悦', org: '淮南供电公司', code: 'AH20260078', theory: 95.2, scenario: 93.5, practice: null },
  { id: 'P09', name: '马超', org: '六安供电公司', code: 'AH20260111', theory: 94.8, scenario: 92.0, practice: 93.5 },
  { id: 'P10', name: '徐静', org: '蚌埠供电公司', code: 'AH20260055', theory: 93.0, scenario: 94.5, practice: null },
  { id: 'P11', name: '韩雪', org: '马鞍山供电公司', code: 'AH20260041', theory: 92.6, scenario: 91.0, practice: 94.0 },
  { id: 'P12', name: '潘琪', org: '宣城供电公司', code: 'AH20260107', theory: 91.5, scenario: 90.0, practice: null }
]

const TEAMS = [
  { id: 'T01', name: '合肥供电公司', memberCount: 48, theory: 97.2, scenario: 95.8, practice: 96.5 },
  { id: 'T02', name: '芜湖供电公司', memberCount: 42, theory: 96.5, scenario: 96.0, practice: 95.8 },
  { id: 'T03', name: '滁州供电公司', memberCount: 39, theory: 95.8, scenario: 95.2, practice: 95.0 },
  { id: 'T04', name: '安庆供电公司', memberCount: 41, theory: 95.5, scenario: 94.8, practice: 94.6 },
  { id: 'T05', name: '阜阳供电公司', memberCount: 36, theory: 94.2, scenario: 95.5, practice: 94.0 },
  { id: 'T06', name: '宿州供电公司', memberCount: 35, theory: 93.8, scenario: 93.0, practice: 94.8 },
  { id: 'T07', name: '淮南供电公司', memberCount: 33, theory: 93.0, scenario: 92.5, practice: null },
  { id: 'T08', name: '六安供电公司', memberCount: 32, theory: 92.4, scenario: 91.8, practice: 93.0 }
]

const practiceStore = {
  personal: {},
  team: {}
}

function delay(data) {
  return new Promise(resolve => {
    window.setTimeout(() => resolve({ success: true, data }), 120)
  })
}

function round1(value) {
  return Number((Number(value) || 0).toFixed(1))
}

function round2(value) {
  return Number((Number(value) || 0).toFixed(2))
}

function scaleByPaper(paperId) {
  if (!paperId) return 1
  const index = PAPERS.findIndex(item => item.id === paperId)
  return index <= 0 ? 1 : 0.72 + (index % 3) * 0.08
}

function scaleScore(score, ratio) {
  if (score == null) return null
  return round1(score * (0.97 + ratio * 0.03))
}

function resolvePractice(item, scope) {
  if (Object.prototype.hasOwnProperty.call(practiceStore[scope], item.id)) {
    return practiceStore[scope][item.id]
  }
  return item.practice
}

export function buildScoreRecord(item, scope = 'personal') {
  const theory = round1(item.theory)
  const scenario = round1(item.scenario)
  const practice = resolvePractice(item, scope)
  const complete = practice != null
  const theoryWeighted = round2(theory * SCORE_RULE.theory.weight)
  const scenarioWeighted = round2(scenario * SCORE_RULE.scenario.weight)
  const practiceWeighted = complete ? round2(practice * SCORE_RULE.practice.weight) : null
  const rawPartial = round1(theory + scenario)
  const rawTotal = complete ? round1(rawPartial + practice) : rawPartial
  const weightedPartial = round2(theoryWeighted + scenarioWeighted)
  const weightedTotal = complete ? round2(weightedPartial + practiceWeighted) : weightedPartial
  const detail = scope === 'team'
    ? `${item.name}代表队 · ${item.memberCount} 人`
    : `${item.org} · ${item.code}`

  return {
    id: item.id,
    name: item.name,
    org: item.org || item.name,
    code: item.code || '',
    memberCount: item.memberCount || 0,
    detail,
    theory,
    scenario,
    practice: complete ? round1(practice) : null,
    theoryWeighted,
    scenarioWeighted,
    practiceWeighted,
    rawPartial,
    rawTotal,
    weightedPartial,
    weightedTotal,
    complete,
    score: complete ? weightedTotal : weightedPartial
  }
}

function compareScore(first, second) {
  if (first.complete !== second.complete) return first.complete ? -1 : 1
  if (second.weightedTotal !== first.weightedTotal) return second.weightedTotal - first.weightedTotal
  const practiceA = first.practice == null ? -1 : first.practice
  const practiceB = second.practice == null ? -1 : second.practice
  if (practiceB !== practiceA) return practiceB - practiceA
  if (second.theory !== first.theory) return second.theory - first.theory
  return second.scenario - first.scenario
}

function rankRecords(list, scope, ratio) {
  let rank = 0
  return list
    .map(item => buildScoreRecord({
      ...item,
      theory: scaleScore(item.theory, ratio),
      scenario: scaleScore(item.scenario, ratio),
      practice: item.practice == null ? null : scaleScore(item.practice, ratio)
    }, scope))
    .sort(compareScore)
    .map(item => {
      if (!item.complete) return { ...item, rank: null }
      rank += 1
      return { ...item, rank }
    })
}

export function getExamPage(params = {}) {
  const paperType = params.paperType
  const list = PAPERS.filter(item => !paperType || paperType === 'all' || item.paperType === paperType)
  return delay({ list, total: list.length, pageNum: 1, pageSize: 500 })
}

export function queryCount(params = {}) {
  const ratio = scaleByPaper(params.paperId)
  const total = Math.round(534 * ratio)
  const ywc = Math.round(368 * ratio)
  const ksz = Math.round(96 * ratio)
  return delay({ total, ywc, ksz, wks: total - ywc - ksz })
}

export function countByDs(params = {}) {
  const ratio = scaleByPaper(params.paperId)
  return delay(UNITS.map(item => ({
    ssds: item.ssds,
    bmrs: Math.max(8, Math.round(item.bmrs * ratio)),
    wcrs: Math.max(4, Math.round(item.wcrs * ratio))
  })))
}

export function getPersonalRankings(params = {}) {
  return delay(rankRecords(PERSONAL, 'personal', scaleByPaper(params.paperId)))
}

export function getTeamRankings(params = {}) {
  return delay(rankRecords(TEAMS, 'team', scaleByPaper(params.paperId)))
}

export function getPracticeTemplate(scope = 'personal') {
  if (scope === 'team') {
    const header = '单位名称,实操成绩'
    const rows = TEAMS.map(item => `${item.name},${item.practice == null ? '' : item.practice}`)
    return delay({ fileName: '实操成绩导入模板-单位.csv', content: [header, ...rows].join('\n') })
  }
  const header = '准考证号,姓名,单位,实操成绩'
  const rows = PERSONAL.map(item => `${item.code},${item.name},${item.org},${item.practice == null ? '' : item.practice}`)
  return delay({ fileName: '实操成绩导入模板-个人.csv', content: [header, ...rows].join('\n') })
}

export function importPracticeScores(payload = {}) {
  const scope = payload.scope === 'team' ? 'team' : 'personal'
  const source = scope === 'team' ? TEAMS : PERSONAL
  const incoming = Array.isArray(payload.records) ? payload.records : []
  let count = 0

  if (incoming.length) {
    incoming.forEach(record => {
      const target = source.find(item => item.id === record.id || item.name === record.name || item.code === record.code)
      if (!target) return
      const score = Number(record.practice)
      if (Number.isNaN(score)) return
      practiceStore[scope][target.id] = round1(Math.max(0, Math.min(100, score)))
      count += 1
    })
  } else {
    source.forEach((item, index) => {
      if (resolvePractice(item, scope) != null) return
      practiceStore[scope][item.id] = round1(88.5 + (index % 5) * 1.4)
      count += 1
    })
  }

  return delay({ scope, imported: count })
}

export function toExamView(source = {}) {
  const typeMap = { QA: '理论题', SCENARIO: '场景题' }
  return {
    ...source,
    id: source.id,
    name: source.title || source.name || '',
    paperType: typeMap[source.paperType] || source.paperType || '理论题',
    paperTypeCode: source.paperType || 'QA'
  }
}
