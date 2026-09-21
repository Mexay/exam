import Vue from 'vue'
import { MessageBox } from 'element-ui';
import { bindFullscreenChange, isExamFullscreen } from './examFullscreen.js';
const DEFAULT_STORAGE_KEY = 'exam-page-active';
const DEFAULT_RESIZE_THRESHOLD = 80;
const DEFAULT_MESSAGE = '违规操作';
const RELOAD_FLAG_SUFFIX = ':reload';
const DEFAULT_DEVTOOLS_THRESHOLD = 160;
const DEFAULT_BLUR_GRACE_MS = 500;
const DEFAULT_FOCUS_POLL_MS = 1000;
const DEFAULT_VIOLATION_COOLDOWN_MS = 1500;

export function createViolationGuard(options = {}) {
  const config = {
    storageKey: DEFAULT_STORAGE_KEY,
    reloadFlagKey: '',
    resizeThreshold: DEFAULT_RESIZE_THRESHOLD,
    devtoolsThreshold: DEFAULT_DEVTOOLS_THRESHOLD,
    blurGraceMs: DEFAULT_BLUR_GRACE_MS,
    focusPollMs: DEFAULT_FOCUS_POLL_MS,
    violationCooldownMs: DEFAULT_VIOLATION_COOLDOWN_MS,
    requireFullscreen: false,
    message: DEFAULT_MESSAGE,
    reportOnStop: true,
    onViolation: null,
    ...options
  };

  const state = {
    tabId: '',
    initialSize: { width: 0, height: 0 },
    initialDpr: 1,
    initialChrome: { width: 0, height: 0 },
    alerting: false,
    started: false,
    composing: false,
    printing: false,
    ignoreBlurUntil: 0,
    lastReportedAt: 0,
    blurTimer: null,
    focusPollTimer: null,
    resizeTimer: null,
    unbindFullscreen: null
  };

  const pageHasFocus = () => {
    try {
      return document.hasFocus();
    } catch (error) {
      return true;
    }
  };

  const clearBlurTimer = () => {
    if (state.blurTimer) {
      clearTimeout(state.blurTimer);
      state.blurTimer = null;
    }
  };

  const suppressBlur = (ms) => {
    const until = Date.now() + ms;
    if (until > state.ignoreBlurUntil) state.ignoreBlurUntil = until;
  };

  const shouldIgnoreBlur = () => {
    return state.composing || state.printing || Date.now() < state.ignoreBlurUntil;
  };

  const reportViolation = () => {
    if (state.alerting) return;
    const now = Date.now();
    if (now - state.lastReportedAt < config.violationCooldownMs) return;
    state.alerting = true;
    state.lastReportedAt = now;
    clearBlurTimer();

    if (typeof config.onViolation === 'function') {
      config.onViolation(config.message);
    } else {
      config.vm.openCodeDialog()
    }
    setTimeout(() => {
      state.alerting = false;
    }, config.violationCooldownMs);
  };

  const confirmWindowBlurViolation = () => {
    state.blurTimer = null;
    if (!state.started || state.alerting) return;
    if (shouldIgnoreBlur()) return;
    // 切标签 / 最小化由 visibilitychange 负责，避免重复记一次
    if (document.hidden) return;
    if (pageHasFocus()) return;
    reportViolation();
  };

  const scheduleBlurViolation = () => {
    if (!state.started || state.alerting || state.blurTimer) return;
    if (shouldIgnoreBlur() || document.hidden) return;
    if (pageHasFocus()) return;
    state.blurTimer = setTimeout(confirmWindowBlurViolation, config.blurGraceMs);
  };

  const isDevtoolsShortcut = event => {
    const key = (event.key || '').toLowerCase();
    if (event.key === 'F12' || event.code === 'F12') return true;
    const modifier = event.ctrlKey || event.metaKey;
    return (modifier && event.shiftKey && ['i', 'j', 'c', 'k'].includes(key))
      || (modifier && key === 'u');
  };

  const isProportionalPageZoom = () => {
    if (!state.initialSize.width || !state.initialSize.height) return false;
    const widthRatio = window.innerWidth / state.initialSize.width;
    const heightRatio = window.innerHeight / state.initialSize.height;
    return Math.abs(widthRatio - heightRatio) < 0.08;
  };

  const isDevtoolsOpen = () => {
    // 页面放大缩小会同时按比例改变宽高，不应当成开发者工具
    if (isProportionalPageZoom()) return false;
    const zoom = (window.devicePixelRatio || 1) / (state.initialDpr || 1);
    const adjustedWidth = window.innerWidth * zoom;
    const adjustedHeight = window.innerHeight * zoom;
    const extraWidth = Math.abs(window.outerWidth - adjustedWidth) - (state.initialChrome.width || 0);
    const extraHeight = Math.abs(window.outerHeight - adjustedHeight) - (state.initialChrome.height || 0);
    return extraWidth > config.devtoolsThreshold || extraHeight > config.devtoolsThreshold;
  };

  const onVisibilityChange = () => {
    if (!state.started) return;
    if (document.hidden) {
      clearBlurTimer();
      reportViolation();
      return;
    }
    suppressBlur(config.blurGraceMs);
  };

  const onWindowBlur = () => {
    scheduleBlurViolation();
  };

  const onWindowFocus = () => {
    clearBlurTimer();
  };

  const onFocusPoll = () => {
    if (!state.started || state.alerting) return;
    if (shouldIgnoreBlur() || document.hidden) return;
    if (pageHasFocus()) {
      clearBlurTimer();
      return;
    }
    scheduleBlurViolation();
  };

  const onCompositionStart = () => {
    state.composing = true;
    clearBlurTimer();
    suppressBlur(2000);
  };

  const onCompositionEnd = () => {
    state.composing = false;
    suppressBlur(400);
  };

  const onPointerDownCapture = (event) => {
    const target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    if (target.closest('input[type="file"]')) {
      clearBlurTimer();
      suppressBlur(5000);
    }
  };

  const onBeforePrint = () => {
    state.printing = true;
    clearBlurTimer();
  };

  const onAfterPrint = () => {
    state.printing = false;
    suppressBlur(500);
  };

  const onFullscreenChange = () => {
    if (!state.started || !config.requireFullscreen || state.alerting) return;
    if (isExamFullscreen()) return;
    reportViolation();
  };

  const onWindowResize = () => {
    if (!state.started) return;
    if (state.resizeTimer) clearTimeout(state.resizeTimer);
    state.resizeTimer = setTimeout(() => {
      state.resizeTimer = null;
      if (!state.started || state.alerting) return;
      if (isDevtoolsOpen()) reportViolation();
    }, 200);
  };

  const onStorageChange = event => {
    if (event.key === config.storageKey && event.newValue && event.newValue !== state.tabId) {
      reportViolation();
    }
  };

  const onBeforeUnload = event => {
    sessionStorage.setItem(getReloadFlagKey(), '1');
    reportViolation();
    cleanupActiveTab();
    event.preventDefault();
    event.returnValue = config.message;
    return config.message;
  };

  const cleanupActiveTab = () => {
    if (localStorage.getItem(config.storageKey) === state.tabId) {
      localStorage.removeItem(config.storageKey);
    }
  };

  const getReloadFlagKey = () => config.reloadFlagKey || `${config.storageKey}${RELOAD_FLAG_SUFFIX}`;

  const start = () => {
    if (state.started) return;
    state.started = true;
    state.tabId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    state.initialSize = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    state.initialDpr = window.devicePixelRatio || 1;
    state.initialChrome = {
      width: Math.abs(window.outerWidth - window.innerWidth),
      height: Math.abs(window.outerHeight - window.innerHeight)
    };
    state.composing = false;
    state.printing = false;
    suppressBlur(config.blurGraceMs);

    const activeTabId = localStorage.getItem(config.storageKey);
    if (activeTabId && activeTabId !== state.tabId) {
      // reportViolation();
    }

    // if (sessionStorage.getItem(getReloadFlagKey()) === '1') {
    //   sessionStorage.removeItem(getReloadFlagKey());
    //   alert(2)
    //   reportViolation();
    // }

    if (isDevtoolsOpen()) {
      reportViolation();
    }

    localStorage.setItem(config.storageKey, state.tabId);
    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('compositionstart', onCompositionStart);
    document.addEventListener('compositionend', onCompositionEnd);
    document.addEventListener('pointerdown', onPointerDownCapture, true);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('storage', onStorageChange);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    if (config.requireFullscreen) {
      state.unbindFullscreen = bindFullscreenChange(onFullscreenChange);
    }
    state.focusPollTimer = setInterval(onFocusPoll, config.focusPollMs);
  };

  const stop = () => {
    if (!state.started) return;
    state.started = false;
    clearBlurTimer();
    if (state.resizeTimer) {
      clearTimeout(state.resizeTimer);
      state.resizeTimer = null;
    }
    if (state.focusPollTimer) {
      clearInterval(state.focusPollTimer);
      state.focusPollTimer = null;
    }
    if (state.unbindFullscreen) {
      state.unbindFullscreen();
      state.unbindFullscreen = null;
    }

    if (config.reportOnStop) reportViolation();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    document.removeEventListener('compositionstart', onCompositionStart);
    document.removeEventListener('compositionend', onCompositionEnd);
    document.removeEventListener('pointerdown', onPointerDownCapture, true);
    window.removeEventListener('blur', onWindowBlur);
    window.removeEventListener('focus', onWindowFocus);
    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('storage', onStorageChange);
    window.removeEventListener('beforeunload', onBeforeUnload);
    window.removeEventListener('beforeprint', onBeforePrint);
    window.removeEventListener('afterprint', onAfterPrint);

    cleanupActiveTab();
  };

  const handleKeyDown = event => {
    if (!isDevtoolsShortcut(event)) return false;
    reportViolation();
    return true;
  };

  return {
    start,
    stop,
    handleKeyDown,
    reportViolation,
    state
  };
}
