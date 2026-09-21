<template>
  <section class="page-section practice-direct-page">
    <div class="practice-mode-toolbar">
      <el-tabs :value="mode" class="practice-element-tabs" @tab-click="handleTabClick">
        <el-tab-pane name="sequence" :disabled="loading">
          <span slot="label" class="practice-tab-label"><i class="el-icon-sort"></i><strong>顺序练习</strong><small>全部 {{
            formatCount(sequenceTotal) }} 题</small></span>
        </el-tab-pane>
        <el-tab-pane name="mock" :disabled="loading">
          <span slot="label" class="practice-tab-label"><i class="el-icon-stopwatch"></i><strong>模拟考试</strong><small>随机
              {{ mockQuestionCount }} 题</small></span>
        </el-tab-pane>
      </el-tabs>
    </div>
    <template v-if="mode === 'mock' && !mockStarted">
      <article class="surface competition-exam-card mock-exam-card">
        <span class="competition-exam-icon"><i class="el-icon-stopwatch"></i></span>
        <div class="competition-exam-content">
          <div style="display: flex;align-items: center;gap: 10px;">
            <h2>配网规划能力模拟考试</h2>
            <span class="competition-exam-tag">模拟考试</span>
          </div>
          <p>从当前题库随机抽取试题，按照正式考试流程进行限时作答。</p>
          <dl>
            <div>
              <dt>考试题量</dt>
              <dd>{{ mockQuestionCount }} 题</dd>
            </div>
            <div>
              <dt>考试时长</dt>
              <dd>60 分钟</dd>
            </div>
            <div>
              <dt>试卷总分</dt>
              <dd>100 分</dd>
            </div>
            <div>
              <dt>及格分数</dt>
              <dd>60 分</dd>
            </div>
          </dl>
        </div>
        <el-button size="small" type="primary" class="competition-start-btn" icon="el-icon-video-play" :loading="loading"
          @click="startMockExam">{{ loading ? '正在抽题' : '开始模拟考试' }}</el-button>
      </article>
    </template>
    <article v-else-if="loading" class="surface table-state"><i class="el-icon-loading"></i>正在加载练习题目</article>
    <QuestionSession v-else-if="sessionQuestions.length" :key="sessionKey" :questions="sessionQuestions"
      :title="sessionTitle" :timed="mode === 'mock'" :duration="60" :instant-feedback="mode !== 'mock'" :show-exit="mode === 'mock'"
      :allow-restart="mode !== 'mock'" :navigator-page-size="50" :submit-handler="submitPracticeAnswers"
      :show-category="mode === 'sequence'"
      @exit="exitMockExam" />
    <article v-else class="surface empty-state"><i class="el-icon-document"></i>
      <h3>暂无练习题目</h3>
      <p>请稍后重新加载</p><el-button size="small" style="margin-top: 15px;" icon="el-icon-refresh" @click="loadSequence">重新加载</el-button>
    </article>
  </section>
</template>

<script>
import QuestionSession from './QuestionSession.vue';
import {
  CURRENT_EXAM_VERSION,
  MOCK_PRACTICE_QUESTION_COUNT,
  getMockPractice,
  getSequencePractice,
  submitPractice,
  toPracticeQuestionList,
  toPracticeResult
} from '@/api/pwgh/examCbPsk';

export default {
  name: 'ExamPractice',
  components: { QuestionSession },
  data() {
    return {
      sessionQuestions: [], sequenceTotal: 0, mode: 'sequence', mockStarted: false, sessionKey: 0, loading: false,
      mockQuestionCount: MOCK_PRACTICE_QUESTION_COUNT
    };
  },
  computed: {
    sessionTitle() { return this.mode === 'mock' ? '模拟考试' : '顺序练习'; }
  },
  mounted() {
    this.loadSequence();
  },
  methods: {
    formatCount(value) { return Number(value || 0).toLocaleString('zh-CN'); },
    async loadSequence() {
      this.loading = true;
      try {
        const response = await getSequencePractice({ version: CURRENT_EXAM_VERSION });
        this.sessionQuestions = toPracticeQuestionList(response.data);
        this.sequenceTotal = this.sessionQuestions.length;
        this.sessionKey += 1;
      } catch (error) {
        this.sessionQuestions = [];
        this.$message.error(error.message || '练习题目加载失败');
      } finally { this.loading = false; }
    },
    async switchMode(mode) {
      if (mode === this.mode) return;
      this.mode = mode;
      this.sessionQuestions = [];
      if (mode === 'mock') { this.mockStarted = false; return; }
      await this.loadSequence();
    },
    handleTabClick(tab) { this.switchMode(tab.name); },
    async startMockExam() {
      if (this.loading) return;
      this.loading = true;
      try {
        const response = await getMockPractice({ version: CURRENT_EXAM_VERSION });
        const questions = toPracticeQuestionList(response.data);
        if (!questions.length) { this.$message.warning('当前没有可用于模拟考试的题目'); return; }
        this.sessionQuestions = questions;
        this.mockStarted = true;
        this.sessionKey += 1;
      } catch (error) {
        this.$message.error(error.message || '模拟试卷加载失败');
      } finally { this.loading = false; }
    },
    exitMockExam() { this.mockStarted = false; this.sessionQuestions = []; },
    async submitPracticeAnswers({ answers }) {
      const response = await submitPractice({ mode: this.mode, version: CURRENT_EXAM_VERSION, answers });
      return toPracticeResult(response.data);
    }
  }
};
</script>
