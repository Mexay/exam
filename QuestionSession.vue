<template>
  <section class="page-section learning-session-page">
    <template v-if="view === 'session' && currentQuestion">
      <div class="secondary-page-head">
        
        <div>
          <h2>{{ title }}</h2>
          <p>第 {{ formatCount(currentIndex + 1) }} 题 / 共 {{ formatCount(questionSet.length) }} 题</p>
        </div>
        <div class="action-spacer"></div>
        <span v-if="timed" class="practice-timer"><i class="el-icon-time"></i>{{ formattedTime }}</span>
        <el-button size="small" :loading="submitting" @click="finish">{{ timed ? '提前交卷' : '结束本次练习' }}</el-button>
<!--        <el-button size="small" v-if="showExit" @click="$emit('exit')">返回考试列表</el-button>-->
      </div>

      <div class="learning-layout">
        <article class="surface learning-question-card">
          <div class="learning-question-meta">
            <span :class="['type-chip', currentQuestion.typeClass]">{{ currentQuestion.type }}</span>
            <!-- <span v-if="currentQuestion.level" :class="['difficulty', currentQuestion.levelClass]">{{
              currentQuestion.level }}</span> -->
            <b>{{ formatCount(currentIndex + 1) }} / {{ formatCount(questionSet.length) }}</b>
          </div>
          <div class="learning-question-stem">
            <span v-if="showCategory && questionCategory(currentQuestion)" class="scene-category">{{ questionCategory(currentQuestion) }}</span>
            <span>{{ currentQuestion.title }}</span>
          </div>
          <div v-if="currentQuestion.type === '判断题'" class="judgment-options">
            <button v-for="option in currentQuestion.options" :key="option.key" type="button"
              :class="['judgment-option', optionClass(option.key)]"
              :disabled="instantFeedback && currentRecord.submitted" @click="toggleAnswer(option.key)">
              <b>{{ option.key }}</b><span>{{ option.text }}</span>
            </button>
          </div>
          <div v-else-if="currentQuestion.type !== '简答题'" class="learning-options">
            <button v-for="option in currentQuestion.options" :key="option.key" type="button"
              :class="optionClass(option.key)" :disabled="instantFeedback && currentRecord.submitted"
              @click="toggleAnswer(option.key)">
              <b>{{ option.key }}</b><span>{{ option.text }}</span><i
                v-if="instantFeedback && currentRecord.submitted && answerKeys(currentQuestion.answer).includes(option.key)"
                class="el-icon-check"></i>
            </button>
          </div>
          <el-input v-else v-model="currentRecord.text" class="learning-text-answer" type="textarea" :rows="6"
            :disabled="instantFeedback && currentRecord.submitted" placeholder="请输入你的答案"></el-input>
          <div v-if="instantFeedback && currentRecord.submitted"
            :class="['practice-feedback', { correct: currentRecord.correct }]">
            <div><i :class="currentRecord.correct ? 'el-icon-circle-check' : 'el-icon-circle-close'"></i><strong>{{
              currentRecord.correct ? '回答正确' : '回答错误' }}</strong><span>正确答案：{{ currentQuestion.answer }}</span></div>
            <p>{{ currentQuestion.analysis }}</p>
          </div>
          <div class="learning-question-actions">
            <el-button size="small" icon="el-icon-arrow-left" :disabled="currentIndex === 0"
              @click="goTo(currentIndex - 1)">上一题</el-button>
            <div class="action-spacer"></div>
            <template v-if="instantFeedback"><el-button size="small" v-if="!currentRecord.submitted" type="primary"
                :disabled="!hasAnswer" @click="submitAnswer">提交答案</el-button><el-button v-else size="small" type="primary"
                :loading="submitting" @click="nextQuestion">{{ currentIndex === questionSet.length - 1 ? '查看结果' : '下一题'
                }}<i class="el-icon-arrow-right el-icon--right"></i></el-button></template>
            <el-button size="small" v-else type="primary" :loading="submitting" @click="nextExamQuestion">{{ currentIndex ===
              questionSet.length
              - 1 ? '提交试卷' : '下一题' }}<i v-if="currentIndex !== questionSet.length - 1"
                class="el-icon-arrow-right el-icon--right"></i></el-button>
          </div>
        </article>

        <aside class="surface learning-navigator">
          <div class="navigator-head"><strong>答题进度</strong><span>{{ formatCount(answeredCount) }}/{{
            formatCount(questionSet.length) }}</span></div>
          <el-progress class="practice-element-progress" :percentage="progress" :stroke-width="5"
            :show-text="false"></el-progress>
          <el-collapse v-model="activeNavigatorType" accordion class="question-type-navigator">
            <el-collapse-item v-for="group in questionGroups" :key="group.type" :name="group.type">
              <template slot="title"><strong>{{ group.type }}</strong><span>{{ formatCount(groupAnsweredCount(group))
              }}/{{ formatCount(group.entries.length) }}</span></template>
              <div v-if="groupPageCount(group) > 1" class="navigator-range">
                <el-button icon="el-icon-arrow-left" circle size="mini" title="上一组题号"
                  :disabled="groupPage(group.type) === 0" @click="setGroupPage(group.type, groupPage(group.type) - 1)"></el-button>
                <el-select :value="groupPage(group.type)" size="mini" aria-label="题号区间"
                  @change="setGroupPage(group.type, $event)"><el-option v-for="page in groupPageCount(group)"
                    :key="page" :label="groupRangeLabel(group, page - 1)" :value="page - 1"></el-option></el-select>
                <el-button icon="el-icon-arrow-right" circle size="mini" title="下一组题号"
                  :disabled="groupPage(group.type) === groupPageCount(group) - 1"
                  @click="setGroupPage(group.type, groupPage(group.type) + 1)"></el-button>
              </div>
              <div class="question-number-grid">
                <button v-for="entry in visibleGroupQuestions(group)" :key="`${group.type}-${entry.item.id}-${entry.index}`"
                  type="button" :class="questionState(entry.item.id, entry.index)" @click="goTo(entry.index)">{{
                    entry.index + 1 }}</button>
              </div>
            </el-collapse-item>
          </el-collapse>
          <form v-if="questionSet.length > navigatorPageSize" class="navigator-jump" @submit.prevent="jumpToQuestion">
            <label for="question-jump">跳转题号</label>
            <el-input id="question-jump" v-model.number="jumpTarget" type="number" size="mini" :min="1"
              :max="questionSet.length"></el-input>
            <el-button type="primary" icon="el-icon-right" native-type="submit" size="mini" title="跳转"></el-button>
          </form>
          <dl>
            <div>
              <dt><i class="current-dot"></i>当前</dt>
              <dd v-if="!instantFeedback"><i class="answered-dot"></i>已作答</dd><template v-else>
                <dd><i class="correct-dot"></i>答对</dd>
                <dd><i class="wrong-dot"></i>答错</dd>
              </template>
            </div>
          </dl>
        </aside>
      </div>
    </template>

    <article v-else class="surface practice-result-panel">
      <span><i :class="showScoreResult ? 'el-icon-trophy' : 'el-icon-circle-check'"></i></span>
      <h2>{{ showScoreResult ? `${title}完成` : '试卷已提交' }}</h2>
      <p v-if="showScoreResult">本次已完成 {{ formatCount(resultAnsweredCount) }} 道 / 共 {{ formatCount(resultTotalCount) }} 道</p>
      <p v-else>答题已提交，请等待评分</p>
      <template v-if="showScoreResult">
        <div class="result-score"><strong>{{ resultScore }}</strong><span>{{ timed ? '分' : '%' }}</span></div>
        <div class="result-stats">
          <div><span>答对</span><strong>{{ resultCorrectCount }}</strong></div>
          <div><span>答错</span><strong>{{ resultWrongCount }}</strong></div>
          <div><span>未作答</span><strong>{{ resultUnansweredCount }}</strong></div>
        </div>
        <section v-if="!instantFeedback && serverResult" class="result-question-overview">
          <header><strong>每题结果</strong><span><i class="correct-dot"></i>正确<i class="wrong-dot"></i>错误<i
                class="unanswered-dot"></i>未作答</span></header>
          <div class="result-question-grid"><span v-for="(question, index) in questionSet" :key="question.id"
              :class="resultQuestionState(question)">{{ index + 1 }}</span></div>
        </section>
      </template>
      <div><el-button size="small" v-if="allowRestart" icon="el-icon-refresh" @click="restart">再做一次</el-button><el-button
          v-if="showExit" type="primary" @click="$emit('exit')">返回列表</el-button></div>
    </article>
  </section>
