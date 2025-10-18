@echo off
echo Downloading AIDL files...

REM Create directories
mkdir app\src\main\aidl\android\content\pm 2>nul
mkdir app\src\main\aidl\android\app 2>nul
mkdir app\src\main\aidl\android\os 2>nul

set BASE_URL=https://raw.githubusercontent.com/aosp-mirror/platform_frameworks_base/master/core/java

REM Download IPackageManager and related files
echo Downloading IPackageManager.aidl...
curl -o app/src/main/aidl/android/content/pm/IPackageManager.aidl %BASE_URL%/android/content/pm/IPackageManager.aidl

echo Downloading PackageInfo.aidl...
curl -o app/src/main/aidl/android/content/pm/PackageInfo.aidl %BASE_URL%/android/content/pm/PackageInfo.aidl

echo Downloading ApplicationInfo.aidl...
curl -o app/src/main/aidl/android/content/pm/ApplicationInfo.aidl %BASE_URL%/android/content/pm/ApplicationInfo.aidl

echo Downloading PermissionInfo.aidl...
curl -o app/src/main/aidl/android/content/pm/PermissionInfo.aidl %BASE_URL%/android/content/pm/PermissionInfo.aidl

echo Downloading ActivityInfo.aidl...
curl -o app/src/main/aidl/android/content/pm/ActivityInfo.aidl %BASE_URL%/android/content/pm/ActivityInfo.aidl

echo Downloading ServiceInfo.aidl...
curl -o app/src/main/aidl/android/content/pm/ServiceInfo.aidl %BASE_URL%/android/content/pm/ServiceInfo.aidl

echo Downloading ProviderInfo.aidl...
curl -o app/src/main/aidl/android/content/pm/ProviderInfo.aidl %BASE_URL%/android/content/pm/ProviderInfo.aidl

echo Downloading InstrumentationInfo.aidl...
curl -o app/src/main/aidl/android/content/pm/InstrumentationInfo.aidl %BASE_URL%/android/content/pm/InstrumentationInfo.aidl

echo Downloading ResolveInfo.aidl...
curl -o app/src/main/aidl/android/content/pm/ResolveInfo.aidl %BASE_URL%/android/content/pm/ResolveInfo.aidl

echo Downloading ComponentInfo.aidl...
curl -o app/src/main/aidl/android/content/pm/ComponentInfo.aidl %BASE_URL%/android/content/pm/ComponentInfo.aidl

echo Downloading PackageItemInfo.aidl...
curl -o app/src/main/aidl/android/content/pm/PackageItemInfo.aidl %BASE_URL%/android/content/pm/PackageItemInfo.aidl

echo Downloading FeatureInfo.aidl...
curl -o app/src/main/aidl/android/content/pm/FeatureInfo.aidl %BASE_URL%/android/content/pm/FeatureInfo.aidl

echo Downloading ConfigurationInfo.aidl...
curl -o app/src/main/aidl/android/content/pm/ConfigurationInfo.aidl %BASE_URL%/android/content/pm/ConfigurationInfo.aidl

echo Downloading VersionedPackage.aidl...
curl -o app/src/main/aidl/android/content/pm/VersionedPackage.aidl %BASE_URL%/android/content/pm/VersionedPackage.aidl

echo Downloading KeySet.aidl...
curl -o app/src/main/aidl/android/content/pm/KeySet.aidl %BASE_URL%/android/content/pm/KeySet.aidl

echo Downloading VerifierDeviceIdentity.aidl...
curl -o app/src/main/aidl/android/content/pm/VerifierDeviceIdentity.aidl %BASE_URL%/android/content/pm/VerifierDeviceIdentity.aidl

echo Downloading ParceledListSlice.aidl...
curl -o app/src/main/aidl/android/content/pm/ParceledListSlice.aidl %BASE_URL%/android/content/pm/ParceledListSlice.aidl

REM Download IActivityManager and related files
echo Downloading IActivityManager.aidl...
curl -o app/src/main/aidl/android/app/IActivityManager.aidl %BASE_URL%/android/app/IActivityManager.aidl

echo Downloading ActivityManager.aidl...
curl -o app/src/main/aidl/android/app/ActivityManager.aidl %BASE_URL%/android/app/ActivityManager.aidl

REM Download common dependencies
echo Downloading UserHandle.aidl...
curl -o app/src/main/aidl/android/os/UserHandle.aidl %BASE_URL%/android/os/UserHandle.aidl

echo Downloading Bundle.aidl...
curl -o app/src/main/aidl/android/os/Bundle.aidl %BASE_URL%/android/os/Bundle.aidl

echo Download completed!
echo Please sync your Gradle project now.
pause