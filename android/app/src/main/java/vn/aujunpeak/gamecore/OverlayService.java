package vn.aujunpeak.gamecore;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;
import android.view.Gravity;
import android.view.WindowManager;
import org.json.JSONObject;

public class OverlayService extends Service {
    public static final String ACTION_START = "vn.aujunpeak.gamecore.START";
    public static final String ACTION_STOP = "vn.aujunpeak.gamecore.STOP";
    public static final String ACTION_UPDATE = "vn.aujunpeak.gamecore.UPDATE";
    public static final String EXTRA_CONFIG = "config";
    public static volatile boolean isRunning = false;
    public static volatile String lastError = "";
    private static final String CHANNEL_ID = "crosshair_overlay";
    private WindowManager windowManager;
    private WindowManager.LayoutParams params;
    private ReticleView reticleView;
    private JSONObject config = new JSONObject();

    @Override public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Tâm ảo đang hoạt động", NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Hiển thị nút tắt tâm ảo Aujunpeak khi chơi game");
        manager.createNotificationChannel(channel);
    }

    private Notification buildNotification() {
        Intent openIntent = new Intent(this, MainActivity.class);
        PendingIntent open = PendingIntent.getActivity(this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent stopIntent = new Intent(this, OverlayService.class).setAction(ACTION_STOP);
        PendingIntent stop = PendingIntent.getService(this, 1, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        return new Notification.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentTitle("AUJUNPEAK • Tâm ảo đang bật")
            .setContentText("Chạm để quay lại ứng dụng. Dùng TẮT để ẩn tâm.")
            .setOngoing(true)
            .setContentIntent(open)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "TẮT TÂM", stop)
            .build();
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? ACTION_START : intent.getAction();
        if (ACTION_STOP.equals(action)) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (!Settings.canDrawOverlays(this)) {
            lastError = "Chưa cấp quyền hiển thị trên ứng dụng khác";
            isRunning = false;
            stopSelf();
            return START_NOT_STICKY;
        }
        if (intent != null && intent.hasExtra(EXTRA_CONFIG)) {
            try { config = new JSONObject(intent.getStringExtra(EXTRA_CONFIG)); }
            catch (Exception ignored) { config = new JSONObject(); }
        }
        if (ACTION_UPDATE.equals(action)) {
            if (isRunning) applyOverlay();
            return START_NOT_STICKY;
        }
        try {
            lastError = "";
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(1451, buildNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } else {
                startForeground(1451, buildNotification());
            }
            applyOverlay();
            isRunning = reticleView != null;
            if (!isRunning) stopSelf();
        } catch (Exception error) {
            lastError = error.getClass().getSimpleName() + ": " + error.getMessage();
            android.util.Log.e("GameCoreOverlay", "Cannot start crosshair overlay", error);
            isRunning = false;
            stopSelf();
        }
        return START_NOT_STICKY;
    }

    private int dip(float value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private double number(String key, double fallback) {
        try { return config.optDouble(key, fallback); }
        catch (Exception ignored) { return fallback; }
    }
    private double clamp(double v, double min, double max) { return Math.max(min, Math.min(max, v)); }

    private void applyOverlay() {
        if (windowManager == null) return;
        int visualSize = dip((float) clamp(number("size", 85), 42, 180));
        // Android 12+ hạn chế thao tác chạm qua cửa sổ từ ứng dụng khác có độ che phủ lớn.
        // Alpha ở mức <= 0.78 để giữ HUD click-through trên các phiên bản Android hỗ trợ.
        float alpha = (float) clamp(number("opacity", 0.78), 0.15, 0.78);
        android.util.DisplayMetrics dm = getResources().getDisplayMetrics();
        int offsetX = (int) (clamp(number("offsetX", 0), -45, 45) * dm.widthPixels / 100.0);
        int offsetY = (int) (clamp(number("offsetY", 0), -42, 42) * dm.heightPixels / 100.0);
        if (reticleView == null) {
            reticleView = new ReticleView(this);
            params = new WindowManager.LayoutParams(
                visualSize, visualSize,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
                WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE |
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT);
            params.gravity = Gravity.CENTER;
            params.alpha = alpha;
            params.x = offsetX;
            params.y = offsetY;
            try { windowManager.addView(reticleView, params); }
            catch (Exception error) {
                lastError = error.getClass().getSimpleName() + ": " + error.getMessage();
                android.util.Log.e("GameCoreOverlay", "Cannot add overlay window", error);
                reticleView = null; stopSelf(); return;
            }
        } else {
            params.width = visualSize;
            params.height = visualSize;
            params.alpha = alpha;
            params.x = offsetX;
            params.y = offsetY;
            try { windowManager.updateViewLayout(reticleView, params); }
            catch (Exception ignored) { }
        }
        reticleView.setConfig(config);
    }

    @Override public void onDestroy() {
        isRunning = false;
        if (windowManager != null && reticleView != null) {
            try { windowManager.removeView(reticleView); }
            catch (Exception ignored) { }
            reticleView = null;
        }
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent intent) { return null; }
}
