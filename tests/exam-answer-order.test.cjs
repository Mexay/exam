const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const drain = async () => { for (let i = 0; i < 16; i++) await Promise.resolve(); };
function pending() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
function method(file, name, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const match = source.match(new RegExp(`^    (?:async )?${name}\\([^]*?^    },`, 'm'));
  return vm.runInNewContext(`({${match[0].slice(0, -1)}}).${name}`, globals);
}
function competition(globals) {
  const context = { examSession: { version: 0 }, compactChoiceAnswer: value => String(value).replace(/[、,，\s]/g, ''),
    assertExamCanSubmit: async () => {}, getExamRecord: async () => ({ data: {} }), toExamRecordView: value => value, ...globals };
  const component = { examSession: { paperId: 'paper-1' }, $message: { error() {} } };
  for (const name of ['saveTempQuestionAnswer', 'submitExamAnswers']) component[name] = method('Competition.vue', name, context).bind(component);
  return component;
}

test('last-minute answer changes are saved in order and re-read before submission', async () => {
  const first = pending(); const second = pending(); const writes = []; const calls = []; let stored = 'A'; let sent;
  const c = competition({
    saveTempAnswer: args => {
      writes.push(args.answer);
      return (writes.length === 1 ? first.promise : second.promise).then(() => { stored = args.answer; return { code: 0, success: true }; });
    },
    getTempAnswer: async () => { calls.push('read'); return { code: 0, data: [{ questionId: 'q1', answer: stored }] }; },
    submitExamSession: async args => { calls.push('submit'); sent = args; return { data: 'record-1' }; }
  });
  const a = c.saveTempQuestionAnswer({ questionId: 'q1', answer: 'B' });
  const b = c.saveTempQuestionAnswer({ questionId: 'q1', answer: 'C' });
  const submit = c.submitExamAnswers({ answers: [{ questionId: 'q1', userAnswer: 'A' }] });
  await drain();
  assert.deepEqual(writes, ['B']);
  assert.deepEqual(calls, []);
  first.resolve(); await drain(); assert.deepEqual(writes, ['B', 'C']); assert.deepEqual(calls, []);
  second.resolve(); await Promise.all([a, b, submit]);
  assert.deepEqual(calls, ['read', 'submit']);
  assert.deepEqual(JSON.parse(JSON.stringify(sent)), { paperId: 'paper-1', answers: [{ questionId: 'q1', userAnswer: 'C' }] });
});

test('failed latest-answer read never sends an empty submission', async () => {
  let submissions = 0;
  const c = competition({ getTempAnswer: async () => { throw new Error('读取失败'); },
    submitExamSession: async () => { submissions++; return { data: 'record-1' }; } });
  await assert.rejects(c.submitExamAnswers({ answers: [{ questionId: 'q1', userAnswer: 'B' }] }), /读取失败/);
  assert.equal(submissions, 0);
});

test('expiry while saving next question still submits and does not navigate afterward', async () => {
  const save = pending(); let submitted = 0; let navigated = 0;
  const c = { currentIndex: 0, questionSet: [{ id: 'q1' }, { id: 'q2' }], view: 'session',
    submitting: false, savingAnswer: false, examExpiredHandled: false,
    persistCurrentTempAnswer: () => save.promise, stopTimer() {}, $alert() {},
    $message: { error() {} }, finish() { submitted++; }, goTo() { navigated++; } };
  c.nextExamQuestion = method('QuestionSession.vue', 'nextExamQuestion').bind(c);
  c.handleExamTimeUp = method('QuestionSession.vue', 'handleExamTimeUp').bind(c);
  const next = c.nextExamQuestion();
  // The real finish() refuses to run when submitting is already true.
  c.finish = () => { if (!c.submitting) submitted++; };
  c.handleExamTimeUp();
  assert.equal(submitted, 1);
  save.resolve(); await next;
  assert.equal(navigated, 0);
});

