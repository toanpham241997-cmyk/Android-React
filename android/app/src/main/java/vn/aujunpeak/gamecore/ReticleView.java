package vn.aujunpeak.gamecore;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.view.View;
import org.json.JSONObject;

public class ReticleView extends View {
    private int color = Color.rgb(49, 242, 236);
    private String style = "precision";
    private float stroke = 2.3f;
    private boolean glow = true;
    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);

    public ReticleView(Context context) {
        super(context);
        setLayerType(View.LAYER_TYPE_SOFTWARE, null);
    }

    public void setConfig(JSONObject cfg) {
        try { color = Color.parseColor(cfg.optString("color", "#31F2EC")); }
        catch (Exception ignored) { color = Color.CYAN; }
        style = cfg.optString("type", "precision");
        stroke = Math.max(1f, Math.min(5f, (float) cfg.optDouble("line", 2.3)));
        glow = cfg.optBoolean("glow", true);
        invalidate();
    }

    private void setup(Paint.Style paintStyle, float width) {
        paint.reset();
        paint.setAntiAlias(true);
        paint.setStyle(paintStyle);
        paint.setColor(color);
        paint.setStrokeCap(Paint.Cap.ROUND);
        paint.setStrokeJoin(Paint.Join.ROUND);
        paint.setStrokeWidth(width);
        if (glow) paint.setShadowLayer(5, 0, 0, color);
    }

    private void line(Canvas c, float x1, float y1, float x2, float y2) {
        c.drawLine(x1, y1, x2, y2, paint);
    }
    private void circle(Canvas c, float r) { c.drawCircle(50, 50, r, paint); }
    private void coreDot(Canvas c, float r) {
        setup(Paint.Style.FILL, stroke);
        circle(c, r);
    }
    private void fourLines(Canvas c, float inner, float outer) {
        line(c, 50, 50 - inner, 50, 50 - outer);
        line(c, 50, 50 + inner, 50, 50 + outer);
        line(c, 50 - inner, 50, 50 - outer, 50);
        line(c, 50 + inner, 50, 50 + outer, 50);
    }

    @Override protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        int s = Math.min(getWidth(), getHeight());
        if (s <= 0) return;
        canvas.save();
        canvas.translate((getWidth() - s) / 2f, (getHeight() - s) / 2f);
        canvas.scale(s / 100f, s / 100f);
        setup(Paint.Style.STROKE, stroke);
        switch (style) {
            case "orbit":
                circle(canvas, 25);
                paint.setAlpha(130);
                circle(canvas, 33);
                paint.setAlpha(255);
                fourLines(canvas, 32, 42);
                coreDot(canvas, 3.5f);
                break;
            case "tactical":
                line(canvas, 22, 37, 22, 22); line(canvas, 22, 22, 37, 22);
                line(canvas, 63, 22, 78, 22); line(canvas, 78, 22, 78, 37);
                line(canvas, 78, 63, 78, 78); line(canvas, 78, 78, 63, 78);
                line(canvas, 37, 78, 22, 78); line(canvas, 22, 78, 22, 63);
                fourLines(canvas, 9, 21);
                coreDot(canvas, 2.5f);
                break;
            case "dot":
                paint.setAlpha(125);
                circle(canvas, 18);
                coreDot(canvas, 6);
                break;
            case "star":
                fourLines(canvas, 14, 38);
                line(canvas, 23, 23, 40, 40); line(canvas, 60, 60, 77, 77);
                line(canvas, 77, 23, 60, 40); line(canvas, 40, 60, 23, 77);
                coreDot(canvas, 3);
                break;
            case "precision":
            default:
                fourLines(canvas, 16, 37);
                coreDot(canvas, 3.7f);
                break;
        }
        canvas.restore();
    }
}
