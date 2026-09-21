<template>
  <section v-if="started && scenarioExam" class="scenario-exam-page">
    <div class="surface scenario-exam-toolbar">
      <div class="scenario-exam-title">
        <span class="exam-type-chip scene">场景题</span>
        <strong
          ref="scenarioExamName"
          class="scenario-exam-name"
          :class="{ 'is-collapsed': !nameExpanded }"
        >{{ scenarioExam.desp }}</strong>
        <el-button
          v-if="nameOverflow"
          type="text"
          size="mini"
          class="scenario-exam-name-toggle"
          @click="toggleScenarioExamName"
        >{{ nameExpanded ? '收起' : '展开' }}</el-button>
      </div>
      <div class="scenario-exam-actions">
        <el-button size="small" type="primary" @click="finishKs">提交试卷</el-button>
<!--        <el-button size="small" @click="exitSceneExam">返回考试列表</el-button>-->
      </div>
    </div>
    <ExamHome @needLogin="$emit('need-login')" @exam-closed="$emit('exam-closed')"/>
  </section>
  <QuestionSession v-else-if="started && examSession" :questions="examSession.questions" :title="examSession.title"
                   timed
                   :paper-id="examSession.paperId || examSession.id"
                   :duration="examSession.duration" :instant-feedback="false" :allow-restart="false"
                   :show-score-result="false"
                   :initial-answers="tempAnswers"
                   :temp-answer-handler="saveTempQuestionAnswer"
                   :submit-handler="submitExamAnswers" @completed="onTheoryExamSubmitted" @exit="exitExam"
                   @violation="$emit('violation')" @exam-closed="$emit('exam-closed')"/>
  <section v-else class="page-section competition-entry-page">
    <article v-if="examsLoading || restoringTheory" class="surface table-state"><i class="el-icon-loading"></i>{{ restoringTheory ? '正在进入试卷' : '正在加载可参加考试' }}</article>
    <template v-else-if="availableExams.length">
      <article v-for="exam in availableExams" :key="exam.id" class="surface competition-exam-card">
        <span class="competition-exam-icon"><i class="el-icon-trophy"></i></span>
        <div class="competition-exam-content">
          <div style="display: flex;align-items: center;gap: 20px;"><h2>{{ exam.name }}</h2>
            <span class="competition-exam-tag">{{ exam.paperType }}</span></div>
          <p>{{ exam.description || '当前考试正在进行中，请在规定时间内完成并提交试卷。' }}</p>
          <dl>
            <div>
              <dt>考试时间</dt>
              <dd>{{ exam.time }}</dd>
            </div>
            <div>
              <dt>考试时长</dt>
              <dd>{{ exam.duration }} 分钟</dd>
            </div>
            <div>
              <dt>试卷总分</dt>
              <dd>{{ exam.totalScore }} 分</dd>
            </div>
            <div>
              <dt>及格分数</dt>
              <dd>{{ exam.passScore }} 分</dd>
            </div>
          </dl>
        </div>
        <el-button type="primary" class="competition-start-btn" size="small"
                   :icon="hasRecordStatus(exam) ? 'el-icon-circle-check' : 'el-icon-video-play'"
                   :loading="startingExamId === exam.id"
                   :disabled="isStartDisabled(exam)"
                   :title="hasRecordStatus(exam) ? '该考试已提交，不能重复参加' : '开始考试'" @click="startExam(exam)">{{
            btnText(exam)
          }}
        </el-button>
      </article>
    </template>
    <article v-else class="surface empty-state competition-exam-empty"><i class="el-icon-document"></i>
      <h3>暂无进行中的考试</h3>
      <p>请稍后刷新查看</p>
      <el-button style="margin-top: 15px;" size="small" icon="el-icon-refresh" @click="loadAvailableExams">重新加载</el-button>
    </article>
    <article class="surface competition-record-panel">
      <div class="panel-head">
        <div>
          <h2>我的考试记录</h2>
