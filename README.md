# AUJUNPEAK GameCore v1.1 — React + Android Native

Ứng dụng Android giao diện dọc, phong cách futuristic/cyberpunk, robot 3D WebGL, 5 mẫu tâm ảo, 6 màu, HUD nổi trên ứng dụng khác, game launcher và thông tin RAM/pin thực tế.

## Cấu trúc

```text
Aujunpeak-GameCore/
├─ .github/workflows/android-apk.yml      # GitHub tự build APK
├─ src/App.jsx                             # React UI, 4 tab
├─ src/RobotScene.jsx                      # Robot WebGL/Three.js
├─ src/Reticle.jsx                         # Mẫu tâm ảo preview
├─ src/native.js                           # React ↔ Android Bridge
├─ src/style.css                           # CSS responsive dọc
├─ android/app/src/main/java/vn/aujunpeak/gamecore/
│  ├─ MainActivity.java                    # WebView + JS bridge + app launcher
│  ├─ OverlayService.java                  # Foreground overlay service
│  └─ ReticleView.java                     # Vẽ tâm ngắm native
├─ android/app/src/main/AndroidManifest.xml
├─ scripts/sync-assets.mjs                 # Chép React dist vào Android assets
└─ package.json
```

## Cách build APK bằng GitHub (không cần Android Studio trên máy)

1. Giải nén ZIP, **đưa tất cả file/thư mục bên trong lên root của repository GitHub** (kể cả thư mục `.github`, là thư mục ẩn). Không đưa thêm một tầng thư mục `Aujunpeak-GameCore` bên ngoài.
2. Vào repository GitHub → **Actions** → **Build Android APK** → **Run workflow**. Workflow cũng tự chạy khi push lên nhánh `main` hoặc `master`.
3. Chờ GitHub Actions báo **Success** → bấm vào run → ở phần **Artifacts** tải **AUJUNPEAK-GameCore-debug-APK** (một ZIP do GitHub tạo).
4. Giải nén artifact để lấy `app-debug.apk` và cài lên máy Android. Nếu điện thoại cảnh báo, chỉ cho phép cài nguồn này nếu bạn tin tưởng đúng APK vừa build.
5. Mở ứng dụng → **Tâm ảo** → **Hiển thị tâm trên game** → cấp quyền **Hiển thị trên ứng dụng khác** → quay lại và kích hoạt, rồi mở game trong **Thư viện**.

> Đây là APK debug để dùng thử, không phải bản release ký riêng cho Google Play.

## Chạy thử giao diện React trên máy tính

Cần Node.js 22 trở lên.

```bash
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị. **Bản trình duyệt chỉ preview UI**; quyền lớp phủ Android và game launcher cần APK.

## Build Android thủ công

Cần Node.js 22, Java 17, Android SDK API 35, Android Build Tools 35, Gradle 8.11.1.

```bash
npm install
npm run android
cd android
gradle :app:assembleDebug
```

APK ở `android/app/build/outputs/apk/debug/app-debug.apk`.

## Chức năng thật và giới hạn

- **Có:** Robot 3D Three.js, hiệu ứng sáng và hạt trong giao diện, giao diện portrait, 4 tab, 5 kiểu tâm, màu sắc, kích thước, độ dày, vị trí X/Y, glow, opacity, lưu thiết lập cục bộ, mở app đã cài, hiển thị RAM/pin từ Android, overlay native click-through, thông báo có nút dừng.
- **Không giả lập:** Ứng dụng không tuyên bố tăng FPS thật, không dọn RAM ứng dụng khác, không can thiệp game, không tự kéo tâm hoặc đọc bộ nhớ game. HUD là lớp phủ trực quan.
- **Hệ thống giới hạn:** Cần Android 8.0+, cấp `SYSTEM_ALERT_WINDOW` bằng tay, dịch vụ chạy ở foreground. Một số game chặn overlay và một số ROM chặn dịch vụ nền; app không vượt qua được việc chặn của hệ điều hành/game. Android 12+ có bảo vệ chạm qua cửa sổ lớp phủ nên alpha HUD được giới hạn tối đa 0.78.
- **Quyền:** `SYSTEM_ALERT_WINDOW` là quyền nhạy cảm, phải do người dùng tự cấp. `FOREGROUND_SERVICE_SPECIAL_USE` cần khai báo lý do khi xuất bản Google Play; được sử dụng vì HUD liên tục theo yêu cầu người dùng.
- **Bảo mật:** Không có API, quảng cáo, root, camera, key, token, thu thập dữ liệu riêng tư hoặc dữ liệu gửi ra máy chủ. Danh sách app/icon và thống kê máy chỉ được đọc trên thiết bị.
- **Vị trí tâm:** Theo phần trăm chiều rộng/cao màn hình; tỷ lệ có thể khác nhau ở những trò chơi dùng chế độ immersive/fullscreen.

## Thay tên và ID app

Đổi `applicationId`, `namespace` trong `android/app/build.gradle`, package thư mục/khai báo Java, và label trong `android/app/src/main/AndroidManifest.xml`.

## Lưu ý sử dụng

Kiểm tra chính sách của từng trò chơi trước khi bật overlay. Nhiều game cho phép tâm hiển thị trung tính nhưng một số game chặn hoặc không cho phép lớp phủ dù không sửa dữ liệu của game.


## v1.1 — kiểm tra build & lỗi GitHub Actions

- Bản cũ báo lỗi trên màn hình Summary nhưng không thấy bước nào hỏng. Mở **Actions → run bị lỗi → Android Debug APK → bước đỏ** để đọc `Error:` / `FAILURE: Build failed` / `npm ERR!`.
- Bản này chia các giai đoạn rõ ràng: Preflight source, Install React packages, Compile React, Android SDK, Gradle, Verify APK.
- Nếu build thất bại sau khi checkout, mục Artifacts có thể có `GAMECORE-BUILD-ERROR-LOGS` gồm log npm/React/Gradle để kiểm tra; nếu thất bại ngay bước cài Actions thì xem trực tiếp log của bước đó.
- Khi build thành công, tải `AUJUNPEAK-GameCore-debug-APK`; kèm SHA-256 của APK.
- Source kiểm tra đủ Java, manifest, cấu trúc asset, quyền overlay, và báo lỗi native thay vì im lặng.

**Quan trọng:** ảnh Summary ban đầu không chứa log chi tiết nên không thể chứng minh nguyên nhân duy nhất; đây là bản gia cố cấu hình và chức năng. Chỉ có lần chạy Actions trên GitHub mới xác nhận build Android hoàn tất. Nếu vẫn Failure, cung cấp nội dung log của bước đỏ và artifact `GAMECORE-BUILD-ERROR-LOGS`.

**Cập nhật repo cũ:** giải nén ZIP và upload file/thư mục **bên trong** thư mục `Aujunpeak-GameCore-FIXED` vào **root** repository, chọn overwrite khi GitHub hỏi. Đặc biệt phải cập nhật `.github/workflows/android-apk.yml` và `scripts/check-project.py`.
