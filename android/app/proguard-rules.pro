# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# Giữ lại class triển khai IAppManagerService và các thành phần bên trong nó.
# -keep class: Giữ lại class và các thành viên của nó.
# implements com.mwarevn.appremover.IAppManagerService: Áp dụng cho bất kỳ class nào triển khai giao diện này.
-keep class * implements com.mwarevn.appremover.IAppManagerService {
    # Giữ lại tất cả các phương thức và trường public, protected, private.
    <fields>;
    <methods>;
}

# Quy tắc quan trọng nhất: Giữ lại hàm khởi tạo không tham số của các class kế thừa từ Stub.
# Điều này ngăn ProGuard/R8 loại bỏ nó.
-keep class * extends android.os.Binder {
    # Giữ lại hàm khởi tạo (constructor).
    <init>(...);
}
