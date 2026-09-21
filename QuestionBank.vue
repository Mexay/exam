<template>
  <section class="page-section question-bank-page">
    <template v-if="view === 'list'">
      <div class="page-actions question-bank-toolbar">
        <el-input size="small" v-model.trim="keyword" class="question-bank-search" prefix-icon="el-icon-search"
                  clearable
                  placeholder="搜索题干或编号"></el-input>
        <el-select size="small" v-model="typeFilter" class="question-bank-filter" placeholder="题型">
          <el-option label="全部题型" value="all"></el-option>
          <el-option label="单选题" value="单选题"></el-option>
          <el-option label="多选题" value="多选题"></el-option>
          <el-option label="判断题" value="判断题"></el-option>
        </el-select>
        <el-select size="small" v-model="versionFilter" class="question-bank-filter" placeholder="题库版本">
          <el-option v-for="version in versionOptions" :key="version" :label="version"
                     :value="version"></el-option>
        </el-select>
        <el-select size="small" v-model="categoryFilter" class="question-bank-filter category-filter" placeholder="试题分类"
                   filterable>
          <el-option label="全部分类" value="all"></el-option>
          <el-option v-for="item in categoryFilterOptions" :key="item.value" :label="item.label"
                     :value="item.value"></el-option>
        </el-select>
        <div class="action-spacer"></div>
        <el-button size="small" icon="el-icon-download" :loading="templateDownloading"
                   @click="downloadTemplate">下载模板
        </el-button>
        <el-button size="small" icon="el-icon-document" :loading="exporting" @click="exportQuestionBank">导出题库
        </el-button>
        <el-button size="small" icon="el-icon-upload2" @click="openImportDialog">导入题库</el-button>
        <el-button size="small" type="primary" icon="el-icon-plus" @click="openEditor()">新建试题</el-button>
      </div>

      <article class="surface table-surface element-table-surface">
        <el-table v-loading="loading" :data="questions" class="exam-element-table" empty-text="暂无符合条件的试题" height="76vh"
                  border stripe size="small"
                  @row-dblclick="openDetail">
          <el-table-column prop="id" label="试题编号" width="130" show-overflow-tooltip></el-table-column>
          <el-table-column label="题型" width="100">
            <template slot-scope="scope"><span :class="['type-chip', scope.row.typeClass]">{{
                scope.row.type
              }}</span></template>
          </el-table-column>
          <el-table-column label="题库版本" width="100" align="center">
            <template slot-scope="scope">{{ scope.row.version }}</template>
          </el-table-column>
          <el-table-column label="试题内容" min-width="380" show-overflow-tooltip>
            <template slot-scope="scope">
              <div class="question-stem-cell">
                <span v-if="questionCategory(scope.row)" class="scene-category">{{ questionCategory(scope.row) }}</span>
                <el-button type="text" class="question-title question-title-link"
                           @click="openDetail(scope.row)"><strong>{{ scope.row.title }}</strong></el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="optionText" label="选项" min-width="300" show-overflow-tooltip></el-table-column>
          <el-table-column prop="answer" label="答案" width="100" show-overflow-tooltip></el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template slot-scope="scope">
              <el-button type="text" @click="openEditor(scope.row)">编辑</el-button>
              <el-button
                  type="text" class="danger-text-button" @click="removeQuestion(scope.row)">删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="total" class="element-pagination-wrap">
          <el-pagination background small layout="prev, pager, next, jumper, total" :current-page="pageNum"
                         :page-size="pageSize" :total="total" @current-change="changePage"></el-pagination>
        </div>
      </article>
    </template>

    <template v-else-if="view === 'detail' && selected">
      <div class="secondary-page-head">
        <el-button icon="el-icon-arrow-left" circle @click="view = 'list'"></el-button>
        <div>
          <h2>试题详情</h2>
          <p>{{ selected.id }}</p>
        </div>
        <div class="action-spacer"></div>
        <el-button size="small" :loading="actionLoading" icon="el-icon-copy-document" @click="duplicateSelected">
          复制试题
        </el-button>
        <el-button size="small" type="primary" icon="el-icon-edit" @click="openEditor(selected)">编辑试题</el-button>
      </div>
      <div class="question-detail-layout">
        <article class="surface question-detail-main">
          <div class="detail-meta"><span :class="['type-chip', selected.typeClass]">{{ selected.type }}</span></div>
          <h2>{{ selected.title }}</h2>
          <ol v-if="selected.options.length" class="detail-options">
            <li v-for="option in selected.options" :key="option.key"
                :class="{ correct: answerKeys(selected).includes(option.key) }"><b>{{ option.key }}</b><span>{{
                option.text
              }}</span><i v-if="answerKeys(selected).includes(option.key)" class="el-icon-check"></i></li>
          </ol>
          <div class="answer-analysis">
            <div><span>正确答案</span><strong>{{ selected.answer }}</strong></div>
            <div><span>答案解析</span>
              <p>{{ selected.analysis || '暂无解析' }}</p>
            </div>
          </div>
        </article>
        <aside class="surface detail-side-panel">
          <h3>基础信息</h3>
          <dl>
            <div>
              <dt>试题编号</dt>
              <dd>{{ selected.id }}</dd>
            </div>
            <div>
              <dt>题型</dt>
              <dd>{{ selected.type }}</dd>
            </div>
            <div>
              <dt>分类</dt>
              <dd>{{ selected.category || '-' }}</dd>
            </div>
            <div>
              <dt>题库版本</dt>
              <dd>{{ selected.version }}</dd>
            </div>
            <div>
              <dt>选项数量</dt>
              <dd>{{ selected.options.length }} 个</dd>
            </div>
          </dl>
        </aside>
      </div>
    </template>

    <template v-else>
      <div class="secondary-page-head question-editor-head">
        <el-button icon="el-icon-arrow-left" circle @click="view = 'list'"></el-button>
        <div>
          <h2>{{ form.id ? '编辑试题' : '新建试题' }}</h2>
          <p>{{ form.id || '创建一道新的考试题目' }}</p>
        </div>
        <div class="action-spacer"></div>
        <el-button size="small" @click="view = 'list'">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="saveForm">保存</el-button>
      </div>
      <article class="surface question-editor-form element-question-editor">
        <el-form size="small" :model="form" label-position="top">
          <el-row :gutter="16">
            <el-col :xs="24" :sm="8">
              <el-form-item label="题型">
                <el-select v-model="form.type" class="full-control"
                           @change="onTypeChange">
                  <el-option label="单选题" value="单选题"></el-option>
                  <el-option label="多选题"
                             value="多选题"></el-option>
                  <el-option label="判断题" value="判断题"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="8">
              <el-form-item label="题库版本">
                <el-select v-model="form.version"
                           class="full-control" @change="loadCategories(true)">
                  <el-option v-for="version in versionOptions"
                             :key="version" :label="version" :value="version"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="8">
              <el-form-item label="分类">
                <el-select v-model="form.category" class="full-control"
                           filterable :loading="categoryLoading" placeholder="请选择题目分类">
                  <el-option v-for="item in categories"
                             :key="item.id || item.name" :label="item.name"
                             :value="item.name"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="题干内容">
            <el-input v-model="form.title" type="textarea" :rows="4"
                      placeholder="请输入试题题干"></el-input>
          </el-form-item>
          <el-form-item v-if="form.type !== '简答题'" class="answer-setting-form-item">
            <div class="answer-setting-head">
              <div><strong>正确答案设置</strong><span>点击左侧选项编号，将其设置为正确答案</span></div>
              <el-tag type="primary" effect="dark" style="color: #fff;">当前答案：{{ form.answer || '未设置' }}</el-tag>
            </div>
            <div v-for="option in form.options" :key="option.key" class="option-editor-row element-option-row">
              <el-button :type="answerKeys(form).includes(option.key) ? 'primary' : 'default'"
                         :class="['answer-selector', { 'is-answer': answerKeys(form).includes(option.key) }]"
                         @click="toggleAnswer(option.key)">{{ option.key }}
              </el-button>
              <el-input v-model="option.text" :placeholder="`请输入选项 ${option.key}`"></el-input>
              <el-button v-if="form.type !== '判断题' && form.options.length > 2" type="text"
                         class="danger-text-button option-delete-button" icon="el-icon-delete" title="删除选项"
                         @click="removeOption(option.key)"></el-button>
            </div>
            <el-button v-if="form.type !== '判断题' && form.options.length < 8" type="text" icon="el-icon-plus"
                       @click="addOption">添加选项
            </el-button>
          </el-form-item>
          <el-form-item v-else class="answer-setting-form-item">
            <div class="answer-setting-head">
              <div><strong>参考答案</strong><span>请填写评分时使用的标准答案</span></div>
            </div>
            <el-input v-model="form.answer" type="textarea" :rows="4" placeholder="请输入参考答案"></el-input>
          </el-form-item>
          <el-form-item label="答案解析">
            <el-input v-model="form.analysis" type="textarea" :rows="4"
                      placeholder="请输入答案解析"></el-input>
          </el-form-item>
        </el-form>
      </article>
    </template>

    <el-dialog title="导入题库" :visible.sync="importVisible" width="520px" @closed="resetImportForm" :modal="false">
      <el-form size="small" label-position="top" class="question-import-form">
        <el-form-item label="导入版本" required>
          <el-select v-model="importForm.version" class="full-control" placeholder="请选择题库版本">
            <el-option v-for="version in versionOptions" :key="version" :label="version"
                       :value="version"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="题库文件" required>
          <el-upload ref="questionUpload" drag action="#" :auto-upload="false" :limit="1"
                     accept=".xlsx" :file-list="importFiles" :on-change="onImportFileChange"
                     :on-remove="onImportFileRemove">
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将 Excel 文件拖到此处，或<em>点击选择</em></div>
            <div slot="tip" class="el-upload__tip">全部题目将绑定到所选版本；版本、题型和题干相同的旧题会自动覆盖</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <span slot="footer"><el-button @click="importVisible = false">取消</el-button><el-button type="primary"
                                                                                               :loading="importing"
                                                                                               @click="submitImport">{{
          importing ? '正在导入' : '开始导入'
        }}</el-button></span>
    </el-dialog>
  </section>
