package com.mwarevn.skibidiapps;

interface IAppManagerService {
    void uninstallPackage(String packageName);
    void disablePackage(String packageName);
    void enablePackage(String packageName);
    void forceStopPackage(String packageName);
    void revokeAllPermissions(String packageName);
    void forceUninstallAsRoot(String packageName);
    boolean checkRootAvailable();
    void destroy();
}