</template>

<script>
import { compactChoiceAnswer, choiceAnswerKeys, getExamTime } from '@/api/pwgh/examCbPsk';
import { cloneData } from './mockData';
import { examSession } from './examSession';

function createRecords(questions) {
  return questions.reduce((result, question) => {
    result[question.id] = { answers: [], text: '', submitted: false, correct: false };
    return result;
  }, {});
}

function recordAnswer(record) {
  if (!record) return '';
  if (record.text && record.text.trim()) return record.text.trim();
  const answers = Array.isArray(record.answers) ? record.answers.filter(Boolean) : [];
  if (!answers.length) return '';
  if (answers.length === 1) return String(answers[0]);
  return [...answers].map(item => String(item).trim()).sort().join('');
}

function parseSavedAnswer(question, raw) {
  const value = String(raw == null ? '' : raw).trim();
  if (!value) return { answers: [], text: '' };
  if (question.type === '简答题') return { answers: [], text: value };
  const optionKeys = (question.options || []).map(option => String(option.key));
  let parts = value.split(/[、,，]/).map(item => item.trim()).filter(Boolean);
  if (parts.length === 1 && question.type === '多选题' && !/[、,，]/.test(value) && value.length > 1) {
    const chars = value.split('');
    if (chars.every(char => optionKeys.some(key => key.toLowerCase() === char.toLowerCase()))) parts = chars;
  }
  const answers = parts.map(part => {
    if (question.type === '判断题') {
      const judged = judgmentValue(part);
      if (optionKeys.includes(judged)) return judged;
    }
    return optionKeys.find(key => key.toLowerCase() === part.toLowerCase()) || part;
  });
  return { answers, text: '' };
}

