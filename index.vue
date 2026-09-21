<template>
  <div class="exam-runtime-root" v-append-to-body>
    <login class="exam-shell exam-system" v-if="needLogin" @login="login" @closeLogin="$emit('close')" />
    <div v-else class="exam-shell exam-system"
      :class="{ 'is-review-mode': reviewMode, 'is-exam-answering': examAnswering, 'is-legacy-view': isLegacyBusinessView || (useLegacyExaminer && cpnName === 'examiner-index') }">
      <header class="exam-system-header">
        <div class="exam-system-brand">
          <img src="@/assets/images/logo@2x.png" alt="国网安徽电力" />
          <h1>国网安徽电力2026年新型配电系统配电网规划设计竞赛</h1>
        </div>
        <div class="exam-system-header-actions">
          <el-button v-if="reviewMode" type="text" icon="el-icon-back" @click="backTeacher">退出阅卷</el-button>
          <div v-if="showExamCountdown" class="exam-countdown">
            距考试结束还有：<strong>{{ getTimeDiff }}</strong>
          </div>
<!--          <el-tag v-if="examModeLabel" class="exam-mode-tag" size="small" type="warning">-->
<!--            {{ examModeLabel }}-->
<!--          </el-tag>-->

          <span class="runtime-user"><i class="el-icon-user"></i>{{ displayUserName }}</span>
<!--          <el-tag class="exam-identity-tag" size="small" :type="isExaminer ? 'success' : ''">-->
<!--            {{ identityLabel }}-->
<!--          </el-tag>-->



<!--          <el-tag v-if="showSubmitAction" type="danger" effect="dark" size="small" class="exam-submit-tag"-->
<!--            @click="finishKs">提交试卷</el-tag>-->
          <el-button type="text" icon="el-icon-switch-button" @click="logout">退出登录</el-button>
        </div>
      </header>

      <Sidebar v-if="showModernSidebar" :groups="menuGroups" :active="activeMenu" @select="selectMenu" />
      <main class="exam-main">
        <template v-if="isLegacyBusinessView">
          <xqkNew v-if="cpnName === 'xqk-new-2'" :tabName="tabName" :regionId="regionId"
            :yxdwId="yxdwId" :mode="mode" @goIndex="goIndex" />
          <xqk v-else-if="cpnName === 'xqk-new'" :tabName="tabName" :regionId="regionId"
            :yxdwId="yxdwId" :mode="mode" @goIndex="goIndex" />
          <xmCbk v-else-if="cpnName === 'xmCbk'" :showTab="cpnName" :regionId="regionId"
            :yxdwId="yxdwId" :mode="mode" @goIndex="goIndex" />
          <xmXdk v-else-if="cpnName === 'xmXdk'" :regionId="regionId" :yxdwId="yxdwId"
            :mode="mode" @goIndex="goIndex" />
          <xmpskNew v-else-if="cpnName === 'xmpsk-new'" :regionId="regionId" :yxdwId="yxdwId"
            :tabName="tabName" :mode="mode" @goIndex="goIndex" />
        </template>

        <paperManagement v-else-if="useLegacyExaminer && cpnName === 'examiner-index'"
          @changeStudent="changeReviewStudent" />

<!--        <home v-else-if="cpnName === 'examHome'" ref="home" @needLogin="needLogin = true" />-->

        <template v-else-if="reviewMode">
          <home ref="home" :mode="mode || '阅卷中'" @needLogin="needLogin = true" />
        </template>

          <component v-else :is="activeComponent" :key="activeMenu" @open-topology="openTopologyCanvas"
            @change-student="changeReviewStudent" @need-login="needLogin = true" @exam-state-change="handleExamStateChange"
            @logout="handleExamLogout" @violation="openCodeDialog" @exam-closed="handleExamClosedByStatus" />
      </main>

      <FloatingScore
        v-if="showFloatingScore"
        :modeType="modeType"
        @close="backTeacher"
      />

      <div
        v-if="showLegacyMenu"
        ref="examMenuFloat"
        class="exam-menu-float"
        :style="menuBallStyle"
      >
        <el-popover
          v-model="isExpand"
          trigger="click"
          width="500"
          :placement="menuPanelSide === 'left' ? 'left-start' : 'right-start'"
          popper-class="exam-legacy-menu-popper1"
        >
          <div class="zjw_nav">
            <div class="menu-list-new">
              <div v-for="(menu, menuIndex) in menuListNew" :key="menu.id || menuIndex" class="item">
                <div v-show="menu.checked" class="menu-content">
                  <img :src="menu.icon" alt="" />
                  <div class="name">{{ menu.title }}</div>
                </div>
                <div v-if="menu.subMenus" class="submenu-list">
                  <template v-for="(subMenu, subIndex) in menu.subMenus">
                    <div v-if="subMenu.checked" :key="subMenu.id || `${menuIndex}-${subIndex}`" class="sub-item"
                         @click="changeTabNew(subMenu.code, subMenu.name, subMenu.permission, subMenu, '')">
                      <span @click="nav_click(subIndex, subMenu)">{{ subMenu.title }}</span>
                      <div v-show="showIndex === subIndex" class="subMenu_div"
                           :style="{ marginBottom: showIndex === subIndex && subMenu.navOptions ? '-40px' : '0' }">
                        <p v-for="(item, optionIndex) in subMenu.navOptions" :key="item.id || optionIndex"
                           @click.stop="changeTabNew(item.code, item.name, item.permission, item, '')">
                          {{ item.title }}
                        </p>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
          <button
            slot="reference"
            type="button"
            class="exam-menu-ball"
            :class="{ 'is-active': isExpand }"
            title="菜单"
            aria-label="菜单"
            @mousedown="onMenuBallDragStart"
            @click="onMenuBallClick"
          >
            <i class="el-icon-menu"></i>
            <span>菜单</span>
          </button>
        </el-popover>
      </div>
    </div>

    <el-dialog
      v-if="codeDialog"
      append-to-body
      :visible="codeDialog"
      title="违规操作，请联系考官获取验证码解封"
      width="25%"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form label-position="right" label-width="120px" @submit.native.prevent="submitCode">
        <el-form-item label="验证码：">
          <el-input v-model="code" type="text" placeholder="请输入验证码"></el-input>
        </el-form-item>
        <div style="display: flex; justify-content: flex-end;">
          <el-button size="small" type="primary" native-type="submit">确定</el-button>
        </div>
      </el-form>
    </el-dialog>

    <div
      v-if="theoryFullscreenGate && !codeDialog"
      class="theory-fullscreen-gate"
      @keydown.capture="onTheoryFullscreenGateKeydown"
    >
      <div class="theory-fullscreen-card">
        <i class="el-icon-full-screen"></i>
        <h3>理论考试需全屏作答</h3>
        <p>请先进入全屏，再开始或继续考试。考试过程中退出全屏或切换窗口将视为违规。</p>
        <el-button type="primary" :loading="enteringTheoryFullscreen" @click="enterTheoryFullscreen">进入全屏</el-button>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable vue/no-mutating-props, vue/multi-word-component-names */
