<template>
  <section class="overview-page" v-loading="loading">
    <div class="page-actions">
      <el-select
        size="small"
        v-model="pcId"
        class="exam-list-filter overview-paper-filter"
        filterable
        placeholder="请选择考试批次"
        :loading="batchLoading"
      >
        <el-option v-for="item in batchOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
      </el-select>
      <div class="action-spacer"></div>
      <el-button type="primary" size="mini" icon="el-icon-upload2" @click="openImport">导入实操成绩</el-button>
      <el-button size="mini" icon="el-icon-refresh" :loading="loading" @click="reload">刷新</el-button>
    </div>

    <article class="surface rule-bar">
      <div class="rule-copy">
        <h2>成绩评定规则</h2>
        <p>总成绩相同时，依次比较规划设计实操、理论机考、业务系统应用。</p>
      </div>
      <div class="rule-formula">
        <span class="rule-chip is-theory">理论题 × 30%</span>
        <i>+</i>
        <span class="rule-chip is-scenario">场景题 × 20%</span>
        <i>+</i>
        <span class="rule-chip is-practice">规划设计实操 × 50%</span>
        <em>= 加权总分</em>
      </div>
    </article>

    <div class="metric-grid">
      <article
        v-for="item in scoreSummary"
        :key="item.key"
        :class="['metric-card', `metric-card-${item.tone}`]"
      >
        <div class="metric-head">
          <span :class="['metric-icon', `metric-${item.tone}`]"><i :class="item.icon"></i></span>
          <span>{{ item.label }}</span>
          <b>{{ item.weight }}</b>
        </div>
        <div class="score-pair">
          <div>
            <label>参加人数</label>
            <strong>{{ item.joined }}</strong>
          </div>
          <div>
            <label>通过率</label>
            <strong>{{ item.passRate }}</strong>
          </div>
        </div>
        <div class="metric-note">{{ item.note }}</div>
      </article>
    </div>

    <article class="surface overview-panel unit-panel">
      <div class="panel-head">
        <div>
          <h2>各单位参赛情况</h2>
          <p>报名人数与已完成人数对比</p>
        </div>
        <span>{{ unitCount }} 个单位</span>
      </div>
      <div ref="unitChart" class="overview-chart"></div>
    </article>

    <article class="surface score-board">
      <div class="panel-head">
        <div>
          <h2>成绩排行</h2>
          <p>每项展示原分 / 加权分；色条为三项加权构成。未导入实操的记录暂不计名次。</p>
        </div>
        <div class="board-actions">
          <el-radio-group v-model="rankMode" size="mini">
            <el-radio-button label="personal">个人成绩</el-radio-button>
            <el-radio-button label="team">团体成绩</el-radio-button>
          </el-radio-group>
          <span>{{ currentRankings.length }} {{ rankMode === 'team' ? '支队伍' : '人' }}</span>
        </div>
      </div>
      <div class="mix-legend">
        <em class="is-theory">理论 30%</em>
        <em class="is-scenario">场景 20%</em>
        <em class="is-practice">实操 50%</em>
      </div>
      <ScoreRankingTable :items="currentRankings" :mode="rankMode" />
    </article>

    <el-dialog
      title="导入规划设计实操成绩"
      custom-class="ov-import-dialog"
      :visible.sync="importVisible"
      width="520px"
      append-to-body
    >
      <p class="import-hint">实操成绩不在机考系统内产生，需导入成绩文件：</p>
      <el-form label-width="92px" size="small">
