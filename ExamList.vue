<template>
  <section class="page-section">
    <div class="page-actions">
      <el-input size="small" v-model.trim="keyword" class="exam-list-search" prefix-icon="el-icon-search" clearable
                placeholder="搜索考试名称或编号"></el-input>
      <el-select size="small" v-model="paperType" class="exam-list-filter" placeholder="试题类型">
        <el-option label="全部试题类型"
                   value="all"></el-option>
        <el-option label="理论题" value="QA"></el-option>
        <el-option label="场景题"
                   value="SCENARIO"></el-option>
      </el-select>
      <el-select size="small" v-model="status" class="exam-list-filter" placeholder="考试状态">
        <el-option label="全部状态"
                   value="all"></el-option>
        <el-option label="待开始" value="NOT_START"></el-option>
        <el-option label="进行中"
                   value="IN_PROGRESS"></el-option>
        <el-option label="已结束" value="FINISHED"></el-option>
      </el-select>
      <el-select size="small" v-model="version" class="exam-list-filter" placeholder="试题版本">
        <el-option v-for="item in versionOptions" :key="item" :label="item" :value="item"></el-option>
      </el-select>
      <span class="exam-filter-result">共 {{ total }} 场考试</span>
    </div>
    <article class="surface table-surface element-table-surface">
      <el-table v-loading="loading" :data="exams" class="exam-element-table" empty-text="暂无符合条件的考试" border
                stripe size="small" height="77vh"
                @row-dblclick="openDetail">
        <el-table-column label="考试名称" min-width="240">
          <template slot-scope="scope">
            <div class="exam-name"><strong>{{ scope.row.name }}</strong><span>考试编号：{{ scope.row.id }}</span></div>
          </template>
        </el-table-column>
        <el-table-column label="试题类型" width="130">
          <template slot-scope="scope"><span
              :class="['exam-type-chip', scope.row.paperTypeCode === 'SCENARIO' ? 'scene' : 'qa']"><i
              :class="scope.row.paperTypeCode === 'SCENARIO' ? 'el-icon-picture-outline-round' : 'el-icon-chat-line-square'"></i>{{
              scope.row.paperType
            }}</span></template>
        </el-table-column>
        <el-table-column label="题目数量" width="100">
          <template slot-scope="scope">{{ scope.row.questionCount }}
            道
          </template>
        </el-table-column>
        <el-table-column label="试卷总分" width="100">
          <template slot-scope="scope">{{ scope.row.totalScore }}
            分
          </template>
        </el-table-column>
        <el-table-column label="及格分数" width="100">
          <template slot-scope="scope">{{ scope.row.passScore }}
            分
          </template>
        </el-table-column>
        <el-table-column label="考试时间" width="210">
          <template slot-scope="scope"><div>
            <div>
              {{ scope.row.startTime }} ~
            </div>
            <div>{{ scope.row.endTime }}</div>
          </div>
          </template>
        </el-table-column>
        <el-table-column label="考试时长" width="110">
          <template slot-scope="scope">{{ scope.row.duration }}
            分钟
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope"><span
              :class="['status-chip', scope.row.statusClass]">{{ scope.row.status }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="420" align="right" header-align="right">
          <template
              slot-scope="scope">
            <el-button type="text" @click="openDetail(scope.row)">查看</el-button>
            <el-button v-if="scope.row.status === '待开始'" type="text" @click="openAccountPicker(scope.row)">设置参考人员</el-button>
            <el-button type="text" @click="openReviewPicker(scope.row)">{{
                isScenarioPaper(scope.row) ? '阅卷' : '考试成绩' }}</el-button>
            <el-button v-if="scope.row.status === '待开始'"
                type="text" :loading="exportingId === scope.row.id" @click="settingTime(scope.row)">设置时间
            </el-button>
            <el-button
                v-if="nextStatus(scope.row)" type="text" class="success-text-button"
                :loading="actionId === scope.row.id"
                @click="changeStatus(scope.row)">{{ nextStatus(scope.row).label }}
            </el-button>
            <el-button type="danger"
                       icon="el-icon-delete" circle plain size="mini" title="删除考试"
                       :disabled="actionId === scope.row.id"
                       @click="removeExam(scope.row)"></el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="total" class="element-pagination-wrap">
        <el-pagination background layout="prev, pager, next, jumper, total" small
                       :current-page="pageNum" :page-size="pageSize" :total="total" :disabled="loading"
                       @current-change="changePage"></el-pagination>
      </div>
    </article>

    <el-dialog title="考试详情" :visible.sync="detailVisible" width="760px" @closed="closeDetail" :modal="false">
      <div class="exam-detail-dialog">
        <p class="exam-detail-subtitle">{{ selectedExam ? `考试编号：${selectedExam.id}` : '正在加载' }}</p>
        <div v-if="detailLoading" class="table-state"><i class="el-icon-loading"></i>正在加载考试详情</div>
        <template v-else-if="selectedExam">
          <div class="exam-detail-heading"><span
              :class="['exam-type-chip', selectedExam.paperTypeCode === 'SCENARIO' ? 'scene' : 'qa']">{{
              selectedExam.paperType
            }}</span><span :class="['status-chip', selectedExam.statusClass]">{{
              selectedExam.status
            }}</span>
            <h3>{{ selectedExam.name }}</h3>
          </div>
          <dl class="exam-detail-grid">
            <div>
              <dt>试卷类型</dt>
              <dd>{{ selectedExam.paperType }}</dd>
            </div>
            <div>
              <dt>题目数量</dt>
              <dd>{{ selectedExam.questionCount }} 道</dd>
            </div>
            <div>
              <dt>试卷总分</dt>
              <dd>{{ selectedExam.totalScore }} 分</dd>
            </div>
            <div>
              <dt>及格分数</dt>
              <dd>{{ selectedExam.passScore }} 分</dd>
            </div>
            <div>
              <dt>考试时长</dt>
              <dd>{{ selectedExam.duration }} 分钟</dd>
            </div>
            <div>
              <dt>当前状态</dt>
              <dd>{{ selectedExam.status }}</dd>
            </div>
          </dl>
          <section class="exam-detail-questions">
            <div class="exam-detail-section-head">
              <h4>试题明细</h4><span>共 {{ selectedExam.questions.length }} 道</span>
            </div>
            <el-table :data="selectedExam.questions" size="small" max-height="320"
                      class="exam-detail-question-table" empty-text="暂无试题明细">
              <el-table-column prop="sortOrder" label="序号"
                               width="80" align="center"></el-table-column>
              <el-table-column prop="text" label="题目名称"
                               min-width="260"></el-table-column>
              <el-table-column label="分值" width="110" align="right">
                <template
                    slot-scope="scope">{{ scope.row.score }} 分
                </template>
              </el-table-column>
            </el-table>
          </section>
        </template>
      </div>
      <span slot="footer"><el-button @click="closeDetail">关闭</el-button><el-button
          v-if="selectedExam && selectedExam.paperType === '理论题'" type="primary"
          icon="el-icon-download"
          :loading="exportingId === selectedExam.id"
          @click="downloadExamPaper(selectedExam)">导出 Word</el-button></span>
    </el-dialog>

    <LeftPop v-if="accountDialogVisible" @close="closeAccountPicker">
      <div class="account-popup">
        <header class="account-popup-header">
          <div>
            <h2>设置参考人员</h2>
            <p>{{ accountPaper ? accountPaper.name : '' }}</p>
          </div>
          <el-button type="text" icon="el-icon-close" aria-label="关闭" @click="closeAccountPicker"></el-button>
        </header>
        <div v-loading="accountDialogLoading" class="account-popup-body">
          <section class="account-table-section">
            <div class="account-section-title">
              <h3>全部考生</h3>
              <span>共 {{ filteredAccounts.length }} / {{ allAccounts.length }} 人，可勾选参加本场考试的考生</span>
              <el-select size="small" v-model="accountParityFilter" class="account-parity-filter" placeholder="准考证号奇偶"
                         @change="onAccountParityFilterChange">
                <el-option label="全部" value="all"></el-option>
                <el-option label="奇数" value="odd"></el-option>
                <el-option label="偶数" value="even"></el-option>
              </el-select>
            </div>
            <el-table ref="accountTable" :data="filteredAccounts" :row-key="accountRowKey" border stripe size="small"
                      max-height="280" empty-text="暂无符合条件的考生" @selection-change="handleAccountSelectionChange">
              <el-table-column type="selection" width="48" align="center" reserve-selection
                               :selectable="canSelectAccount"></el-table-column>
              <el-table-column prop="userName" label="姓名" min-width="110"></el-table-column>
              <el-table-column prop="userId" label="账号" min-width="130"></el-table-column>
              <el-table-column prop="zkzNum" label="准考证号" min-width="140" show-overflow-tooltip></el-table-column>
              <el-table-column prop="ssds" label="地市" min-width="100"></el-table-column>
              <el-table-column prop="yxdw" label="单位" min-width="170" show-overflow-tooltip></el-table-column>
              <el-table-column prop="dept" label="部门" min-width="120" show-overflow-tooltip></el-table-column>
              <el-table-column label="考试状态" width="96" align="center">
                <template slot-scope="scope"><span :class="['status-chip', accountStatusMeta(scope.row).className]">{{
                    accountStatusMeta(scope.row).label }}</span></template>
              </el-table-column>
              <el-table-column label="得分" width="80" align="center">
                <template slot-scope="scope"><strong>{{ accountScoreText(scope.row) }}</strong></template>
              </el-table-column>
            </el-table>
          </section>
          <section class="account-table-section selected-account-section">
            <div class="account-section-title">
              <h3>已选考生</h3>
              <span>已选择 {{ selectedAccounts.length }} 人</span>
            </div>
            <el-table :data="selectedAccounts" :row-key="accountRowKey" border size="small" max-height="190"
                      empty-text="暂未选择考生">
              <el-table-column prop="userName" label="姓名" min-width="110"></el-table-column>
              <el-table-column prop="userId" label="账号" min-width="130"></el-table-column>
              <el-table-column prop="yxdw" label="单位" min-width="190" show-overflow-tooltip></el-table-column>
              <el-table-column label="考试状态" width="96" align="center">
                <template slot-scope="scope"><span :class="['status-chip', accountStatusMeta(scope.row).className]">{{
                    accountStatusMeta(scope.row).label }}</span></template>
              </el-table-column>
              <el-table-column label="得分" width="80" align="center">
                <template slot-scope="scope"><strong>{{ accountScoreText(scope.row) }}</strong></template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="right" header-align="right">
                <template slot-scope="scope"><el-button type="text" class="danger-text-button"
                                                         @click="removeSelectedAccount(scope.row)">移除</el-button></template>
              </el-table-column>
            </el-table>
          </section>
        </div>
        <footer class="account-popup-footer">
          <el-button @click="closeAccountPicker">取消</el-button>
          <el-button type="primary" :loading="accountSaving" :disabled="accountDialogLoading"
                     @click="saveAccounts">确认设置</el-button>
        </footer>
      </div>
    </LeftPop>

    <LeftPop v-if="reviewDialogVisible" @close="closeReviewPicker">
      <div class="account-popup review-account-popup">
        <header class="account-popup-header">
          <div>
            <h2>{{ isReviewScenario ? '场景题阅卷' : '理论题考试成绩' }}</h2>
            <p>{{ reviewPaper ? reviewPaper.name : '' }}</p>
          </div>
          <div class="account-popup-header-actions">
            <el-button type="primary" size="small" icon="el-icon-download"
                       :loading="exportingScore" @click="exportReviewScore">导出成绩</el-button>
            <el-button type="text" icon="el-icon-close" aria-label="关闭" @click="closeReviewPicker"></el-button>
          </div>
        </header>
        <div v-loading="reviewDialogLoading" class="account-popup-body">
          <div class="account-section-title">
            <h3>已设置参考人员</h3>
            <span>共 {{ reviewAccounts.length }} 人</span>
          </div>
          <el-table :data="reviewAccounts" :row-key="accountRowKey" border stripe size="small" max-height="520"
                    empty-text="该试卷暂未设置参考人员">
            <el-table-column prop="userName" label="姓名" min-width="110"></el-table-column>
            <el-table-column prop="userId" label="账号" min-width="130"></el-table-column>
            <el-table-column prop="ssds" label="地市" min-width="100"></el-table-column>
            <el-table-column prop="yxdw" label="单位" min-width="170" show-overflow-tooltip></el-table-column>
            <el-table-column prop="dept" label="部门" min-width="120" show-overflow-tooltip></el-table-column>
            <el-table-column label="考试状态" width="96" align="center">
              <template slot-scope="scope"><span :class="['status-chip', accountStatusMeta(scope.row).className]">{{
                  accountStatusMeta(scope.row).label }}</span></template>
            </el-table-column>
            <el-table-column label="得分" width="80" align="center">
              <template slot-scope="scope"><strong>{{ accountScoreText(scope.row) }}</strong></template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="right" header-align="right">
              <template slot-scope="scope">
                <el-button v-if="isReviewScenario && canReviewAccount(scope.row)" type="text"
                           class="success-text-button" @click="reviewScenarioAccount(scope.row)">阅卷打分</el-button>
                <el-button v-else-if="!isReviewScenario" type="text"
                           @click="openScoreDetail(scope.row)">查看详情</el-button>
                <span v-else class="account-action-empty">-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <footer class="account-popup-footer"><el-button @click="closeReviewPicker">关闭</el-button></footer>
      </div>
    </LeftPop>

    <el-dialog title="考试成绩详情" :visible.sync="scoreDialogVisible" width="760px" append-to-body :z-index="3100"
               @closed="closeScoreDetail">
      <div v-loading="scoreLoading" class="account-score-dialog">
        <div v-if="scoreRecord" class="account-record-detail">
          <header>
            <div>
              <h3>{{ scoreRecord.paperTitle || (reviewPaper ? reviewPaper.name : '-') }}</h3>
              <p>{{ scoreRecord.submitTime || '-' }}</p>
            </div>
            <strong>{{ scoreRecord.score }}<small>分</small></strong>
          </header>
          <dl class="account-record-meta">
            <div><dt>姓名</dt><dd>{{ scoreUserName(scoreAccount, scoreRecord) }}</dd></div>
            <div><dt>单位名称</dt><dd>{{ scoreEntityName(scoreAccount, scoreRecord) }}</dd></div>
          </dl>
          <div class="result-stats">
            <div><span>答对</span><strong>{{ scoreRecord.correctCount }}</strong></div>
            <div><span>答错</span><strong>{{ scoreRecord.wrongCount }}</strong></div>
            <div><span>未作答</span><strong>{{ scoreRecord.unansweredCount }}</strong></div>
          </div>
          <el-table :data="scoreRecord.details" border stripe size="small" max-height="320"
                    class="record-answer-table" empty-text="暂无逐题明细">
            <el-table-column type="index" label="序号" width="70" align="center"></el-table-column>
            <el-table-column prop="text" label="题目" min-width="180" show-overflow-tooltip></el-table-column>
            <el-table-column prop="userAnswer" label="考生答案" min-width="120"></el-table-column>
            <el-table-column prop="correctAnswer" label="正确答案" min-width="120"></el-table-column>
            <el-table-column label="结果" width="90" align="center">
              <template slot-scope="scope">
                <span :class="['record-answer-result', scope.row.correct ? 'correct' : 'wrong']">
                  <i :class="scope.row.correct ? 'el-icon-check' : 'el-icon-close'"></i>
                  {{ scope.row.correct ? '正确' : '错误' }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-else-if="!scoreLoading" class="table-state">该考生暂无考试成绩</div>
      </div>
      <span slot="footer"><el-button @click="scoreDialogVisible = false">关闭</el-button></span>
    </el-dialog>

    <leftPopup class="addWtModel" v-if="ksTimeModel" style="width: 35vw;top: 25vh;left: 38vw;">
      <template slot="content">
        <h1 class="title">
          <span class="close" @click="ksTimeModel = false"></span>设置
        </h1>
        <div class="context">
          <el-form ref="ywForm" label-width="130px" label-position="right" label-suffix="：" style="width: 90%;">
            <el-form-item label="考试时间">
              <el-date-picker v-model="ksTimeArr" size="small" type="datetimerange" style="width:453px;"
                              range-separator="至" value-format="yyyy-MM-dd HH:mm:ss" start-placeholder="开始时间"
                              end-placeholder="结束时间"></el-date-picker>
            </el-form-item>
            <el-form-item label="考试时长">
              {{ getDurationMinutes(ksTimeArr && ksTimeArr[0], ksTimeArr && ksTimeArr[1]) || '-' }} 分钟
            </el-form-item>
          </el-form>
        </div>
        <div class="bottom">
          <p class="btn1 save" @click="submitKsTime">提交</p>
          <p class="btn1" @click="ksTimeModel = false">取消</p>
        </div>
      </template>
    </leftPopup>
  </section>
</template>

<script>
import {
  CURRENT_EXAM_VERSION,
  deleteExam,
  exportPaperById,
  exportScore,
  getAccountByPaper,
  getExamDetail,
  getExamPage,
  getExamRecord,
  loadExamVersionState,
  setAccounts,
  setExamTime,
  toExamRecordView,
  toExamView,
  updateExamStatus
} from '@/api/pwgh/examCbPsk';
import {listAccount} from '@/api/pwgh/examIndex';
import {downloadBlob, safeFilename} from './downloadFile';
import leftPopup from "@/components/ghsjPanel/dragPopup/index.vue";

const REVIEW_PICKER_RETURN_KEY = 'exam-review-picker-return';

const LeftPop = {
  name: 'LeftPop',
  functional: true,
  render(createElement, context) {
    return createElement('div', {class: 'exam-left-pop'}, [
      createElement('div', {
        class: 'exam-left-pop__mask',
        on: {click: () => context.listeners.close && context.listeners.close()}
      }),
      createElement('section', {class: 'exam-left-pop__panel'}, context.children)
    ]);
  }
};

function payloadRows(payload, keys) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (let index = 0; index < keys.length; index += 1) {
    if (Array.isArray(payload[keys[index]])) return payload[keys[index]];
  }
  return [];
}

function accountId(account) {
  const value = account && typeof account === 'object'
      ? (account.id != null ? account.id : account.accountId)
      : account;
  return value == null ? '' : String(value);
}

function accountZkzParity(account) {
  const raw = String(account && account.zkzNum != null ? account.zkzNum : '').trim();
  if (!raw) return '';
  const last = raw[raw.length - 1];
  const digit = /\d/.test(last) ? last : ((raw.match(/\d(?!.*\d)/) || [])[0]);
  if (digit == null) return '';
  return Number(digit) % 2 === 0 ? 'even' : 'odd';
}

export default {
  name: 'ExamList',
  components: {leftPopup, LeftPop},
  data() {
    return {
      paperId: '',
      ksTimeArr: ['', ''],
      ksTimeModel: false,
      keyword: '',
      paperType: 'all',
      status: 'all',
      version: CURRENT_EXAM_VERSION,
      versionOptions: [CURRENT_EXAM_VERSION],
      exams: [],
      pageNum: 1,
      pageSize: 20,
      total: 0,
      loading: false,
      searchTimer: null,
      actionId: null,
      exportingId: null,
      detailVisible: false,
      detailLoading: false,
      selectedExam: null,
      accountDialogVisible: false,
      accountDialogLoading: false,
      accountSaving: false,
      accountPaper: null,
      allAccounts: [],
      selectedAccounts: [],
      accountParityFilter: 'all',
      syncingAccountSelection: false,
      scoreDialogVisible: false,
      scoreLoading: false,
      scoreAccount: null,
      scoreRecord: null,
      reviewDialogVisible: false,
      reviewDialogLoading: false,
      reviewPaper: null,
      reviewAccounts: [],
      exportingScore: false
    };
  },
  computed: {
    pageCount() {
      return Math.max(1, Math.ceil(this.total / this.pageSize));
    },
    isReviewScenario() {
      return this.isScenarioPaper(this.reviewPaper);
    },
    filteredAccounts() {
      if (this.accountParityFilter === 'all') return this.allAccounts;
      return this.allAccounts.filter(account => accountZkzParity(account) === this.accountParityFilter);
    }
  },
  watch: {
    keyword() {
      if (this.searchTimer) window.clearTimeout(this.searchTimer);
      this.searchTimer = window.setTimeout(() => this.reloadFromFirstPage(), 300);
    },
    paperType() {
      this.reloadFromFirstPage();
    },
    status() {
      this.reloadFromFirstPage();
    },
    version() {
      this.reloadFromFirstPage();
    }
  },
  async mounted() {
    await this.loadVersionOptions();
    await this.loadExams();
    this.restoreReviewPicker();
  },
  beforeDestroy() {
    if (this.searchTimer) window.clearTimeout(this.searchTimer);
  },
  methods: {
    accountRowKey(account) {
      return accountId(account);
    },
    canSelectAccount(account) {
      return Boolean(accountId(account));
    },
    isScenarioPaper(paper) {
      return Boolean(paper) && (paper.paperTypeCode === 'SCENARIO' || paper.paperType === '场景题');
    },
    accountStatusMeta(account) {
      if (!account || !account._assignedToPaper) return {label: '未设置', className: 'pending'};
      const status = String(account.status == null ? '' : account.status).toUpperCase();
      return {
        0: {label: '未开始', className: 'pending'},
        1: {label: '进行中', className: 'running'},
        2: {label: '待评分', className: 'pending'},
        3: {label: '已评分', className: 'finished'},
        NOT_START: {label: '未开始', className: 'pending'},
        IN_PROGRESS: {label: '进行中', className: 'running'},
        SUBMITTED: {label: '待评分', className: 'pending'},
        GRADED: {label: '已评分', className: 'finished'},
        FINISHED: {label: '已完成', className: 'finished'}
      }[status] || {label: status || '未开始', className: 'pending'};
    },
    accountScoreText(account) {
      return account && account._assignedToPaper && account.score != null && account.score !== ''
          ? `${account.score} 分` : '-';
    },
    scoreUserName(account, record) {
      const source = account || {};
      const detail = record || {};
      return detail.userName || detail.realName || detail.name
          || source.userName || source.realName || source.name || '-';
    },
    scoreEntityName(account, record) {
      const source = account || {};
      const detail = record || {};
      return detail.entityName || detail.orgName || detail.organizationName || detail.unitName || detail.yxdw
          || source.entityName || source.orgName || source.organizationName || source.unitName || source.yxdw || '-';
    },
    canReviewAccount(account) {
      const status = String(account && account.status != null ? account.status : '').toUpperCase();
      return Boolean(account && account._assignedToPaper)
          && (Number(status) > 1 || ['SUBMITTED', 'GRADED', 'FINISHED'].includes(status));
    },
    async fetchAllAccounts() {
      const accounts = [];
      const knownIds = new Set();
      const pageSize = 500;
      for (let pageNo = 1; pageNo <= 100; pageNo += 1) {
        const response = await listAccount({pageNo, pageSize});
        if (response && response.success === false) throw new Error(response.msg || '考生列表加载失败');
        const page = response && response.data ? response.data : {};
        const rows = payloadRows(page, ['records', 'list', 'rows']);
        let added = 0;
        rows.forEach(account => {
          const id = accountId(account);
          if (!id || knownIds.has(id)) return;
          knownIds.add(id);
          accounts.push(account);
          added += 1;
        });
        const total = Number(page.total) || 0;
        const pages = Number(page.pages) || 0;
        if (!rows.length || !added || (total && accounts.length >= total) || (pages && pageNo >= pages) || (!total && rows.length < pageSize)) break;
      }
      return accounts;
    },
    async loadPaperAccounts(paperId) {
      const [accounts, assignedResponse] = await Promise.all([
        this.fetchAllAccounts(),
        getAccountByPaper({paperId, pageSize: 500})
      ]);
      if (assignedResponse && assignedResponse.success === false) {
        throw new Error(assignedResponse.msg || '已设置考生加载失败');
      }
      const assignedRows = payloadRows(assignedResponse && assignedResponse.data, [
        'records', 'list', 'rows', 'accounts', 'accountIds'
      ]);
      const accountMap = new Map(accounts.map(account => [accountId(account), {
        ...account,
        _assignedToPaper: false
      }]));
      assignedRows.forEach(account => {
        const id = accountId(account);
        if (!id) return;
        const assignedAccount = account && typeof account === 'object' ? account : {};
        accountMap.set(id, {...(accountMap.get(id) || {}), ...assignedAccount, _assignedToPaper: true});
      });
      const all = Array.from(accountMap.values());
      const assignedIds = new Set(assignedRows.map(accountId).filter(Boolean));
      return {all, assigned: all.filter(account => assignedIds.has(accountId(account)))};
    },
    async openAccountPicker(exam) {
      this.accountPaper = exam;
      this.allAccounts = [];
      this.selectedAccounts = [];
      this.accountParityFilter = 'all';
      this.accountDialogVisible = true;
      this.accountDialogLoading = true;
      try {
        const result = await this.loadPaperAccounts(exam.id);
        this.allAccounts = result.all;
        this.selectedAccounts = result.assigned;
        await this.$nextTick();
        this.syncAccountSelection();
      } catch (error) {
        this.notifyError(error);
      } finally {
        this.accountDialogLoading = false;
      }
    },
    syncAccountSelection() {
      const table = this.$refs.accountTable;
      if (!table) return;
      this.syncingAccountSelection = true;
      const selectedIds = new Set(this.selectedAccounts.map(accountId));
      table.clearSelection();
      this.filteredAccounts.forEach(account => {
        if (selectedIds.has(accountId(account))) table.toggleRowSelection(account, true);
      });
      this.$nextTick(() => { this.syncingAccountSelection = false; });
    },
    async onAccountParityFilterChange() {
      await this.$nextTick();
      this.syncAccountSelection();
    },
    handleAccountSelectionChange(selection) {
      if (this.syncingAccountSelection) return;
      const visibleIds = new Set(this.filteredAccounts.map(accountId));
      const hiddenSelected = this.selectedAccounts.filter(account => !visibleIds.has(accountId(account)));
      const merged = [...hiddenSelected];
      const known = new Set(merged.map(accountId));
      selection.forEach(account => {
        const id = accountId(account);
        if (!id || known.has(id)) return;
        known.add(id);
        merged.push(account);
      });
      this.selectedAccounts = merged;
    },
    removeSelectedAccount(account) {
      const table = this.$refs.accountTable;
      if (table) table.toggleRowSelection(account, false);
      const id = accountId(account);
      this.selectedAccounts = this.selectedAccounts.filter(item => accountId(item) !== id);
    },
    closeAccountPicker() {
      if (this.accountSaving) return;
      this.accountDialogVisible = false;
      this.accountPaper = null;
      this.allAccounts = [];
      this.selectedAccounts = [];
      this.accountParityFilter = 'all';
    },
    async openReviewPicker(exam) {
      this.reviewPaper = exam;
      this.reviewAccounts = [];
      this.reviewDialogVisible = true;
      this.reviewDialogLoading = true;
      try {
        const result = await this.loadPaperAccounts(exam.id);
        this.reviewAccounts = result.assigned;
      } catch (error) {
        this.notifyError(error);
      } finally {
        this.reviewDialogLoading = false;
      }
    },
    closeReviewPicker() {
      sessionStorage.removeItem(REVIEW_PICKER_RETURN_KEY);
      this.reviewDialogVisible = false;
      this.reviewPaper = null;
      this.reviewAccounts = [];
      this.exportingScore = false;
    },
    async exportReviewScore() {
      const paper = this.reviewPaper;
      if (!paper || this.exportingScore) return;
      const paperId = paper.id != null && paper.id !== '' ? paper.id : paper.paperId;
      if (paperId == null || paperId === '') {
        this.$message.warning('当前试卷缺少编号，无法导出成绩');
        return;
      }
      this.exportingScore = true;
      try {
        const data = await exportScore({ paperId });
        const blob = data instanceof Blob ? data : new Blob([data]);
        downloadBlob(blob, `${safeFilename(paper.name, '考试成绩')}.xlsx`);
        this.$message.success('成绩导出成功');
      } catch (error) {
        this.notifyError(error);
      } finally {
        this.exportingScore = false;
      }
    },
    persistReviewPickerState() {
      if (!this.reviewPaper) return;
      sessionStorage.setItem(REVIEW_PICKER_RETURN_KEY, JSON.stringify({
        paper: {
          id: this.reviewPaper.id,
          name: this.reviewPaper.name,
          paperType: this.reviewPaper.paperType,
          paperTypeCode: this.reviewPaper.paperTypeCode,
          questionCount: this.reviewPaper.questionCount
        }
      }));
    },
    restoreReviewPicker() {
      let state = null;
      try {
        state = JSON.parse(sessionStorage.getItem(REVIEW_PICKER_RETURN_KEY));
      } catch (error) {
        state = null;
      }
      if (!state || !state.paper || !state.paper.id) return;
      const exam = this.exams.find(item => String(item.id) === String(state.paper.id)) || state.paper;
      this.openReviewPicker(exam);
    },
    reviewScenarioAccount(account) {
      if (!this.canReviewAccount(account) || !this.reviewPaper) return;
      this.persistReviewPickerState();
      this.$emit('change-student', {
        ...account,
        paperId: this.reviewPaper.id,
        reviewReturnMenu: 'exams'
      });
    },
    openScoreDetail(account) {
      if (!this.reviewPaper || !account.recordId) {
        this.$message.warning('该考生暂无考试记录');
        return;
      }
      this.scoreAccount = account;
      this.openRecord(account);
    },
    async resolvePaperQuestionCount() {
      const fromPaper = Number(this.reviewPaper && this.reviewPaper.questionCount);
      if (fromPaper > 0) return fromPaper;
      if (!this.reviewPaper || this.reviewPaper.id == null || this.reviewPaper.id === '') return 0;
      try {
        const response = await getExamDetail(this.reviewPaper.id);
        const exam = toExamView((response && response.data) || {});
        const count = Number(exam.questionCount) || (Array.isArray(exam.questions) ? exam.questions.length : 0) || 0;
        this.reviewPaper = { ...this.reviewPaper, questionCount: count };
        return count;
      } catch (error) {
        return 0;
      }
    },
    async openRecord(record) {
      this.scoreDialogVisible = true;
      this.scoreLoading = true;
      const questionCount = await this.resolvePaperQuestionCount();
      this.scoreRecord = toExamRecordView({
        ...record,
        paperId: this.reviewPaper.id,
        paperTitle: this.reviewPaper.name,
        questionCount,
        totalCount: questionCount
      });
      try {
        const response = await getExamRecord(record.recordId);
        if (response && response.success === false) throw new Error(response.msg || '考试记录详情加载失败');
        this.scoreRecord = toExamRecordView({
          paperTitle: this.reviewPaper.name,
          ...(response.data || {}),
          questionCount,
          totalCount: questionCount
        });
      } catch (error) {
        this.notifyError(error);
      } finally {
        this.scoreLoading = false;
      }
    },
    closeScoreDetail() {
      this.scoreAccount = null;
      this.scoreRecord = null;
    },
    async saveAccounts() {
      if (!this.accountPaper || this.accountSaving) return;
      this.accountSaving = true;
      try {
        const response = await setAccounts({
          paperId: this.accountPaper.id,
          accountIds: this.selectedAccounts.map(accountId).filter(Boolean)
        });
        if (response && response.success === false) throw new Error(response.msg || '参考人员设置失败');
        this.$message.success('参考人员设置成功');
        this.accountSaving = false;
        this.closeAccountPicker();
      } catch (error) {
        this.accountSaving = false;
        this.notifyError(error);
      }
    },
    submitKsTime() {
      if (!this.ksTimeArr || this.ksTimeArr && this.ksTimeArr.length < 2) {
        this.$message.error('请补充考试时间 ！')
        return;
      }
      setExamTime({
        paperId: this.paperId,
        startTime: this.ksTimeArr[0],
        endTime: this.ksTimeArr[1],
        duration: this.getDurationMinutes(this.ksTimeArr[0], this.ksTimeArr[1]) || 0
      }).then(res => {
        if (res.success) {
          this.$message.success('设置成功!');
          this.ksTimeArr = ['', ''];
          this.ksTimeModel = false;
          this.loadExams();
        } else {
          this.$message.error(res.msg);
        }
      })
    },
    settingTime(row) {
      this.paperId = row.id;
      this.ksTimeModel = true;
      this.ksTimeArr = [row.startTime || '', row.endTime || ''];
    },
    getDurationMinutes(startTime, endTime) {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      if (Number.isNaN(start) || Number.isNaN(end)) {
        return '';
      }
      return Math.max(0, Math.ceil((end - start) / 60000));
    },
    notifyError(error) {
      this.$message.error(error.message || '操作失败，请稍后重试');
    },
    async loadVersionOptions() {
      const state = await loadExamVersionState();
      this.versionOptions = state.versionOptions;
      this.version = state.defaultVersion;
    },
    async loadExams() {
      this.loading = true;
      try {
        const response = await getExamPage({
          pageNum: this.pageNum,
          pageSize: this.pageSize,
          keyword: this.keyword || undefined,
          paperType: this.paperType === 'all' ? undefined : this.paperType,
          status: this.status === 'all' ? undefined : this.status,
          version: this.version
        });
        const page = response.data || {};
        this.exams = (page.list || []).map(toExamView);
        this.pageNum = Number(page.pageNum) || this.pageNum;
        this.pageSize = Number(page.pageSize) || this.pageSize;
        this.total = Number(page.total) || 0;
      } catch (error) {
        this.exams = [];
        this.total = 0;
        this.notifyError(error);
      } finally {
        this.loading = false;
      }
    },
    reloadFromFirstPage() {
      this.pageNum = 1;
      this.loadExams();
    },
    changePage(page) {
      this.pageNum = Math.max(1, Math.min(page, this.pageCount));
      this.loadExams();
    },
    nextStatus(exam) {
      if (exam.statusCode === 'NOT_START') return {code: 'IN_PROGRESS', label: '开始'};
      if (exam.statusCode === 'IN_PROGRESS') return {code: 'FINISHED', label: '结束'};
      return null;
    },
    async changeStatus(exam) {
      const next = this.nextStatus(exam);
      if (!next) return;
      if (next.label === '开始' && (!exam.startTime || !exam.endTime)) {
        this.$message.error('请设置考试时间');
        return
      }
      try {
        await this.$confirm(`确认${next.label}“${exam.name}”吗？`, `${next.label}考试`, {
          type: 'warning',
          confirmButtonText: next.label,
          cancelButtonText: '取消'
        });
      } catch (error) {
        return;
      }
      this.actionId = exam.id;
      try {
        const res = await updateExamStatus(exam.id, next.code);
        if (res.success) {
          this.$message.success(`考试已${next.label}`);
        } else {
          this.$message.error(res.msg);
        }

        await this.loadExams();
      } catch (error) {
        this.notifyError(error);
      } finally {
        this.actionId = null;
      }
    },
    async openDetail(exam) {
      this.detailVisible = true;
      this.detailLoading = true;
      this.selectedExam = exam;
      try {
        const response = await getExamDetail(exam.id);
        this.selectedExam = toExamView({...exam, ...(response.data || {})});
      } catch (error) {
        this.notifyError(error);
      } finally {
        this.detailLoading = false;
      }
    },
    closeDetail() {
      this.detailVisible = false;
      this.selectedExam = null;
    },
    async downloadExamPaper(exam) {
      if (!exam || this.exportingId) return;
      this.exportingId = exam.id;
      try {
        const blob = await exportPaperById(exam.id);
        downloadBlob(blob, `${safeFilename(exam.paper || exam.name, '考试试卷')}.docx`);
        this.$message.success('试卷 Word 导出成功');
      } catch (error) {
        this.notifyError(error);
      } finally {
        this.exportingId = null;
      }
    },
    async removeExam(exam) {
      try {
        await this.$confirm(`确认删除“${exam.name}”吗？`, '删除考试', {
          type: 'warning',
          confirmButtonText: '删除',
          cancelButtonText: '取消'
        });
      } catch (error) {
        return;
      }
      this.actionId = exam.id;
      try {
        await deleteExam(exam.id).then(res => {
          if (res.success) {
            this.loadExams();
            this.$message.success('考试已删除');
            if (this.exams.length === 1 && this.pageNum > 1) this.pageNum -= 1;
          } else {
            this.$message.error(res.msg);
          }
        });
      } catch (error) {
        this.notifyError(error);
      } finally {
        this.actionId = null;
      }
    }
  }
};
</script>

<style scoped lang="less">
@import '../../style/index.less';

.addWtModel {
  width: 25vw;
  top: 25vh;
  left: 38vw;

  .context {
    padding: 10px;
    display: flex;

    span {
      white-space: nowrap;
    }
  }

  /deep/ .el-input__inner {
    width: 15vw;
  }

  .bottom {
    display: flex;
    justify-content: center;

    .btn1 {
      margin: 10px;
      cursor: pointer;
      height: 32px;
      width: 100px;
      line-height: 32px;
      color: #3064d4 !important;
      text-align: center;
      font-size: 14px;
      border: 1px solid #3064d4 !important;
      background: #fff !important;
    }

    .save {
      background: linear-gradient(139deg, #94b6ff 0%, #3064d4 100%) !important;
      color: #fff !important;
      border: 1px solid #d9d9d9 !important;
    }
  }
}

.exam-left-pop {
  position: fixed;
  inset: 0;
  z-index: 3000;
}

.exam-left-pop__mask {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.38);
}

.exam-left-pop__panel {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(100vw - 48px);
  max-width: 1120px;
  max-height: calc(100vh - 64px);
  overflow: hidden;
  transform: translate(-50%, -50%);
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.2);
}