<!--          <p>已提交的考试记录</p>-->
        </div>
        <el-button icon="el-icon-refresh" circle title="刷新考试记录" :loading="recordsLoading"
                   @click="loadExamRecords"></el-button>
      </div>
      <el-table v-loading="recordsLoading" :data="records" class="exam-element-table" empty-text="暂无考试记录"
                border stripe size="small">
        <el-table-column prop="paperTitle" label="考试名称" min-width="240"></el-table-column>
        <el-table-column prop="submitTime" label="交卷时间" width="170"></el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope"><span class="status-chip finished">{{
              scope.row.statusLabel
            }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="right" header-align="right">
          <template
              slot-scope="scope">
            <el-button type="text"
                       @click="openRecord(scope.row)">查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="recordTotal" class="element-pagination-wrap">
        <el-pagination background small
                       layout="prev, pager, next, jumper, total" :current-page="recordPageNum"
                       :page-size="recordPageSize"
                       :total="recordTotal" :disabled="recordsLoading"
                       @current-change="changeRecordPage"></el-pagination>
      </div>
    </article>

    <el-dialog title="考试记录详情" :visible.sync="recordVisible" width="760px" @closed="closeRecord" :modal="false">
      <div v-if="recordDetailLoading" class="table-state"><i class="el-icon-loading"></i>正在加载考试记录</div>
      <div v-else-if="selectedRecord" class="competition-record-detail">
        <header>
          <div>
            <h3>{{ selectedRecord.paperTitle }}</h3>
            <p>{{ selectedRecord.submitTime }}</p>
          </div>
        </header>
        <el-table :data="selectedRecord.details" border stripe size="small" max-height="320" class="record-answer-table"
                  empty-text="暂无逐题明细">
          <el-table-column type="index" label="序号" width="70"
                           align="center"></el-table-column>
          <el-table-column prop="text" label="题目"
                           min-width="180" show-overflow-tooltip></el-table-column>
          <el-table-column prop="userAnswer" label="考生答案"
                           min-width="120"></el-table-column>
        </el-table>
      </div>
      <span slot="footer"><el-button @click="recordVisible = false">关闭</el-button></span>
    </el-dialog>
  </section>
</template>

<script>
import QuestionSession from './QuestionSession.vue';
import ExamHome from './cpns/home.vue';
import {
  getExamPage,
  getExamRecord,
  getExamRecordPage,
  getExamSession,
  submitExamSession,
  saveTempAnswer,
  getTempAnswer,
  toExamRecordView,
  toExamSessionView,
  toExamView,
  startExam as startExamRequest, finishExam, logout as logoutRequest,
  getExamTime
} from '@/api/pwgh/examCbPsk';
import { enterExamFullscreen, exitExamFullscreen, isExamFullscreen } from './examFullscreen';

