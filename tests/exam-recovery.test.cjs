const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const drain = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function pending() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
function setup(overrides = {}) {
  const examSession = { version: 0, violationVersion: 0 };
  const context = vm.createContext({ Promise, Error, Date, String, Number, examSession,
    window: { setInterval: () => 1, clearInterval() {} },
    localStorage: { getItem: () => 'paper-1', removeItem() {} },
    isExamFullscreen: () => false, enterExamFullscreen: async () => {}, exitExamFullscreen() {},
    getExamTime: async () => ({ data: { sfwg: 1 } }),
    wgjl: async () => ({ success: true }), yzmjy: async () => ({ success: true }), ...overrides });
  const component = { needLogin: false, isExaminer: false, reviewMode: false, mode: '', codeDialog: false,
    code: '123456', verifyingCode: false, reportingViolation: false, isActiveStudentExam: true, scenarioExamActive: false,
    ksInfo: { sfwg: 1 }, hasExamEndedStatus: () => false, canWatchTheoryViolation: () => true,
    $set(target, key, value) { target[key] = value; }, async $nextTick(fn) { if (fn) fn(); },
    $message: { success() {}, error() {}, warning() {} }, stopTheoryViolationGuard() {},
    banExamForViolation() {}, releaseExamKeyboardLock() {}, stopExamClock() {},
    requestExamKeyboardLock: async () => {}, startTheoryViolationGuard() {},
    syncTheoryExamLock() {}, clearExamTimeInfo() {} };
  const source = fs.readFileSync(path.join(__dirname, '../index.vue'), 'utf8');
  for (const name of ['openCodeDialog', 'showCodeDialog', 'submitCode', 'getExamTimeInfo',
    'isViolationLocked', 'onTheoryFullscreenChange', 'enterTheoryFullscreen', 'clearLoginState']) {
    const match = source.match(new RegExp(`^    (?:async )?${name}\\([^]*?^    },`, 'm'));
    if (match) component[name] = vm.runInContext(`({${match[0].slice(0, -1)}}).${name}`, context).bind(component);
  }
  return { component, examSession, context };
}

test('restoring an existing violation shows the dialog without reporting a new violation', async () => {
  let reports = 0;
  const { component } = setup({ wgjl: async () => { reports++; return { success: true }; } });
  component.getExamTimeInfo('paper-1'); await drain();
  assert.equal(component.codeDialog, true);
  assert.equal(reports, 0);
});

test('an old status response cannot relock after successful verification', async () => {
  const status = pending(); let reports = 0;
  const { component } = setup({ getExamTime: () => status.promise,
    wgjl: async () => { reports++; return { success: true }; } });
  component.codeDialog = true;
  component.getExamTimeInfo('paper-1');
  component.submitCode(); await drain();
  status.resolve({ data: { sfwg: 1 } }); await drain();
  assert.equal(component.codeDialog, false);
  assert.equal(component.ksInfo.sfwg, 0);
  assert.equal(reports, 0);
  assert.equal(component.theoryFullscreenGate, true);
});

test('an old violation report cannot end the next account exam', async () => {
  const report = pending(); let bans = 0;
  const { component } = setup({ wgjl: () => report.promise });
  component.banExamForViolation = () => { bans++; };
  component.openCodeDialog(); component.clearLoginState();
  component.needLogin = false;
  report.resolve({ success: false, msg: '禁止考试' }); await drain();
  assert.equal(bans, 0);
});

test('verification cannot overtake an unfinished violation report', async () => {
  const report = pending(); let verifications = 0;
  const { component } = setup({ wgjl: () => report.promise,
    yzmjy: async () => { verifications++; return { success: true }; } });
  component.openCodeDialog(); component.submitCode();
  assert.equal(verifications, 0);
  report.resolve({ success: true }); await drain();
  await component.submitCode();
  assert.equal(verifications, 1);
  assert.equal(component.codeDialog, false);
});

test('logging out invalidates pending account status before the next login', async () => {
  const status = pending(); let reports = 0;
  const { component } = setup({ getExamTime: () => status.promise,
    wgjl: async () => { reports++; return { success: true }; } });
  component.getExamTimeInfo('old-paper');
  component.clearLoginState();
  component.needLogin = false; component.currentUser = { id: 'new-account' };
  status.resolve({ data: { sfwg: 1 } }); await drain();
  assert.equal(component.codeDialog, false);
  assert.equal(reports, 0);
});

test('fullscreen event does not start monitoring before entering fullscreen completes', () => {
  const { component } = setup({ isExamFullscreen: () => true }); let starts = 0;
  component.enteringTheoryFullscreen = true; component.theoryFullscreenGate = true;
  component.startTheoryViolationGuard = () => { starts++; };
  component.onTheoryFullscreenChange();
  assert.equal(starts, 0);
  assert.equal(component.theoryFullscreenGate, true);
});

