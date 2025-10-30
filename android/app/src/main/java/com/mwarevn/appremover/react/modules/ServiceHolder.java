package com.mwarevn.appremover.react.modules;

import com.mwarevn.appremover.IAppManagerService;

public class ServiceHolder {
    private static volatile IAppManagerService serviceApi;

    public static IAppManagerService getServiceApi() {
        return serviceApi;
    }

    public static void setServiceApi(IAppManagerService api) {
        serviceApi = api;
    }
}
