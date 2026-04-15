package com.mwarevn.skibidiapps.react.packages;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.mwarevn.skibidiapps.react.modules.ShizukuModule;
import com.mwarevn.skibidiapps.react.modules.AppManager;
import com.mwarevn.skibidiapps.react.modules.AppManagerBinder;
import com.mwarevn.skibidiapps.react.modules.RootModule;
import com.mwarevn.skibidiapps.react.modules.SystemModule;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class SystemPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new SystemModule(reactContext));
        modules.add(new ShizukuModule(reactContext));
        modules.add(new AppManagerBinder(reactContext));
        modules.add(new AppManager(reactContext));
        modules.add(new RootModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