.account-popup-header,
.account-popup-footer,
.account-section-title {
  display: flex;
  align-items: center;
}

.account-popup-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.account-popup-header {
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid #e5eaf2;

  h2,
  p {
    margin: 0;
  }

  h2 {
    color: #17233d;
    font-size: 18px;
  }

  p {
    margin-top: 5px;
    color: #8a98ad;
    font-size: 12px;
  }
}

.account-popup-body {
  max-height: calc(100vh - 190px);
  overflow-y: auto;
  padding: 18px 22px;
}

.account-table-section + .account-table-section {
  margin-top: 20px;
}

.account-section-title {
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;

  h3 {
    margin: 0;
    color: #24324a;
    font-size: 14px;
  }

  span {
    color: #8795aa;
    font-size: 12px;
  }
}

.account-parity-filter {
  width: 110px;
  margin-left: auto;
}

.account-popup-footer {
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px;
  border-top: 1px solid #e5eaf2;
}

.account-action-empty {
  color: #b8c1cf;
}

.account-record-detail {
  > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 4px 0 18px;
    border-bottom: 1px solid #edf0f4;

    h3 { color: #24324a; font-size: 16px; }
    p { margin-top: 6px; color: #929baa; font-size: 12px; }
    > strong { color: #2563eb; font-size: 34px; white-space: nowrap; }
    small { margin-left: 3px; font-size: 12px; }
  }

  > .result-stats {
    display: grid;
    width: 360px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin: 20px auto;
    text-align: center;

    > div { border-right: 1px solid #e6eaf0; }
    > div:last-child { border-right: 0; }
    span, strong { display: block; }
    span { color: #929baa; font-size: 12px; }
    strong { margin-top: 6px; color: #24324a; font-size: 17px; }
  }
}

.account-record-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 16px 0 0;

  > div { min-width: 0; padding: 11px 14px; background: #f6f8fb; border: 1px solid #e7ebf2; }
  dt { color: #8795aa; font-size: 12px; }
  dd { overflow: hidden; margin-top: 6px; color: #24324a; font-size: 14px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
}

.record-answer-result {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &.correct { color: #159a7f; }
  &.wrong { color: #e45f5c; }
}
</style>