test('repeated verification clicks send one request and recover after rejection', async () => {
  const verification = pending(); let requests = 0;
  const { component } = setup({ yzmjy: () => { requests++; return verification.promise; } });
  component.codeDialog = true;
  component.submitCode(); component.submitCode();
  assert.equal(requests, 1);
  verification.resolve({ success: false, msg: '验证码错误' }); await drain();
  assert.equal(component.codeDialog, true);
  assert.equal(component.verifyingCode, false);
});

test('successful verification resumes monitoring without requesting keyboard lock', async () => {
  const { component } = setup({ isExamFullscreen: () => true });
  const events = [];
  component.requestExamKeyboardLock = async () => {
    assert.equal(component.codeDialog, false);
    assert.fail('keyboard lock must not be requested');
  };
  component.startTheoryViolationGuard = () => events.push('monitor');
  component.codeDialog = true;
  await component.submitCode();
  assert.equal(component.codeDialog, false);
  assert.equal(component.theoryFullscreenGate, false);
  assert.deepEqual(events, ['monitor']);
});

test('restoration shows fullscreen first, then existing violation, then monitoring after verification', async () => {
  let fullscreen = false;
  const { component } = setup({ isExamFullscreen: () => fullscreen,
    enterExamFullscreen: async () => { fullscreen = true; } });
  component.isTheoryExamLocked = true;
  const events = [];
  component.requestExamKeyboardLock = async () => assert.fail('keyboard lock must not be requested');
  component.startTheoryViolationGuard = () => events.push('monitor');
  component.showCodeDialog();
  assert.equal(component.codeDialog, false);
  assert.equal(component.theoryFullscreenGate, true);
  assert.equal(component.pendingViolation, true);
  await component.enterTheoryFullscreen();
  assert.equal(component.codeDialog, true);
  assert.equal(component.theoryFullscreenGate, false);
  assert.deepEqual(events, []);
  await component.submitCode();
  assert.equal(component.codeDialog, false);
  assert.equal(component.theoryFullscreenGate, false);
  assert.deepEqual(events, ['monitor']);
});

for (const entered of [true, false]) {
  test(`resume starts monitoring only after fullscreen succeeds (${entered})`, async () => {
    const fullscreenRequest = pending(); let starts = 0;
    const { component } = setup({ isExamFullscreen: () => true,
      enterExamFullscreen: () => fullscreenRequest.promise.then(result => {
        if (!result) throw new Error('fullscreen denied');
      }) });
    component.theoryFullscreenGate = true;
    component.requestExamKeyboardLock = () => assert.fail('keyboard lock must not be requested');
    component.startTheoryViolationGuard = () => {
      assert.equal(component.enteringTheoryFullscreen, false);
      starts++;
    };
    const operation = component.enterTheoryFullscreen(); await drain();
    component.onTheoryFullscreenChange();
    assert.equal(starts, 0);
    fullscreenRequest.resolve(entered); await operation;
    assert.equal(starts, entered ? 1 : 0);
    assert.equal(component.theoryFullscreenGate, !entered);
    assert.equal(component.enteringTheoryFullscreen, false);
  });
}

test('QuestionSession ignores stale violation state but retains the server countdown', async () => {
  const status = pending();
  const { context, examSession } = setup({ getExamTime: () => status.promise });
  const source = fs.readFileSync(path.join(__dirname, '../QuestionSession.vue'), 'utf8');
  const match = source.match(/^    getExamTimeInfo\([^]*?^    },/m);
  const getTime = vm.runInContext(`({${match[0].slice(0, -1)}}).getExamTimeInfo`, context);
  const events = [];
  const component = { paperId: 'paper-1', ksInfo: { sfwg: 0 },
    $set(target, key, value) { target[key] = value; },
    hasExamEndedStatus: () => false, isViolationLocked: value => value === 1,
    $emit: event => events.push(event), timed: false,
    startDurationFallback() { assert.fail('must preserve the server deadline'); } };
  const operation = getTime.call(component);
  examSession.violationVersion++;
  status.resolve({ data: { sfwg: 1, endTime: '2026-09-21 20:00:00' } });
  await operation;
  assert.deepEqual(events, []);
  assert.equal(component.ksInfo.sfwg, 0);
  assert.equal(component.ksInfo.endTime, '2026-09-21 20:00:00');
  assert.equal(component.timer, 1);
});

test('one genuine violation reports once while the dialog is open', async () => {
  let reports = 0;
  const { component } = setup({ wgjl: async () => { reports++; return { success: true }; } });
  component.openCodeDialog(); component.openCodeDialog(); await drain();
  component.openCodeDialog();
  assert.equal(reports, 1);
});

test('discarding a verification result still releases its own loading indicator', async () => {
  const verification = pending();
  const { component, examSession } = setup({ yzmjy: () => verification.promise });
  component.codeDialog = true;
  const operation = component.submitCode();
  examSession.version++;
  verification.resolve({ code: '0', msg: '操作成功', data: null, success: true });
  await operation;
  assert.equal(component.codeDialog, true, 'a stale success must not unlock another session');
  assert.equal(component.verifyingCode, false, 'the completed request must not leave a spinner');
});