export default {
  name: 'ExamCompetition',
  components: {QuestionSession, ExamHome},
  data() {
    return {
      started: false,
      restoringTheory: Boolean(localStorage.getItem('paperId')) && !localStorage.getItem('ks-active-paper'),
      examSession: null,
      tempAnswers: [],
      scenarioExam: null,
      nameExpanded: false,
      nameOverflow: false,
      availableExams: [],
      examsLoading: false,
      startingExamId: '',
      records: [],
      recordsLoading: false,
      recordPageNum: 1,
      recordPageSize: 10,
      recordTotal: 0,
      recordVisible: false,
      recordDetailLoading: false,
      selectedRecord: null
    };
  },
  watch: {
    'scenarioExam.desp'() {
      this.nameExpanded = false;
      this.measureScenarioExamName();
    }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.measureScenarioExamName);
    this.unbindExamKeyBlock();
    this.releaseExamKeyboardLock();
  },
  async mounted() {
    window.addEventListener('resize', this.measureScenarioExamName);
    this.restoreActiveScenarioExam();
    this.restoreActiveTheoryExam();
    this.loadAvailableExams();
    this.loadExamRecords();
    this.measureScenarioExamName();
  },
  methods: {
    toggleScenarioExamName() {
      this.nameExpanded = !this.nameExpanded;
    },
    measureScenarioExamName() {
      this.$nextTick(() => {
        const el = this.$refs.scenarioExamName;
        if (!el || !this.scenarioExam || !this.scenarioExam.desp) {
          this.nameOverflow = false;
          return;
        }
        if (this.nameExpanded) {
          const lineHeight = parseFloat(window.getComputedStyle(el).lineHeight) || 25;
          this.nameOverflow = el.scrollHeight > lineHeight + 1;
        } else {
          this.nameOverflow = el.scrollWidth > el.clientWidth + 1;
        }
        if (!this.nameOverflow) this.nameExpanded = false;
      });
    },
    notifyExamState(answering, exam) {
      if (!answering) {
        this.unbindExamKeyBlock();
        this.releaseExamKeyboardLock();
        this.$emit('exam-state-change', { answering: false });
        return;
      }
      const paperType = exam && (exam.paperTypeCode || exam.paperType);
      const scenario = paperType === 'SCENARIO' || paperType === '场景题';
      if (!scenario) this.bindExamKeyBlock();
      this.$emit('exam-state-change', {
        answering: true,
        scenario,
        paperId: exam && (exam.id || exam.paperId)
      });
    },
    onExamKeyBlock(event) {
      const key = String(event.key || '').toLowerCase();
      if (key === 'escape' || key === 'f5' || key === 'f11' || key === 'f12') {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
      }
    },
    requestExamKeyboardLock() {
      if (!window.navigator.keyboard || typeof window.navigator.keyboard.lock !== 'function') {
        this.$message.warning('当前浏览器不支持键盘锁（Keyboard Lock），请使用 HTTPS 环境下的 Chrome/Edge');
        return Promise.resolve();
      }
      return window.navigator.keyboard.lock(['Escape', 'F5', 'F11', 'F12'])
        .catch(error => Promise.reject(new Error(error && error.message ? error.message : '键盘锁请求失败')));
    },
    releaseExamKeyboardLock() {
      if (window.navigator.keyboard && typeof window.navigator.keyboard.unlock === 'function') {
        window.navigator.keyboard.unlock();
      }
    },
    bindExamKeyBlock() {
      if (this._examKeyBlockBound) return;
      window.addEventListener('keydown', this.onExamKeyBlock, true);
      this._examKeyBlockBound = true;
    },
    unbindExamKeyBlock() {
      if (!this._examKeyBlockBound) return;
      window.removeEventListener('keydown', this.onExamKeyBlock, true);
      this._examKeyBlockBound = false;
    },
    restoreActiveScenarioExam() {
      const storedExam = localStorage.getItem('ks-active-paper');
      if (!storedExam) return;
      try {
        this.scenarioExam = JSON.parse(storedExam);
        this.started = true;
        this.notifyExamState(true, this.scenarioExam);
      } catch (error) {
        localStorage.removeItem('ks-active-paper');
      }
    },
    async restoreActiveTheoryExam() {
      if (this.started || localStorage.getItem('ks-active-paper')) {
        this.restoringTheory = false;
        return;
      }
      const paperId = localStorage.getItem('paperId');
      if (!paperId) {
        this.restoringTheory = false;
        return;
      }
      this.restoringTheory = true;
      try {
        const matched = this.availableExams.find(item => String(item.id) === String(paperId));
        const exam = matched || { id: paperId, paperId, paperType: 'QA', paperTypeCode: 'QA', status: '进行中' };
        if (exam.paperTypeCode === 'SCENARIO' || exam.paperType === '场景题') {
          this.restoringTheory = false;
          return;
        }
        const response = await getExamSession(paperId);
        this.examSession = toExamSessionView(response.data, exam);
        if (!this.examSession.questions.length) {
          this.examSession = null;
          this.$message.warning('当前试卷暂无题目');
          return;
        }
        this.tempAnswers = await this.loadTempAnswers(this.examSession.paperId || paperId);
        this.started = true;
        this.notifyExamState(true, { ...exam, ...this.examSession });
      } catch (error) {
        this.examSession = null;
        this.started = false;
      } finally {
        this.restoringTheory = false;
      }
    },
    findExamRecord(exam) {
      const examId = exam && exam.id;
      if (examId == null || examId === '') return null;
      return this.records.find(record => String(record.paperId) === String(examId)) || null;
    },
    recordStatusValue(exam) {
      const record = this.findExamRecord(exam);
      if (!record) return null;
      return record.status == null || record.status === '' ? record.statusCode : record.status;
    },
    hasRecordStatus(exam) {
      const status = this.recordStatusValue(exam);
      return status != null && status !== '';
    },
    isStartDisabled(exam) {
      return this.hasRecordStatus(exam)
        || (Boolean(this.startingExamId) && this.startingExamId !== exam.id);
    },
    btnText(exam) {
      const paperId = localStorage.getItem('paperId');
      if (this.hasRecordStatus(exam) || exam.status === 'FINISHED') {
        return '考试已结束'
      } else if (this.startingExamId === exam.id) {
        return '正在加载'
      } else if (String(exam.id) === String(paperId) && exam.status === '进行中' && !this.hasRecordStatus(exam)) {
        return '正在考试'
      } else {
        return '开始考试'
      }
    },
    finishKs() {
      this.$confirm('确定要提交试卷吗？提交后将结束考试，是否继续？', '提示', {type: 'warning'})
          .then(() => {
            finishExam().then(res => {
              if (res && res.success === false) {
                this.$message.error(res.msg || '提交失败');
                return;
              }
              this.started = false;
              this.scenarioExam = null;
              localStorage.removeItem('ks-active-paper');
              localStorage.removeItem('paperId');
              this.notifyExamState(false);
              this.$message.success('提交成功，结束考试!');
              this.$emit('logout');
            }).catch(error => {
              this.$message.error(error.message || '提交失败');
            });
          })
          .catch(error => {
            if (error !== 'cancel' && error !== 'close') this.$message.error(error.message || '提交失败');
          });
    },
    onTheoryExamSubmitted() {
      this.started = false;
      this.examSession = null;
      this.tempAnswers = [];
      localStorage.removeItem('paperId');
      this.notifyExamState(false);
      this.$message.success('提交成功，结束考试!');
      this.$emit('logout');
    },
    async loadAvailableExams() {
      this.examsLoading = true;
      try {
        const response = await getExamPage({pageNum: 1, pageSize: 100, status: 'IN_PROGRESS'});
        const page = response.data || {};
        this.availableExams = (Array.isArray(page.list) ? page.list : []).map(source => ({
          ...toExamView(source),
          participationStatus: String(source.status || '').toUpperCase()
        }));
      } catch (error) {
        this.availableExams = [];
        this.$message.error(error.message || '进行中考试加载失败');
      } finally {
        this.examsLoading = false;
      }
    },
    isExamCompleted(exam) {
      return ['SUBMITTED', 'GRADED'].includes(String((exam && exam.participationStatus) || '').toUpperCase());
    },
    parseExamTime(value) {
      if (typeof value === 'number') return value;
      if (!value) return 0;
      const timestamp = new Date(String(value).replace(/-/g, '/')).getTime();
      return Number.isNaN(timestamp) ? 0 : timestamp;
    },
    compareDateTime(firstTime, secondTime) {
      const first = this.parseExamTime(firstTime);
      const second = this.parseExamTime(secondTime);
      if (!first || !second) return NaN;
      return first - second;
    },
    isScenarioExam(exam) {
      const paperType = exam && (exam.paperTypeCode || exam.paperType);
      return paperType === 'SCENARIO' || paperType === '场景题';
    },
    confirmTheoryFullscreen() {
      this.bindExamKeyBlock();
      if (isExamFullscreen()) {
        return this.requestExamKeyboardLock().then(() => {
          if (!isExamFullscreen()) {
            this.releaseExamKeyboardLock();
            this.$message.warning('授权期间退出了全屏，键盘锁未生效，请重新进入全屏');
            return Promise.reject(new Error('exit-fullscreen'));
          }
        });
      }
      return this.$msgbox({
        title: '进入考试',
        message: '理论考试需全屏作答。请先进入全屏，再开始考试。考试过程中退出全屏或切换窗口将视为违规。',
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: '进入全屏并开始',
        cancelButtonText: '取消',
        closeOnClickModal: false,
        closeOnPressEscape: false,
        distinguishCancelAndClose: true,
        confirmButtonLoading: false,
        beforeClose: (action, instance, done) => {
          if (action !== 'confirm') {
            this.unbindExamKeyBlock();
            this.releaseExamKeyboardLock();
            instance.confirmButtonLoading = false;
            done();
            return;
          }
          instance.confirmButtonLoading = true;
          enterExamFullscreen()
            .then(() => this.requestExamKeyboardLock())
            .then(() => {
              if (!isExamFullscreen()) {
                this.releaseExamKeyboardLock();
                instance.confirmButtonLoading = false;
                this.$message.warning('授权期间退出了全屏，键盘锁未生效，请重新进入全屏');
                done('cancel');
                return;
              }
              instance.confirmButtonLoading = false;
              done();
            })
            .catch(error => {
              instance.confirmButtonLoading = false;
              this.$message.warning((error && error.message) || '未能进入全屏，请允许浏览器全屏后重试');
            });
        }
      });
    },
    async startExam(exam) {
      if (this.hasRecordStatus(exam)) {
        this.$message.info('该考试已完成，不能重复参加');
        return;
      }
      const isScenario = this.isScenarioExam(exam);
      if (!isScenario) {
        try {
          await this.confirmTheoryFullscreen();
        } catch (error) {
          return;
        }
        if (!isExamFullscreen()) {
          this.$message.warning('理论考试需全屏作答，请允许全屏后重新开始');
          return;
        }
      }
      this.startingExamId = exam.id;
      let keepFullscreen = isScenario;
      try {
        const timeRes = await getExamTime({ paperId: exam.id });
        if (timeRes && timeRes.success === false) {
          this.$message.error(timeRes.msg || '获取考试时间失败');
          return;
        }
        const timeData = (timeRes && timeRes.data) || {};
        if (timeData.examStatus != null && String(timeData.examStatus).trim() !== '') {
          this.$emit('exam-closed');
          return;
        }
        if (timeData.sfwg === 1 || timeData.sfwg === '1' || timeData.sfwg === true) {
          this.$emit('violation');
        }
        const { currentTime, startTime, endTime } = timeData;
        const result1 = this.compareDateTime(currentTime, startTime);
        const result2 = this.compareDateTime(currentTime, endTime);
        if (Number.isNaN(result1) || Number.isNaN(result2)) {
          this.$message.error('时间异常!');
          return;
        }
        if (result1 < 0) {
          this.$message.error('还未到考试时间!');
          return;
        }
        if (result2 >= 0) {
          this.$message.error('考试已结束!');
          return;
        }

        const prevPaperId = localStorage.getItem('paperId');
        const inProgress = exam.status === '进行中' || exam.status === 'IN_PROGRESS';
        const isResume = String(exam.id) === String(prevPaperId) && inProgress;
        localStorage.setItem('paperId', exam.id);
        if (!isResume) {
          const startRes = await startExamRequest({ paperId: exam.id });
          if (startRes && startRes.success === false) {
            this.$message.error(startRes.msg || '开始考试失败');
            if (prevPaperId) localStorage.setItem('paperId', prevPaperId);
            else localStorage.removeItem('paperId');
            return;
          }
        }
        if (isScenario) {
          this.scenarioExam = exam;
          localStorage.setItem('ks-active-paper', JSON.stringify(exam));
          this.started = true;
          this.notifyExamState(true, exam);
          keepFullscreen = true;
          return;
        }
        const response = await getExamSession(exam.id);
        this.examSession = toExamSessionView(response.data, exam);
        if (!this.examSession.questions.length) {
          this.$message.warning('当前试卷暂无题目');
          return;
        }
        this.tempAnswers = await this.loadTempAnswers(this.examSession.paperId);
        this.started = true;
        this.notifyExamState(true, exam);
        keepFullscreen = true;
      } catch (error) {
        this.$message.error(error.message || '开始考试失败');
      } finally {
        this.startingExamId = '';
        if (!isScenario && !keepFullscreen) exitExamFullscreen();
        if (!isScenario && !keepFullscreen) this.releaseExamKeyboardLock();
        if (!this.started) this.unbindExamKeyBlock();
      }
    },
    async loadTempAnswers(paperId) {
      if (!paperId) return [];
      try {
        const response = await getTempAnswer({ paperId });
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        return [];
      }
    },
    async saveTempQuestionAnswer({ questionId, answer }) {
      const paperId = this.examSession && this.examSession.paperId;
      if (!paperId || questionId == null || questionId === '') return;
      try {
        await saveTempAnswer({ paperId, questionId, answer });
      } catch (error) {
        this.$message.error(error.message || '答案暂存失败');
      }
    },
    async submitExamAnswers({answers}) {
      const response = await submitExamSession({paperId: this.examSession.paperId, answers});
      const result = response.data;
      const recordId = result && typeof result === 'object' ? (result.recordId || result.id) : result;
      if (recordId == null || recordId === '') throw new Error(response.msg);
      const recordResponse = await getExamRecord(recordId);
      return toExamRecordView(recordResponse.data);
    },
    async loadExamRecords() {
      this.recordsLoading = true;
      try {
        const response = await getExamRecordPage({pageNum: this.recordPageNum, pageSize: this.recordPageSize});
        const page = response.data || {};
        this.records = (Array.isArray(page.list) ? page.list : []).map(toExamRecordView);
        this.recordPageNum = Number(page.pageNum) || this.recordPageNum;
        this.recordPageSize = Number(page.pageSize) || this.recordPageSize;
        this.recordTotal = Number(page.total) || 0;
      } catch (error) {
        this.records = [];
        this.recordTotal = 0;
        this.$message.error(error.message || '考试记录加载失败');
      } finally {
        this.recordsLoading = false;
      }
    },
    changeRecordPage(page) {
      this.recordPageNum = page;
      this.loadExamRecords();
    },
    async openRecord(record) {
      this.recordVisible = true;
      this.recordDetailLoading = true;
      this.selectedRecord = record;
      try {
        const response = await getExamRecord(record.id);
        this.selectedRecord = toExamRecordView(response.data);
      } catch (error) {
        this.$message.error(error.message || '考试记录详情加载失败');
      } finally {
        this.recordDetailLoading = false;
      }
    },
    closeRecord() {
      this.recordVisible = false;
      this.selectedRecord = null;
    },
    exitExam() {
      this.started = false;
      this.examSession = null;
      this.tempAnswers = [];
      localStorage.removeItem('paperId');
      this.notifyExamState(false);
      this.loadAvailableExams();
      this.loadExamRecords();
    },
    async exitSceneExam() {
      // try {
      //   await this.$confirm('场景考试尚未在此页面提交，确认返回考试列表吗？', '返回考试列表', {
      //     type: 'warning', confirmButtonText: '确认返回', cancelButtonText: '继续考试'
      //   });
      // } catch (error) {
      //   return;
      // }
      this.started = false;
      this.scenarioExam = null;
      localStorage.removeItem('ks-active-paper');
      // localStorage.removeItem('paperId');
      this.notifyExamState(false);
      this.loadAvailableExams();
      this.loadExamRecords();
    }
  }
};
</script>
<style scoped lang="less">
@import '../../style/index.less';
</style>
