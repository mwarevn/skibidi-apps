package com.mwarevn.skibiops

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost


import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper
import com.mwarevn.skibiops.ReactPackages.SystemPackage

import rikka.shizuku.Shizuku

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
      this,
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
              add(SystemPackage())
//              add(ShizukuPackage())
            }

          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)




    // Nếu app multi-process
    // ShizukuProvider.enableMultiProcessSupport();  // nếu bạn sử dụng multi process

    // Đăng listener để biết khi Binder được cung cấp
    Shizuku.addBinderReceivedListener( {
      // binder đã sẵn sàng, bạn có thể bắt đầu gọi API Shizuku
    });
    Shizuku.addBinderDeadListener( {
      // binder bị hủy, cần xử lý lại
    });

    // Nếu chưa có quyền, bạn có thể request
    if (Shizuku.checkSelfPermission() != 100) {
      Shizuku.requestPermission(1);  // mã requestCode tùy bạn chọn
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
