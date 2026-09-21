const FULLSCREEN_EVENTS = [
  'fullscreenchange',
  'webkitfullscreenchange',
  'mozfullscreenchange',
  'MSFullscreenChange'
];

export function isExamFullscreen() {
  return Boolean(
    document.fullscreenElement
    || document.webkitFullscreenElement
    || document.mozFullScreenElement
    || document.msFullscreenElement
  );
}

export function bindFullscreenChange(handler) {
  FULLSCREEN_EVENTS.forEach(event => document.addEventListener(event, handler));
  return () => {
    FULLSCREEN_EVENTS.forEach(event => document.removeEventListener(event, handler));
  };
}

function waitUntilFullscreen(requestResult) {
  if (isExamFullscreen()) {
    return new Promise(resolve => {
      window.setTimeout(resolve, 160);
    });
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (ok, error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      unbind();
      if (ok) resolve();
      else reject(error || new Error('未能进入全屏，请允许浏览器全屏后重试'));
    };
    const onChange = () => {
      if (isExamFullscreen()) window.setTimeout(() => finish(true), 160);
    };
    const unbind = bindFullscreenChange(onChange);
    const timer = window.setTimeout(() => {
      if (isExamFullscreen()) finish(true);
      else finish(false);
    }, 2000);
    Promise.resolve(requestResult).then(() => {
      if (isExamFullscreen()) window.setTimeout(() => finish(true), 160);
    }).catch(error => finish(false, error));
  });
}

export function enterExamFullscreen(element) {
  const target = element || document.documentElement;
  if (isExamFullscreen()) return Promise.resolve();
  const request = target.requestFullscreen
    || target.webkitRequestFullscreen
    || target.mozRequestFullScreen
    || target.msRequestFullscreen;
  if (!request) return Promise.reject(new Error('当前浏览器不支持全屏'));
  let requestResult;
  try {
    requestResult = request.call(target);
  } catch (error) {
    return Promise.reject(error);
  }
  return waitUntilFullscreen(requestResult);
}

export function exitExamFullscreen() {
  if (!isExamFullscreen()) return Promise.resolve();
  const exit = document.exitFullscreen
    || document.webkitExitFullscreen
    || document.mozCancelFullScreen
    || document.msExitFullscreen;
  if (!exit) return Promise.resolve();
  return Promise.resolve(exit.call(document)).catch(() => {});
}
