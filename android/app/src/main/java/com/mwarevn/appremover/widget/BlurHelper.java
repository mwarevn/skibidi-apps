package com.mwarevn.appremover.widget;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.renderscript.Allocation;
import android.renderscript.Element;
import android.renderscript.RenderScript;
import android.renderscript.ScriptIntrinsicBlur;
import android.util.Log;

public class BlurHelper {

    private static final String TAG = "BlurHelper";

    /**
     * Blur bitmap sử dụng RenderScript
     */
    public static Bitmap blurBitmap(Context context, Bitmap bitmap, float radius) {
        if (bitmap == null) {
            Log.e(TAG, "Input bitmap is null");
            return null;
        }

        // Giới hạn radius
        if (radius < 1) radius = 1;
        if (radius > 25) radius = 25;

        Log.d(TAG, "Starting blur with radius: " + radius);
        Log.d(TAG, "Bitmap size: " + bitmap.getWidth() + "x" + bitmap.getHeight());

        // Tạo bitmap output với config ARGB_8888
        Bitmap outputBitmap = Bitmap.createBitmap(
                bitmap.getWidth(),
                bitmap.getHeight(),
                Bitmap.Config.ARGB_8888
        );

        RenderScript rs = null;
        Allocation input = null;
        Allocation output = null;
        ScriptIntrinsicBlur script = null;

        try {
            rs = RenderScript.create(context);
            Log.d(TAG, "RenderScript created");

            // Tạo Allocations
            input = Allocation.createFromBitmap(rs, bitmap,
                    Allocation.MipmapControl.MIPMAP_NONE,
                    Allocation.USAGE_SCRIPT);
            output = Allocation.createTyped(rs, input.getType());

            // Tạo blur script
            script = ScriptIntrinsicBlur.create(rs, Element.U8_4(rs));
            script.setRadius(radius);
            script.setInput(input);
            script.forEach(output);

            // Copy kết quả
            output.copyTo(outputBitmap);
            Log.d(TAG, "Blur completed successfully");

            return outputBitmap;

        } catch (Exception e) {
            Log.e(TAG, "Error during blur: " + e.getMessage(), e);
            return bitmap; // Trả về bitmap gốc nếu lỗi
        } finally {
            // Cleanup
            if (input != null) input.destroy();
            if (output != null) output.destroy();
            if (script != null) script.destroy();
            if (rs != null) rs.destroy();
        }
    }

    /**
     * Fast blur - scale down trước khi blur
     */
    public static Bitmap fastBlur(Context context, Bitmap bitmap, float radius) {
        if (bitmap == null) {
            Log.e(TAG, "Input bitmap is null");
            return null;
        }

        int originalWidth = bitmap.getWidth();
        int originalHeight = bitmap.getHeight();

        // Scale xuống để blur nhanh hơn
        int scaledWidth = originalWidth / 4;
        int scaledHeight = originalHeight / 4;

        if (scaledWidth < 1) scaledWidth = 1;
        if (scaledHeight < 1) scaledHeight = 1;

        Log.d(TAG, "Scaling from " + originalWidth + "x" + originalHeight +
                " to " + scaledWidth + "x" + scaledHeight);

        Bitmap scaled = Bitmap.createScaledBitmap(bitmap, scaledWidth, scaledHeight, true);
        Bitmap blurred = blurBitmap(context, scaled, radius);

        if (blurred == null) {
            if (scaled != bitmap) scaled.recycle();
            return bitmap;
        }

        // Scale lên lại
        Bitmap result = Bitmap.createScaledBitmap(
                blurred,
                originalWidth,
                originalHeight,
                true
        );

        // Cleanup
        if (scaled != bitmap) scaled.recycle();
        if (blurred != result) blurred.recycle();

        Log.d(TAG, "Fast blur completed");
        return result;
    }

    /**
     * Thêm overlay lên blur bitmap
     */
    public static Bitmap addOverlay(Bitmap bitmap, int overlayColor) {
        if (bitmap == null) return null;

        Bitmap result = bitmap.copy(Bitmap.Config.ARGB_8888, true);
        Canvas canvas = new Canvas(result);
        Paint paint = new Paint();
        paint.setColor(overlayColor);
        canvas.drawRect(0, 0, result.getWidth(), result.getHeight(), paint);

        return result;
    }
}