package com.mwarevn.skibiops.react.modules;

import com.mwarevn.skibiops.IAppManagerService;

public class ServiceHolder {
    private static volatile IAppManagerService serviceApi;

    public static IAppManagerService getServiceApi() {
        return serviceApi;
    }

    public static void setServiceApi(IAppManagerService api) {
        serviceApi = api;
    }
}
