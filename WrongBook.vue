<template>
  <QuestionSession v-if="session" :questions="sessionQuestions" title="错题重练" :submit-handler="submitWrongPractice"
                   @exit="exitSession"/>
  <section v-else class="page-section">
    <div class="wrong-summary">
      <div><span>错题总数</span><strong>{{ total }}</strong></div>
      <div><span>本页待巩固</span><strong>{{ unmasteredCount }}</strong></div>
      <div><span>本页已掌握</span><strong>{{ masteredCount }}</strong></div>
    </div>
    <div class="page-actions">
      <el-input size="small" v-model.trim="keyword" class="wrong-search" prefix-icon="el-icon-search"
                clearable placeholder="搜索错题"></el-input>
      <!-- <el-select size="small" v-model="version" class="wrong-filter"
                 placeholder="试题版本">
        <el-option v-for="item in versionOptions" :key="item" :label="item" :value="item"></el-option>
      </el-select> -->
      <el-select size="small" v-model="type" class="wrong-filter"
                 placeholder="题型">
        <el-option label="全部题型" value="all"></el-option>
        <el-option label="单选题"
                   value="单选题"></el-option>
        <el-option label="多选题" value="多选题"></el-option>
        <el-option label="判断题"
                   value="判断题"></el-option>
      </el-select>
      <el-select size="small" v-model="status" class="wrong-filter"
                 placeholder="掌握状态">
        <el-option label="全部状态" value="all"></el-option>
        <el-option label="待巩固"
                   value="unmastered"></el-option>
        <el-option label="已掌握" value="mastered"></el-option>
      </el-select>
      <el-button size="small" type="primary" icon="el-icon-refresh"
                 :disabled="!filteredQuestions.length" @click="startWrongPractice">开始错题重练
      </el-button>
      <span
          class="filter-result">共 {{ filteredQuestions.length }} 道</span></div>
    <div v-loading="loading" class="wrong-content-area">
      <div v-if="filteredQuestions.length" class="wrong-list">
        <article v-for="(item, index) in filteredQuestions" :key="item.id"
                 :class="['surface', 'wrong-item', { mastered: item.mastered }]"><span class="question-index">{{
            (pageNum - 1)
            * pageSize + index + 1
          }}</span>
          <div>
            <div class="wrong-meta" style="display: flex;justify-content: space-between;">
              <div>
                <span :class="['type-chip', item.typeClass]">{{ item.type }}</span>
                <span>{{
                    item.category
                  }}</span>
                <b>{{ item.level }}</b>
                <em v-if="item.mastered" style="margin: 0 5px"><i
                    class="el-icon-circle-check"></i>已掌握</em>
                <span style="color: red;">错 {{ item.wrongCount }} 次</span>
              </div>
              <div>
                <!-- <el-button size="small" type="text"
                           :loading="actionId === item.id && actionType === 'detail'" @click="toggleAnalysis(item)">{{
                    expandedId ===
                    item.id ? '收起解析' : '查看解析'
                  }}
                </el-button> -->

                <el-button size="small" v-if="!item.mastered" type="text"
                           :loading="actionId === item.id && actionType === 'mastered'"
                           @click="markMastered(item)">标记掌握
                </el-button>
                <el-button type="danger" icon="el-icon-delete" circle plain
                           size="mini" title="移出错题集" :disabled="actionId === item.id"
                           @click="remove(item)"></el-button>
              </div>
            </div>
            <h3>{{ item.title }}</h3>
            <ul v-if="item.options.length" class="wrong-options">
              <li v-for="option in item.options" :key="option.key" :class="{
                'user-selected': isAnswerOption(item.userAnswer, option.key),
                correct: isAnswerOption(item.answer, option.key)
              }">
                <b>{{ option.key }}</b><span>{{ option.text }}</span>
                <div class="wrong-option-marks"><em v-if="isAnswerOption(item.userAnswer, option.key)">你的答案</em><em
                    v-if="isAnswerOption(item.answer, option.key)">正确答案</em></div>
              </li>
            </ul>
            <p>你的答案：<span>{{ item.userAnswer }}</span> 正确答案：<strong>{{ item.answer }}</strong></p>
            <div v-if="expandedId === item.id" class="wrong-analysis"><strong>答案解析</strong>
              <p>{{ item.analysis || '暂无解析' }}</p>
            </div>
          </div>

        </article>
      </div>
      <div v-else-if="!loading" class="surface empty-state"><i class="el-icon-circle-check"></i>
        <h3>没有符合条件的错题</h3>
        <p>调整筛选条件后再查看</p>
      </div>
    </div>
    <div v-if="total" class="surface element-pagination-wrap wrong-pagination">
      <el-pagination background small
                     layout="prev, pager, next, jumper, total" :current-page="pageNum" :page-size="pageSize"
                     :total="total"
                     :disabled="loading" @current-change="changePage"></el-pagination>
    </div>
  </section>
</template>

