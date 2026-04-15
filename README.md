<div align="center">

# skibidi-apps

**Quản lý ứng dụng Android cấp độ hệ thống — Hỗ trợ cả root và no-root (Shizuku).**

![Platform](https://img.shields.io/badge/platform-Android-3DDC84?style=flat-square&logo=android)
![Built with Expo](https://img.shields.io/badge/built%20with-Expo-000020?style=flat-square&logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react)
![License](https://img.shields.io/badge/license-Private-red?style=flat-square)

</div>

---

## Giới thiệu

\*_Skibidi Apps_ là một app Android mạnh tay, cho phép bạn xem, bật/tắt, gỡ bỏ hoặc force-stop bất kỳ ứng dụng nào trên thiết bị — kể cả app hệ thống mà Google không muốn bạn đụng vào.

Hai chế độ hoạt động:

| Chế độ      | Yêu cầu                                 | Mức quyền                  |
| ----------- | --------------------------------------- | -------------------------- |
| **Shizuku** | ADB qua Wi-Fi hoặc ADB có dây (một lần) | ADB-level — không cần root |
| **Root**    | Thiết bị đã root                        | Toàn quyền hệ thống        |

Ngoài ra còn có **Widget** để ghim app yêu thích lên màn hình chính với các hành động nhanh (quick force stop, quick disable, quick enable, quick uninstall).

---

## Tính năng

- Liệt kê toàn bộ app đang cài — user app lẫn system app
- Bật / tắt app không cần gỡ cài đặt
- Force-stop tiến trình đang chạy
- Gỡ cài đặt (uninstall) hoàn toàn
- Tìm kiếm app theo tên hoặc package name
- Mở trang Play Store của bất kỳ app nào
- Quản lý danh sách Widget — thêm / xóa app khỏi widget
- Hỗ trợ Dark Mode / Light Mode tự động theo hệ thống
- Haptic feedback cho từng thao tác

---

## Yêu cầu

- **Android 10+** (API 29 trở lên)
- **Shizuku** (khuyên dùng) — tải trên [Play Store](https://play.google.com/store/apps/details?id=moe.shizuku.privileged.api) hoặc [GitHub](https://github.com/RikkaApps/Shizuku)
- Hoặc thiết bị **đã root** (Magisk / KernelSU / APatch / ....)

---

## Cài đặt & Chạy (Development)

### 1. Clone và cài dependencies

```bash
git clone <repo-url>
cd skibidi-apps
yarn install
```

### 2. Kết nối thiết bị Android

```bash
# Kiểm tra thiết bị đã nhận chưa
adb devices
```

Bật **USB Debugging** trên thiết bị: _Cài đặt > Giới thiệu điện thoại > Nhấn 7 lần vào "Số bản dựng" > Tuỳ chọn nhà phát triển > USB Debugging_

### 3. Build và chạy trên Android

```bash
yarn android
```

Lần đầu build sẽ lâu hơn vì phải compile native modules. Từ lần sau thì nhanh hơn nhiều.

### 4. Khởi động Shizuku (nếu không dùng root)

Trên thiết bị, mở app **Shizuku** và chọn **"Bắt đầu qua ADB"**, sau đó chạy lệnh sau trên máy tính:

```bash
adb shell sh /sdcard/Android/data/moe.shizuku.privileged.api/start.sh
```

> Chỉ cần chạy một lần. Sau khi khởi động lại máy thì cần chạy lại lệnh này.

---

## Cấu trúc project

```
skibidi-apps/
├── app/                    # Expo Router — file-based routing
│   ├── (tabs)/
│   │   ├── index.tsx       # Màn hình chính — danh sách app
│   │   └── widget-list.tsx # Quản lý widget
│   ├── modal.tsx           # Modal thêm app vào widget
│   └── _layout.tsx         # Root layout
├── components/             # UI components dùng chung
├── hooks/                  # Custom hooks (theme, v.v.)
├── utils/
│   └── appManager.ts       # Wrapper cho Shizuku & Root native modules
├── android/                # Native Android code (AIDL, modules)
└── assets/                 # Icon, hình ảnh
```

---

## Build APK release

```bash
# Build APK local (không cần EAS)
yarn android --variant release

# Hoặc dùng EAS Build (cloud)
eas build --platform android --profile production
```

APK được ký bằng `skibidiapps-release-key.keystore` — giữ file này cẩn thận, mất là gg.

---

## Troubleshooting

**App báo "Shizuku không khả dụng"**
→ Mở app Shizuku và khởi động lại service. Chạy lại lệnh ADB ở trên.

**Không tắt/gỡ được app**
→ Một số app hệ thống được bảo vệ ở cấp firmware. Với những app này cần root hoặc device policy mới can thiệp được.

**Build lỗi native module**
→ Thử `cd android && ./gradlew clean`, sau đó build lại.

---

<div align="center">

Made with frustration and caffeine by **mwarevn**

</div>
