const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function method(file, name, globals) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const match = source.match(new RegExp(`^    (?:async )?${name}\\([^]*?^    },`, 'm'));
  assert.ok(match, name);
  return vm.runInNewContext(`({${match[0].slice(0, -1)}}).${name}`, globals);
}

function checker(getExamTime) {
  const source = fs.readFileSync(path.join(__dirname, '../examSubmission.js'), 'utf8');
  return vm.runInNewContext(source.replace(/^import.*$/gm, '').replace('export ', '') + '\nassertExamCanSubmit;', { getExamTime });
}

for (const [name, response, message] of [
  ['numeric code zero with ended status', { code: 0, data: { examStatus: 2 } }, '考试已结束'],
  ['zero itself is a populated examStatus', { code: '0', data: { examStatus: 0 } }, '考试已结束'],
  ['deleted paper with numeric error code', { code: 1, success: true, msg: '试卷不存在', data: null }, '试卷不存在'],
  ['deleted paper with string error code', { code: '1', msg: '试卷不存在', data: null }, '试卷不存在'],
  ['other business error', { code: 1, msg: '状态查询失败' }, '状态查询失败'],
  ['missing exam data', { code: 0, data: null }, '考试状态查询失败']
]) {
  test(`precheck rejects ${name}`, async () => {
    const check = checker(async args => {
      assert.deepEqual(JSON.parse(JSON.stringify(args)), { paperId: 'paper-1' });
      return response;
    });
    await assert.rejects(check('paper-1'), new RegExp(message));
  });
}

test('precheck allows code zero with an empty examStatus', async () => {
  for (const status of [null, undefined, '', ' ']) {
    await checker(async () => ({ code: '0', data: { examStatus: status } }))('paper-1');
  }
});

test('network failure rejects instead of permitting submission', async () => {
  await assert.rejects(checker(async () => { throw new Error('网络异常'); })('paper-1'), /网络异常/);
});

test('theory submission must check availability before sending answers', async () => {
  let submitted = 0;
  const submit = method('Competition.vue', 'submitExamAnswers', {
    examSession: { version: 0 },
    getTempAnswer: async () => ({ code: 0, data: [] }),
    compactChoiceAnswer: value => value,
    assertExamCanSubmit: async () => { throw new Error('试卷不存在'); },
    submitExamSession: async () => { submitted++; return { data: 'record-1' }; },
    getExamRecord: async () => ({ data: {} }), toExamRecordView: data => data
  });
  await assert.rejects(submit.call({ examSession: { paperId: 'paper-1' } }, { answers: [] }), /试卷不存在/);
  assert.equal(submitted, 0);
});

test('scenario submission requests exam closure without submitting an unavailable paper', async () => {
  let finished = 0; const events = []; const messages = [];
  const finish = method('Competition.vue', 'finishKs', {
    examSession: { version: 0 }, localStorage: { getItem: () => 'paper-1', removeItem() {} },
    assertExamCanSubmit: async () => { const e = new Error('考试已结束'); e.code = 'EXAM_UNAVAILABLE'; throw e; },
    finishExam: async () => { finished++; return { success: true }; }
  });
  await finish.call({ scenarioExam: { id: 'paper-1' },
    $confirm: async () => {}, $message: { error: m => messages.push(m), success() {} },
    notifyExamState() {}, $emit(...event) { events.push(event); } });
  for (let i = 0; i < 12; i++) await Promise.resolve();
  assert.equal(finished, 0);
  assert.deepEqual(events, [['exam-closed', '考试已结束']]);
  assert.deepEqual(messages, []);
});

test('valid theory submission preserves API payload and checks before submitting', async () => {
  const order = []; const answers = [{ questionId: 'q1', userAnswer: 'A' }];
  const submit = method('Competition.vue', 'submitExamAnswers', {
    examSession: { version: 0 },
    getTempAnswer: async args => { order.push('read'); return { code: 0, data: answers }; },
    compactChoiceAnswer: value => value,
    assertExamCanSubmit: checker(async args => { order.push('check'); return { code: 0, data: { examStatus: null } }; }),
    submitExamSession: async args => {
      order.push('submit');
      assert.deepEqual(JSON.parse(JSON.stringify(args)), { paperId: 'paper-1', answers });
      return { data: 'record-1' };
    },
    getExamRecord: async id => { order.push('record'); assert.equal(id, 'record-1'); return { data: {} }; },
    toExamRecordView: data => data
  });
  await submit.call({ examSession: { paperId: 'paper-1' } }, { answers });
  assert.deepEqual(order, ['read', 'check', 'submit', 'record']);
});

test('unavailable theory paper does not emit completion or restart polling', async () => {
  const answers = [{ questionId: 'q1', userAnswer: 'A' }]; const messages = []; const events = [];
  const finish = method('QuestionSession.vue', 'finish', {});
  const component = { timed: true, view: 'session', examExpiredHandled: true, formattedTime: '00:10:00',
    stopTimer() {}, buildAnswers: () => answers,
    submitHandler: async () => { await checker(async () => ({ code: 1, msg: '试卷不存在' }))('paper-1'); },
    startTimer() { assert.fail('unavailable exam must not restart polling'); },
    $emit(...event) { events.push(event); },
    $message: { error: message => messages.push(message) } };
  await finish.call(component);
  assert.deepEqual(messages, []);
  assert.deepEqual(events, [['exam-closed', '试卷不存在']]);
  assert.equal(component.view, 'session');
  assert.equal(component.submitting, false);
  assert.equal(answers.length, 1);
});

for (const message of ['考试已结束', '试卷不存在']) {
  test(`terminal exam notice logs out and switches to login: ${message}`, async () => {
    const notices = []; const logouts = [];
    const globals = { window: { clearInterval() {} }, exitExamFullscreen() {},
      logoutRequest: async args => { logouts.push(args); return { success: true }; } };
    const close = method('index.vue', 'handleExamClosedByStatus', globals);
    const logout = method('index.vue', 'requestLogout', globals);
    const component = { currentUser: { id: 'account-1' }, ksUserInfo: {},
      needLogin: false, stopTheoryViolationGuard() {},
      $confirm: async message => { notices.push(message); },
      $message: { error() {}, success() {} },
      clearLoginState() { this.needLogin = true; } };
    component.requestLogout = logout.bind(component);
    await close.call(component, message);
    for (let i = 0; i < 12; i++) await Promise.resolve();
    assert.deepEqual(notices, [message]);
    assert.deepEqual(JSON.parse(JSON.stringify(logouts)), [{ accountId: 'account-1' }]);
    assert.equal(component.needLogin, true);
  });
}

test('a temporary submission check failure keeps the answer page and does not logout', async () => {
  const events = []; const messages = [];
  const finish = method('QuestionSession.vue', 'finish', {});
  const component = { timed: false, view: 'session', stopTimer() {}, buildAnswers: () => [{ questionId: 'q1', userAnswer: 'A' }],
    submitHandler: async () => { throw new Error('网络异常'); },
    $emit: (...event) => events.push(event), $message: { error: message => messages.push(message) } };
  await finish.call(component);
  assert.deepEqual(events, []);
  assert.deepEqual(messages, ['网络异常']);
  assert.equal(component.view, 'session');
  assert.equal(component.submitting, false);
});