<script>
import QuestionSession from './QuestionSession.vue';
import {
  CURRENT_EXAM_VERSION,
  deleteWrongQuestion,
  getWrongQuestionDetail,
  getWrongQuestionPage,
  loadExamVersionState,
  markWrongQuestionMastered,
  choiceAnswerKeys,
  submitPractice,
  toPracticeResult,
  toWrongQuestionView
} from '@/api/pwgh/examCbPsk';

export default {
  name: 'WrongBook', components: {QuestionSession},
  data() {
    return {
      questions: [],
      sessionQuestions: [],
      session: false,
      keyword: '',
      type: 'all',
      status: 'all',
      version: CURRENT_EXAM_VERSION,
      versionOptions: [CURRENT_EXAM_VERSION],
      expandedId: '',
      pageNum: 1,
      pageSize: 10,
      total: 0,
      loading: false,
      actionId: '',
      actionType: ''
    };
  },
  computed: {
    masteredCount() {
      return this.questions.filter(item => item.mastered).length;
    }, unmasteredCount() {
      return this.questions.length - this.masteredCount;
    },
    filteredQuestions() {
      return this.questions.filter(item => (!this.keyword || item.title.includes(this.keyword)) && (this.type === 'all' || item.type === this.type) && (this.status === 'all' || (this.status === 'mastered' ? item.mastered : !item.mastered)));
    }
  },
  watch: {
    version() {
      this.pageNum = 1;
      this.expandedId = '';
      this.loadWrongQuestions();
    }
  },
  async mounted() {
    await this.loadVersionOptions();
    this.loadWrongQuestions();
  },
  methods: {
    isAnswerOption(answer, key) {
      return choiceAnswerKeys(answer).includes(String(key).toUpperCase());
    },
    async loadVersionOptions() {
      const state = await loadExamVersionState();
      this.versionOptions = state.versionOptions;
      this.version = state.defaultVersion;
    },
    async loadWrongQuestions() {
      this.loading = true;
      try {
        const response = await getWrongQuestionPage({pageNum: this.pageNum, pageSize: 10, version: this.version});
        const page = response.data || {};
        this.questions = (Array.isArray(page.list) ? page.list : []).map(toWrongQuestionView);
        this.pageNum = Number(page.pageNum) || this.pageNum;
        this.pageSize = Number(page.pageSize) || this.pageSize;
        this.total = Number(page.total) || 0;
      } catch (error) {
        this.questions = [];
        this.total = 0;
        this.$message.error(error.message || '错题集加载失败');
      } finally {
        this.loading = false;
      }
    },
    changePage(page) {
      this.pageNum = page;
      this.expandedId = '';
      this.loadWrongQuestions();
    },
    async startWrongPractice() {
      try {
        const response = await getWrongQuestionPage({pageNum: 1, pageSize: -1});
        const page = response.data || {};
        this.sessionQuestions = (Array.isArray(page.list) ? page.list : []).map(toWrongQuestionView);
        this.session = true;
      } catch (error) {
        this.$message.error(error.message || '错题集加载失败');
      }
    },
    exitSession() {
      this.session = false;
      this.loadWrongQuestions();
    },
    async submitWrongPractice({answers}) {
      const response = await submitPractice({mode: 'sequence', version: this.version, answers});
      return toPracticeResult(response.data);
    },
    async toggleAnalysis(question) {
      if (this.expandedId === question.id) {
        this.expandedId = '';
        return;
      }
      this.actionId = question.id;
      this.actionType = 'detail';
      try {
        const response = await getWrongQuestionDetail(question.recordId);
        const detail = toWrongQuestionView(response.data);
        const index = this.questions.findIndex(item => item.id === question.id);
        if (index >= 0) this.$set(this.questions, index, detail);
        this.expandedId = detail.id;
      } catch (error) {
        this.$message.error(error.message || '错题详情加载失败');
      } finally {
        this.actionId = '';
        this.actionType = '';
      }
    },
    async markMastered(question) {
      this.actionId = question.id;
      this.actionType = 'mastered';
      try {
        await markWrongQuestionMastered(question.recordId);
        question.mastered = true;
        this.$message.success('已标记为掌握');
      } catch (error) {
        this.$message.error(error.message || '标记失败');
      } finally {
        this.actionId = '';
        this.actionType = '';
      }
    },
    async remove(question) {
      try {
        await this.$confirm('确认将该试题移出错题集吗？', '移出错题集', {
          type: 'warning',
          confirmButtonText: '移出',
          cancelButtonText: '取消'
        });
      } catch (error) {
        return;
      }
      this.actionId = question.id;
      this.actionType = 'delete';
      try {
        await deleteWrongQuestion(question.recordId);
        this.$message.success('已移出错题集');
        if (this.questions.length === 1 && this.pageNum > 1) this.pageNum -= 1;
        await this.loadWrongQuestions();
      } catch (error) {
        this.$message.error(error.message || '删除失败');
      } finally {
        this.actionId = '';
        this.actionType = '';
      }
    }
  }
};
</script>