<!--        <el-form-item label="导入对象">-->
<!--          <el-radio-group v-model="importScope">-->
<!--            <el-radio label="personal">考生个人</el-radio>-->
<!--            <el-radio label="team">单位 / 代表队</el-radio>-->
<!--          </el-radio-group>-->
<!--        </el-form-item>-->
        <el-form-item label="成绩文件">
          <el-upload
            action="#"
            :auto-upload="false"
            :limit="1"
            accept=".csv,.xls,.xlsx"
            :on-change="onFileChange"
            :on-remove="onFileRemove"
            :file-list="importFiles"
          >
            <el-button size="mini">选择文件</el-button>
            <span slot="tip" class="el-upload__tip">支持 csv / xls / xlsx格式的文件</span>
          </el-upload>
        </el-form-item>
      </el-form>
      <span slot="footer">
<!--        <el-button size="small" @click="downloadTemplate">下载模板</el-button>-->
        <el-button size="small" @click="importVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="importing" @click="confirmImport">导入</el-button>
      </span>
    </el-dialog>
  </section>
</template>

<script>
import * as echarts from 'echarts'
import ScoreRankingTable from './ScoreRankingTable.vue'
import { getExamBatchOptions, importGhsjsc, queryHomeCount, queryHomeCountByCity, queryHomeRank } from '@/api/pwgh/examCbPsk'
import { getPracticeTemplate } from './mock/examOverview'
import { rankScoreViews } from './rankMap'

const HOME_COUNT_CARDS = [
  { key: 'theory', type: 1, label: '基础理论考试', weight: '30%', tone: 'blue', icon: 'el-icon-document' },
  { key: 'scenario', type: 2, label: '业务系统应用', weight: '20%', tone: 'green', icon: 'el-icon-monitor' },
  { key: 'practice', type: 3, label: '规划设计实操', weight: '50%', tone: 'orange', icon: 'el-icon-edit-outline' },
  { key: 'total', type: 4, label: '综合成绩', weight: '100%', tone: 'red', icon: 'el-icon-s-data' }
]

function emptyCount() {
  return { cjrs: 0, tgl: null }
}

function pickCount(response) {
  const data = (response && response.data) || {}
  return {
    cjrs: Number(data.cjrs) || 0,
    tgl: data.tgl
  }
}

function formatPassRate(tgl) {
  if (tgl == null || tgl === '') return '—'
  const value = Number(tgl)
  if (Number.isNaN(value)) return String(tgl)
  const percent = value <= 1 ? value * 100 : value
  return `${percent.toFixed(1)}%`
}

