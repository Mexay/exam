export const MENU_GROUPS = [
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
    label: '学习中心',
    items: [
      { key: 'competition', label: '开始考试', icon: 'el-icon-video-play' },
      { key: 'practice', label: '练习模式', icon: 'el-icon-reading' },
      { key: 'wrong', label: '错题集', icon: 'el-icon-warning-outline' }
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

const DEFAULT_OPTIONS = [
  { key: 'A', text: '' },
  { key: 'B', text: '' },
  { key: 'C', text: '' },
  { key: 'D', text: '' }
];

export const SCENARIOS = [
  { id: 'SC-2026001', title: '县域配电网迎峰度夏扩容规划', category: '网架规划', description: '某县夏季最大负荷同比增长 18%，现有 110kV 变电站主变重载，需要结合负荷预测提出网架优化方案。', topology: '县域迎峰度夏拓扑', questionCount: 8, status: '已发布', updated: '2026-08-03' },
  { id: 'SC-2026002', title: '新能源高比例接入消纳分析', category: '新能源接入', description: '区域内新增分布式光伏 120MW，午间反向潮流明显，请分析接入影响并提出治理措施。', topology: '新能源接入拓扑', questionCount: 6, status: '待发布', updated: '2026-08-02' },
  { id: 'SC-2026003', title: '重要用户双电源改造设计', category: '供电可靠性', description: '工业园区重要用户当前采用单电源供电，需要完成双电源接入及联络方案设计。', topology: '工业园双电源拓扑', questionCount: 5, status: '草稿', updated: '2026-08-01' },
  { id: 'SC-2026004', title: '老旧城区电缆通道优化', category: '通道规划', description: '老城区电缆通道资源紧张且故障率上升，需要在有限廊道条件下完成改造方案。', topology: '老城区电缆拓扑', questionCount: 7, status: '已发布', updated: '2026-07-30' }
];

export const EXAMS = [
  { id: 'EX-20260801', name: '配网规划岗位能力考试', paper: '2026年配网规划专业测评 A 卷', paperType: '理论题', questionCount: 42, time: '08-08 09:00 - 10:30', people: 286, status: '进行中', statusClass: 'running' },
  { id: 'EX-20260802', name: '县域网架规划专项考试', paper: '县域迎峰度夏场景卷', paperType: '场景题', questionCount: 8, time: '08-09 14:00 - 15:30', people: 128, status: '待开始', statusClass: 'pending' },
  { id: 'EX-20260803', name: '新能源接入规划能力测评', paper: '新能源高比例接入分析卷', paperType: '场景题', questionCount: 6, time: '08-10 09:30 - 11:00', people: 156, status: '待开始', statusClass: 'pending' },
  { id: 'EX-20260804', name: '配电网基础知识月度考试', paper: '配网基础知识 8 月卷', paperType: '理论题', questionCount: 50, time: '08-12 09:00 - 10:30', people: 412, status: '待开始', statusClass: 'pending' },
  { id: 'EX-20260705', name: '重要用户供电保障专项考试', paper: '双电源改造场景卷', paperType: '场景题', questionCount: 5, time: '07-28 14:30 - 16:00', people: 96, status: '已结束', statusClass: 'finished' },
  { id: 'EX-20260706', name: '中压配电网规划专业考试', paper: '中压网架规划 B 卷', paperType: '理论题', questionCount: 45, time: '07-25 09:00 - 10:30', people: 238, status: '已结束', statusClass: 'finished' },
  { id: 'EX-20260707', name: '老旧城区电网改造竞赛', paper: '老城区电缆通道优化卷', paperType: '场景题', questionCount: 7, time: '07-22 14:00 - 15:30', people: 84, status: '已结束', statusClass: 'finished' },
  { id: 'EX-20260708', name: '供电可靠性提升专项测评', paper: '可靠性分析综合卷', paperType: '理论题', questionCount: 36, time: '07-18 09:00 - 10:00', people: 196, status: '已结束', statusClass: 'finished' },
  { id: 'EX-20260709', name: '配网项目管理能力考试', paper: '项目建议书与评审卷', paperType: '理论题', questionCount: 40, time: '07-15 15:00 - 16:30', people: 175, status: '已结束', statusClass: 'finished' }
];

export const USERS = [
  { name: '张伟', phone: '138****1026', code: 'AH20260126', department: '合肥供电公司', role: '考生', exams: 12 },
  { name: '李娜', phone: '139****2841', code: 'AH20260118', department: '芜湖供电公司', role: '考生', exams: 9 },
  { name: '王强', phone: '136****5538', code: 'AH-T0086', department: '省公司培训中心', role: '教师', exams: 24 },
  { name: '赵敏', phone: '137****9260', code: 'AH-R0032', department: '安庆供电公司', role: '阅卷员', exams: 18 }
];

export function cloneData(source) {
  return JSON.parse(JSON.stringify(source));
}

export function createQuestionForm(question) {
  if (question) return cloneData(question);
  return {
    id: '', type: '单选题', typeClass: 'single', title: '', level: '中等', levelClass: 'medium',
    used: 0, updated: '2026-08-05', status: '草稿', options: cloneData(DEFAULT_OPTIONS), answer: 'C', analysis: ''
  };
}
