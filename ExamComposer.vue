<template>
  <section class="page-section compose-page">
    <el-tabs v-model="activeTab" type="card" class="compose-element-tabs" @tab-click="onTabClick">
      <el-tab-pane name="qa">
        <span slot="label" class="compose-tab-label"><i
            class="el-icon-chat-line-square"></i><span><b>理论</b><small>按题型规则或手动选择试题</small></span></span>
      </el-tab-pane>
      <el-tab-pane name="scene">
        <span slot="label" class="compose-tab-label"><i
            class="el-icon-picture-outline-round"></i><span><b>场景</b><small>基于业务场景与拓扑图出题</small></span></span>
      </el-tab-pane>
    </el-tabs>

    <div v-if="notice" class="compose-notice"><i class="el-icon-info"></i>{{ notice }}</div>

    <template v-if="activeTab === 'qa'">
      <div v-if="qaView === 'builder'" class="compose-workspace">
        <el-radio-group v-model="composeMode" size="small" class="compose-mode-control">
          <el-radio-button label="smart"><i class="el-icon-magic-stick"></i>智能组卷</el-radio-button>
          <el-radio-button label="manual"><i class="el-icon-thumb"></i>手动选题</el-radio-button>
        </el-radio-group>
        <div class="builder-layout">
          <article class="surface builder-form">
            <div class="section-title"><span>1</span>
              <div>
                <h2>组卷参数</h2>
                <p>设置抽题总数、试卷分值与建议作答时长</p>
              </div>
            </div>
            <div class="form-grid compose-parameter-grid">
              <label><span>题库版本</span>
                <el-select size="small" v-model="bankVersion" class="full-control"
                           @change="changeBankVersion">
                  <el-option v-for="version in bankVersions" :key="version"
                             :label="version" :value="version"></el-option>
                </el-select>
              </label>
              <label v-if="composeMode === 'smart'"><span>出题总数</span>
                <el-input-number
                    size="small"
                    v-model="settings.totalQuestions" controls-position="right"
                    :min="1" :max="combinedQuestionPool || 999999"></el-input-number>
              </label>
              <label><span>建议时长</span>
                <el-input-number size="small" v-model="settings.duration" controls-position="right"
                                 :min="1"></el-input-number>
              </label>
              <label><span>及格分数</span>
                <el-input-number size="small" v-model="settings.passScore" controls-position="right"
                                 :min="0" :max="composeScore || 999999"></el-input-number>
              </label>
              <label><span>考试批次</span>
                <el-select size="small" v-model="settings.pcId" class="full-control" filterable clearable
                           placeholder="请选择考试批次" :loading="batchLoading">
                  <el-option v-for="item in batchOptions" :key="item.value" :label="item.label"
                             :value="item.value"></el-option>
                </el-select>
              </label>
              <label v-for="rule in questionTypeRules" :key="rule.id"><span>{{ rule.type }}每题分值</span>
                <el-input-number size="small"
                    v-model="rule.score" controls-position="right" :min="0.1" :step="0.1"
                    :precision="2"></el-input-number>
              </label>
              <label><span>试卷总分（自动计算）</span>
                <el-input size="small" :value="`${formatScore(composeScore)} 分`"
                          disabled></el-input>
              </label>
            </div>
            <template v-if="composeMode === 'smart'">
              <div class="section-title rule-title"><span>2</span>
                <div>
                  <h2>题库来源与题型结构</h2>
                  <p>先按题库来源分配题量，再按题型比例控制整卷结构</p>
                </div>
              </div>
              <div class="compose-structure-grid">
                <section class="compose-rule-card">
                  <header>
                    <div><strong>题库来源</strong><small>默认主题库 80%，超纲题库 20%</small></div>
                    <span>{{
                        sourceWeightTotal
                      }}%</span></header>
                  <div class="compose-rule-table compose-source-table">
                    <div class="compose-rule-row compose-rule-row-head">
                      <span>题库</span><span>可用题量</span><span>比例</span><span>抽取</span><span>题型结构</span>
                    </div>
                    <div v-for="rule in allocatedSourceRules" :key="rule.id" class="compose-rule-row">
                      <div><i :style="{ background: rule.color }"></i><strong>{{ rule.name }}</strong></div>
                      <span class="pool-available">{{ rule.available.toLocaleString() }} 道</span>
                      <el-input-number v-model="rule.source.weight" size="mini" controls-position="right" :min="0" disabled
                                       :max="100"></el-input-number>
                      <b>{{ rule.count }} 道</b><span class="source-type-breakdown">{{
                        sourceTypeSummary(rule.sourceType)
                      }}</span>
                    </div>
                  </div>
                </section>
                <section class="compose-rule-card">
                  <header>
                    <div><strong>题型比例</strong><small>权重 5:2:5，默认比例按权重换算且合计 100</small></div>
                    <span>{{ questionTypeRatioText }}（{{ formatScore(questionTypeWeightTotal) }}）</span></header>
                  <div class="compose-rule-table compose-type-table">
                    <div class="compose-rule-row compose-rule-row-head">
                      <span>题型</span><span>题库数量</span><span>比例</span><span>抽取</span><span>小计分值</span></div>
                    <div v-for="rule in allocatedQuestionTypeRules" :key="rule.id" class="compose-rule-row">
                      <div><i :style="{ background: rule.color }"></i><strong>{{ rule.type }}</strong></div>
                      <span class="pool-available">{{ rule.available.toLocaleString() }} 道</span>
                      <el-input-number v-model="rule.source.weight" size="mini" controls-position="right" :min="0" disabled
                                       :max="100" :step="0.01" :precision="2"></el-input-number>
                      <b>{{ rule.count }} 道</b><span>{{ formatScore(rule.count * rule.score) }} 分</span>
                    </div>
                  </div>
                </section>
              </div>
              <div class="smart-rule-heading rule-title">
                <div class="section-title"><span>3</span>
                  <div>
                    <h2>主题库大类比例</h2>
                    <p>主题库共 {{ totalQuestionPool.toLocaleString() }} 道，按大类比例抽取 {{ themeQuestionCount }}
                      道试题</p>
                  </div>
                </div>
                <div class="smart-rule-tools">
                  <el-radio-group :value="ratioMode" size="mini" @input="setRatioMode">
                    <el-radio-button label="default">默认比例</el-radio-button>
                    <el-radio-button label="custom">自定义比例</el-radio-button>
                  </el-radio-group>
                  <el-popover placement="bottom-end" width="350" trigger="hover"
                              popper-class="algorithm-element-popover">
                    <strong>比例选题算法</strong>
                    <p>1. 总题数先按题库来源比例拆分为主题库和超纲题库。</p>
                    <p>2. 主题库题量再按大类比例分配；超纲题不参与主题大类分配。</p>
                    <p>3. 单选、多选、判断按独立题型比例控制整张试卷结构。</p>
                    <p>4. 各层均先向下取整，再按小数余量补齐，且不会超过可用题量。</p>
                    <p>5. 总分 = Σ（各题型抽取数量 × 该题型单题分值）。</p><code>Ni = N × Wi / ΣW</code>
                    <el-button slot="reference" type="text" icon="el-icon-info">规则算法</el-button>
                  </el-popover>
                </div>
              </div>
              <div class="smart-rule-summary">
                <div><span>题库总量</span><strong>{{ combinedQuestionPool.toLocaleString() }}</strong><small>道</small>
                </div>
                <div><span>配置大类</span><strong>{{ categoryRules.length }}</strong><small>类</small></div>
                <div><span>配置合计</span><strong>{{ configuredWeightTotal }}</strong><small>%</small></div>
                <div><span>计划抽取</span><strong>{{ allocatedQuestionCount }}</strong><small>道</small></div>
                <p v-if="configuredWeightTotal !== 100"><i class="el-icon-info"></i>配置合计为 {{
                    configuredWeightTotal
                  }}%，已自动归一化为 100%</p>
              </div>
              <div v-if="categoryLoading" class="table-state"><i class="el-icon-loading"></i>正在加载分类规则</div>
              <div v-else-if="!categoryRules.length" class="table-state">暂无主题库大类</div>
              <div v-else class="category-allocation-table">
                <div class="category-allocation-row category-allocation-head">
                  <span>题目大类</span><span>题库数量</span><span>配置比例</span><span>归一化占比</span><span>抽题数量</span>
                </div>
                <div v-for="rule in allocatedCategoryRules" :key="rule.id" class="category-allocation-row">
                  <div class="category-name"><i :style="{ background: rule.color }"></i><span><strong>{{
                      rule.name
                    }}</strong><small>{{ rule.description }}</small></span></div>
                  <span class="category-pool-count"><b>{{ rule.available.toLocaleString() }}</b> 道</span>
                  <el-input-number v-model="rule.source.weight" class="ratio-element-input" size="mini"
                                   controls-position="right" :min="0" :max="100"
                                   :disabled="ratioMode === 'default'"></el-input-number>
                  <div class="normalized-ratio"><strong>{{ formatRatio(rule.normalizedRatio) }}%</strong><span><i
                      :style="{ width: `${rule.normalizedRatio}%`, background: rule.color }"></i></span></div>
                  <strong class="allocated-count">{{ rule.count }}<small> 道</small><em>{{
                      categoryTypeSummary(rule.id)
                    }}</em></strong>
                </div>
              </div>
              <div v-if="categoryRules.length" class="allocation-distribution" aria-label="各类别抽题数量分布"><i
                  v-for="rule in allocatedCategoryRules" :key="rule.id"
                  :style="{ width: `${rule.actualRatio}%`, background: rule.color }"
                  :title="`${rule.name}：${rule.count} 道`"></i></div>
              <div v-if="categoryRules.length" class="allocation-legend"><span v-for="rule in allocatedCategoryRules"
                                                                               :key="rule.id"><i
                  :style="{ background: rule.color }"></i>{{ rule.name }} {{ rule.count }} 道</span>
              </div>
            </template>
            <template v-else>
              <div class="section-title rule-title"><span>2</span>
                <div>
                  <h2>手动选择试题</h2>
                  <p>已选择 {{ selectedQuestionIds.length }} 道试题</p>
                </div>
              </div>
              <div class="manual-question-tools">
                <el-input size="small" v-model.trim="manualKeyword" class="manual-question-search"
                          prefix-icon="el-icon-search" clearable placeholder="搜索题目"></el-input>
                <el-button
                    size="small"
                    icon="el-icon-finished" :disabled="manualLoading || !questions.length" @click="toggleAllQuestions">
                  {{
                    allQuestionsSelected ? '取消本页' : '选择本页'
                  }}
                </el-button>
                <span>题库共 {{ manualTotal }} 道，已选 {{
                    selectedQuestionIds.length
                  }} 道</span></div>
              <div v-if="manualLoading" class="table-state"><i class="el-icon-loading"></i>正在加载题目</div>
              <div v-else-if="!questions.length" class="table-state">暂无可选试题</div>
              <div v-else class="manual-question-list"><label v-for="item in questions" :key="item.id"
                                                              :class="{ selected: selectedQuestionIds.includes(item.id) }">
                <el-checkbox
                    :value="selectedQuestionIds.includes(item.id)" @change="toggleQuestion(item.id)"></el-checkbox>
                <span
                    :class="['type-chip', item.typeClass]">{{ item.type }}</span><strong :title="item.title">{{
                  item.title
                }}</strong><small>{{ item.level }}</small></label></div>
              <div v-if="manualTotal" class="element-pagination-wrap compact-pagination">
                <el-pagination background small
                               layout="sizes, prev, pager, next, jumper, total"
                               :current-page="manualPage"
                               :page-size="manualPageSize"
                               :page-sizes="[10, 20, 50, 100, 200, 300]"
                               :total="manualTotal" :disabled="manualLoading"
                               @current-change="changeManualPage"
                               @size-change="changeManualPageSize"></el-pagination>
              </div>
            </template>
          </article>
          <aside class="surface paper-summary">
            <h2>试卷概要</h2>
            <div class="paper-score"><strong>{{
                composeMode === 'smart' ? composeCount : composeScore
              }}</strong><span>{{
                composeMode === 'smart' ? '道题' : '总分'
              }}</span></div>
            <dl>
              <div>
                <dt>题库版本</dt>
                <dd>{{ bankVersion }}</dd>
              </div>
              <div>
                <dt>试题总数</dt>
                <dd>{{ composeCount }} 道</dd>
              </div>
              <div>
                <dt>试卷总分</dt>
                <dd>{{ composeScore }} 分</dd>
              </div>
              <div>
                <dt>题型数量</dt>
                <dd>{{ composeTypeCount }} 种</dd>
              </div>
              <div>
                <dt>组卷方式</dt>
                <dd>{{
                    composeMode === 'smart' ? (ratioMode === 'default' ? '默认比例' : '自定义比例') : '手动选题'
                  }}
                </dd>
              </div>
              <div>
                <dt>建议时长</dt>
                <dd>{{ settings.duration }} 分钟</dd>
              </div>
            </dl>
            <el-button size="small" type="primary" class="full-btn" :loading="generating" icon="el-icon-magic-stick"
                       @click="generatePaper">{{
                generating ? '正在生成' : '生成并预览'
              }}
            </el-button>
          </aside>
        </div>
      </div>
      <article v-else-if="qaView === 'preview'" class="surface paper-preview-surface">
        <div class="secondary-page-head">
          <el-button icon="el-icon-arrow-left" circle
                     @click="qaView = 'builder'"></el-button>
          <div>
            <h2>试卷结构预览</h2>
            <p>{{ composeCount }} 道题 · {{ composeScore }} 分</p>
          </div>
          <div class="action-spacer"></div>
          <el-button size="small" icon="el-icon-plus" @click="openQuestionPicker">新增试题</el-button>
          <el-button size="small" type="primary" icon="el-icon-check" :loading="savingPaper" @click="saveGeneratedPaper">{{
              savingPaper ? '正在保存' : '保存试卷'
            }}
          </el-button>
          <el-button size="small" icon="el-icon-download" :loading="exportingPaper" @click="exportGeneratedPaper">{{
              exportingPaper ? '正在导出' : '导出 Word'
            }}
          </el-button>
        </div>
        <div class="paper-preview-title">
          <div class="paper-preview-name">
            <label for="paper-title">试卷名称</label>
            <el-input size="small" id="paper-title" v-model="generatedPaper.title" maxlength="100"
                      placeholder="请输入试卷名称"></el-input>
            <p>及格 {{ generatedPaper.passScore }} 分 · 时长 {{ generatedPaper.duration }} 分钟</p>
          </div>
        </div>
        <el-alert v-if="!previewScoreValid" class="paper-score-warning" type="warning" :closable="false"
                  show-icon :title="`当前试卷共 ${formatScore(composeScore)} 分，调整至 100 分后才能保存`"></el-alert>
        <el-collapse v-model="previewActiveType" accordion class="paper-question-groups">
          <el-collapse-item v-for="group in previewQuestionGroups" :key="group.type" :name="group.type">
            <template slot="title">
              <div class="paper-question-group-title"><span :class="['type-chip', questionTypeClass(group.type)]">{{
                  group.type
                }}</span><strong>{{ group.items.length }} 道</strong><small>小计 {{
                  formatScore(group.score)
                }} 分</small></div>
            </template>
            <ol class="paper-question-preview">
              <li v-for="item in group.items" :key="item.questionId || item.id"><span>{{ item.previewIndex + 1 }}</span>
                <div>
                  <strong class="paper-question-stem">
                    <span v-if="questionCategory(item)" class="scene-category">{{ questionCategory(item) }}</span>
                    <span>{{ item.title }}</span>
                  </strong>
                  <small>{{ item.type }} · {{
                    generatedPaper.version
                  }}</small>
                </div>
                <b>{{ questionScore(item) }} 分</b>
                <el-button type="danger" icon="el-icon-delete" circle plain
                           size="mini" title="从试卷中删除"
                           @click="removePreviewQuestion(item.previewIndex)"></el-button>
              </li>
            </ol>
          </el-collapse-item>
        </el-collapse>
      </article>
      <article v-else class="surface compose-result-panel"><span><i class="el-icon-check"></i></span>
        <h2>试卷保存成功</h2>
        <p>试卷编号 {{ savedPaperId }} · {{ composeCount }} 道题 · 共 {{ composeScore }} 分</p>
        <div>
          <el-button size="small" @click="resetComposer">继续出题</el-button>
          <el-button size="small"
              @click="qaView = 'preview'">查看试卷
          </el-button>
          <el-button size="small" type="primary" icon="el-icon-download"
                     :loading="exportingPaper" @click="exportSavedPaper">导出 Word
          </el-button>
        </div>
      </article>
    </template>

    <template v-else>
      <SceneQuestion class="scene-question-integration"/>
      <template v-if="false">
        <div v-if="sceneView === 'list'" class="scene-list-page">
          <div class="page-actions scene-toolbar">
            <el-input v-model.trim="sceneKeyword" class="scene-search" prefix-icon="el-icon-search" clearable
                      placeholder="搜索场景名称或编号"></el-input>
            <el-select v-model="sceneStatus" class="scene-status-filter" placeholder="发布状态">
              <el-option label="全部状态"
                         value="all"></el-option>
              <el-option label="草稿" value="草稿"></el-option>
              <el-option label="待发布"
                         value="待发布"></el-option>
              <el-option label="已发布" value="已发布"></el-option>
            </el-select>
            <div class="action-spacer"></div>
            <el-button type="primary" icon="el-icon-plus"
                       @click="openSceneEditor()">新建场景
            </el-button>
          </div>
          <article class="surface table-surface element-table-surface">
            <el-table :data="filteredScenes" class="exam-element-table" empty-text="暂无场景数据" border stripe
                      size="small"
                      @row-dblclick="openSceneDetail">
              <el-table-column label="场景信息" min-width="240">
                <template slot-scope="scope">
                  <el-button type="text"
                             class="scene-title" @click="openSceneDetail(scope.row)"><strong>{{
                      scope.row.title
                    }}</strong><span>{{
                      scope.row.id
                    }}</span></el-button>
                </template>
              </el-table-column>
              <el-table-column label="类型" width="130">
                <template slot-scope="scope"><span class="scene-category">{{
                    scope.row.category
                  }}</span></template>
              </el-table-column>
              <el-table-column prop="topology" label="关联拓扑" min-width="180" show-overflow-tooltip>
                <template
                    slot-scope="scope">{{ scope.row.topology || '未关联' }}
                </template>
              </el-table-column>
              <el-table-column label="题目数" width="90">
                <template slot-scope="scope">{{ scope.row.questionCount }}
                  道
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template slot-scope="scope"><span
                    :class="['status-chip', sceneStatusClass(scope.row.status)]">{{
                    scope.row.status
                  }}</span></template>
              </el-table-column>
              <el-table-column prop="updated" label="更新时间" width="120"></el-table-column>
              <el-table-column label="操作" width="360" align="center">
                <template slot-scope="scope">
                  <el-button type="text"
                             @click="createFromScene(scope.row)">出题
                  </el-button>
                  <el-button type="text"
                             @click="openTopology(scope.row)">拓扑图
                  </el-button>
                  <el-button type="text" class="success-text-button"
                             @click="publishScene(scope.row)">{{
                      scope.row.status === '已发布' ? '取消发布' : '发布考题'
                    }}
                  </el-button>
                  <el-button icon="el-icon-edit" circle size="mini" title="编辑"
                             @click="openSceneEditor(scope.row)"></el-button>
                  <el-button type="danger" icon="el-icon-delete" circle
                             size="mini" plain title="删除" @click="removeScene(scope.row)"></el-button>
                </template>
              </el-table-column>
            </el-table>
          </article>
        </div>

        <div v-else-if="sceneView === 'editor'" class="scene-secondary-page">
          <div class="secondary-page-head">
            <el-button icon="el-icon-arrow-left" circle
                       @click="sceneView = 'list'"></el-button>
            <div>
              <h2>{{ sceneForm.id ? '编辑场景' : '新建场景' }}</h2>
              <p>维护场景说明及关联拓扑图</p>
            </div>
            <div class="action-spacer"></div>
            <el-button @click="sceneView = 'list'">取消</el-button>
            <el-button
                type="primary" icon="el-icon-check" @click="saveScene">保存场景
            </el-button>
          </div>
          <article class="surface scene-editor-form element-scene-form">
            <el-form :model="sceneForm"
                     label-position="top">
              <el-row :gutter="16">
                <el-col :xs="24" :sm="12">
                  <el-form-item label="场景名称">
                    <el-input
                        v-model.trim="sceneForm.title" placeholder="请输入场景名称"></el-input>
                  </el-form-item>
                </el-col>
                <el-col
                    :xs="24" :sm="12">
                  <el-form-item label="场景类型">
                    <el-select v-model="sceneForm.category"
                               class="full-control">
                      <el-option v-for="item in ['网架规划', '新能源接入', '供电可靠性', '通道规划', '故障处置']"
                                 :key="item"
                                 :label="item" :value="item"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :xs="24"
                        :sm="12">
                  <el-form-item label="关联拓扑">
                    <el-input v-model.trim="sceneForm.topology"
                              placeholder="请输入或选择拓扑图"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item
                      label="发布状态">
                    <el-select v-model="sceneForm.status" class="full-control">
                      <el-option
                          v-for="item in ['草稿', '待发布', '已发布']" :key="item" :label="item"
                          :value="item"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item
                  label="场景说明">
                <el-input v-model.trim="sceneForm.description" type="textarea" :rows="6"
                          placeholder="描述业务背景、边界条件、已知数据和作答目标"></el-input>
              </el-form-item>
            </el-form>
          </article>
        </div>

        <div v-else-if="sceneView === 'detail'" class="scene-secondary-page">
          <div class="secondary-page-head">
            <el-button icon="el-icon-arrow-left" circle
                       @click="sceneView = 'list'"></el-button>
            <div>
              <h2>场景详情</h2>
              <p>{{ activeScene.id }}</p>
            </div>
            <div class="action-spacer"></div>
            <el-button icon="el-icon-share"
                       @click="openTopology(activeScene)">拓扑图
            </el-button>
            <el-button icon="el-icon-edit"
                       @click="openSceneEditor(activeScene)">编辑
            </el-button>
            <el-button type="primary" icon="el-icon-document-add"
                       @click="createFromScene(activeScene)">基于场景出题
            </el-button>
          </div>
          <article class="surface scene-detail">
            <div class="scene-detail-head"><span class="scene-category">{{ activeScene.category }}</span><span
                :class="['status-chip', sceneStatusClass(activeScene.status)]">{{ activeScene.status }}</span></div>
            <h2>{{ activeScene.title }}</h2>
            <p>{{ activeScene.description }}</p>
            <dl>
              <div>
                <dt>关联拓扑图</dt>
                <dd>{{ activeScene.topology }}</dd>
              </div>
              <div>
                <dt>已关联题目</dt>
                <dd>{{ activeScene.questionCount }} 道</dd>
              </div>
              <div>
                <dt>最后更新</dt>
                <dd>{{ activeScene.updated }}</dd>
              </div>
            </dl>
          </article>
        </div>

        <div v-else class="scene-secondary-page scene-question-page">
          <div class="secondary-page-head">
            <el-button icon="el-icon-arrow-left" circle
                       @click="sceneView = 'list'"></el-button>
            <div>
              <h2>场景出题</h2>
              <p>{{ activeScene.title }} · {{ activeScene.id }}</p>
            </div>
            <div class="action-spacer"></div>
            <el-button icon="el-icon-document"
                       @click="openSceneDetail(activeScene)">场景详情
            </el-button>
          </div>
          <article class="surface scene-map-workspace">
            <header class="scene-map-toolbar">
              <div><span class="scene-category">{{ activeScene.category }}</span><strong>{{
                  activeScene.title
                }}</strong>
              </div>
              <div>
                <el-button icon="el-icon-location-outline" circle title="定位"></el-button>
                <el-button
                    icon="el-icon-zoom-in" circle title="放大"></el-button>
                <el-button icon="el-icon-zoom-out" circle
                           title="缩小"></el-button>
                <el-button icon="el-icon-full-screen" circle title="全屏"></el-button>
              </div>
            </header>
            <div class="scene-map-placeholder">
              <i class="map-river river-a"></i><i class="map-river river-b"></i><i class="map-road road-a"></i><i
                class="map-road road-b"></i><i class="map-road road-c"></i>
              <span class="map-marker marker-a"><i class="el-icon-location"></i></span><span
                class="map-marker marker-b"><i class="el-icon-location"></i></span><span class="map-marker marker-c"><i
                class="el-icon-location"></i></span>
              <div class="map-placeholder-copy"><i class="el-icon-map-location"></i><strong>场景地图</strong><small>{{
                  activeScene.title
                }}</small></div>
            </div>
          </article>
        </div>
      </template>
    </template>

    <el-dialog title="从题库新增试题" :visible.sync="questionPickerVisible" width="860px" :modal="false"
               @open="loadPickerQuestions">
      <div class="question-picker-toolbar">
        <el-input size="small" v-model.trim="pickerKeyword" prefix-icon="el-icon-search" clearable placeholder="搜索题目或编号"
                  @keyup.enter.native="searchPickerQuestions"></el-input>
        <el-select size="small" :value="bankVersion" disabled>
          <el-option v-for="version in bankVersions" :key="version" :label="version"
                     :value="version"></el-option>
        </el-select>
        <el-select size="small" v-model="typeFilter" class="question-bank-filter" placeholder="题型">
          <el-option label="全部题型" value="all"></el-option>
          <el-option label="单选题" value="单选题"></el-option>
          <el-option label="多选题" value="多选题"></el-option>
          <el-option label="判断题" value="判断题"></el-option>
        </el-select>
        <el-select size="small" v-model="pickerCategory" class="question-bank-filter category-filter" placeholder="试题分类"
                   filterable @change="searchPickerQuestions">
          <el-option label="全部分类" value="all"></el-option>
          <el-option v-for="item in categoryFilterOptions" :key="item.value" :label="item.label"
                     :value="item.value"></el-option>
        </el-select>
        <el-button size="small" icon="el-icon-search" @click="searchPickerQuestions">查询</el-button>
      </div>
      <el-table v-loading="pickerLoading" :data="pickerQuestions" class="exam-element-table" height="420"
                border stripe size="small"
                empty-text="当前版本暂无可添加试题">
        <el-table-column prop="id" label="试题编号" width="130" show-overflow-tooltip></el-table-column>
        <el-table-column prop="type" label="题型" width="90"></el-table-column>
        <el-table-column label="题目内容" min-width="330" show-overflow-tooltip>
          <template slot-scope="scope">
            <div class="question-stem-cell">
              <span v-if="questionCategory(scope.row)" class="scene-category">{{ questionCategory(scope.row) }}</span>
              <span>{{ scope.row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="130" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作" width="90" align="right">
          <template slot-scope="scope">
            <el-button size="small" type="text"
                       :disabled="paperHasQuestion(scope.row.id) || !questionCanBeAdded(scope.row)"
                       @click="addQuestionToPaper(scope.row)">{{
                paperHasQuestion(scope.row.id) ? '已添加' :
                    (questionCanBeAdded(scope.row) ? '添加' : '题型未配置')
              }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="pickerTotal" class="element-pagination-wrap compact-pagination">
        <el-pagination background small
                       layout="prev, pager, next, jumper, total" :current-page="pickerPage" :page-size="pickerPageSize"
                       :total="pickerTotal" @current-change="changePickerPage"></el-pagination>
      </div>
      <span slot="footer"><el-button size="small" type="primary" @click="questionPickerVisible = false">完成</el-button></span>
    </el-dialog>

  </section>
</template>

<script>
import SceneQuestion from './cpns/SceneQuestion.vue';
import {
  exportPaper,
  generateManualPaper,
  generateSmartPaper,
  getComposeCategories,
  getExamBatchOptions,
  loadExamCategoryOptions,
  loadExamVersionState,
  CURRENT_EXAM_VERSION,
  getQuestionPage,
  savePaper,
  toPaperPayload,
  toPaperView,
  toQuestionView
} from '@/api/pwgh/examCbPsk';
import {downloadBlob, safeFilename} from './downloadFile';

const CATEGORY_COLORS = ['#3478e5', '#16a085', '#8b6fd6', '#e18a24', '#d3547a', '#2e86de', '#27ae60', '#8e44ad'];

function isOutOfScopeCategory(item) {
  const name = String((item && (item.name || item.categoryName || item.catagory || item.title)) || '');
  const type = String((item && (item.sourceType || item.categoryType || item.type)) || '').toUpperCase();
  return type === 'OUT_OF_SCOPE' || name.includes('超纲');
}

function toCategoryRule(item, index) {
  const name = (item && (item.name || item.categoryName || item.catagory || item.title)) || `大类${index + 1}`;
  const rawId = item && (item.id != null && item.id !== '' ? item.id : (item.categoryId != null && item.categoryId !== '' ? item.categoryId : item.code));
  const weight = Math.max(0, Number(item && (item.weight != null ? item.weight : (item.ratio != null ? item.ratio : (item.percent != null ? item.percent : item.defaultWeight)))) || 0);
  return {
    id: rawId == null || rawId === '' ? name : String(rawId),
    name,
    available: Math.max(0, Number(item && (item.available != null ? item.available : (item.count != null ? item.count : item.total))) || 0),
    weight,
    defaultWeight: weight,
    description: (item && (item.description || item.desc)) || '',
    color: (item && item.color) || CATEGORY_COLORS[index % CATEGORY_COLORS.length]
  };
}

function withDefaultCategoryWeights(rules) {
  if (!rules.length || rules.some(rule => rule.weight > 0)) return rules;
  const equal = Math.floor(10000 / rules.length) / 100;
  return rules.map((rule, index) => {
    const weight = index === rules.length - 1
      ? Math.round((100 - equal * (rules.length - 1)) * 100) / 100
      : equal;
    return { ...rule, weight, defaultWeight: weight };
  });
}

const QUESTION_TYPE_COUNT_KEYS = {
  '单选题': ['单选题', 'single', 'singleCount', 'singleChoice', 'singleTotal'],
  '多选题': ['多选题', 'multiple', 'multipleCount', 'multiCount', 'multiTotal'],
  '判断题': ['判断题', 'judge', 'judgeCount', 'judgment', 'judgmentCount']
};

function readNumericCount(value) {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(0, count) : 0;
}

function readTypeCountFromSource(source, type) {
  if (!source || typeof source !== 'object') return 0;
  const keys = QUESTION_TYPE_COUNT_KEYS[type] || [type];
  for (let index = 0; index < keys.length; index += 1) {
    const value = source[keys[index]];
    if (value != null && value !== '' && typeof value !== 'object') return readNumericCount(value);
  }
  const nested = source.types || source.typeCounts || source.questionTypes || source.countByType || source.typeStat;
  if (Array.isArray(nested)) {
    const matched = nested.find(item => item && (item.type === type || item.name === type || item.id === type));
    return matched ? readNumericCount(matched.available || matched.count || matched.total) : 0;
  }
  if (nested && typeof nested === 'object') return readTypeCountFromSource(nested, type);
  return 0;
}

function weightsToPercents(weights) {
  const values = (weights || []).map(weight => Math.max(0, Number(weight) || 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total) return values.map(() => 0);
  const raw = values.map(value => value / total * 100);
  const percents = raw.map(value => Math.floor(value * 100) / 100);
  let remain = Math.round((100 - percents.reduce((sum, value) => sum + value, 0)) * 100);
  [...raw.keys()].sort((first, second) => (raw[second] - percents[second]) - (raw[first] - percents[first])).forEach(index => {
    if (remain > 0) {
      percents[index] = Math.round((percents[index] + 0.01) * 100) / 100;
      remain -= 1;
    }
  });
  return percents;
}

function collectQuestionTypeCounts(payload, categories, types) {
  const sources = [payload].concat(Array.isArray(categories) ? categories : []);
  return types.reduce((result, type) => {
    result[type] = sources.reduce((sum, source) => sum + readTypeCountFromSource(source, type), 0);
    return result;
  }, {});
}

function allocateQuestionsByWeight(categories, requestedTotal) {
  const poolSize = categories.reduce((sum, item) => sum + Math.max(0, Number(item.available) || 0), 0);
  const targetTotal = Math.min(poolSize, Math.max(0, Math.floor(Number(requestedTotal) || 0)));
  const weightTotal = categories.reduce((sum, item) => sum + Math.max(0, Number(item.weight) || 0), 0);

  if (!targetTotal || !weightTotal) {
    return categories.map(item => ({
      ...item,
      source: item,
      normalizedRatio: 0,
      actualRatio: 0,
      count: 0,
      remainder: 0
    }));
  }

  const allocations = categories.map(item => {
    const weight = Math.max(0, Number(item.weight) || 0);
    const available = Math.max(0, Number(item.available) || 0);
    const normalizedRatio = weight / weightTotal * 100;
    const theoreticalCount = targetTotal * weight / weightTotal;
    return {
      ...item,
      source: item,
      normalizedRatio,
      count: Math.min(available, Math.floor(theoreticalCount)),
      remainder: theoreticalCount - Math.floor(theoreticalCount)
    };
  });

  let remaining = targetTotal - allocations.reduce((sum, item) => sum + item.count, 0);
  const remainderOrder = [...allocations].sort((first, second) => second.remainder - first.remainder || second.weight - first.weight);

  while (remaining > 0) {
    let distributed = false;
    remainderOrder.forEach(item => {
      if (remaining > 0 && item.weight > 0 && item.count < item.available) {
        item.count += 1;
        remaining -= 1;
        distributed = true;
      }
    });
    if (!distributed) break;
  }

  allocations.forEach(item => {
    item.actualRatio = targetTotal ? item.count / targetTotal * 100 : 0;
  });
  return allocations;
}

function allocateCountMatrix(rows, columns) {
  const total = rows.reduce((sum, row) => sum + Math.max(0, Number(row.count) || 0), 0);
  if (!total) return [];
  const cells = [];
  const rowRemaining = new Map();
  const columnRemaining = new Map();

  rows.forEach(row => rowRemaining.set(row.id, Math.max(0, Number(row.count) || 0)));
  columns.forEach(column => columnRemaining.set(column.id, Math.max(0, Number(column.count) || 0)));
  rows.forEach(row => {
    columns.forEach(column => {
      const theoretical = Math.max(0, Number(row.count) || 0) * Math.max(0, Number(column.count) || 0) / total;
      const count = Math.floor(theoretical);
      cells.push({row, column, count, remainder: theoretical - count});
      rowRemaining.set(row.id, rowRemaining.get(row.id) - count);
      columnRemaining.set(column.id, columnRemaining.get(column.id) - count);
    });
  });

  const rankedCells = [...cells].sort((first, second) => second.remainder - first.remainder);
  rankedCells.forEach(cell => {
    if (rowRemaining.get(cell.row.id) > 0 && columnRemaining.get(cell.column.id) > 0) {
      cell.count += 1;
      rowRemaining.set(cell.row.id, rowRemaining.get(cell.row.id) - 1);
      columnRemaining.set(cell.column.id, columnRemaining.get(cell.column.id) - 1);
    }
  });

  rows.forEach(row => {
    columns.forEach(column => {
      const remaining = Math.min(rowRemaining.get(row.id), columnRemaining.get(column.id));
      if (!remaining) return;
      const cell = cells.find(item => item.row.id === row.id && item.column.id === column.id);
      cell.count += remaining;
      rowRemaining.set(row.id, rowRemaining.get(row.id) - remaining);
      columnRemaining.set(column.id, columnRemaining.get(column.id) - remaining);
    });
  });
  return cells.filter(cell => cell.count > 0);
}

export default {
  name: 'ExamComposer',
  components: {SceneQuestion},
  data() {
    return {
      typeFilter: 'all',
      activeTab: 'qa',
      qaView: 'builder',
      composeMode: 'smart',
      notice: '',
      questions: [],
      selectedQuestionIds: [],
      selectedQuestionTypes: {},
      bankVersion: CURRENT_EXAM_VERSION,
      bankVersions: [CURRENT_EXAM_VERSION],
      settings: {totalQuestions: 300, totalScore: 100, passScore: 60, duration: 60, pcId: ''},
      batchOptions: [],
      batchLoading: false,
      sourceRules: [
        {id: 'theme', sourceType: 'THEME', name: '主题库', available: 0, weight: 80, color: '#218c83'},
        {id: 'out-of-scope', sourceType: 'OUT_OF_SCOPE', name: '超纲题库', available: 0, weight: 20, color: '#e18a24'}
      ],
      questionTypeRules: [
        {id: 'single', type: '单选题', available: 0, weight: 41.67, defaultWeight: 5, score: 0.4, color: '#3478e5'},
        {id: 'multiple', type: '多选题', available: 0, weight: 16.66, defaultWeight: 2, score: 0.5, color: '#7659cf'},
        {id: 'judge', type: '判断题', available: 0, weight: 41.67, defaultWeight: 5, score: 0.2, color: '#16a085'}
      ],
      ratioMode: 'default',
      categoryRules: [],
      categoryLoading: false,
      manualKeyword: '',
      manualPage: 1,
      manualPageSize: 10,
      manualTotal: 0,
      manualLoading: false,
      manualSearchTimer: null,
      generatedPaper: null,
      generating: false,
      savingPaper: false,
      exportingPaper: false,
      savedPaperId: '',
      previewActiveType: '单选题',
      questionPickerVisible: false,
      pickerQuestions: [],
      pickerKeyword: '',
      pickerPage: 1,
      pickerPageSize: 10,
      pickerTotal: 0,
      pickerLoading: false,
      pickerCategory: 'all',
      categoryFilterOptions: []
    };
  },
  computed: {
    totalQuestionPool() {
      return this.categoryRules.reduce((sum, rule) => sum + Number(rule.available || 0), 0);
    },
    combinedQuestionPool() {
      return this.sourceRules.reduce((sum, rule) => sum + Math.max(0, Number(rule.available) || 0), 0);
    },
    normalizedTotalQuestions() {
      return Math.min(this.combinedQuestionPool, Math.max(0, Math.floor(Number(this.settings.totalQuestions) || 0)));
    },
    sourceWeightTotal() {
      return Math.round(this.sourceRules.reduce((sum, rule) => sum + Math.max(0, Number(rule.weight) || 0), 0) * 100) / 100;
    },
    allocatedSourceRules() {
      return allocateQuestionsByWeight(this.sourceRules, this.normalizedTotalQuestions);
    },
    themeQuestionCount() {
      const rule = this.allocatedSourceRules.find(item => item.sourceType === 'THEME');
      return rule ? rule.count : 0;
    },
    questionTypeWeightTotal() {
      return Math.round(this.questionTypeRules.reduce((sum, rule) => sum + Math.max(0, Number(rule.weight) || 0), 0) * 100) / 100;
    },
    questionTypeRatioText() {
      return this.questionTypeRules.map(rule => this.formatScore(rule.weight)).join(':');
    },
    allocatedQuestionTypeRules() {
      return allocateQuestionsByWeight(this.questionTypeRules, this.normalizedTotalQuestions);
    },
    sourceTypeMatrix() {
      return allocateCountMatrix(this.allocatedSourceRules, this.allocatedQuestionTypeRules);
    },
    themeCategoryTypeMatrix() {
      const themeTypeColumns = this.allocatedQuestionTypeRules.map(typeRule => ({
        ...typeRule,
        count: this.sourceTypeMatrix.filter(cell => cell.row.sourceType === 'THEME' && cell.column.type === typeRule.type)
            .reduce((sum, cell) => sum + cell.count, 0)
      }));
      return allocateCountMatrix(this.allocatedCategoryRules, themeTypeColumns);
    },
    selectionRules() {
      const themeRules = this.themeCategoryTypeMatrix.map(cell => ({
        sourceType: 'THEME',
        sourceName: '主题库',
        categoryId: cell.row.id,
        categoryName: cell.row.name,
        type: cell.column.type,
        score: Math.max(0, Number(cell.column.score) || 0),
        count: cell.count
      }));
      const outOfScopeRules = this.sourceTypeMatrix.filter(cell => cell.row.sourceType === 'OUT_OF_SCOPE').map(cell => ({
        sourceType: 'OUT_OF_SCOPE',
        sourceName: '超纲题库',
        categoryId: '',
        categoryName: '超纲题库',
        type: cell.column.type,
        score: Math.max(0, Number(cell.column.score) || 0),
        count: cell.count
      }));
      return [...themeRules, ...outOfScopeRules];
    },
    calculatedSmartScore() {
      return Math.round(this.allocatedQuestionTypeRules.reduce((sum, rule) => sum + rule.count * Math.max(0, Number(rule.score) || 0), 0) * 100) / 100;
    },
    calculatedManualScore() {
      return Math.round(this.selectedQuestionIds.reduce((sum, id) => {
        const type = this.selectedQuestionTypes[id];
        return sum + this.configuredQuestionScore({type});
      }, 0) * 100) / 100;
    },
    manualQuestionScores() {
      return this.selectedQuestionIds.map(id => ({
        questionId: id,
        score: this.configuredQuestionScore({type: this.selectedQuestionTypes[id]})
      }));
    },
    configuredWeightTotal() {
      return Math.round(this.categoryRules.reduce((sum, rule) => sum + Math.max(0, Number(rule.weight) || 0), 0) * 100) / 100;
    },
    allocatedCategoryRules() {
      return allocateQuestionsByWeight(this.categoryRules, this.themeQuestionCount);
    },
    allocatedCategoryQuestionCount() {
      return this.allocatedCategoryRules.reduce((sum, rule) => sum + rule.count, 0);
    },
    allocatedQuestionCount() {
      return this.allocatedSourceRules.reduce((sum, rule) => sum + rule.count, 0);
    },
    composeCount() {
      return this.generatedPaper && this.qaView !== 'builder' ? this.generatedPaper.questionCount : (this.composeMode === 'smart' ? this.allocatedQuestionCount : this.selectedQuestionIds.length);
    },
    composeScore() {
      return this.generatedPaper && this.qaView !== 'builder' ? this.generatedPaper.totalScore : (this.composeMode === 'smart' ? this.calculatedSmartScore : this.calculatedManualScore);
    },
    composeTypeCount() {
      return this.composeMode === 'smart' ? this.allocatedQuestionTypeRules.filter(rule => rule.count > 0).length : new Set(Object.values(this.selectedQuestionTypes)).size;
    },
    allQuestionsSelected() {
      return Boolean(this.questions.length) && this.questions.every(item => this.selectedQuestionIds.includes(item.id));
    },
    manualPageCount() {
      return Math.max(1, Math.ceil(this.manualTotal / this.manualPageSize));
    },
    previewQuestions() {
      return this.generatedPaper ? this.generatedPaper.questions : [];
    },
    previewQuestionGroups() {
      const indexedQuestions = this.previewQuestions.map((item, previewIndex) => ({...item, previewIndex}));
      const preferredTypes = ['单选题', '多选题', '判断题'];
      const extraTypes = [...new Set(indexedQuestions.map(item => item.type).filter(type => !preferredTypes.includes(type)))];
      return [...preferredTypes, ...extraTypes].map(type => {
        const items = indexedQuestions.filter(item => item.type === type);
        return {
          type,
          items,
          score: Math.round(items.reduce((sum, item) => sum + Math.max(0, Number(item.score) || 0), 0) * 100) / 100
        };
      }).filter(group => group.items.length);
    },
    previewScoreValid() {
      return Math.abs(Number(this.composeScore) - 100) < 0.001;
    }
  },
  watch: {
    manualKeyword() {
      if (this.manualSearchTimer) window.clearTimeout(this.manualSearchTimer);
      this.manualSearchTimer = window.setTimeout(() => {
        this.manualPage = 1;
        this.loadManualQuestions();
      }, 300);
    }
  },
  mounted() {
    this.loadComposeData();
  },
  beforeDestroy() {
    if (this.manualSearchTimer) window.clearTimeout(this.manualSearchTimer);
  },
  methods: {
    notifyError(error) {
      this.$message.error(error.message || '操作失败，请稍后重试');
    },
    async loadComposeData() {
      await this.loadVersionOptions();
      await Promise.all([this.loadCategories(), this.loadManualQuestions(), this.loadBatchOptions(), this.loadCategoryFilterOptions()]);
    },
    async loadCategoryFilterOptions() {
      this.categoryFilterOptions = await loadExamCategoryOptions({version: this.bankVersion});
      if (this.pickerCategory !== 'all' && !this.categoryFilterOptions.some(item => item.value === this.pickerCategory)) {
        this.pickerCategory = 'all';
      }
    },
    async loadVersionOptions() {
      const state = await loadExamVersionState();
      this.bankVersions = state.versionOptions;
      this.bankVersion = state.defaultVersion;
    },
    async loadBatchOptions() {
      this.batchLoading = true;
      try {
        this.batchOptions = await getExamBatchOptions();
      } catch (error) {
        this.batchOptions = [];
        this.notifyError(error);
      } finally {
        this.batchLoading = false;
      }
    },
    applyQuestionTypePool(typeCounts) {
      const percents = weightsToPercents(this.questionTypeRules.map(rule => rule.defaultWeight));
      this.questionTypeRules.forEach((rule, index) => {
        this.$set(rule, 'available', Math.max(0, Number(typeCounts[rule.type]) || 0));
        this.$set(rule, 'weight', percents[index] || 0);
      });
    },
    async loadQuestionTypeCounts() {
      const results = await Promise.all(this.questionTypeRules.map(async rule => {
        try {
          const response = await getQuestionPage({
            pageNum: 1,
            pageSize: 1,
            type: rule.type,
            status: '已启用',
            version: this.bankVersion
          });
          return [rule.type, Number((response.data || {}).total) || 0];
        } catch (error) {
          return [rule.type, 0];
        }
      }));
      this.applyQuestionTypePool(results.reduce((result, [type, count]) => {
        result[type] = count;
        return result;
      }, {}));
    },
    async loadCategories() {
      this.categoryLoading = true;
      try {
        const response = await getComposeCategories({version: this.bankVersion});
        const payload = response.data || [];
        const categories = Array.isArray(payload) ? payload : (payload.categories || payload.list || []);
        const outOfScopeCategory = categories.find(isOutOfScopeCategory) || {};
        this.categoryRules = withDefaultCategoryWeights(
          categories.filter(item => !isOutOfScopeCategory(item)).map(toCategoryRule)
        );
        const themeTotal = this.categoryRules.reduce((sum, item) => sum + item.available, 0);
        const outOfScopeTotal = Number(outOfScopeCategory.available || payload.outOfScopeTotal || payload.outlineTotal || payload.superTotal) || 0;
        this.$set(this.sourceRules[0], 'available', themeTotal);
        this.$set(this.sourceRules[1], 'available', Math.max(0, outOfScopeTotal));
        const typeCounts = collectQuestionTypeCounts(payload, categories, this.questionTypeRules.map(rule => rule.type));
        if (this.questionTypeRules.some(rule => typeCounts[rule.type] > 0)) this.applyQuestionTypePool(typeCounts);
        else await this.loadQuestionTypeCounts();
      } catch (error) {
        this.notifyError(error);
      } finally {
        this.categoryLoading = false;
      }
    },
    async loadManualQuestions() {
      this.manualLoading = true;
      try {
        const response = await getQuestionPage({
          pageNum: this.manualPage,
          pageSize: this.manualPageSize,
          keyword: this.manualKeyword || undefined,
          status: '已启用',
          version: this.bankVersion,
        });
        const page = response.data || {};
        this.questions = (page.list || []).map(toQuestionView);
        this.manualPage = Number(page.pageNum) || this.manualPage;
        this.manualTotal = Number(page.total) || 0;
      } catch (error) {
        this.questions = [];
        this.manualTotal = 0;
        this.notifyError(error);
      } finally {
        this.manualLoading = false;
      }
    },
    changeManualPage(page) {
      this.manualPage = Math.max(1, Math.min(page, this.manualPageCount));
      this.loadManualQuestions();
    },
    changeManualPageSize(size) {
      const pageSize = Math.min(300, Math.max(1, Number(size) || 10));
      this.manualPageSize = pageSize;
      this.manualPage = 1;
      this.loadManualQuestions();
    },
    async changeBankVersion() {
      this.notice = '';
      this.manualPage = 1;
      this.selectedQuestionIds = [];
      this.selectedQuestionTypes = {};
      this.generatedPaper = null;
      this.qaView = 'builder';
      this.pickerPage = 1;
      this.pickerCategory = 'all';
      await Promise.all([this.loadCategories(), this.loadManualQuestions(), this.loadCategoryFilterOptions()]);
      if (this.questionPickerVisible) await this.loadPickerQuestions();
    },
    switchTab(tab) {
      this.activeTab = tab;
      this.notice = '';
    },
    onTabClick(tab) {
      this.switchTab(tab.name);
    },
    setRatioMode(mode) {
      this.ratioMode = mode;
      if (mode === 'default') this.categoryRules.forEach(rule => {
        rule.weight = rule.defaultWeight;
      });
    },
    formatRatio(value) {
      return Number(value || 0).toFixed(1);
    },
    formatScore(value) {
      const number = Math.round((Number(value) || 0) * 100) / 100;
      return Number.isInteger(number) ? String(number) : String(number).replace(/0$/, '');
    },
    questionCategory(item) {
      return String((item && (item.category || item.catagory)) || '').trim();
    },
    configuredQuestionType(type) {
      return this.questionTypeRules.find(rule => rule.type === type);
    },
    configuredQuestionScore(question) {
      const rule = this.configuredQuestionType(question && question.type);
      return rule ? Math.max(0, Number(rule.score) || 0) : Math.max(0, Number(question && question.score) || 0);
    },
    questionTypeClass(type) {
      return {'单选题': 'single', '多选题': 'multiple', '判断题': 'judge', '简答题': 'essay'}[type] || 'single';
    },
    typeShortName(type) {
      return {'单选题': '单', '多选题': '多', '判断题': '判'}[type] || type;
    },
    sourceTypeSummary(sourceType) {
      return this.sourceTypeMatrix.filter(cell => cell.row.sourceType === sourceType)
          .map(cell => `${this.typeShortName(cell.column.type)}${cell.count}`).join(' / ');
    },
    categoryTypeSummary(categoryId) {
      return this.themeCategoryTypeMatrix.filter(cell => cell.row.id === categoryId)
          .map(cell => `${this.typeShortName(cell.column.type)}${cell.count}`).join(' / ');
    },
    toggleQuestion(id) {
      if (this.selectedQuestionIds.includes(id)) {
        this.selectedQuestionIds = this.selectedQuestionIds.filter(item => item !== id);
        this.$delete(this.selectedQuestionTypes, id);
        return;
      }
      const question = this.questions.find(item => item.id === id);
      this.selectedQuestionIds = [...this.selectedQuestionIds, id];
      this.$set(this.selectedQuestionTypes, id, question ? question.type : '未知题型');
    },
    toggleAllQuestions() {
      const pageIds = this.questions.map(item => item.id);
      if (this.allQuestionsSelected) {
        this.selectedQuestionIds = this.selectedQuestionIds.filter(id => !pageIds.includes(id));
        pageIds.forEach(id => this.$delete(this.selectedQuestionTypes, id));
        return;
      }
      this.questions.forEach(item => this.$set(this.selectedQuestionTypes, item.id, item.type));
      this.selectedQuestionIds = [...new Set([...this.selectedQuestionIds, ...pageIds])];
    },
    questionScore(question) {
      return this.formatScore(question.score == null ? this.composeScore / Math.max(1, this.composeCount) : question.score);
    },
    async generatePaper() {
      if (!this.composeCount) {
        this.notice = '请先设置有效的出题数量。';
      }
      if (this.composeMode === 'smart' && (!this.sourceWeightTotal || !this.questionTypeWeightTotal || !this.configuredWeightTotal)) {
        this.notice = '题库来源、题型比例和主题大类比例均需设置有效值。';
      }
      if (this.composeMode === 'smart' && this.allocatedQuestionCount < this.normalizedTotalQuestions) {
        this.notice = '主题库或超纲题库可用题量不足，请调整出题总数或来源比例。';
      }
      if (this.composeMode === 'smart' && this.allocatedCategoryQuestionCount < this.themeQuestionCount) {
        this.notice = '主题库大类的可用题量不足，请调整大类比例。';
      }
      if (this.composeMode === 'smart' && this.allocatedQuestionTypeRules.reduce((sum, rule) => sum + rule.count, 0) < this.normalizedTotalQuestions) {
        this.notice = '题型比例无法覆盖全部题目，请调整单选、多选和判断题比例。';
      }
      if (Number(this.settings.passScore) > this.composeScore) {
        this.notice = '及格分数不能高于试卷总分。';
      }
      if (!this.settings.pcId) {
        this.notice = '请选择考试批次。';
      }
      if (this.notice) {
        this.$message.warning(this.notice);
        this.notice = '';
        return;
      }
      this.notice = '';
      this.generating = true;
      try {
        const common = {
          paperType: 'QA',
          version: this.bankVersion,
          totalScore: this.composeScore,
          passScore: Number(this.settings.passScore) || 0,
          duration: Number(this.settings.duration) || 0,
          pcId: this.settings.pcId
        };
        const requestBase = {
          version: this.bankVersion,
          totalScore: common.totalScore,
          passScore: common.passScore,
          duration: common.duration
        };
        let responseData = {};
        if (this.composeMode === 'smart') {
          const payload = {
            ...requestBase,
            totalQuestions: this.normalizedTotalQuestions,
            selectionRules: this.selectionRules
          };
          const response = await generateSmartPaper(payload);
          responseData = response.data || {};
        } else {
          const response = await generateManualPaper({
            ...requestBase,
            totalQuestions: this.selectedQuestionIds.length,
            questionIds: this.selectedQuestionIds,
            questionScores: this.manualQuestionScores
          });
          responseData = response.data || {};
        }
        this.generatedPaper = toPaperView({...common, ...responseData});
        if (this.composeMode === 'smart') {
          const actualCount = this.generatedPaper.questions.length;
          if (actualCount !== this.normalizedTotalQuestions) {
            this.notice = `后端返回 ${actualCount} 道题，与计划抽取的 ${this.normalizedTotalQuestions} 道不一致，请检查题库数据或组卷规则。`;
            this.generatedPaper = null;
            this.$message.error(this.notice);
            return;
          }
        }
        this.rebalancePaperQuestions();
        this.previewActiveType = this.previewQuestionGroups.length ? this.previewQuestionGroups[0].type : '';
        this.qaView = 'preview';
      } catch (error) {
        this.notifyError(error);
      } finally {
        this.generating = false;
      }
    },
    async saveGeneratedPaper() {
      const paperId = await this.persistGeneratedPaper();
      if (!paperId) return;
      this.qaView = 'result';
      this.$message.success('试卷保存成功');
    },
    validateGeneratedPaper() {
      if (!this.generatedPaper) return;
      if (!this.generatedPaper.questions.length) {
        this.$message.warning('请至少保留一道试题');
        return false;
      }
      if (!this.previewScoreValid) {
        this.$message.warning(`当前试卷为 ${this.formatScore(this.generatedPaper.totalScore)} 分，请调整至 100 分后再保存`);
        return false;
      }
      if (Number(this.generatedPaper.passScore) > Number(this.generatedPaper.totalScore)) {
        this.$message.warning('及格分数不能高于当前试卷总分');
        return false;
      }
      const title = String(this.generatedPaper.title || '').trim();
      if (!title) {
        this.$message.warning('请输入试卷名称');
        return false;
      }
      this.generatedPaper.title = title;
      this.generatedPaper.pcId = this.generatedPaper.pcId || this.settings.pcId;
      if (!this.generatedPaper.pcId) {
        this.$message.warning('请选择考试批次');
        return false;
      }
      return true;
    },
    async persistGeneratedPaper() {
      if (!this.validateGeneratedPaper()) return '';
      this.savingPaper = true;
      try {
        const response = await savePaper(toPaperPayload(this.generatedPaper));
        const payload = response.data;
        const paperId = payload && typeof payload === 'object' ? (payload.id || payload.paperId) : payload;
        if (!paperId) throw new Error(response.msg);
        this.savedPaperId = String(paperId);
        this.generatedPaper.id = this.savedPaperId;
        return this.savedPaperId;
      } catch (error) {
        this.notifyError(error);
        return '';
      } finally {
        this.savingPaper = false;
      }
    },
    resolveExportBlob(response) {
      if (response instanceof Blob) return response;
      if (response && response.data instanceof Blob) return response.data;
      return response;
    },
    async exportCurrentPaper() {
      if (!this.validateGeneratedPaper()) return;
      this.exportingPaper = true;
      try {
        const blob = this.resolveExportBlob(await exportPaper(toPaperPayload(this.generatedPaper)));
        downloadBlob(blob, `${safeFilename(this.generatedPaper.title, '考试试卷')}.docx`);
        this.$message.success('试卷 Word 导出成功');
      } catch (error) {
        this.notifyError(error);
      } finally {
        this.exportingPaper = false;
      }
    },
    async exportGeneratedPaper() {
      if (this.exportingPaper || this.savingPaper) return;
      await this.exportCurrentPaper();
    },
    async exportSavedPaper() {
      if (this.exportingPaper) return;
      await this.exportCurrentPaper();
    },
    async openQuestionPicker() {
      this.pickerKeyword = '';
      this.pickerPage = 1;
      this.pickerCategory = 'all';
      await this.loadCategoryFilterOptions();
      this.questionPickerVisible = true;
    },
    async loadPickerQuestions() {
      if (!this.questionPickerVisible) return;
      this.pickerLoading = true;
      try {
        const response = await getQuestionPage({
          pageNum: this.pickerPage,
          pageSize: this.pickerPageSize,
          keyword: this.pickerKeyword || undefined,
          status: '已启用',
          version: this.bankVersion,
          type: this.typeFilter === 'all' ? undefined : this.typeFilter,
          catagory: this.pickerCategory && this.pickerCategory !== 'all' ? this.pickerCategory : undefined
        });
        const page = response.data || {};
        this.pickerQuestions = (page.list || []).map(toQuestionView);
        this.pickerPage = Number(page.pageNum) || this.pickerPage;
        this.pickerPageSize = Number(page.pageSize) || this.pickerPageSize;
        this.pickerTotal = Number(page.total) || 0;
      } catch (error) {
        this.pickerQuestions = [];
        this.pickerTotal = 0;
        this.notifyError(error);
      } finally {
        this.pickerLoading = false;
      }
    },
    searchPickerQuestions() {
      this.pickerPage = 1;
      this.loadPickerQuestions();
    },
    changePickerPage(page) {
      this.pickerPage = page;
      this.loadPickerQuestions();
    },
    paperHasQuestion(id) {
      return Boolean(this.generatedPaper && this.generatedPaper.questions.some(item => String(item.questionId || item.id) === String(id)));
    },
    questionCanBeAdded(question) {
      return this.composeMode !== 'smart' || Boolean(this.configuredQuestionType(question.type));
    },
    addQuestionToPaper(question) {
      if (!this.generatedPaper || this.paperHasQuestion(question.id)) return;
      this.generatedPaper.questions.push({
        ...question,
        id: question.id,
        questionId: question.id,
        version: this.bankVersion,
        score: 0,
        sortOrder: this.generatedPaper.questions.length + 1
      });
      this.rebalancePaperQuestions();
      this.previewActiveType = question.type;
      this.$message.success('试题已添加到当前试卷');
    },
    async removePreviewQuestion(index) {
      const question = this.generatedPaper && this.generatedPaper.questions[index];
      if (!question) return;
      try {
        await this.$confirm(`确认从试卷中删除“${question.title}”吗？`, '删除试题', {
          type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消'
        });
      } catch (error) {
        return;
      }
      this.generatedPaper.questions.splice(index, 1);
      this.rebalancePaperQuestions();
    },
    rebalancePaperQuestions() {
      if (!this.generatedPaper) return;
      const questions = this.generatedPaper.questions || [];
      this.generatedPaper.questions = questions.map((item, index) => ({
        ...item,
        score: this.configuredQuestionScore(item),
        sortOrder: index + 1
      }));
      this.generatedPaper.totalScore = Math.round(this.generatedPaper.questions.reduce((sum, item) => sum + item.score, 0) * 100) / 100;
      this.generatedPaper.questionCount = questions.length;
    },
    resetComposer() {
      this.qaView = 'builder';
      this.generatedPaper = null;
      this.savedPaperId = '';
    }
  }
};
</script>
<style scoped lang="less">
@import '../../style/index.less';
</style>