function toCount(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function normalizeCityCount(source) {
  const list = Array.isArray(source) ? source : []
  return list.map(item => ({
    ssdsId: item && item.ssdsId,
    ssds: (item && item.ssds) || '',
    bmrs: toCount(item && item.bmrs),
    wcrs: toCount(item && item.wcrs)
  })).filter(item => item.ssds)
}

export default {
  name: 'ExamOverview',
  components: { ScoreRankingTable },
  data() {
    return {
      pcId: '',
      batchOptions: [],
      batchLoading: false,
      loading: false,
      importing: false,
      importVisible: false,
      importScope: 'personal',
      importFiles: [],
      rankMode: 'personal',
      chart: null,
      unitCount: 0,
      personalRankings: [],
      teamRankings: [],
      countStats: {
        theory: emptyCount(),
        scenario: emptyCount(),
        practice: emptyCount(),
        total: emptyCount()
      }
    }
  },
  computed: {
    currentRankings() {
      return this.rankMode === 'team' ? this.teamRankings : this.personalRankings
    },
    scoreSummary() {
      return HOME_COUNT_CARDS.map(card => {
        const stat = this.countStats[card.key] || emptyCount()
        return {
          ...card,
          joined: String(stat.cjrs),
          passRate: formatPassRate(stat.tgl),
          note: '本批次统计'
        }
      })
    }
  },
  watch: {
    pcId() {
      this.loadDashboard()
    }
  },
  mounted() {
    this.loadBatches()
    window.addEventListener('resize', this.resizeChart)
  },
  activated() {
    this.$nextTick(this.resizeChart)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeChart)
    if (this.chart) this.chart.dispose()
  },
  methods: {
    queryParams() {
      return { pcId: this.pcId || '' }
    },
    resizeChart() {
      if (this.chart) this.chart.resize()
    },
    reload() {
      this.loadBatches()
    },
    openImport() {
      if (!this.pcId) {
        this.$message.warning('请先选择考试批次')
        return
      }
      this.importScope = this.rankMode === 'team' ? 'team' : 'personal'
      this.importFiles = []
      this.importVisible = true
    },
    onFileChange(file, fileList) {
      this.importFiles = fileList.slice(-1)
    },
    onFileRemove() {
      this.importFiles = []
    },
    async downloadTemplate() {
      try {
        const response = await getPracticeTemplate(this.importScope)
        const payload = (response && response.data) || {}
        const blob = new Blob([`\uFEFF${payload.content || ''}`], { type: 'text/csv;charset=utf-8' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = payload.fileName || '实操成绩导入模板.csv'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        this.$message.error((error && error.message) || '模板下载失败')
      }
    },
    async confirmImport() {
      if (!this.pcId) {
        this.$message.warning('请先选择考试批次')
        return
      }
      const file = this.importFiles[0] && this.importFiles[0].raw
      if (!file) {
        this.$message.warning('请选择成绩文件')
        return
      }
      this.importing = true
      try {
        const response = await importGhsjsc({ pcId: this.pcId, file })
        if (response && response.success === false) {
          this.$message.error(response.msg || '导入失败')
          return
        }
        this.$message.success((response && response.msg) || '实操成绩导入完成')
        this.importVisible = false
        this.importFiles = []
        await this.loadDashboard()
      } catch (error) {
        this.$message.error((error && error.message) || '导入失败')
      } finally {
        this.importing = false
      }
    },
    async loadBatches() {
      this.batchLoading = true
      try {
        this.batchOptions = await getExamBatchOptions()
        const currentExists = this.batchOptions.some(item => String(item.value) === String(this.pcId))
        this.pcId = currentExists ? this.pcId : (this.batchOptions[0] ? this.batchOptions[0].value : '')
        if (currentExists || !this.batchOptions.length) this.loadDashboard()
      } catch (error) {
        this.batchOptions = []
        this.pcId = ''
        this.$message.error((error && error.message) || '考试批次加载失败')
      } finally {
        this.batchLoading = false
      }
    },
    async loadDashboard() {
      this.loading = true
      try {
        const params = this.queryParams()
        const countReqs = HOME_COUNT_CARDS.map(card => (
          queryHomeCount({ pcId: params.pcId, type: card.type })
            .then(pickCount)
            .catch(() => emptyCount())
        ))
        const [unitResponse, personalResponse, teamResponse, ...countList] = await Promise.all([
          queryHomeCountByCity(params),
          queryHomeRank({ pcId: params.pcId, type: 1 }),
          queryHomeRank({ pcId: params.pcId, type: 2 }),
          ...countReqs
        ])
        const nextStats = {}
        HOME_COUNT_CARDS.forEach((card, index) => {
          nextStats[card.key] = countList[index] || emptyCount()
        })
        this.countStats = nextStats
        this.personalRankings = rankScoreViews(personalResponse && personalResponse.data, 'personal')
        this.teamRankings = rankScoreViews(teamResponse && teamResponse.data, 'team')
        this.renderChart(normalizeCityCount(unitResponse && unitResponse.data))
      } catch (error) {
        this.renderChart([])
        this.personalRankings = []
        this.teamRankings = []
        this.countStats = {
          theory: emptyCount(),
          scenario: emptyCount(),
          practice: emptyCount(),
          total: emptyCount()
        }
        this.$message.error((error && error.message) || '总览数据加载失败')
      } finally {
        this.loading = false
      }
    },
    renderChart(data) {
      this.unitCount = data.length
      this.$nextTick(() => {
        if (!this.$refs.unitChart) return
        this.chart = this.chart || echarts.init(this.$refs.unitChart)
        const axis = {
          axisLine: { lineStyle: { color: '#dce2eb' } },
          axisTick: { show: false },
          axisLabel: { color: '#8792a6', fontSize: 11 }
        }
        this.chart.setOption({
          color: ['#3b82f6', '#16a085'],
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          legend: { top: 0, right: 8, itemWidth: 10, itemHeight: 10, textStyle: { color: '#59657a' } },
          grid: { left: 48, right: 14, top: 38, bottom: 34 },
          xAxis: { type: 'category', data: data.map(item => item.ssds), ...axis },
          yAxis: { type: 'value', splitLine: { lineStyle: { color: '#edf0f5' } }, ...axis },
          series: [
            {
              name: '报名人数',
              type: 'bar',
              barMaxWidth: 24,
              data: data.map(item => Number(item.bmrs) || 0),
              itemStyle: { borderRadius: [3, 3, 0, 0] }
            },
            {
              name: '已完人数',
              type: 'bar',
              barMaxWidth: 24,
              data: data.map(item => Number(item.wcrs) || 0),
              itemStyle: { borderRadius: [3, 3, 0, 0] }
            }
          ]
        }, true)
      })
    }
  }
}
</script>

<style lang="less">
.overview-page .metric-head b {
  margin-left: auto;
  padding: 2px 6px;
  color: #5072a7;
  font-size: 12px;
  font-weight: 700;
  background: #edf4ff;
  border-radius: 4px;
}

.overview-page .score-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
}

.overview-page .score-pair label {
  display: block;
  color: #929baa;
  font-size: 12px;
}

.overview-page .score-pair strong {
  display: block;
  margin-top: 4px;
  color: #1e2735;
  font-size: 26px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.overview-page .score-pair div:last-child strong {
  color: #175bc7;
}

.overview-page .metric-note {
  margin-top: 12px;
  color: #7d8798;
  font-size: 12px;
}

.overview-page .rule-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.overview-page .rule-copy h2 {
  color: #273142;
  font-size: 15px;
}

.overview-page .rule-copy p {
  margin-top: 4px;
  color: #929baa;
  font-size: 12px;
}

.overview-page .rule-formula {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: #667085;
}

.overview-page .rule-formula i {
  font-style: normal;
  color: #b0b8c6;
}

.overview-page .rule-formula em {
  color: #175bc7;
  font-style: normal;
  font-weight: 700;
}

.overview-page .rule-chip,
.overview-page .mix-legend em {
  display: inline-flex;
  align-items: center;
  padding: 5px 9px;
  font-size: 12px;
  font-style: normal;
  border-radius: 4px;
}

.overview-page .rule-chip.is-theory,
.overview-page .mix-legend em.is-theory {
  color: #2563eb;
  background: #eaf2ff;
}

.overview-page .rule-chip.is-scenario,
.overview-page .mix-legend em.is-scenario {
  color: #14866d;
  background: #e7f6f1;
}

.overview-page .rule-chip.is-practice,
.overview-page .mix-legend em.is-practice {
  color: #d57a06;
  background: #fff3df;
}

.overview-page .score-board {
  padding: 18px 18px 8px;
}

.overview-page .board-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.overview-page .board-actions > span {
  padding: 4px 8px;
  color: #5072a7;
  font-size: 12px;
  background: #edf4ff;
  border-radius: 4px;
}

.overview-page .mix-legend {
  display: flex;
  gap: 8px;
  margin: 4px 0 12px;
}

.ov-import-dialog .import-hint {
  margin: 0 0 16px;
  color: #667085;
  font-size: 13px;
  line-height: 1.6;
}

.ov-import-dialog .el-upload__tip {
  margin-left: 8px;
  color: #929baa;
}

@media (max-width: 1280px) {
  .overview-page .metric-grid {
    grid-template-columns: 1fr 1fr;
  }

  .overview-page .rule-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
