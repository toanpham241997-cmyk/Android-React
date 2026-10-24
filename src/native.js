export const isNative = typeof window !== 'undefined' && Boolean(window.AujunpeakAndroid);

function parseJson(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

export const native = {
  status() {
    if (!isNative) return { permission: false, active: false, demo: true };
    return parseJson(window.AujunpeakAndroid.getStatus(), { permission: false, active: false });
  },
  device() {
    if (!isNative) return { battery: null, availableRamMB: null, totalRamMB: null, androidVersion: 'Web Preview', manufacturer: 'Browser', model: 'Desktop' };
    return parseJson(window.AujunpeakAndroid.getDeviceInfo(), {});
  },
  games() {
    if (!isNative) return [];
    return parseJson(window.AujunpeakAndroid.getInstalledApps(), []);
  },
  requestPermission() { if (isNative) window.AujunpeakAndroid.requestOverlayPermission(); },
  start(config) { if (isNative) window.AujunpeakAndroid.startOverlay(JSON.stringify(config)); },
  update(config) { if (isNative) window.AujunpeakAndroid.updateOverlay(JSON.stringify(config)); },
  stop() { if (isNative) window.AujunpeakAndroid.stopOverlay(); },
  launch(packageName) { if (isNative) window.AujunpeakAndroid.launchApp(packageName); },
  openAppSettings() { if (isNative) window.AujunpeakAndroid.openAppSettings(); },
};
