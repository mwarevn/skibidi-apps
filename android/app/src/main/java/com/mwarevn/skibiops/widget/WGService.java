package com.mwarevn.skibiops.widget;

import android.content.Intent;
import android.widget.RemoteViewsService;

public class WGService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new WGRemoteViewsFactory(this.getApplicationContext(), intent);
    }
}
