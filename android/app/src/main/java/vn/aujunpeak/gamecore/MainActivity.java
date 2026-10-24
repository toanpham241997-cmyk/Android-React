package vn.aujunpeak.gamecore;

import android.Manifest;
import android.app.Activity;
import android.app.ActivityManager;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import androidx.webkit.WebViewAssetLoader;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class MainActivity extends Activity {
    private WebView webView;
    private static volatile String lastOverlayError = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(android.graphics.Color.rgb(6, 10, 20));
        getWindow().setNavigationBarColor(android.graphics.Color.rgb(6, 10, 20));
        webView = new WebView(this);
        webView.setBackgroundColor(android.graphics.Color.rgb(6, 10, 20));
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setAllowContentAccess(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        // Truy cập asset nội bộ bằng HTTPS origin thay vì file:// (để JS modules chạy đúng).
        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !"appassets.androidplatform.net".equals(request.getUrl().getHost());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !url.startsWith("https://appassets.androidplatform.net/assets/");
            }
        });
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new NativeBridge(), "AujunpeakAndroid");
        setContentView(webView);
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");
    }

    private void refreshStatus() {
        runOnUiThread(() -> {
            if (webView != null) webView.evaluateJavascript(
                "window.dispatchEvent(new Event('aujunpeak-native-update'))", null);
        });
    }

    @Override protected void onResume() {
        super.onResume();
        if (webView != null) webView.postDelayed(this::refreshStatus, 350);
    }

    @Override protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("AujunpeakAndroid");
            webView.destroy();
        }
        super.onDestroy();
    }

    private class NativeBridge {
        @JavascriptInterface public String getStatus() {
            JSONObject obj = new JSONObject();
            try {
                obj.put("permission", Settings.canDrawOverlays(MainActivity.this));
                obj.put("active", OverlayService.isRunning);
                obj.put("demo", false);
                obj.put("lastError", !OverlayService.lastError.isEmpty() ? OverlayService.lastError : lastOverlayError);
            } catch (Exception ignored) { }
            return obj.toString();
        }

        @JavascriptInterface public String getDeviceInfo() {
            JSONObject info = new JSONObject();
            try {
                Intent batteryIntent = registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
                int battery = -1;
                if (batteryIntent != null) {
                    int level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                    int scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                    if (scale > 0 && level >= 0) battery = Math.round(level * 100f / scale);
                }
                ActivityManager am = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
                ActivityManager.MemoryInfo memory = new ActivityManager.MemoryInfo();
                if (am != null) am.getMemoryInfo(memory);
                info.put("battery", battery >= 0 ? battery : JSONObject.NULL);
                info.put("availableRamMB", memory.availMem / 1048576L);
                info.put("totalRamMB", memory.totalMem / 1048576L);
                info.put("androidVersion", Build.VERSION.RELEASE);
                info.put("manufacturer", Build.MANUFACTURER);
                info.put("model", Build.MODEL);
            } catch (Exception ignored) { }
            return info.toString();
        }

        @JavascriptInterface public String getInstalledApps() {
            JSONArray result = new JSONArray();
            try {
                PackageManager pm = getPackageManager();
                Intent intent = new Intent(Intent.ACTION_MAIN);
                intent.addCategory(Intent.CATEGORY_LAUNCHER);
                List<ResolveInfo> apps = pm.queryIntentActivities(intent, 0);
                Collections.sort(apps, (a,b) -> {
                    boolean ga = a.activityInfo.applicationInfo.category == ApplicationInfo.CATEGORY_GAME;
                    boolean gb = b.activityInfo.applicationInfo.category == ApplicationInfo.CATEGORY_GAME;
                    if (ga != gb) return ga ? -1 : 1;
                    return a.loadLabel(pm).toString().compareToIgnoreCase(b.loadLabel(pm).toString());
                });
                Set<String> seen = new HashSet<>();
                for (ResolveInfo app : apps) {
                    String pack = app.activityInfo.packageName;
                    if (pack.equals(getPackageName()) || !seen.add(pack)) continue;
                    JSONObject item = new JSONObject();
                    item.put("name", app.loadLabel(pm).toString());
                    item.put("packageName", pack);
                    item.put("game", app.activityInfo.applicationInfo.category == ApplicationInfo.CATEGORY_GAME);
                    // Icon base64 nội bộ, không gửi dữ liệu ra mạng.
                    try {
                        Drawable drawable = app.loadIcon(pm);
                        Bitmap bitmap = Bitmap.createBitmap(56, 56, Bitmap.Config.ARGB_8888);
                        Canvas canvas = new Canvas(bitmap);
                        drawable.setBounds(0, 0, 56, 56);
                        drawable.draw(canvas);
                        ByteArrayOutputStream os = new ByteArrayOutputStream();
                        bitmap.compress(Bitmap.CompressFormat.PNG, 85, os);
                        item.put("icon", "data:image/png;base64," + Base64.encodeToString(os.toByteArray(), Base64.NO_WRAP));
                        bitmap.recycle();
                    } catch (Exception ignored) { }
                    result.put(item);
                }
            } catch (Exception ignored) { }
            return result.toString();
        }

        @JavascriptInterface public void requestOverlayPermission() {
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getPackageName()));
                    startActivity(intent);
                } catch (Exception ignored) {
                    startActivity(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION));
                }
            });
        }

        @JavascriptInterface public void startOverlay(String config) {
            runOnUiThread(() -> {
                if (!Settings.canDrawOverlays(MainActivity.this)) {
                    refreshStatus();
                    return;
                }
                try {
                    Intent intent = new Intent(MainActivity.this, OverlayService.class);
                    intent.setAction(OverlayService.ACTION_START);
                    intent.putExtra(OverlayService.EXTRA_CONFIG, config);
                    lastOverlayError = "";
                    OverlayService.lastError = "";
                    if (Build.VERSION.SDK_INT >= 33 &&
                        checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                        requestPermissions(new String[] { Manifest.permission.POST_NOTIFICATIONS }, 2026);
                    }
                    startForegroundService(intent);
                } catch (Exception error) {
                    lastOverlayError = error.getClass().getSimpleName() + ": " + error.getMessage();
                }
                webView.postDelayed(MainActivity.this::refreshStatus, 450);
            });
        }

        @JavascriptInterface public void updateOverlay(String config) {
            runOnUiThread(() -> {
                if (!OverlayService.isRunning) return;
                Intent intent = new Intent(MainActivity.this, OverlayService.class);
                intent.setAction(OverlayService.ACTION_UPDATE);
                intent.putExtra(OverlayService.EXTRA_CONFIG, config);
                try { startService(intent); }
                catch (Exception error) { lastOverlayError = error.getMessage(); }
            });
        }

        @JavascriptInterface public void stopOverlay() {
            runOnUiThread(() -> {
                Intent intent = new Intent(MainActivity.this, OverlayService.class);
                intent.setAction(OverlayService.ACTION_STOP);
                // Không khởi động service mới chỉ để dừng nếu nó không hoạt động.
                if (OverlayService.isRunning) {
                    try { startService(intent); }
                    catch (Exception error) { lastOverlayError = error.getMessage(); }
                }
                webView.postDelayed(MainActivity.this::refreshStatus, 350);
            });
        }

        @JavascriptInterface public void launchApp(String packageName) {
            runOnUiThread(() -> {
                try {
                    PackageManager pm = getPackageManager();
                    Intent intent = pm.getLaunchIntentForPackage(packageName);
                    if (intent != null) {
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                    }
                } catch (Exception ignored) { }
            });
        }

        @JavascriptInterface public void openAppSettings() {
            runOnUiThread(() -> {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                        Uri.fromParts("package", getPackageName(), null));
                startActivity(intent);
            });
        }
    }
}