import { getGhsjData, findEquipment, getDropdownItems, getLoginRole } from '@/api/pwgh/xqkNew';
import leftPopup from '@/components/ghsjPanel/dragPopup/index.vue';
import { mapState } from 'vuex';
import mouseClick from '@/platformComponents/mouseClick/index.vue';
import TPMap from '@/components/ghsjPanel/components/tp/indexTzgh.vue';
import Popup from '@/components/ghsjPanel/components/wjghModel/popup.vue';
import tpModel from '@/components/ghsjPanel/components/wgdjModel/components/wj/drawTp2.vue';
import common from '../../common.js';
import Sidebar from './Sidebar.vue';
import Overview from './Overview.vue';
import QuestionBank from './QuestionBank.vue';
import ExamComposer from './ExamComposer.vue';
import ExamList from './ExamList.vue';
import Competition from './Competition.vue';
import Practice from './Practice.vue';
import WrongBook from './WrongBook.vue';
import Security from './Security.vue';
import Users from './Users.vue';
import home from './cpns/home.vue';
import FloatingScore from './cpns/FloatingScore.vue';
import login from './cpns/login.vue';
import xqkNew from '../../components/xqkNewModelExam/index.vue';
import xqk from '../../components/xqkModelExam/index.vue';
import xmCbk from '../../components/cbkModelExam/index.vue';
import xmXdk from '../../components/xdkModelExam/index.vue';
import xmpskNew from '../../components/pskModelExam/index.vue';
import paperManagement from './cpns/PaperManagement.vue';
import { createViolationGuard } from './violationGuard.js';
import { bindFullscreenChange, enterExamFullscreen, exitExamFullscreen, isExamFullscreen } from './examFullscreen';
import { finishExam, getExamTime, getPaperDetail, getTempAnswer, logout as logoutRequest, submitExamSession, toPaperView, wgjl, yzmjy } from '@/api/pwgh/examCbPsk';

const STUDENT_MENUS = [{
  label: '学习中心',
  items: [
    { key: 'competition', label: '开始考试', icon: 'el-icon-video-play' },
    { key: 'practice', label: '练习模式', icon: 'el-icon-reading' },
    { key: 'wrong', label: '错题集', icon: 'el-icon-warning-outline' }
  ]
}];

const EXAMINER_MENUS = [
  { label: '工作台', items: [{ key: 'dashboard', label: '系统总览', icon: 'el-icon-data-analysis' }] },
  {
    label: '考试管理',
    items: [
      { key: 'questions', label: '题库管理', icon: 'el-icon-collection' },
      { key: 'compose', label: '考试出题', icon: 'el-icon-edit-outline' },
      { key: 'exams', label: '考试管理', icon: 'el-icon-monitor' }
    ]
  },
  {
    label: '数据与设置',
    items: [
      { key: 'security', label: '验证码管理', icon: 'el-icon-lock' },
      { key: 'users', label: '人员管理', icon: 'el-icon-user' }
    ]
  }
];

const PAGE_COMPONENTS = {
  dashboard: Overview,
  questions: QuestionBank,
  compose: ExamComposer,
  exams: ExamList,
  competition: Competition,
  practice: Practice,
  wrong: WrongBook,
  security: Security,
  users: Users
};

function readStoredUser(key = 'ks-user-info') {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (error) { return {}; }
}

function readStoredSessionUser() {
  try { return JSON.parse(sessionStorage.getItem('userInfo')) || {}; } catch (error) { return {}; }
}

function createLegacyMenuList() {
  return [{
    title: '项目管理',
    name: '项目管理',
    checked: true,
    id: '875A3D15-FE07-4610-8447-99B23BAC1452',
    icon: require('@/components/ghsjPanel/images/menu5.png'),
    subMenus: [
      {
        title: '竞赛首页',
        name: '竞赛首页',
        code: 'index',
        checked: true,
        id: '14CB709C-14C3-4EE7-A5DB-11E6A4E4EAE3'
      },
      {
        title: '需求统筹',
        name: '需求统筹',
        code: 'xqk-new-2',
        checked: true,
        id: '14CB709C-14C3-4EE7-A5DB-11E6A4E4EAE2'
      },
      {
        title: '规划库',
        name: '规划（需求）',
        permission: '需求统筹',
        id: '1E2101DB-8044-4EA9-889E-4140C501BF27',
        checked: true,
        pop: true,
        navOptions: [{
          title: '基建规划',
          name: '基建规划',
          code: 'xqk-new',
          permission: '需求统筹',
          id: '2036D948-C609-45F2-91C1-695D1ACEBBED',
          checked: true
        }]
      },
      {
        title: '储备库',
        name: '储备管理',
        permission: '需求统筹',
        code: 'xmCbk',
        id: 'AD2B65EF-165F-488F-844A-2D2C6BF55CC0',
        checked: true,
        pop: true,
        navOptions: [{
          title: '基建储备',
          name: '需求统筹',
          code: 'xmCbk',
          permission: '需求统筹',
          id: '1030B237-6C9A-4368-B08D-F1B9B7EB5CB1',
          checked: true
        }]
      },
      {
        title: '计划库',
        name: '计划下达',
        permission: '需求统筹',
        code: 'xmXdk',
        id: '02AE24B9-4702-4D00-8F57-DEA0C7B02227',
        checked: true,
        pop: true,
        navOptions: [{
          title: '基建下达',
          name: '需求统筹',
          code: 'xmXdk',
          permission: '需求统筹',
          id: '1030B237-6C9A-4368-B08D-F1B9B7EB5CB1',
          checked: true
        }]
      },
      {
        title: '三级评审',
        name: '三级评审',
        checked: true,
        code: 'xmpsk-new',
        id: '459345E8-951E-419C-9B40-9E29370BD43E',
        pop: true,
        navOptions: [
          { title: '基建评审库', name: '基建评审库', code: 'xmpsk-new', permission: '新三级评审', active: false, checked: true },
          { title: '技改评审库', name: '技改评审库', code: 'xmpsk-new', permission: '新三级评审', active: false, checked: true },
          { title: '大修评审库', name: '大修评审库', code: 'xmpsk-new', permission: '新三级评审', active: false, checked: true }
        ]
      }
    ]
  }];
}

