package com.mwarevn.skibiops.ReactPackages;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.mwarevn.skibiops.ReactModules.AppInspectorModule;
import com.mwarevn.skibiops.ReactModules.ShizukuModule;
import com.mwarevn.skibiops.ReactModules.SystemModule;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class SystemPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new SystemModule(reactContext));
        modules.add(new ShizukuModule(reactContext));
        modules.add(new AppInspectorModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
