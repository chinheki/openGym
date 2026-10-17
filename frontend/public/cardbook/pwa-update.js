export const currentVersion = '__CARDBOOK_VERSION__';
export async function checkVersion(fetcher = fetch) {
  const url = new URL('../version.json', import.meta.url);
  url.searchParams.set('check', Date.now());
  const response = await fetcher(url, {cache:'no-store', signal:AbortSignal.timeout(15000)});
  if (!response.ok || response.redirected) throw new Error('检查更新失败，请联网后重试');
  const info = await response.json();
  if (typeof info.version !== 'string' || !info.version || info.version.length > 100) throw new Error('版本信息无效，请稍后重试');
  return info.version;
}
export async function prepareUpdate(serviceWorker = navigator.serviceWorker) {
  if (!serviceWorker) throw new Error('当前浏览器暂不支持应用更新');
  const registration = await serviceWorker.getRegistration(new URL('../', import.meta.url));
  if (!registration) throw new Error('应用尚未准备好，请联网重新打开后重试');
  await registration.update();
  // This worker activates itself only after the new shell has finished caching.
  const deadline = Date.now() + 60000;
  let pending;
  while (registration.installing || registration.waiting) {
    if (Date.now() > deadline) throw new Error('下载尚未完成，请稍后重试升级');
    const worker = registration.installing || registration.waiting;
    pending = worker;
    if (worker.state === 'redundant') throw new Error('新版下载失败，请联网重试');
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  if (pending?.state === 'redundant') throw new Error('新版下载失败，请联网重试');
  if (!registration.active) throw new Error('新版尚未就绪，请重试');
}
