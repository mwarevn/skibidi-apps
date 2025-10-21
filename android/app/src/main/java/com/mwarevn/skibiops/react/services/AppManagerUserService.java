package com.mwarevn.skibiops.react.services;

import android.os.RemoteException;
import com.mwarevn.skibiops.IAppManagerService;

import android.util.Log;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

public class AppManagerUserService extends IAppManagerService.Stub {
    private static final String TAG = "SK_AppManagerUserService";

    private void validatePackageName(String packageName) throws RemoteException {
        if (packageName == null || packageName.trim().isEmpty()) {
            throw new RemoteException("packageName must not be null or empty");
        }
    }

    private void runCommand(List<String> command) throws RemoteException {
        Log.i(TAG, "runCommand: " + command.toString());
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);
        Process process = null;
        try {
            process = pb.start();
            StringBuilder output = new StringBuilder();
            try (BufferedReader br = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = br.readLine()) != null) {
                    output.append(line).append('\n');
                }
            }
            int exit = process.waitFor();
            Log.i(TAG, "Command exit=" + exit + " output=" + output.toString());
            if (exit != 0) {
                String out = output.toString().trim();
                Log.e(TAG, "Command failed (exit " + exit + "): " + out);
                throw new RemoteException("Command failed (exit " + exit + "): " + out);
            }
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            Log.e(TAG, "Failed to execute command", e);
            throw new RemoteException("Failed to execute command: " + e.getMessage());
        } finally {
            if (process != null) process.destroy();
        }
    }

    @Override
    public void uninstallPackage(String packageName) throws RemoteException {
        validatePackageName(packageName);
        Log.i(TAG, "uninstallPackage called for: " + packageName);
        List<String> cmd = new ArrayList<>();
        cmd.add("/system/bin/pm");
        cmd.add("uninstall");
        cmd.add("--user");
        cmd.add("0");
        cmd.add(packageName);
        try {
            runCommand(cmd);
            return;
        } catch (RemoteException e) {
            Log.w(TAG, "uninstall with --user failed, trying without user: " + e.getMessage());
        }

        List<String> fallback = new ArrayList<>();
        fallback.add("/system/bin/pm");
        fallback.add("uninstall");
        fallback.add(packageName);
        runCommand(fallback);
    }

    @Override
    public void disablePackage(String packageName) throws RemoteException {
        validatePackageName(packageName);
        Log.i(TAG, "disablePackage called for: " + packageName);
        List<String> cmd = new ArrayList<>();
        cmd.add("/system/bin/pm");
        cmd.add("disable-user");
        cmd.add("--user");
        cmd.add("0");
        cmd.add(packageName);
        runCommand(cmd);
    }

    @Override
    public void enablePackage(String packageName) throws RemoteException {
        validatePackageName(packageName);
        Log.i(TAG, "enablePackage called for: " + packageName);
        // Try enabling for user 0 first
        List<String> cmd = new ArrayList<>();
        cmd.add("/system/bin/pm");
        cmd.add("enable");
        cmd.add("--user");
        cmd.add("0");
        cmd.add(packageName);
        try {
            runCommand(cmd);
            return;
        } catch (RemoteException e) {
            Log.w(TAG, "enable with --user failed, trying without user: " + e.getMessage());
        }

        List<String> fallback = new ArrayList<>();
        fallback.add("/system/bin/pm");
        fallback.add("enable");
        fallback.add(packageName);
        runCommand(fallback);
    }

    @Override
    public void forceStopPackage(String packageName) throws RemoteException {
        validatePackageName(packageName);
        Log.i(TAG, "forceStopPackage called for: " + packageName);
        List<String> cmd = new ArrayList<>();
        cmd.add("/system/bin/am");
        cmd.add("force-stop");
        cmd.add(packageName);
        try {
            runCommand(cmd);
            return;
        } catch (RemoteException e) {
            Log.w(TAG, "force-stop using /system/bin/am failed, trying 'am' on PATH: " + e.getMessage());
        }

        List<String> fallback = new ArrayList<>();
        fallback.add("am");
        fallback.add("force-stop");
        fallback.add(packageName);
        runCommand(fallback);
    }

    @Override
    public void destroy() throws RemoteException {
        // no-op for now
    }

}