test('latest failed temporary answer is retried before reading and submitting', async () => {
  let attempts = 0; let stored = 'A'; let sent;
  const c = competition({ saveTempAnswer: async args => {
    if (++attempts === 1) throw new Error('暂存失败');
    stored = args.answer; return { code: 0 };
  }, getTempAnswer: async () => ({ code: 0, data: [{ questionId: 'q1', answer: stored }] }),
  submitExamSession: async args => { sent = args; return { data: 'record-1' }; } });
  await assert.rejects(c.saveTempQuestionAnswer({ questionId: 'q1', answer: 'B' }), /暂存失败/);
  await c.submitExamAnswers({ answers: [{ questionId: 'q1', userAnswer: 'B' }] });
  assert.equal(attempts, 2);
  assert.equal(sent.answers[0].userAnswer, 'B');
});

test('continued temporary save failure stops submission without reading old answers', async () => {
  const c = competition({ saveTempAnswer: async () => ({ code: 1, msg: '暂存失败' }),
    getTempAnswer: async () => assert.fail('must not read stale answers'),
    submitExamSession: async () => assert.fail('must not submit stale answers') });
  await assert.rejects(c.saveTempQuestionAnswer({ questionId: 'q1', answer: 'B' }), /暂存失败/);
  await assert.rejects(c.submitExamAnswers({ answers: [{ questionId: 'q1', userAnswer: 'B' }] }), /暂存失败/);
});

test('answer edits are ignored after expiry or while final submission is running', () => {
  const toggle = method('QuestionSession.vue', 'toggleAnswer');
  for (const flags of [{ submitting: true }, { timed: true, examExpiredHandled: true }]) {
    toggle.call({ ...flags, ensureRecord() { assert.fail('must not change the answer snapshot'); } }, 'B');
  }
});

test('manual confirmation returning during auto submission cannot submit twice', async () => {
  const confirm = pending(); const submit = pending(); let submissions = 0;
  const finish = method('QuestionSession.vue', 'finish');
  const c = { timed: true, view: 'session', submitting: false, examExpiredHandled: false,
    $confirm: () => confirm.promise, stopTimer() {}, buildAnswers: () => [],
    submitHandler: () => { submissions++; return submit.promise; }, applyResultDetails() {}, $emit() {}, $message: { error() {} } };
  const manual = finish.call(c);
  c.examExpiredHandled = true;
  const automatic = finish.call(c);
  confirm.resolve(); await drain();
  assert.equal(submissions, 1);
  submit.resolve({}); await Promise.all([manual, automatic]);
});

test('empty paper without local answers can submit without throwing missing answer error', async () => {
  let submittedPayload;
  const c = competition({
    getTempAnswer: async () => ({ code: 0, data: [] }),
    submitExamSession: async args => { submittedPayload = args; return { data: 'record-empty' }; }
  });
  const result = await c.submitExamAnswers({
    answers: [{ questionId: 'q1', userAnswer: '' }, { questionId: 'q2', userAnswer: '' }]
  });
  assert.ok(result);
  assert.deepEqual(JSON.parse(JSON.stringify(submittedPayload)), { paperId: 'paper-1', answers: [] });
});

test('expired state allows retrying submission on the last question but blocks mid-exam navigation', async () => {
  let finishCalls = 0;
  let navigated = 0;
  const next = method('QuestionSession.vue', 'nextExamQuestion');
  const component = {
    currentIndex: 1,
    questionSet: [{ id: 'q1' }, { id: 'q2' }],
    submitting: false,
    savingAnswer: false,
    examExpiredHandled: true,
    persistCurrentTempAnswer: async () => {},
    finish() { finishCalls++; },
    goTo() { navigated++; },
    $message: { error() {} }
  };
  // 最后一题：即使 examExpiredHandled 为 true，也允许点击提交试卷重试
  await next.call(component);
  assert.equal(finishCalls, 1);
  assert.equal(navigated, 0);

  // 非最后一题：已超时则不允许继续翻题
  component.currentIndex = 0;
  await next.call(component);
  assert.equal(finishCalls, 1);
  assert.equal(navigated, 0);
});