</template>

<script>
import {createQuestionForm} from './mockData';
import {downloadBlob} from './downloadFile';
import {
  CURRENT_EXAM_VERSION,
  deleteQuestion,
  downloadQuestionTemplate,
  duplicateQuestion,
  exportQuestions,
  getComposeCategories,
  getQuestionDetail,
  getQuestionPage,
  importQuestions,
  loadExamCategoryOptions,
  loadExamVersionState,
  saveQuestion,
  toQuestionPayload,
  toQuestionView
} from '@/api/pwgh/examCbPsk';

function createEditorForm(question, defaultVersion) {
  return {
    ...createQuestionForm(question),
    category: question ? (question.category || question.catagory || '') : '',
    version: (question && question.version) || defaultVersion || CURRENT_EXAM_VERSION
  };
}

export default {
  name: 'QuestionBank',
  data() {
    return {
      view: 'list',
      keyword: '',
      typeFilter: 'all',
      versionFilter: CURRENT_EXAM_VERSION,
      versionOptions: [CURRENT_EXAM_VERSION],
      categoryFilter: 'all',
      categoryFilterOptions: [],
      questions: [],
      selected: null,
      form: createEditorForm(),
      pageNum: 1,
      pageSize: 20,
      total: 0,
      pages: 1,
      loading: false,
      saving: false,
      actionLoading: false,
      searchTimer: null,
      categories: [],
      categoryLoading: false,
      importVisible: false,
      importing: false,
      importFiles: [],
      importForm: {version: CURRENT_EXAM_VERSION},
      templateDownloading: false,
      exporting: false,
      syncingFilters: false
    };
  },
  watch: {
    keyword() {
      this.scheduleLoad();
    },
    typeFilter() {
      this.reloadFromFirstPage();
    },
    versionFilter() {
      if (this.syncingFilters) return;
      this.handleVersionChange();
    },
    categoryFilter() {
      if (this.syncingFilters) return;
      this.reloadFromFirstPage();
    }
  },
  async mounted() {
    this.syncingFilters = true;
    await this.loadVersionOptions();
    await this.loadCategoryFilterOptions();
    this.syncingFilters = false;
    this.loadQuestions();
  },
  beforeDestroy() {
    if (this.searchTimer) window.clearTimeout(this.searchTimer);
  },
  methods: {
    notifyError(error) {
      this.$message.error(error.message || '操作失败，请稍后重试');
    },
    answerKeys(question) {
      return String(question.answer || '').split('、').filter(Boolean);
    },
    questionCategory(item) {
      return String((item && (item.category || item.catagory)) || '').trim();
    },
    requestParams() {
      return {
        pageNum: this.pageNum,
        pageSize: this.pageSize,
        keyword: this.keyword || undefined,
        type: this.typeFilter === 'all' ? undefined : this.typeFilter,
        version: this.versionFilter,
        catagory: this.categoryFilter && this.categoryFilter !== 'all' ? this.categoryFilter : undefined
      };
    },
    async loadVersionOptions() {
      const state = await loadExamVersionState();
      this.versionOptions = state.versionOptions;
      this.versionFilter = state.defaultVersion;
      this.importForm.version = state.defaultVersion;
    },
    async loadCategoryFilterOptions() {
      this.categoryFilterOptions = await loadExamCategoryOptions({version: this.versionFilter});
      if (this.categoryFilter !== 'all' && !this.categoryFilterOptions.some(item => item.value === this.categoryFilter)) {
        this.categoryFilter = 'all';
      }
    },
    async handleVersionChange() {
      this.syncingFilters = true;
      this.pageNum = 1;
      await this.loadCategoryFilterOptions();
      this.syncingFilters = false;
      this.loadQuestions();
    },
    async loadQuestions() {
      this.loading = true;
      try {
        const response = await getQuestionPage(this.requestParams());
        const page = response.data || {};
        this.questions = (page.list || []).map(toQuestionView);
        this.pageNum = Number(page.pageNum) || this.pageNum;
        this.pageSize = Number(page.pageSize) || this.pageSize;
        this.total = Number(page.total) || 0;
        this.pages = Number(page.pages) || Math.max(1, Math.ceil(this.total / this.pageSize));
      } catch (error) {
        this.questions = [];
        this.total = 0;
        this.pages = 1;
        this.notifyError(error);
      } finally {
        this.loading = false;
      }
    },
    scheduleLoad() {
      if (this.searchTimer) window.clearTimeout(this.searchTimer);
      this.searchTimer = window.setTimeout(() => this.reloadFromFirstPage(), 300);
    },
    reloadFromFirstPage() {
      this.pageNum = 1;
      this.loadQuestions();
    },
    changePage(page) {
      this.pageNum = Math.max(1, Math.min(page, this.pages));
      this.loadQuestions();
    },
    async loadCategories(force = false) {
      if (this.categoryLoading) return;
      this.categoryLoading = true;
      try {
        const response = await getComposeCategories({version: this.form.version || this.versionFilter});
        this.categories = Array.isArray(response.data) ? response.data : [];
        if (force && this.form.category && !this.categories.some(item => item.name === this.form.category)) this.form.category = '';
      } catch (error) {
        this.notifyError(error);
      } finally {
        this.categoryLoading = false;
      }
    },
    async openDetail(question) {
      this.selected = question;
      this.view = 'detail';
      try {
        const response = await getQuestionDetail(question.id);
        this.selected = toQuestionView(response.data);
      } catch (error) {
        this.notifyError(error);
      }
    },
    async openEditor(question) {
      if (!question || !question.id) {
        this.form = createEditorForm(null, this.versionFilter);
        this.view = 'editor';
        await this.loadCategories();
        return;
      }
      this.form = createEditorForm(question, this.versionFilter);
      this.view = 'editor';
      try {
        const [response] = await Promise.all([getQuestionDetail(question.id), this.loadCategories()]);
        this.form = createEditorForm(toQuestionView(response.data), this.versionFilter);
      } catch (error) {
        this.notifyError(error);
      }
    },
    async duplicateSelected() {
      this.actionLoading = true;
      try {
        await duplicateQuestion(this.selected.id);
        this.$message.success('试题复制成功');
        this.view = 'list';
        await this.loadQuestions();
      } catch (error) {
        this.notifyError(error);
      } finally {
        this.actionLoading = false;
      }
    },
    openImportDialog() {
      this.importForm = {version: this.versionFilter};
      this.importFiles = [];
      this.importVisible = true;
    },
    resetImportForm() {
      this.importFiles = [];
      if (this.$refs.questionUpload) this.$refs.questionUpload.clearFiles();
    },
    onImportFileChange(file, files) {
      this.importFiles = files.slice(-1);
    },
    onImportFileRemove() {
      this.importFiles = [];
    },
    async submitImport() {
      const file = this.importFiles[0] && this.importFiles[0].raw;
      if (!this.importForm.version) {
        this.$message.warning('请选择题库版本');
        return;
      }
      if (!file) {
        this.$message.warning('请选择要导入的题库文件');
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('version', this.importForm.version);
      this.importing = true;
      try {
        const response = await importQuestions(formData);
        const count = Number(response.data);
        this.$message.success(Number.isFinite(count) ? `题库导入完成，共处理 ${count} 道试题` : '题库导入完成');
        this.importVisible = false;
        this.versionFilter = this.importForm.version;
        this.pageNum = 1;
        await this.loadQuestions();
      } catch (error) {
        this.notifyError(error);
      } finally {
        this.importing = false;
      }
    },
    async downloadTemplate() {
      this.templateDownloading = true;
      try {
        const blob = await downloadQuestionTemplate({version: this.versionFilter});
        downloadBlob(blob, '题库导入模板.xlsx');
      } catch (error) {
        this.notifyError(error);
      } finally {
        this.templateDownloading = false;
      }
    },
    async exportQuestionBank() {
      this.exporting = true;
      try {
        const blob = await exportQuestions({
          keyword: this.keyword || undefined,
          type: this.typeFilter === 'all' ? undefined : this.typeFilter,
          version: this.versionFilter,
          catagory: this.categoryFilter && this.categoryFilter !== 'all' ? this.categoryFilter : undefined
        });
        downloadBlob(blob, `题库导出-${this.versionFilter}.xlsx`);
      } catch (error) {
        this.notifyError(error);
      } finally {
        this.exporting = false;
      }
    },
    onTypeChange() {
      if (this.form.type === '判断题') {
        this.form.options = [{key: 'A', text: '√'}, {key: 'B', text: '×'}];
        this.form.answer = 'A';
      } else if (this.form.type === '简答题') {
        this.form.options = [];
        this.form.answer = '';
      } else if (!this.form.options.length) {
        this.form = {...this.form, ...createQuestionForm(), type: this.form.type, title: this.form.title};
      }
    },
    toggleAnswer(key) {
      if (this.form.type !== '多选题') {
        this.form.answer = key;
        return;
      }
      const keys = this.answerKeys(this.form);
      this.form.answer = (keys.includes(key) ? keys.filter(item => item !== key) : [...keys, key]).join('、');
    },
    addOption() {
      const key = 'ABCDEFGH'.split('').find(item => !this.form.options.some(option => option.key === item));
      if (key) this.form.options.push({key, text: ''});
    },
    removeOption(key) {
      this.form.options = this.form.options.filter(item => item.key !== key);
      this.form.answer = this.answerKeys(this.form).filter(item => item !== key).join('、');
    },
    async saveForm() {
      if (!String(this.form.title || '').trim()) {
        this.$message.warning('请输入题干内容');
        return;
      }
      if (!String(this.form.answer || '').trim()) {
        this.$message.warning('请设置正确答案');
        return;
      }
      if (!String(this.form.category || '').trim()) {
        this.$message.warning('请选择题目分类');
        return;
      }
      if (!String(this.form.version || '').trim()) {
        this.$message.warning('请选择题库版本');
        return;
      }
      this.saving = true;
      try {
        await saveQuestion(toQuestionPayload(this.form));
        this.$message.success('试题保存成功');
        if (!this.form.id) this.pageNum = 1;
        this.view = 'list';
        await this.loadQuestions();
      } catch (error) {
        this.notifyError(error);
      } finally {
        this.saving = false;
      }
    },
    async removeQuestion(question) {
      try {
        await this.$confirm(`确认删除“${question.title}”吗？`, '删除试题', {
          type: 'warning',
          confirmButtonText: '删除',
          cancelButtonText: '取消'
        });
      } catch (error) {
        return;
      }
      try {
        await deleteQuestion(question.id);
        this.$message.success('试题已删除');
        if (this.questions.length === 1 && this.pageNum > 1) this.pageNum -= 1;
        await this.loadQuestions();
      } catch (error) {
        this.notifyError(error);
      }
    }
  }
};
</script>
<style scoped lang="less">
@import '../../style/index.less';
</style>
