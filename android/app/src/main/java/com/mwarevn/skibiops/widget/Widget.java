package com.mwarevn.skibiops.widget;

import static com.facebook.react.modules.dialog.DialogModule.ACTION_BUTTON_CLICKED;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.RemoteException;
import android.util.Log;
import android.widget.RemoteViews;
import android.widget.Toast;

import com.mwarevn.skibiops.IAppManagerService;
import com.mwarevn.skibiops.R;
import com.mwarevn.skibiops.react.modules.ServiceHolder;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Implementation of App Widget functionality.
 */
public class Widget extends AppWidgetProvider {

    public static final String EXTRA_PACKAGE_NAME = "com.mwarevn.skibiops.widget";
    public static final String ACTION_FORCE_STOP = "force_stop";
    public static final String ACTION_TOGGLE_ENABLE = "toggle_state";

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager,
                                int appWidgetId) {

        Intent intent = new Intent(context, WGService.class);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        intent.setData(Uri.parse(intent.toUri(Intent.URI_INTENT_SCHEME)));

        // Construct the RemoteViews object
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.app_leader);

        // Set remote adapter cho ListView
        views.setRemoteAdapter(R.id.list_view, intent);
        views.setEmptyView(R.id.list_view, R.id.empty_view);

        // PendingIntent template
        Intent templateIntent = new Intent(context, Widget.class);
        templateIntent.setAction(ACTION_BUTTON_CLICKED);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_MUTABLE;  // Cần cho fillInIntent trên API 31+
        }

        PendingIntent template = PendingIntent.getBroadcast(context, 0, templateIntent, flags);
        views.setPendingIntentTemplate(R.id.list_view, template);

        // Instruct the widget manager to update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        if (!ACTION_BUTTON_CLICKED.equals(intent.getAction())) return;

        String action = intent.getStringExtra("action");
        String pkg = intent.getStringExtra("packageName");
        boolean enabled = intent.getBooleanExtra("enabled", true);

        Log.d("Widget", "Received: action=" + action + ", pkg=" + pkg); // DEBUG

        if (pkg == null || action == null) {
            Log.e("Widget", "Missing extras!");
            return;
        }

        IAppManagerService service = ServiceHolder.getServiceApi();
        if (service != null) {
            executeAction(context, action, pkg, enabled);
        } else {
            WidgetShizukuBinder.bindIfNeeded(context, () -> {
                executeAction(context, action, pkg, enabled);
            });
        }
    }

    private void updateWidgetDataAfterToggle(Context context, String pkg, boolean newEnabled) {
        SharedPreferences sharedPref = context.getSharedPreferences("WIDGET_DATA", Context.MODE_PRIVATE);
        String jsonData = sharedPref.getString("list_items", "[]");

        try {
            JSONArray array = new JSONArray(jsonData);
            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.getJSONObject(i);
                if (pkg.equals(obj.getString("packageName"))) {
                    obj.put("enabled", newEnabled);
                    break;
                }
            }
            SharedPreferences.Editor editor = sharedPref.edit();
            editor.putString("list_items", array.toString());
            editor.apply();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void executeAction(Context context, String action, String pkg, boolean enabled) {
        try {
            IAppManagerService service = ServiceHolder.getServiceApi();
            if (service == null) return;

            if ("force_stop".equals(action)) {
                service.forceStopPackage(pkg);
                service.revokeAllPermissions(pkg);
                Toast.makeText(context, "Force stopped " + pkg, Toast.LENGTH_SHORT).show();
            } else if ("toggle_enable".equals(action)) {
                if (enabled) {
                    service.disablePackage(pkg);
                    updateWidgetDataAfterToggle(context, pkg, false);
                } else {
                    service.enablePackage(pkg);
                    updateWidgetDataAfterToggle(context, pkg, true);
                }
                Toast.makeText(context, enabled ? "Disabled " : "Enabled " + pkg, Toast.LENGTH_SHORT).show();
            }
        } catch (RemoteException e) {
            Toast.makeText(context, "Error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }

        updateAllWidgets(context);
    }


    private void updateAllWidgets(Context context) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(context, Widget.class));
        mgr.notifyAppWidgetViewDataChanged(ids, R.id.list_view);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onDeleted(Context context, int[] appWidgetIds) {
        // When the user deletes the widget, delete the preference associated with it.
        for (int appWidgetId : appWidgetIds) {
//            AppLeaderConfigureActivity.deleteTitlePref(context, appWidgetId);
        }
    }

    @Override
    public void onEnabled(Context context) {
        // Enter relevant functionality for when the first widget is created
    }

    @Override
    public void onDisabled(Context context) {
        super.onDisabled(context);
    }
}