test('discarding a violation report still releases its own loading indicator', async () => {
  const report = pending();
  const { component, examSession } = setup({ wgjl: () => report.promise });
  const operation = component.openCodeDialog();
  examSession.version++;
  report.resolve({ success: true });
  await operation;
  assert.equal(component.reportingViolation, false);
});

test('finishing an old verification must not clear the new account verification spinner', async () => {
  const first = pending(); const second = pending(); let requests = 0;
  const { component } = setup({ yzmjy: () => (++requests === 1 ? first.promise : second.promise) });
  component.codeDialog = true;
  const oldOperation = component.submitCode();
  component.clearLoginState();
  component.needLogin = false; component.codeDialog = true; component.code = '654321';
  const newOperation = component.submitCode();
  first.resolve({ success: true }); await oldOperation;
  assert.equal(component.verifyingCode, true);
  assert.equal(component.codeDialog, true);
  second.resolve({ success: true }); await newOperation;
  assert.equal(component.verifyingCode, false);
  assert.equal(component.codeDialog, false);
});

test('destroying an old component does not invalidate another component verification', async () => {
  const verification = pending();
  const { component, context } = setup({ yzmjy: () => verification.promise,
    document: { getElementsByClassName: () => [] } });
  context.window.removeEventListener = () => {};
  component.codeDialog = true;
  const operation = component.submitCode();
  const source = fs.readFileSync(path.join(__dirname, '../index.vue'), 'utf8');
  const match = source.match(/^  beforeDestroy\(\) {[^]*?^  },/m);
  const destroy = vm.runInContext(`({${match[0].slice(0, -1)}}).beforeDestroy`, context);
  destroy.call({ removeMenuBallDragListeners() {}, unbindExamKeyBlock() {},
    releaseExamKeyboardLock() {}, stopTheoryViolationGuard() {}, stopExamClock() {} });
  verification.resolve({ code: '0', msg: '操作成功', data: null, success: true });
  await operation;
  assert.equal(component.codeDialog, false);
  assert.equal(component.verifyingCode, false);
});

test('verification keeps the existing API arguments and accepts the recorded response shape', async () => {
  const calls = [];
  const { component } = setup({ yzmjy: async args => {
    calls.push(JSON.parse(JSON.stringify(args)));
    return { code: '0', msg: '操作成功', data: null, responseTime: 0, success: true, total: 0 };
  } });
  component.codeDialog = true;
  await component.submitCode();
  assert.deepEqual(calls, [{ code: '123456' }]);
  assert.equal(component.codeDialog, false);
});

test('a newly detected fullscreen exit opens verification immediately and reports once', async () => {
  let reports = 0;
  const { component } = setup({ isExamFullscreen: () => false,
    wgjl: async () => { reports++; return { success: true }; } });
  component.isTheoryExamLocked = true;
  await component.openCodeDialog();
  assert.equal(component.codeDialog, true);
  assert.equal(reports, 1);
  await component.submitCode();
  assert.equal(component.codeDialog, false);
  assert.equal(component.theoryFullscreenGate, true);
});

test('developer-tools shortcut is reported without cancelling the key default action', () => {
  let reports = 0; let prevented = 0;
  const context = vm.createContext({ Date, setTimeout: () => 1, clearTimeout() {} });
  const source = fs.readFileSync(path.join(__dirname, '../violationGuard.js'), 'utf8');
  vm.runInContext(source.replace(/^import.*$/gm, '').replace('export ', ''), context);
  const guard = context.createViolationGuard({ onViolation: () => { reports++; } });
  assert.equal(guard.handleKeyDown({ key: 'F12', preventDefault() { prevented++; } }), true);
  assert.equal(reports, 1);
  assert.equal(prevented, 0);
});

test('exam key blocker disables only F5 and F12 without reporting accidental key presses', () => {
  const source = fs.readFileSync(path.join(__dirname, '../index.vue'), 'utf8');
  const match = source.match(/^    onExamKeyBlock\([^]*?^    },/m);
  assert.ok(match, 'exam key blocker must exist');
  const handler = vm.runInNewContext(`({${match[0].slice(0, -1)}}).onExamKeyBlock`);
  for (const key of ['F5', 'F12', 'Escape', 'F11', 'a', 'Enter']) {
    for (const eventData of [{ key }, { key: 'Unidentified', code: key }]) {
      let prevented = false; let stopped = false;
      handler.call({}, { ...eventData,
        preventDefault() { prevented = true; },
        stopImmediatePropagation() { stopped = true; } });
      assert.equal(prevented, key === 'F5' || key === 'F12');
      assert.equal(stopped, key === 'F5' || key === 'F12');
    }
  }
});
