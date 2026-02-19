package com.mwarevn.appremover.react.modules;

import android.content.pm.PackageManager;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;

public class RootModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public RootModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "RootModule";
    }

    @ReactMethod
    public void executeRootCommand(String command, Promise promise) {
        try {
            Process process = Runtime.getRuntime().exec("su");
            DataOutputStream outputStream = new DataOutputStream(process.getOutputStream());
            BufferedReader inputStream = new BufferedReader(new InputStreamReader(process.getInputStream()));
            BufferedReader errorStream = new BufferedReader(new InputStreamReader(process.getErrorStream()));

            outputStream.writeBytes(command + "\n");
            outputStream.writeBytes("exit\n");
            outputStream.flush();

            StringBuilder output = new StringBuilder();
            String line;
            while ((line = inputStream.readLine()) != null) {
                output.append(line).append("\n");
            }

            StringBuilder error = new StringBuilder();
            while ((line = errorStream.readLine()) != null) {
                error.append(line).append("\n");
            }

            int exitCode = process.waitFor();

            if (exitCode == 0) {
                promise.resolve(output.toString().trim());
            } else {
                promise.reject("ROOT_COMMAND_FAILED", "Exit code: " + exitCode + ", Error: " + error.toString().trim());
            }

        } catch (Exception e) {
            promise.reject("ROOT_COMMAND_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void disablePackage(String packageName, Promise promise) {
        executeRootCommand("pm disable " + packageName, promise);
    }

    @ReactMethod
    public void enablePackage(String packageName, Promise promise) {
        executeRootCommand("pm enable " + packageName, promise);
    }

    @ReactMethod
    public void forceStopPackage(String packageName, Promise promise) {
        executeRootCommand("am force-stop " + packageName, promise);
    }

    @ReactMethod
    public void uninstallPackage(String packageName, Promise promise) {
        executeRootCommand("pm uninstall " + packageName, promise);
    }
}