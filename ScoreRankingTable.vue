<template>
  <el-table
    :data="items"
    stripe
    size="small"
    class="score-table"
    :row-class-name="rowClass"
    max-height="460"
  >
    <el-table-column label="名次" width="64" align="center" fixed>
      <template slot-scope="{ row, $index }">
        <div :class="['rank-cell', rankClass(row, $index)]">
          <i v-if="row.complete && displayRank(row, $index) <= 3" class="el-icon-trophy"></i>
          <span v-else-if="row.complete">{{ displayRank(row, $index) }}</span>
          <span v-else class="rank-wait">—</span>
        </div>
      </template>
    </el-table-column>

    <el-table-column :label="nameLabel" min-width="188" fixed>
      <template slot-scope="{ row }">
        <div class="name-cell">
          <strong>{{ row.name }}</strong>
          <small>{{ row.detail }}</small>
          <div class="score-mix" :title="mixTitle(row)">
            <i class="mix-theory" :style="{ width: barWidth(row.theoryWeighted) }"></i>
            <i class="mix-scenario" :style="{ width: barWidth(row.scenarioWeighted) }"></i>
            <i class="mix-practice" :class="{ 'is-empty': !row.complete }" :style="{ width: barWidth(row.practiceWeighted) }"></i>
          </div>
        </div>
      </template>
    </el-table-column>

    <el-table-column label="理论题 30%" align="center">
      <el-table-column label="原分" width="78" align="right">
        <template slot-scope="{ row }">
          <span class="raw-score">{{ formatRaw(row.theory) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="加权分" width="84" align="right">
        <template slot-scope="{ row }">
          <span class="weighted-score">{{ formatWeighted(row.theoryWeighted) }}</span>
        </template>
      </el-table-column>
    </el-table-column>

    <el-table-column label="场景题 20%" align="center">
      <el-table-column label="原分" width="78" align="right">
        <template slot-scope="{ row }">
          <span class="raw-score">{{ formatRaw(row.scenario) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="加权分" width="84" align="right">
        <template slot-scope="{ row }">
          <span class="weighted-score">{{ formatWeighted(row.scenarioWeighted) }}</span>
        </template>
      </el-table-column>
    </el-table-column>

    <el-table-column label="规划设计实操 50%" align="center">
      <el-table-column label="原分" width="88" align="right">
        <template slot-scope="{ row }">
          <span v-if="row.complete" class="raw-score">{{ formatRaw(row.practice) }}</span>
          <span v-else class="score-pending">待导入</span>
        </template>
      </el-table-column>
      <el-table-column label="加权分" width="84" align="right">
        <template slot-scope="{ row }">
          <span v-if="row.complete" class="weighted-score">{{ formatWeighted(row.practiceWeighted) }}</span>
          <span v-else class="score-pending">—</span>
        </template>
      </el-table-column>
    </el-table-column>

    <el-table-column label="权重前总分" width="108" align="right">
      <template slot-scope="{ row }">
        <div class="total-cell">
          <strong>{{ formatRaw(row.rawTotal) }}</strong>
          <small v-if="!row.complete">缺实操</small>
        </div>
      </template>
    </el-table-column>

    <el-table-column label="权重后总分" width="118" align="right" fixed="right">
      <template slot-scope="{ row }">
        <div class="final-cell">
          <strong>{{ formatWeighted(row.weightedTotal) }}</strong>
          <small>{{ row.complete ? '计入名次' : '暂不计名次' }}</small>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
export default {
  name: 'ScoreRankingTable',
  props: {
    items: { type: Array, default: () => [] },
    mode: { type: String, default: 'personal' }
  },
  computed: {
    nameLabel() {
      return this.mode === 'team' ? '代表队' : '选手'
    }
  },
  methods: {
    displayRank(row, index) {
      return row.rank == null ? index + 1 : row.rank
    },
    rankClass(row, index) {
      if (!row.complete) return ''
      const rank = this.displayRank(row, index)
      return rank <= 3 ? `rank-${rank}` : ''
    },
    rowClass({ row }) {
      return row.complete ? '' : 'is-incomplete'
    },
    formatRaw(value) {
      if (value == null || value === '') return '—'
      return Number(value).toFixed(2)
    },
    formatWeighted(value) {
      if (value == null || value === '') return '—'
      return Number(value).toFixed(2)
    },
    barWidth(value) {
      return `${Math.max(0, Math.min(100, Number(value) || 0))}%`
    },
    mixTitle(row) {
      const practice = row.complete ? this.formatWeighted(row.practiceWeighted) : '待导入'
      return `理论 ${this.formatWeighted(row.theoryWeighted)} · 场景 ${this.formatWeighted(row.scenarioWeighted)} · 实操 ${practice}`
    }
  }
}
</script>

<style lang="less">
.score-table {
  width: 100%;
}

.score-table::before {
  display: none;
}

.score-table th {
  color: #5b677a;
  font-weight: 600;
  background: #f5f7fb;
}

.score-table .el-table__header th {
  padding: 8px 0;
}

.score-table td {
  padding: 8px 0;
}

.score-table .is-incomplete {
  color: #8a94a6;
}

.score-table .rank-cell {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  color: #778195;
  font-size: 12px;
  background: #f0f2f6;
  border-radius: 4px;
}

.score-table .rank-cell i {
  font-size: 16px;
}

.score-table .rank-wait {
  color: #b0b8c6;
}

.score-table .rank-1 { --award: #ffc400; }
.score-table .rank-2 { --award: #8fb6df; }
.score-table .rank-3 { --award: #ff6b28; }

.score-table .rank-1,
.score-table .rank-2,
.score-table .rank-3 {
  color: var(--award);
  background: #fff;
}

.score-table .name-cell {
  min-width: 0;
  padding: 2px 0;
}

.score-table .name-cell strong {
  display: block;
  color: #3d485a;
  font-size: 13px;
  line-height: 1.3;
}

.score-table .name-cell small {
  display: block;
  overflow: hidden;
  color: #929baa;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score-table .score-mix {
  display: flex;
  width: 100%;
  height: 8px;
  overflow: hidden;
  margin-top: 6px;
  background: #edf2f8;
  border-radius: 2px;
}

.score-table .score-mix i {
  display: block;
  height: 100%;
}

.score-table .mix-theory { background: #3b82f6; }
.score-table .mix-scenario { background: #16a085; }
.score-table .mix-practice { background: #f0a126; }
.score-table .mix-practice.is-empty {
  background: repeating-linear-gradient(90deg, #f8e3c4, #f8e3c4 4px, #fff6e8 4px, #fff6e8 8px);
}

.score-table .raw-score {
  color: #3d485a;
  font-variant-numeric: tabular-nums;
}

.score-table .weighted-score {
  color: #175bc7;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.score-table .score-pending {
  color: #d57a06;
  font-size: 12px;
}

.score-table .total-cell,
.score-table .final-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.25;
}

.score-table .total-cell strong {
  color: #273142;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.score-table .final-cell strong {
  color: #175bc7;
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}

.score-table .total-cell small,
.score-table .final-cell small {
  color: #929baa;
  font-size: 11px;
}
</style>
