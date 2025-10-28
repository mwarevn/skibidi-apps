package com.mwarevn.skibiops.widget;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.app.Service;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.IBinder;
import android.os.SystemClock;

import com.mwarevn.skibiops.R;

public class WidgetUpdateService extends Service {

    private static final long UPDATE_INTERVAL = 30 * 1000; // 1 phút

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        updateWidget();
        scheduleNextUpdate();
        return START_STICKY;
    }

    private void updateWidget() {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(this);
        ComponentName widgetComponent = new ComponentName(this, Widget.class);
        int[] ids = appWidgetManager.getAppWidgetIds(widgetComponent);
        if (ids.length > 0) {
            appWidgetManager.notifyAppWidgetViewDataChanged(ids, R.id.list_view);
        }
    }

    private void scheduleNextUpdate() {
        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(this, WidgetUpdateService.class);
        PendingIntent pendingIntent = PendingIntent.getService(
                this, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        long triggerAtMillis = SystemClock.elapsedRealtime() + UPDATE_INTERVAL;
        alarmManager.set(AlarmManager.ELAPSED_REALTIME, triggerAtMillis, pendingIntent);
    }
}