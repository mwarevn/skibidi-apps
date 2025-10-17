package com.mwarevn.skibiops.rpackage;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.mwarevn.skibiops.rmodule.ShizukuModule;
import com.mwarevn.skibiops.rmodule.SystemModule;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ShizukuPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new ShizukuModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
