package com.mwarevn.skibiops.helper;

import android.util.Log;

import com.facebook.react.bridge.Promise;

import java.io.BufferedReader;
import java.io.InputStreamReader;

import rikka.shizuku.Shizuku;
import rikka.shizuku.ShizukuRemoteProcess;

public class ShizukuHelper {
    private static final String TAG = "ShizukuHelper";

    public static void init() {
        if (Shizuku.pingBinder()) {
            Log.i(TAG, "Shizuku is running.");
        } else {
            Log.e(TAG, "Shizuku is NOT running.");
        }
    }

    public void getAllPackages(Promise promise) {

    }


}