function judgmentValue(value) {
  const answer = String(value == null ? '' : value).trim().toUpperCase();
  if (['√', 'A', 'TRUE', '1', '正确', '对'].includes(answer)) return '√';
  if (['×', 'X', 'B', 'FALSE', '0', '错误', '错'].includes(answer)) return '×';
  return answer;
}

function normalizeSessionQuestions(questions) {
  return cloneData(questions).map(question => question.type === '判断题' ? {
    ...question,
    options: [{ key: '√', text: '正确' }, { key: '×', text: '错误' }],
    answer: judgmentValue(question.answer)
  } : question);
}

const QUESTION_TYPE_ORDER = ['单选题', '多选题', '判断题'];

export default {
  name: 'QuestionSession',
  props: {
    questions: { type: Array, required: true },
    title: { type: String, required: true },
    timed: { type: Boolean, default: false },
    paperId: { type: [String, Number], default: '' },
    duration: { type: Number, default: 60 },
    instantFeedback: { type: Boolean, default: true },
    submitHandler: { type: Function, default: null },
    allowRestart: { type: Boolean, default: true },
    startIndex: { type: Number, default: 0 },
    showExit: { type: Boolean, default: true },
    showScoreResult: { type: Boolean, default: true },
    navigatorPageSize: { type: Number, default: 50 },
    initialAnswers: { type: Array, default: () => [] },
    tempAnswerHandler: { type: Function, default: null },
    showCategory: { type: Boolean, default: false }
  },
  data() {
    const questionSet = normalizeSessionQuestions(this.questions);
    const initialIndex = Math.max(0, Math.min(this.startIndex, questionSet.length - 1));
    const initialType = questionSet[initialIndex] ? questionSet[initialIndex].type : '';
    const initialTypeIndex = questionSet.slice(0, initialIndex + 1).filter(question => question.type === initialType).length - 1;
    return {
      questionSet,
      currentIndex: initialIndex,
      records: createRecords(questionSet),
      activeNavigatorType: initialType,
      navigatorGroupPages: initialType ? { [initialType]: Math.floor(Math.max(0, initialTypeIndex) / this.navigatorPageSize) } : {},
      jumpTarget: initialIndex + 1,
      view: 'session',
      seconds: 0,
      timer: null,
      submitting: false,
      serverResult: null,
      examExpiredHandled: false,
      ksInfo: {
        currentTime: '',
        endTime: '',
        startTime: '',
        sfwg: '',
        wgcs: ''
      }
    };
  },
  computed: {
    currentQuestion() { return this.questionSet[this.currentIndex] || null; },
    currentRecord() { return this.currentQuestion ? this.records[this.currentQuestion.id] : null; },
    hasAnswer() { return this.currentQuestion.type === '简答题' ? Boolean(this.currentRecord.text.trim()) : this.currentRecord.answers.length > 0; },
    answeredCount() { return Object.values(this.records).filter(item => Boolean(recordAnswer(item))).length; },
    correctCount() { return Object.values(this.records).filter(item => item.submitted && item.correct).length; },
    wrongCount() { return Object.values(this.records).filter(item => item.submitted && !item.correct).length; },
    unansweredCount() { return this.questionSet.length - this.answeredCount; },
    progress() { return this.questionSet.length ? Math.round(this.answeredCount / this.questionSet.length * 100) : 0; },
    score() {
      const total = this.timed ? this.questionSet.length : this.answeredCount;
      return total ? Math.round(this.correctCount / total * 100) : 0;
    },
    resultTotalCount() { return this.serverResult ? Number(this.serverResult.totalCount) || this.questionSet.length : this.questionSet.length; },
    resultAnsweredCount() { return this.serverResult ? Number(this.serverResult.answeredCount == null ? this.resultTotalCount - this.resultUnansweredCount : this.serverResult.answeredCount) : this.answeredCount; },
    resultCorrectCount() { return this.serverResult ? Number(this.serverResult.correctCount) || 0 : this.correctCount; },
    resultWrongCount() { return this.serverResult ? Number(this.serverResult.wrongCount) || 0 : this.wrongCount; },
    resultUnansweredCount() { return this.serverResult ? Number(this.serverResult.unansweredCount) || 0 : this.unansweredCount; },
    resultScore() { return this.serverResult ? Number(this.serverResult.score) || 0 : this.score; },
    formattedTime() {
      const diff = this.parseExamTime(this.ksInfo.endTime) - this.parseExamTime(this.ksInfo.currentTime);
      if (diff <= 0 || !this.ksInfo.endTime) return '';
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      const hms = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      return days ? `${days}天${hms}` : hms;
    },
    questionGroups() {
      const groups = new Map();
      this.questionSet.forEach((item, index) => {
        if (!groups.has(item.type)) groups.set(item.type, { type: item.type, entries: [] });
        groups.get(item.type).entries.push({ item, index });
      });
      return Array.from(groups.values()).sort((first, second) => {
        const firstIndex = QUESTION_TYPE_ORDER.indexOf(first.type);
        const secondIndex = QUESTION_TYPE_ORDER.indexOf(second.type);
        return (firstIndex === -1 ? QUESTION_TYPE_ORDER.length : firstIndex)
          - (secondIndex === -1 ? QUESTION_TYPE_ORDER.length : secondIndex);
      });
    }
  },
  watch: {
    formattedTime(value) {
      if (this.timed && this.view === 'session' && !value && this.ksInfo.endTime) this.handleExamTimeUp();
    }
  },
  created() { this.applyInitialAnswers(); },
  mounted() { if (this.timed) this.startTimer(); },
  activated() { if (this.timed && this.view === 'session') this.startTimer(); },
  deactivated() { this.stopTimer(); },
  beforeDestroy() { this.stopTimer(); },
  methods: {
    formatCount(value) { return Number(value || 0).toLocaleString('zh-CN'); },
    parseExamTime(value) {
      if (typeof value === 'number') return value;
      if (!value) return 0;
      const timestamp = new Date(String(value).replace(/-/g, '/')).getTime();
      return Number.isNaN(timestamp) ? 0 : timestamp;
    },
    formatExamClock(timestamp) {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    startDurationFallback() {
      const minutes = Number(this.duration) || 0;
      if (!minutes) return;
      const now = Date.now();
      this.ksInfo = {
        currentTime: this.formatExamClock(now),
        endTime: this.formatExamClock(now + minutes * 60 * 1000),
        startTime: this.formatExamClock(now),
        sfwg: '',
        wgcs: ''
      };
      if (this.timer) window.clearInterval(this.timer);
      this.timer = window.setInterval(() => {
        const nextTime = this.parseExamTime(this.ksInfo.currentTime) + 1000;
        if (!nextTime) return;
        this.ksInfo.currentTime = this.formatExamClock(nextTime);
      }, 1000);
    },
    questionCategory(item) {
      return String((item && (item.category || item.catagory)) || '').trim();
    },
    answerKeys(value) {
      return choiceAnswerKeys(value);
    },
    ensureRecord() {
      if (!this.records[this.currentQuestion.id]) this.$set(this.records, this.currentQuestion.id, { answers: [], text: '', submitted: false, correct: false });
      return this.records[this.currentQuestion.id];
    },
    applyInitialAnswers() {
      const list = Array.isArray(this.initialAnswers) ? this.initialAnswers : [];
      list.forEach(item => {
        const questionId = String(item.questionId || item.id || '');
        if (!questionId) return;
        const question = this.questionSet.find(entry => String(entry.questionId || entry.id) === questionId);
        if (!question) return;
        const record = this.records[question.id];
        if (!record) return;
        const parsed = parseSavedAnswer(question, item.answer);
        record.answers = parsed.answers;
        record.text = parsed.text;
      });
    },
    persistCurrentTempAnswer() {
      if (!this.tempAnswerHandler || this.instantFeedback || !this.currentQuestion) return Promise.resolve();
      const question = this.currentQuestion;
      const record = this.records[question.id];
      return Promise.resolve(this.tempAnswerHandler({
        questionId: question.questionId || question.id,
        answer: recordAnswer(record)
      }));
    },
    toggleAnswer(key) {
      const record = this.ensureRecord();
      if (this.currentQuestion.type === '多选题') record.answers = record.answers.includes(key) ? record.answers.filter(item => item !== key) : [...record.answers, key];
      else record.answers = [key];
      this.persistCurrentTempAnswer();
    },
    submitAnswer() {
      const record = this.ensureRecord();
      if (this.currentQuestion.type === '简答题') {
        record.correct = Boolean(record.text.trim());
      } else {
        record.correct = compactChoiceAnswer(this.currentQuestion.answer) === compactChoiceAnswer(recordAnswer(record));
      }
      record.submitted = true;
    },
    optionClass(key) {
      const record = this.currentRecord;
      return ['learning-option', {
        selected: record.answers.includes(key),
        correct: record.submitted && this.answerKeys(this.currentQuestion.answer).includes(key),
        wrong: record.submitted && record.answers.includes(key) && !this.answerKeys(this.currentQuestion.answer).includes(key)
      }];
    },
    questionState(id, index) {
      const record = this.records[id];
      if (!this.instantFeedback) return { active: index === this.currentIndex, answered: Boolean(recordAnswer(record)) };
      return { active: index === this.currentIndex, correct: record && record.submitted && record.correct, wrong: record && record.submitted && !record.correct };
    },
    resultQuestionState(question) {
      const record = this.records[question.id];
      if (!recordAnswer(record)) return 'unanswered';
      if (!record || !record.submitted) return 'answered';
      return record.correct ? 'correct' : 'wrong';
    },
    groupAnsweredCount(group) {
      return group.entries.filter(entry => Boolean(recordAnswer(this.records[entry.item.id]))).length;
    },
    groupPage(type) { return Number(this.navigatorGroupPages[type]) || 0; },
    groupPageCount(group) { return Math.ceil(group.entries.length / this.navigatorPageSize); },
    setGroupPage(type, page) { this.$set(this.navigatorGroupPages, type, Number(page) || 0); },
    visibleGroupQuestions(group) {
      const start = this.groupPage(group.type) * this.navigatorPageSize;
      return group.entries.slice(start, start + this.navigatorPageSize);
    },
    groupRangeLabel(group, page) {
      const entries = group.entries.slice(page * this.navigatorPageSize, (page + 1) * this.navigatorPageSize);
      if (!entries.length) return '-';
      return `${entries[0].index + 1}-${entries[entries.length - 1].index + 1}`;
    },
    goTo(index) {
      this.currentIndex = Math.max(0, Math.min(index, this.questionSet.length - 1));
      const question = this.questionSet[this.currentIndex];
      if (question) {
        const group = this.questionGroups.find(item => item.type === question.type);
        const groupIndex = group ? group.entries.findIndex(entry => entry.index === this.currentIndex) : 0;
        this.activeNavigatorType = question.type;
        this.setGroupPage(question.type, Math.floor(Math.max(0, groupIndex) / this.navigatorPageSize));
      }
      this.jumpTarget = this.currentIndex + 1;
    },
    jumpToQuestion() {
      const target = Math.max(1, Math.min(Number(this.jumpTarget) || 1, this.questionSet.length));
      this.goTo(target - 1);
    },
    nextQuestion() { if (this.currentIndex === this.questionSet.length - 1) this.finish(); else this.goTo(this.currentIndex + 1); },
    async nextExamQuestion() {
      if (this.submitting) return;
      this.submitting = true;
      try {
        await this.persistCurrentTempAnswer();
      } finally {
        this.submitting = false;
      }
      if (this.currentIndex === this.questionSet.length - 1) this.finish();
      else this.goTo(this.currentIndex + 1);
    },
    buildAnswers() {
      return this.questionSet.map(question => ({
        questionId: question.questionId || question.id,
        userAnswer: compactChoiceAnswer(recordAnswer(this.records[question.id]))
      })).filter(item => item.userAnswer);
    },
    applyResultDetails(details) {
      const resultDetails = Array.isArray(details) ? details : [];
      this.questionSet.forEach(question => {
        const record = this.records[question.id];
        if (!record || !recordAnswer(record)) return;
        const questionId = String(question.questionId || question.id);
        const detail = resultDetails.find(item => String(item.questionId || item.id) === questionId);
        if (detail) {
          record.correct = detail.correct === true || detail.correct === 1 || detail.correct === '1';
          record.submitted = true;
          return;
        }
        if (!question.answer) return;
        if (question.type === '简答题') {
          record.correct = Boolean(record.text.trim());
        } else {
          record.correct = compactChoiceAnswer(question.answer) === compactChoiceAnswer(recordAnswer(record));
        }
        record.submitted = true;
      });
    },
    async finish() {
      if (this.submitting) return;
      if (this.timed && this.view === 'session' && !this.examExpiredHandled) {
        try {
          await this.$confirm('确定要提交试卷吗？提交后将结束考试，是否继续？', '提示', { type: 'warning' });
        } catch (error) {
          return;
        }
      }
      this.stopTimer();
      if (!this.submitHandler) { this.view = 'result'; return; }
      this.submitting = true;
      try {
        const result = await this.submitHandler({ answers: this.buildAnswers(), questions: this.questionSet });
        this.serverResult = result || null;
        this.applyResultDetails(result && result.details);
        this.view = 'result';
        this.$emit('completed', result);
      } catch (error) {
        this.$message.error(error.message || '提交失败，请稍后重试');
        if (this.timed && this.formattedTime) this.startTimer();
      } finally { this.submitting = false; }
    },
    handleExamTimeUp() {
      if (this.examExpiredHandled || this.view !== 'session') return;
      this.examExpiredHandled = true;
      this.stopTimer();
      this.$alert('考试已结束！', '提示', {
        type: 'warning',
        confirmButtonText: '确认',
        showCancelButton: false
      });
      this.finish();
    },
    restart() {
      this.records = createRecords(this.questionSet);
      this.currentIndex = 0;
      this.activeNavigatorType = this.questionSet[0] ? this.questionSet[0].type : '';
      this.navigatorGroupPages = {};
      this.jumpTarget = 1;
      this.seconds = 0;
      this.serverResult = null;
      this.examExpiredHandled = false;
      this.view = 'session';
      if (this.timed) this.startTimer();
    },
    startTimer() {
      this.getExamTimeInfo();
    },
    isViolationLocked(value) {
      return value === 1 || value === '1' || value === true;
    },
    hasExamEndedStatus(value) {
      return value != null && String(value).trim() !== '';
    },
    getExamTimeInfo() {
      const paperId = this.paperId || '';
      if (!paperId) {
        this.startDurationFallback();
        return;
      }
      const version = examSession.version;
      const violationVersion = examSession.violationVersion;
      return getExamTime({ paperId }).then(response => {
        if (this._isDestroyed || version !== examSession.version) return;
        const data = { ...((response && response.data) || {}) };
        if (violationVersion !== examSession.violationVersion) data.sfwg = this.ksInfo.sfwg;
        this.$set(this, 'ksInfo', data);
        if (this.hasExamEndedStatus(data.examStatus)) {
          this.stopTimer();
          this.$emit('exam-closed');
          return;
        }
        if (violationVersion === examSession.violationVersion && this.isViolationLocked(data.sfwg)) this.$emit('violation');
        if (this.timer) window.clearInterval(this.timer);
        if (!this.ksInfo.endTime) {
          this.startDurationFallback();
          return;
        }
        if (this.timed && this.view === 'session' && !this.formattedTime && this.ksInfo.endTime) {
          this.handleExamTimeUp();
          return;
        }
        this.timer = window.setInterval(() => {
          const nextTime = this.parseExamTime(this.ksInfo.currentTime) + 1000;
          if (!nextTime) return;
          this.ksInfo.currentTime = this.formatExamClock(nextTime);
        }, 1000);
      }).catch(() => {
        if (this._isDestroyed || version !== examSession.version) return;
        this.startDurationFallback();
      });
    },
    stopTimer() { if (this.timer) window.clearInterval(this.timer); this.timer = null; }
  }
};
</script>
