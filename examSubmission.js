import { getExamTime } from '@/api/pwgh/examCbPsk';

export async function assertExamCanSubmit(paperId) {
  if (!paperId) throw new Error('缺少试卷信息，无法检查考试状态');
  const response = await getExamTime({ paperId });
  const message = String((response && response.msg) || '');
  const data = response && response.data;
  if (response && String(response.code) === '1' && message.includes('试卷不存在')) {
    const error = new Error(message);
    error.code = 'EXAM_UNAVAILABLE';
    throw error;
  }
  if (!response || String(response.code) !== '0' || !data || typeof data !== 'object') {
    throw new Error(message || '考试状态查询失败，请稍后重试');
  }
  if (data.examStatus != null && String(data.examStatus).trim() !== '') {
    const error = new Error('考试已结束');
    error.code = 'EXAM_UNAVAILABLE';
    throw error;
  }
}