export default {
  name: 'tzgh',
  components: {
    Sidebar,
    leftPopup,
    mouseClick,
    TPMap,
    Popup,
    tpModel,
    home,
    xqkNew,
    xqk,
    xmCbk,
    xmXdk,
    xmpskNew,
    paperManagement,
    login,
    FloatingScore
  },
  props: {
    regionId: { type: String, default: '' },
    yxdwId: { type: String, default: '' },
    tableDetail: { type: Object, default: () => ({}) },
    searchDetail: { type: Object, default: () => ({}) },
    useLegacyExaminer: { type: Boolean, default: false }
  },
  directives: {
    'append-to-body': {
      inserted(el, binding) {
        if (binding.value !== false) document.body.appendChild(el);
      },
      unbind(el) {
        if (el.parentNode === document.body) document.body.removeChild(el);
      }
    }
  },
  data() {
    const currentUser = readStoredUser();
    const teacherInfo = readStoredUser('ks-user-info-teacher');
    const isExaminer = Number(currentUser.roleType) === 1;
    const needLogin = !currentUser.id && !currentUser.userId;
    const hasTheoryPaper = !isExaminer && Boolean(localStorage.getItem('paperId')) && !localStorage.getItem('ks-active-paper');
    return {
      reviewReturnMenu: 'users',
      examAnswering: !isExaminer && Boolean(localStorage.getItem('ks-active-paper')),
      scenarioExamActive: !isExaminer && Boolean(localStorage.getItem('ks-active-paper')),
      hasActiveTheoryPaper: !isExaminer && Boolean(localStorage.getItem('paperId')) && !localStorage.getItem('ks-active-paper'),
      currentUser,
      ksUserInfo: currentUser,
      ksUserInfo1: { userName: '', id: '' },
      teacherInfo,
      needLogin,
      activeMenu: isExaminer ? 'dashboard' : 'competition',
      cpnName: isExaminer ? 'examiner-index' : '',
      reviewMode: false,
      reviewUser: {},
      modeType: '',
      mode: '',
      timer: null,
      ksInfo: {
        currentTime: '',
        endTime: '',
        startTime: '',
        sfwg: '',
        wgcs: ''
      },
      violationGuard: null,
      theoryFullscreenGate: !isExaminer && !needLogin && hasTheoryPaper && !isExamFullscreen(),
      enteringTheoryFullscreen: false,
      codeDialog: false,
      code: '',
      showIndex: -1,
      selectTab: '',
      itemChildActive: '',
      lsShow: false,
      vm: {},
      tabName: '',
      isExpand: false,
      menuBallPosition: { left: 5, top: Math.max(80, Math.round(window.innerHeight / 3 - 32)) },
      menuBallDragState: null,
      menuBallLastDragAt: 0,
      menuPanelSide: 'right',
      menuListNew: createLegacyMenuList(),
      user: { userName: 'Wll' },
      maxTp: false,
      activeRow: {},
      roleData: [],
      colorList: ['#FF9600', '#FF1E1E', '#BC0000', '#FF5353', '#FEB65A', '#00A6B2', '#5Bd3FF', '#B28DBF', '#BE4785', '#D9B8E4'],
      map: null,
      sgdps: null,
      legacyServices: { getGhsjData, findEquipment, getDropdownItems },
      examClock: { startAt: 0, endAt: 0, currentAt: 0 },
      examClockOffset: 0,
      examTimer: null,
      examExpiredHandled: false,
      examClosedHandled: false
    };
  },
  computed: {
    ...mapState({
      theme: state => (state.pwmode ? state.pwmode.theme : ''),
      showTab: state => state.showTab
    }),
    isExaminer() { return Number(this.currentUser.roleType) === 1; },
    studentStatus() {
      const status = Number(this.currentUser.status);
      return Number.isFinite(status) ? status : 0;
    },
    isActiveStudentExam() { return !this.isExaminer && !this.reviewMode && this.studentStatus <= 1; },
    isTheoryExamLocked() {
      return !this.isExaminer && !this.reviewMode
        && ((this.examAnswering && !this.scenarioExamActive) || this.hasActiveTheoryPaper);
    },
    menuGroups() {
      if (this.isExaminer) return EXAMINER_MENUS;
      return STUDENT_MENUS.map(group => ({
        ...group,
        items: group.items.map(item => ({
          ...item,
          disabled: this.isTheoryExamLocked && (item.key === 'practice' || item.key === 'wrong')
        }))
      }));
    },
    activeComponent() { return PAGE_COMPONENTS[this.activeMenu] || (this.isExaminer ? Overview : Competition); },
    isLegacyBusinessView() {
      return ['xqk-new-2', 'xqk-new', 'xmCbk', 'xmXdk', 'xmpsk-new'].includes(this.cpnName);
    },
    showModernSidebar() {
      return !this.examAnswering && !this.reviewMode && !this.isLegacyBusinessView
        && !(this.useLegacyExaminer && this.cpnName === 'examiner-index');
    },
    showSubmitAction() {
      return this.cpnName !== 'examiner-index' && !this.mode && !this.isExaminer;
    },
    getTimeDiff() {
      const diff = this.parseExamTime(this.ksInfo.endTime) - this.parseExamTime(this.ksInfo.currentTime);
      if (diff <= 0 || !this.ksInfo.endTime) return '';
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      const hms = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      return days ? `${days}天${hms}` : hms;
    },
    remainingExamTime() {
      if (!this.examClock.endAt || !this.examClock.currentAt) return 0;
      return Math.max(0, this.examClock.endAt - this.examClock.currentAt);
    },
    examCountdown() {
      const diff = this.remainingExamTime;
      if (!diff) return '';
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      const time = [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
      return days ? `${days}天${time}` : time;
    },
    showFloatingScore() {
      return this.reviewMode && this.mode === '阅卷中';
    },
    showExamCountdown() {
      return this.scenarioExamActive && this.isActiveStudentExam && Boolean(this.getTimeDiff);
    },
    examModeLabel() {
      if (this.mode) return this.mode;
      if (this.reviewMode) return '阅卷中';
      if (this.isExaminer) return '';
      let label = '';
      this.studentStatus > 1 && (label = '查看试卷');
      !this.studentStatus && (label = '考试中');
      !this.studentStatus && this.currentUser.status === null && (label = '');
        return label;
    },
    identityLabel() { return this.isExaminer ? '考官端' : '学生端'; },
    displayUserName() {
      const user = this.reviewMode ? this.reviewUser : this.currentUser;
      return user.userName || user.name || user.userId || '';
    },
    menuBallStyle() {
      return {
        left: `${this.menuBallPosition.left}px`,
        top: `${this.menuBallPosition.top}px`
      };
    },
    showLegacyMenu() {
      if (this.activeMenu === 'practice' || this.activeMenu === 'wrong') return false;
      if (this.reviewMode || this.mode === '阅卷中') return true;
      if (this.isLegacyBusinessView || this.scenarioExamActive) return true;
      if (this.isExaminer) return false;
      return this.activeMenu !== 'competition';
    }
  },
  watch: {
    getTimeDiff(value) {
      if (value || !this.ksInfo.endTime) return;
      if (this.needLogin || this.reviewMode || this.isExaminer || this.mode) return;
      if (!this.scenarioExamActive) return;
      this.handleExamExpired();
    },
    needLogin: {
      handler(value) {
        this.ksUserInfo = readStoredUser();
        this.currentUser = { ...this.ksUserInfo };
        this.getExamTimeInfo();
        this.syncTheoryExamLock();
        if (value) {
          this.theoryFullscreenGate = false;
          this.stopTheoryViolationGuard();
          exitExamFullscreen();
        }
      },
      immediate: true
    },
    theoryFullscreenGate(value) {
      if (!value) return;
      this.$nextTick(() => {
        const btn = this.$el && this.$el.querySelector('.theory-fullscreen-card .el-button');
        if (btn && typeof btn.focus === 'function') btn.focus();
      });
    },
    isTheoryExamLocked: {
      immediate: true,
      handler(locked) {
        if(locked) this.bindExamKeyBlock();
        else this.unbindExamKeyBlock(); 
      }
    },
    searchDetail: {
      handler(value) {
        this.tableDetail.ssds = value.shiName || '';
        this.tableDetail.yxdw = value.xianName || '';
        this.tableDetail.gridName = value.wgName || '';
        this.tableDetail.no = value.wgNo || '';
        this.tableDetail.gridId = value.gridId || '';
        window.setTimeout(() => {
          if (typeof this.initGrid === 'function') this.initGrid();
        }, 1000);
      },
      deep: true
    }
  },
  beforeCreate() {
    const current = readStoredUser();
    const teacher = readStoredUser('ks-user-info-teacher');
    const currentIsStudent = (current.id || current.userId) && Number(current.roleType) !== 1;
    if (currentIsStudent) return;
    if (teacher.id || teacher.userId) {
      localStorage.setItem('ks-user-info', localStorage.getItem('ks-user-info-teacher'));
    }
  },
  mounted() {
    const selectionBox = document.getElementsByClassName('xzzd-box')[0];
    const searchIcon = document.getElementsByClassName('SearchIcon')[0];
    if (selectionBox) selectionBox.style.background = 'none';
    if (searchIcon) searchIcon.style.left = '96vw';

    if (this.searchDetail.shiName) this.tableDetail.ssds = this.searchDetail.shiName;
    if (this.searchDetail.xianName) this.tableDetail.yxdw = this.searchDetail.xianName;
    if (this.searchDetail.wgName) this.tableDetail.gridName = this.searchDetail.wgName;
    if (this.searchDetail.wgNo) this.tableDetail.no = this.searchDetail.wgNo;
    if (!this.tableDetail.gridId) this.tableDetail.gridId = this.searchDetail.gridId || '';

    this.$nextTick(() => {
      const sessionUser = readStoredSessionUser();
      if (!sessionUser.userName && !sessionUser.userId) return;
      getLoginRole({ userName: sessionUser.userName, userId: sessionUser.userId }).then(response => {
        if (response.success && response.data && Array.isArray(response.data.roles)) {
          this.roleData = response.data.roles.map(role => role.role_code);
        }
      });
    });

    if (Number(this.ksUserInfo.status) > 1) this.mode = '查看试卷';
    window.addEventListener('resize', this.constrainMenuBallPosition);
    this.constrainMenuBallPosition();
    this.unbindTheoryFullscreen = bindFullscreenChange(this.onTheoryFullscreenChange);
  },
  beforeDestroy() {
    this.removeMenuBallDragListeners();
    window.removeEventListener('resize', this.constrainMenuBallPosition);
    this.unbindExamKeyBlock()
    if (this.unbindTheoryFullscreen) this.unbindTheoryFullscreen();
    this.stopTheoryViolationGuard();
    if (this.timer) window.clearInterval(this.timer);
    this.timer = null;
    this.stopExamClock();

    const selectionBox = document.getElementsByClassName('xzzd-box')[0];
    const searchIcon = document.getElementsByClassName('SearchIcon')[0];
    if (selectionBox) selectionBox.style.background = '#ecf2fc';
    if (searchIcon) searchIcon.style.left = '34vw';
    if (typeof this.removeLayers === 'function') {
      this.removeLayers('网架规划-draw-点,网架规划-draw-架空线,网架规划-draw-电缆线');
      this.removeLayers('投资设备-撒线,投资设备-撒点,投资设备-周边线路');
      this.removeLayers('网格定级-定位网格,网格定级-网格边框');
    }
  },
  destroyed() {
    window.sgdps1 = null;
  },
  methods: {
    getMenuBallBounds() {
      const size = 64;
      return {
        maxLeft: Math.max(0, window.innerWidth - size),
        maxTop: Math.max(0, window.innerHeight - size)
      };
    },
    constrainMenuBallPosition() {
      const bounds = this.getMenuBallBounds();
      this.menuBallPosition.left = Math.min(Math.max(this.menuBallPosition.left, 0), bounds.maxLeft);
      this.menuBallPosition.top = Math.min(Math.max(this.menuBallPosition.top, 0), bounds.maxTop);
      this.menuPanelSide = this.menuBallPosition.left + 76 + 500 > window.innerWidth - 8 ? 'left' : 'right';
    },
    onMenuBallDragStart(event) {
      if (event.button !== 0) return;
      event.preventDefault();
      this.isExpand = false;
      this.menuBallDragState = {
        startX: event.clientX,
        startY: event.clientY,
        startLeft: this.menuBallPosition.left,
        startTop: this.menuBallPosition.top,
        moved: false
      };
      window.addEventListener('mousemove', this.onMenuBallDragging);
      window.addEventListener('mouseup', this.onMenuBallDragEnd);
      window.addEventListener('blur', this.onMenuBallDragEnd);
    },
    onMenuBallDragging(event) {
      if (!this.menuBallDragState) return;
      const deltaX = event.clientX - this.menuBallDragState.startX;
      const deltaY = event.clientY - this.menuBallDragState.startY;
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) this.menuBallDragState.moved = true;
      const bounds = this.getMenuBallBounds();
      this.menuBallPosition.left = Math.min(Math.max(this.menuBallDragState.startLeft + deltaX, 0), bounds.maxLeft);
      this.menuBallPosition.top = Math.min(Math.max(this.menuBallDragState.startTop + deltaY, 0), bounds.maxTop);
      this.menuPanelSide = this.menuBallPosition.left + 76 + 500 > window.innerWidth - 8 ? 'left' : 'right';
    },
    onMenuBallDragEnd() {
      if (this.menuBallDragState && this.menuBallDragState.moved) this.menuBallLastDragAt = Date.now();
      this.menuBallDragState = null;
      this.removeMenuBallDragListeners();
    },
    removeMenuBallDragListeners() {
      window.removeEventListener('mousemove', this.onMenuBallDragging);
      window.removeEventListener('mouseup', this.onMenuBallDragEnd);
      window.removeEventListener('blur', this.onMenuBallDragEnd);
    },
    onMenuBallClick(event) {
      if (Date.now() - this.menuBallLastDragAt < 200) {
        event.stopImmediatePropagation();
        return;
      }
      this.showIndex = -1;
    },
    handleExamLogout() {
      this.requestLogout({ silent: true });
    },
    handleExamStateChange(payload) {
      const isObject = payload && typeof payload === 'object';
      const answering = isObject ? Boolean(payload.answering) : Boolean(payload);
      this.examAnswering = answering;
      const isScenario = isObject
        ? Boolean(payload.scenario)
        : Boolean(answering && localStorage.getItem('ks-active-paper'));
      this.scenarioExamActive = answering && isScenario;
      if (answering && !this.scenarioExamActive) this.isExpand = false;
      if (answering && !isScenario) this.startTheoryViolationGuard();
      else {
        this.stopTheoryViolationGuard();
        this.theoryFullscreenGate = false;
        if (!answering) exitExamFullscreen();
        if (!answering) this.releaseExamKeyboardLock();
      }
      this.syncTheoryExamLock();
      if (this.scenarioExamActive) {
        this.examExpiredHandled = false;
        this.getExamTimeInfo((isObject && payload.paperId) || localStorage.getItem('paperId'));
        return;
      }
      if (!answering) {
        this.codeDialog = false;
        this.code = '';
        this.clearExamTimeInfo();
      }
    },
    syncTheoryExamLock() {
      this.hasActiveTheoryPaper = !this.isExaminer
        && Boolean(localStorage.getItem('paperId'))
        && !localStorage.getItem('ks-active-paper');
    },
    canWatchTheoryViolation() {
      return !this.needLogin && !this.isExaminer && !this.reviewMode && !this.mode
        && !this.teacherInfo.id && !this.teacherInfo.userId
        && this.examAnswering && !this.scenarioExamActive;
    },
    startTheoryViolationGuard() {
      if (!this.canWatchTheoryViolation()) {
        this.stopTheoryViolationGuard();
        return;
      }
      if (!isExamFullscreen()) {
        this.theoryFullscreenGate = true;
        if (this.violationGuard && this.violationGuard.state && this.violationGuard.state.started) {
          this.stopTheoryViolationGuard({ keepDialog: true });
        }
        return;
      }
      this.theoryFullscreenGate = false;
      if (this.violationGuard && this.violationGuard.state && this.violationGuard.state.started) return;
      this.stopTheoryViolationGuard({ keepDialog: true });
      window.addEventListener('keydown', this.onKeyDown);
      this.violationGuard = createViolationGuard({
        storageKey: 'exam-page-active',
        vm: this,
        reportOnStop: false,
        requireFullscreen: true,
        onViolation: () => this.openCodeDialog()
      });
      this.violationGuard.start();
    },
    onTheoryFullscreenChange() {
      if (!this.canWatchTheoryViolation()) return;
      if (isExamFullscreen()) {
        this.theoryFullscreenGate = false;
        this.startTheoryViolationGuard();
        return;
      }
      this.releaseExamKeyboardLock();
      if (this.codeDialog) return;
      if (this.violationGuard && this.violationGuard.state && this.violationGuard.state.started) return;
      this.theoryFullscreenGate = true;
    },
    onTheoryFullscreenGateKeydown(event) {
      if (event.key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();
        const btn = event.currentTarget.querySelector('.el-button');
        if (btn) btn.focus();
        return;
      }
      const onButton = event.target && event.target.closest && event.target.closest('.el-button');
      if (!onButton) event.stopPropagation();
    },
    enterTheoryFullscreen() {
      if (this.enteringTheoryFullscreen) return;
      this.enteringTheoryFullscreen = true;
      enterExamFullscreen()
        .then(() => this.requestExamKeyboardLock())
        .then(() => {
          if (!isExamFullscreen()) {
            this.releaseExamKeyboardLock();
            this.theoryFullscreenGate = true;
            this.$message.warning('授权期间退出了全屏，键盘锁未生效，请重新进入全屏');
            return;
          }
          this.theoryFullscreenGate = false;
          this.startTheoryViolationGuard();
        })
        .catch(error => {
          this.releaseExamKeyboardLock();
          this.theoryFullscreenGate = true;
          this.$message.warning((error && error.message) || '未能进入全屏，请允许浏览器全屏后重试');
        })
        .finally(() => {
          this.enteringTheoryFullscreen = false;
        });
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
    stopTheoryViolationGuard(options = {}) {
      window.removeEventListener('keydown', this.onKeyDown);
      if (this.violationGuard) {
        this.violationGuard.stop();
        this.violationGuard = null;
      }
      if (!options.keepDialog) {
        this.codeDialog = false;
        this.code = '';
      }
    },
    selectMenu(menu) {
      if (this.isTheoryExamLocked && (menu === 'practice' || menu === 'wrong')) {
        this.$message.warning('理论考试进行中，暂不可进入练习模式和错题集');
        return;
      }
      this.activeMenu = menu;
      this.cpnName = this.isExaminer ? 'examiner-index' : '';
      this.isExpand = false;
    },
    isViolationLocked(source) {
      const value = source && Object.prototype.hasOwnProperty.call(source, 'sfwg') ? source.sfwg : source;
      return value === 1 || value === '1' || value === true;
    },
    openCodeDialog() {
      if (this.needLogin || this.isExaminer || this.reviewMode || this.mode) return;
      if (this.codeDialog || this._openingCodeDialog) return;
      this._openingCodeDialog = true;
      this.codeDialog = true;
      wgjl().then(res => {
        if (res && !res.success && String(res.msg || '').includes('禁止考试')) {
          this.banExamForViolation();
        }
      }).catch(() => {}).finally(() => {
        this._openingCodeDialog = false;
      });
    },
    submitCode() {
      if (!this.code) {
        this.$message.error('请输入验证码!');
        return;
      }
      yzmjy({ code: this.code }).then(res => {
        if (res && res.success) {
          this.codeDialog = false;
          this.code = '';
          this.$message.success('已解除限制');
          this.$nextTick(() => {
            if (this.canWatchTheoryViolation() && !isExamFullscreen()) {
              this.stopTheoryViolationGuard({ keepDialog: true });
              this.theoryFullscreenGate = true;
            }
          });
        } else {
          this.$message.error((res && res.msg) || '验证码错误');
        }
      }).catch(error => {
        this.$message.error(error.message || '验证失败');
      });
    },
    isScenarioExam() {
      return this.scenarioExamActive || Boolean(localStorage.getItem('ks-active-paper'));
    },
    async submitTheoryExam() {
      const paperId = localStorage.getItem('paperId');
      if (!paperId) return;
      let answers = [];
      try {
        const response = await getTempAnswer({ paperId });
        const list = Array.isArray(response.data) ? response.data : [];
        answers = list.map(item => {
          const raw = item.userAnswer == null || item.userAnswer === '' ? item.answer : item.userAnswer;
          const text = String(raw == null ? '' : raw).trim();
          const userAnswer = /^[A-Za-z](?:\s*[、,，]\s*[A-Za-z])+$/.test(text)
            ? text.replace(/[、,，\s]/g, '').toUpperCase()
            : text;
          return {
            questionId: item.questionId || item.id,
            userAnswer
          };
        }).filter(item => item.questionId != null && item.questionId !== '' && item.userAnswer != null && item.userAnswer !== '');
      } catch (error) {
        answers = [];
      }
      return submitExamSession({ paperId, answers });
    },
    submitExamForViolation() {
      return this.isScenarioExam() ? finishExam() : this.submitTheoryExam();
    },
    banExamForViolation() {
      this.stopTheoryViolationGuard();
      const accountId = this.currentUser.id || this.currentUser.userId || this.ksUserInfo.id || this.ksUserInfo.userId;
      this.submitExamForViolation().then(() => {
        if (accountId) return logoutRequest({ accountId });
      }).then(() => {
        this.clearLoginState();
      }).catch(() => {
        this.clearLoginState();
      });
      this.$confirm('违规操作超过三次，考试结束！', '提示', {
        type: 'warning',
        confirmButtonText: '确认',
        showCancelButton: false
      }).catch(() => {});
    },
    backTeacher() {
      const returnMenu = this.reviewReturnMenu || 'users';
      const teacher = this.teacherInfo.id || this.teacherInfo.userId ? this.teacherInfo : readStoredUser('ks-user-info-teacher');
      localStorage.setItem('ks-user-info', JSON.stringify(teacher));
      localStorage.removeItem('paperId');
      localStorage.removeItem('ks-active-paper');
      this.currentUser = { ...teacher };
      this.ksUserInfo = { ...teacher };
      this.mode = '';
      this.cpnName = 'examiner-index';
      this.ksUserInfo1 = {};
      this.reviewUser = {};
      this.reviewMode = false;
      this.activeMenu = returnMenu;
      this.reviewReturnMenu = 'users';
      this.componentRenderKey += 1;
      this.examAnswering = false;
      this.scenarioExamActive = false;
      this.stopTheoryViolationGuard();
      this.syncTheoryExamLock();
      this.clearExamTimeInfo();
    },
    changeMode(data) {
      if (!this.teacherInfo.id && !this.teacherInfo.userId) this.teacherInfo = { ...this.currentUser };
      localStorage.setItem('ks-user-info-teacher', JSON.stringify(this.teacherInfo));
      localStorage.setItem('ks-user-info', JSON.stringify(data));
      this.modeType = (Number(data.status) === 2 || data.status === 'SUBMITTED') ? 'edit' : 'view';
      this.mode = '阅卷中';
      this.ksUserInfo1 = readStoredUser();
      this.reviewUser = { ...data };
      this.reviewMode = true;
      this.examAnswering = true;
      this.$nextTick(() => {
        this.cpnName = '';
      });
    },
    async changeReviewStudent(student) {
      if (!this.isExaminer) return;
      this.reviewReturnMenu = (student && student.reviewReturnMenu) || this.activeMenu || 'users';
      const paperId = student && student.paperId;
      if (paperId == null || paperId === '') {
        this.$message.warning('当前考生没有关联试卷，无法进入阅卷');
        return;
      }
      const loading = this.$loading({
        lock: true,
        text: '正在加载试卷信息',
        spinner: 'el-icon-loading',
        background: 'rgba(255, 255, 255, 0.65)'
      });
      try {
        const response = await getPaperDetail(paperId);
        const paper = toPaperView(response.data || {});
        const paperType = String(paper.paperType || '').toUpperCase();
        if (paperType !== 'SCENARIO' && paper.paperType !== '场景题') {
          this.$message.warning('当前试卷不是场景题，无法进入场景阅卷');
          return;
        }
        localStorage.setItem('paperId', String(paperId));
        localStorage.setItem('ks-active-paper', JSON.stringify({ ...paper, id: paper.id || paperId, paperId, cjId: student.cjId }));
        this.changeMode({ ...student, paperId });
      } catch (error) {
        this.$message.error(error.message || '试卷信息加载失败，无法进入阅卷');
      } finally {
        loading.close();
      }
    },
    hasExamEndedStatus(source) {
      const value = source && typeof source === 'object' && Object.prototype.hasOwnProperty.call(source, 'examStatus')
        ? source.examStatus
        : source;
      return value != null && String(value).trim() !== '';
    },
    handleExamClosedByStatus() {
      if (this.examClosedHandled || this.needLogin || this.isExaminer || this.reviewMode) return;
      this.examClosedHandled = true;
      if (this.timer) window.clearInterval(this.timer);
      this.timer = null;
      this.theoryFullscreenGate = false;
      this.stopTheoryViolationGuard();
      exitExamFullscreen();
      this.releaseExamKeyboardLock();
      this.$confirm('考试已结束', '提示', {
        type: 'warning',
        confirmButtonText: '确认',
        showCancelButton: false
      }).catch(() => {}).finally(() => {
        this.requestLogout({ silent: true });
      });
    },
    getExamTimeInfo(paperId) {
      const id = paperId || localStorage.getItem('paperId');
      if (!id) return;
      getExamTime({ paperId: id }).then(response => {
        this.$set(this, 'ksInfo', response.data || {});
        if (this.isActiveStudentExam && this.hasExamEndedStatus(this.ksInfo)) {
          this.handleExamClosedByStatus();
          return;
        }
        if (this.isActiveStudentExam && this.isViolationLocked(this.ksInfo)) this.openCodeDialog();
        if (this.timer) window.clearInterval(this.timer);
        if (this.scenarioExamActive && this.ksInfo.endTime && !this.getTimeDiff) {
          this.handleExamExpired();
          return;
        }
        this.timer = window.setInterval(() => {
          const nextTime = this.parseExamTime(this.ksInfo.currentTime) + 1000;
          if (!nextTime) return;
          const date = new Date(nextTime);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          this.ksInfo.currentTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }, 1000);
      }).catch(() => {
        if (this.timer) window.clearInterval(this.timer);
        this.timer = null;
      });
    },
    clearExamTimeInfo() {
      if (this.timer) window.clearInterval(this.timer);
      this.timer = null;
      this.ksInfo = {
        currentTime: '',
        endTime: '',
        startTime: '',
        sfwg: '',
        wgcs: ''
      };
    },
    getTimeDiff1(endTime, startTime) {
      const diff = new Date(endTime).getTime() - new Date(startTime).getTime();
      if (diff <= 0) return '';
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      const hms = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      return days ? `${days}天${hms}` : hms;
    },
    finishKs() {
      this.$confirm('确定要提交试卷吗？提交后将结束考试，是否继续？', '提示', { type: 'warning' })
        .then(async () => {
          await finishExam();
          const accountId = this.ksUserInfo.id || this.ksUserInfo.userId;
          if (accountId) await logoutRequest({ accountId });
          this.clearLoginState();
          this.$message.success('提交成功，结束考试!');
        })
        .catch(error => {
          if (error !== 'cancel' && error !== 'close') this.$message.error(error.message || '提交失败');
        });
    },
    login(data = {}) {
      const { role, status } = data;
      this.currentUser = readStoredUser();
      this.ksUserInfo = { ...this.currentUser };
      localStorage.removeItem('paperId');
      localStorage.removeItem('ks-active-paper');
      if (role === 'student') {
        localStorage.removeItem('ks-user-info-teacher');
        this.teacherInfo = {};
        this.cpnName = '';
        this.mode = Number(status) > 1 ? '查看试卷' : '';
        this.activeMenu = 'competition';
      } else {
        this.cpnName = 'examiner-index';
        this.teacherInfo = readStoredUser('ks-user-info-teacher');
        if (!this.teacherInfo.id && !this.teacherInfo.userId) this.teacherInfo = { ...this.currentUser };
        this.activeMenu = 'dashboard';
      }
      this.reviewMode = false;
      this.needLogin = false;
      this.examExpiredHandled = false;
      this.examClosedHandled = false;
      this.examAnswering = false;
      this.scenarioExamActive = false;
      this.stopTheoryViolationGuard();
      this.syncTheoryExamLock();
      this.clearExamTimeInfo();
      this.$message.success('登录成功！');
    },
    handleLogin(data) {
      this.login(data);
    },
    onKeyDown(event) {
      if (this.violationGuard && this.violationGuard.handleKeyDown(event)) return;
    },
    onExamKeyBlock(event) {
      const key = String(event.key || '').toLowerCase();
      if(key === 'escape' || key === 'f5' || key === 'f11'|| key === 'f12') {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
      }
    },
    bindExamKeyBlock() {
      if(this._examKeyBlockBound) return
      window.addEventListener('keydown', this.onExamKeyBlock, true)
      this._examKeyBlockBound = true
    },
    unbindExamKeyBlock() {
      if(!this._examKeyBlockBound) return
      window.removeEventListener('keydown', this.onExamKeyBlock, true)
      this._examKeyBlockBound = false
    },
    nav_click(index, subMenu) {
      if (!subMenu.pop) return;
      this.showIndex = this.showIndex === index ? -1 : index;
    },
    changeTabNew(type, title, permission, pskmenu = {}, activeData) {
      void permission;
      void activeData;
      if (type === 'index') {
        this.goIndex();
        this.isExpand = false;
        return;
      }
      if (pskmenu.pop) return;
      if (type !== this.showTab && common && typeof common.removeLayerById === 'function') {
        common.removeLayerById('三级网格-点击-定面');
      }
      this.$nextTick(() => {
        this.cpnName = type;
        this.selectTab = '';
        const gridButtons = document.getElementsByClassName('gridBtns')[0];
        const wideTypes = ['xmk', 'wjgh', 'wjtpt', 'wjfx', 'sjwg', 'xqk-new', 'xqk-new-2', 'wtk', 'xmpsk', 'wgdj', 'xmpsk-new', 'xmCbk', 'xmXdk'];
        if (gridButtons) gridButtons.style.left = wideTypes.includes(type) ? 'calc(75% - 110px)' : 'calc(50% - 110px)';
      });
      const mapRuntime = window.sgdps || this.sgdps;
      if (mapRuntime && mapRuntime.sgdpsPopup) mapRuntime.sgdpsPopup.remove();
      this.isExpand = false;
      this.showIndex = -1;
      this.tabName = this.lsShow ? pskmenu.title : title;
    },
    changeSelectTab(type, title) {
      this.itemChildActive = title;
      if (type !== this.showTab && common && typeof common.removeLayerById === 'function') {
        common.removeLayerById('三级网格-点击-定面');
      }
      this.selectTab = '';
      const mapRuntime = window.sgdps || this.sgdps;
      if (mapRuntime && mapRuntime.sgdpsPopup) mapRuntime.sgdpsPopup.remove();
      ['mask_right', 'mask_right_close', 'mask_left', 'mask_left_close'].forEach(className => {
        const element = document.getElementsByClassName(className)[0];
        if (element) element.style.display = 'none';
      });
      this.$nextTick(() => {
        this.cpnName = type;
        const navBar = document.getElementsByClassName('pw-nav-bar')[0];
        const gridButtons = document.getElementsByClassName('gridBtns')[0];
        if (navBar) {
          navBar.style.left = 'calc(100vw - 230px)';
          navBar.style.top = '55px';
        }
        if (gridButtons) gridButtons.style.left = 'calc(75% - 110px)';
      });
    },
    goIndex() {
      if (this.reviewMode) {
        this.cpnName = '';
        this.examAnswering = true;
        this.isExpand = false;
        return;
      }
      if (!this.isExaminer && (localStorage.getItem('ks-active-paper') || localStorage.getItem('paperId'))) {
        this.activeMenu = 'competition';
        this.cpnName = '';
        this.reviewMode = false;
        this.examAnswering = true;
        this.scenarioExamActive = Boolean(localStorage.getItem('ks-active-paper'));
        this.isExpand = false;
        return;
      }
      this.cpnName = this.isExaminer ? 'examiner-index' : '';
      this.reviewMode = false;
      this.isExpand = false;
    },
    logout() {
      if (this.reviewMode) {
        this.backTeacher();
        return;
      }
      if (this.isExaminer) {
        this.requestLogout();
        return;
      }
      if (Number(this.ksUserInfo.status) > 1) {
        this.requestLogout();
        return;
      }
      const inExam = this.examAnswering
        || Boolean(localStorage.getItem('paperId'))
        || Boolean(localStorage.getItem('ks-active-paper'));
      if (inExam) {
        this.$confirm('确定要退出登录吗？退出后将结束考试，是否继续？', '提示', { type: 'warning' })
            .then(() => this.finishAndLogout())
            .catch(() => {});
        return;
      }
      this.requestLogout();
    },
    parseExamTime(value) {
      if (typeof value === 'number') return value;
      if (!value) return 0;
      const timestamp = new Date(String(value).replace(/-/g, '/')).getTime();
      return Number.isNaN(timestamp) ? 0 : timestamp;
    },
    async loadExamTime() {
      try {
        const response = await getExamTime({});
        const data = response && response.data ? response.data : {};
        const serverNow = this.parseExamTime(data.currentTime) || Date.now();
        this.examClock = {
          startAt: this.parseExamTime(data.startTime),
          endAt: this.parseExamTime(data.endTime),
          currentAt: serverNow
        };
        this.examClockOffset = serverNow - Date.now();
        this.startExamClock();
      } catch (error) {
        this.stopExamClock();
      }
    },
    startExamClock() {
      this.stopExamClock();
      this.examTimer = window.setInterval(() => {
        this.examClock.currentAt = Date.now() + this.examClockOffset;
      }, 1000);
    },
    stopExamClock() {
      if (this.examTimer) window.clearInterval(this.examTimer);
      this.examTimer = null;
    },
    async handleExamExpired() {
      if (this.examExpiredHandled) return;
      this.examExpiredHandled = true;
      try {
        await finishExam();
        const accountId = this.currentUser.id || this.currentUser.userId || this.ksUserInfo.id || this.ksUserInfo.userId;
        if (accountId) await logoutRequest({ accountId });
      } catch (error) {
        this.$message.error(error.message || '考试结束处理失败');
      } finally {
        this.clearLoginState();
        this.$alert('考试已结束！', '提示', { type: 'warning', confirmButtonText: '确认' });
      }
    },
    async finishAndLogout() {
      try {
        await finishExam();
        await this.requestLogout();
      } catch (error) {
        this.$message.error(error.message || '结束考试失败');
      }
    },
    async requestLogout(options = {}) {
      try {
        const accountId = this.currentUser.id || this.currentUser.userId || this.ksUserInfo.id || this.ksUserInfo.userId;
        if (accountId) await logoutRequest({ accountId });
        this.clearLoginState();
        if (!options.silent) this.$message.success('退出成功');
      } catch (error) {
        this.$message.error(error.message || '退出失败');
        this.clearLoginState();
      }
    },
    clearLoginState() {
      this.stopExamClock();
      localStorage.removeItem('ks-user-info');
      localStorage.removeItem('ks-user-info-teacher');
      localStorage.removeItem('ks-active-paper');
      localStorage.removeItem('paperId');
      this.currentUser = {};
      this.ksUserInfo = {};
      this.teacherInfo = {};
      this.reviewUser = {};
      this.reviewMode = false;
      this.mode = '';
      this.cpnName = '';
      this.needLogin = true;
      this.examAnswering = false;
      this.scenarioExamActive = false;
      this.theoryFullscreenGate = false;
      this.stopTheoryViolationGuard();
      this.syncTheoryExamLock();
      this.clearExamTimeInfo();
      exitExamFullscreen();
      this.releaseExamKeyboardLock();
    },
    openTopologyCanvas() {
      if (this.$root && Object.prototype.hasOwnProperty.call(this.$root, 'activeTab')) this.$root.activeTab = 'v10';
    }
  }
};
</script>

<style lang="less" src="./styles.less"></style>
