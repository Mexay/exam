export function safeFilename(value, fallback = '下载文件') {
  const filename = String(value || '').trim().replace(/[\\/:*?"<>|]/g, '_');
  return filename || fallback;
}

export function downloadBlob(blob, filename) {
  if (!(blob instanceof Blob)) throw new Error('下载失败，接口未返回文件数据');
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
}
