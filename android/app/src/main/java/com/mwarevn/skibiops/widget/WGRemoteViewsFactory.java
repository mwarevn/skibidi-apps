package com.mwarevn.skibiops.widget;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.util.Base64;
import android.util.Log;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import com.mwarevn.skibiops.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class WGRemoteViewsFactory implements RemoteViewsService.RemoteViewsFactory{

    private Context context;
    private List<String> items = new ArrayList<>();

    public WGRemoteViewsFactory(Context applicationContext, Intent intent) {
        this.context = applicationContext;
    }

    @Override
    public int getCount() {
        return items.size();
    }

    @Override
    public long getItemId(int i) {
        return i;
    }

    @Override
    public RemoteViews getLoadingView() {
        return new RemoteViews(context.getPackageName(), com.facebook.react.R.layout.dev_loading_view);
    }

    private String getCurrentJsonData() {
        SharedPreferences sharedPref = context.getSharedPreferences("WIDGET_DATA", Context.MODE_PRIVATE);
        return sharedPref.getString("list_items", "[]");
    }
    private void loadDataFromJson() {
        String jsonData = getCurrentJsonData();
        Log.d("WGFactory", "loadDataFromJson: " + jsonData);

        try {
            JSONArray array = new JSONArray(jsonData);
            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.getJSONObject(i);
                items.add(obj.optString("appName", "Unknown"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // Trong getViewAt
    @Override
    public RemoteViews getViewAt(int position) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_item);

        try {
            JSONArray array = new JSONArray(getCurrentJsonData());
            if (position >= array.length()) return views;

            JSONObject obj = array.getJSONObject(position);
            String pkg = obj.getString("packageName");
            boolean enabled = obj.optBoolean("enabled", true);
            String iconBase64 = obj.getString("iconBase64");


            // set icon, appName
            byte[] decodedBytes = Base64.decode(iconBase64, Base64.DEFAULT);
            Bitmap decodedBitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);
            views.setImageViewBitmap(R.id.item_icon, decodedBitmap);
            views.setTextViewText(R.id.item_title, items.get(position));

            // Force Stop
            Intent forceStopFillIn = new Intent();
            forceStopFillIn.putExtra("action", "force_stop");
            forceStopFillIn.putExtra("packageName", pkg);
            forceStopFillIn.putExtra("enabled", enabled);
            forceStopFillIn.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, position);  // ← ĐÚNG KEY
            views.setOnClickFillInIntent(R.id.btnForceStop, forceStopFillIn);

            if (enabled) {
                views.setTextViewText(R.id.btnToggleState, "Disable");
                views.setTextColor(R.id.btnToggleState, Color.parseColor("#fc0313"));
            } else {
                views.setTextViewText(R.id.btnToggleState, "Enable");
                views.setTextColor(R.id.btnToggleState, Color.parseColor("#0473c2"));
            }
            // Toggle
            Intent toggleFillIn = new Intent();
            toggleFillIn.putExtra("action", "toggle_enable");
            toggleFillIn.putExtra("packageName", pkg);
            toggleFillIn.putExtra("enabled", enabled);
            toggleFillIn.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, position);  // ← ĐÚNG KEY
            views.setOnClickFillInIntent(R.id.btnToggleState, toggleFillIn);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return views;
    }

    @Override
    public int getViewTypeCount() {
        return 1;
    }

    @Override
    public boolean hasStableIds() {
        return true;
    }

    @Override
    public void onCreate() {
        loadDataFromJson();
    }

    @Override
    public void onDataSetChanged() {
        items.clear();
        onCreate();
    }

    @Override
    public void onDestroy() {
        items.clear();
    }
}