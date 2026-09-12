package cloud.kosch.pizzascan;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.res.Configuration;
import java.util.Locale;
import android.util.Base64;
import java.io.FileOutputStream;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import org.json.JSONObject;

/** Only packaged content can access the origin-scoped native message channel. */
public class MainActivity extends Activity {
    static final String ORIGIN = "https://appassets.androidplatform.net";
    static final String START_URL = ORIGIN + "/assets/index.html";
    private static final int LOCATION = 41, PICK_FILE = 42, SAVE_FILE = 43;
    private WebView web;
    private PersistentModelStore modelStore;
    private ValueCallback<Uri[]> fileCallback;
    private Uri captureUri;
    private File captureFile;
    private String pendingExport;
    private GeolocationPermissions.Callback geoCallback;
    private String geoOrigin;
    private volatile String appLanguage = Locale.getDefault().getLanguage();

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        modelStore = new PersistentModelStore(this);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(255, 249, 246));
        web = new WebView(this);
        web.setId(View.generateViewId());
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return insets;
        });
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // User-selected document/photo URIs only.
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setUserAgentString(settings.getUserAgentString()
                + " PizzaScan/" + BuildConfig.VERSION_NAME + " (+https://github.com/chekento/Pizzascan)");
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse model = modelStore.intercept(request);
                if (model != null) return model;
                WebResourceResponse result = loader.shouldInterceptRequest(request.getUrl());
                if (result != null) {
                    String path = request.getUrl().getPath();
                    if (path != null && path.endsWith(".mjs")) result.setMimeType("application/javascript");
                    if (path != null && path.endsWith(".wasm")) result.setMimeType("application/wasm");
                }
                if (result == null && isLocal(request.getUrl())) {
                    return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found",
                            Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
                }
                return result;
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (isLocal(request.getUrl())) return false;
                if (request.isForMainFrame() && request.hasGesture()) openExternal(request.getUrl());
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (!ORIGIN.equals(origin) && !(ORIGIN + "/").equals(origin)) {
                    callback.invoke(origin, false, false);
                    return;
                }
                if (hasLocationPermission()) {
                    callback.invoke(origin, true, false);
                } else {
                    if (geoCallback != null) geoCallback.invoke(geoOrigin, false, false);
                    geoOrigin = origin;
                    geoCallback = callback;
                    requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION}, LOCATION);
                }
            }
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                                       FileChooserParams params) {
                if (!START_URL.equals(view.getUrl())) { callback.onReceiveValue(null); return true; }
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                captureUri = null;
                Intent pick = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                pick.addCategory(Intent.CATEGORY_OPENABLE);
                boolean image = false;
                for (String type : params.getAcceptTypes()) if (type.startsWith("image/")) image = true;
                pick.setType(image ? "image/*" : "application/json");
                pick.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                Intent chooser = Intent.createChooser(pick, image ? ui(R.string.pick_photo) : ui(R.string.import_json));
                if (image) {
                    try {
                        File dir = new File(getCacheDir(), "photos");
                        if (!dir.exists() && !dir.mkdirs()) throw new java.io.IOException("Photo directory unavailable");
                        File[] old = dir.listFiles();
                        if (old != null) for (File f : old) if (System.currentTimeMillis() - f.lastModified() > 86400000) f.delete();
                        captureFile = File.createTempFile("pizza-", ".jpg", dir);
                        captureUri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".files", captureFile);
                        Intent camera = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                        camera.putExtra(MediaStore.EXTRA_OUTPUT, captureUri);
                        camera.setClipData(ClipData.newRawUri("Pizza photo", captureUri));
                        camera.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        if (camera.resolveActivity(getPackageManager()) != null) {
                            chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{camera});
                            if (params.isCaptureEnabled()) chooser = camera;
                        }
                    } catch (Exception e) { captureUri = null; }
                }
                try { startActivityForResult(chooser, PICK_FILE); }
                catch (Exception e) { fileCallback.onReceiveValue(null); fileCallback = null; toast(ui(R.string.no_picker)); }
                return true;
            }
        });
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(web, "PizzaScanNative", Collections.singleton(ORIGIN),
                    (view, message, sourceOrigin, isMainFrame, reply) -> {
                        if (!isMainFrame || !ORIGIN.equals(sourceOrigin.toString())) return;
                        String data = message.getData();
                        if (data == null || data.length() > 4 * 1024 * 1024) return;
                        try {
                            JSONObject request = new JSONObject(data);
                            runOnUiThread(() -> handleMessage(request));
                        } catch (Exception e) { toast(ui(R.string.request_error)); }
                    });
        }
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::handleBack);
        }
        web.loadUrl(START_URL);
    }

    private static boolean isLocal(Uri uri) {
        return "https".equals(uri.getScheme()) && "appassets.androidplatform.net".equals(uri.getHost())
                && (uri.getPort() == -1 || uri.getPort() == 443);
    }
    private boolean hasLocationPermission() {
        return checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }
    @Override public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code == LOCATION && geoCallback != null) {
            geoCallback.invoke(geoOrigin, hasLocationPermission(), false);
            geoCallback = null;
            geoOrigin = null;
        }
    }
    private void reply(JSONObject request, String value, String error) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("id", request.optString("id"));
            payload.put("value", value);
            if (error != null) payload.put("error", error);
            web.evaluateJavascript("window.PizzaScanBridge?.reply(" + payload + ")", null);
        } catch (Exception e) { toast(ui(R.string.reply_error)); }
    }
    private void handleMessage(JSONObject request) {
        try {
            switch (request.optString("type")) {
                case "setLanguage": {
                    String language = request.optString("language");
                    if (!language.matches("de|en|it|es|fr")) throw new IllegalArgumentException("Unsupported language");
                    appLanguage = language;
                    break;
                }
                case "copy": {
                    ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                    clipboard.setPrimaryClip(ClipData.newPlainText(ui(R.string.review_clip), request.optString("text")));
                    break;
                }
                case "save": {
                    if (pendingExport != null) throw new IllegalStateException("Bitte laufenden Export abschließen");
                    pendingExport = request.optString("text");
                    Intent create = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    create.addCategory(Intent.CATEGORY_OPENABLE); create.setType("application/json");
                    create.putExtra(Intent.EXTRA_TITLE, request.optString("name", "pizzascan-backup.json").replaceAll("[^a-zA-Z0-9._-]", "_"));
                    try { startActivityForResult(create, SAVE_FILE); } catch (Exception e) { pendingExport = null; throw e; }
                    break;
                }
                case "sharePhoto": {
                    String photo = request.optString("photo");
                    if (!photo.startsWith("data:image/jpeg;base64,")) throw new IllegalArgumentException("Ungültiges Foto");
                    File dir = new File(getCacheDir(), "photos");
                    if (!dir.exists() && !dir.mkdirs()) throw new java.io.IOException("Fotospeicher nicht verfügbar");
                    File file = File.createTempFile("pizza-share-", ".jpg", dir);
                    try (FileOutputStream stream = new FileOutputStream(file)) { stream.write(Base64.decode(photo.substring(23), Base64.DEFAULT)); }
                    Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".files", file);
                    Intent share = new Intent(Intent.ACTION_SEND).setType("image/jpeg");
                    share.putExtra(Intent.EXTRA_STREAM, uri); share.putExtra(Intent.EXTRA_TEXT, request.optString("text"));
                    share.setClipData(ClipData.newUri(getContentResolver(), "Pizzafoto", uri));
                    share.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivity(Intent.createChooser(share, ui(R.string.share_photo)));
                    break;
                }
                case "modelStorageStatus": {
                    reply(request, modelStore.status(request.optString("repo")).toString(), null);
                    return;
                }
                case "clearModelStorage": modelStore.clearAll(); break;
                case "open": openExternal(Uri.parse(request.optString("url"))); break;
                default: throw new IllegalArgumentException("Unbekannte Android-Aktion");
            }
            reply(request, "ok", null);
        } catch (Exception e) { reply(request, "", ui(R.string.action_error) + ": " + e.getClass().getSimpleName()); }
    }
    private void openExternal(Uri uri) {
        String scheme = uri.getScheme();
        if (!("https".equals(scheme) || "http".equals(scheme) || "tel".equals(scheme) || "geo".equals(scheme))) return;
        if (("https".equals(scheme) || "http".equals(scheme)) && (uri.getHost() == null || isLocal(uri))) return;
        try { startActivity(new Intent("tel".equals(scheme) ? Intent.ACTION_DIAL : Intent.ACTION_VIEW, uri)); }
        catch (Exception e) { toast(ui(R.string.no_link_app)); }
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == PICK_FILE && fileCallback != null) {
            Uri[] uris = null;
            if (result == RESULT_OK) {
                if (data != null && data.getData() != null) uris = new Uri[]{data.getData()};
                else if (captureUri != null && captureFile != null && captureFile.length() > 0) uris = new Uri[]{captureUri};
            }
            fileCallback.onReceiveValue(uris);
            fileCallback = null;
            captureUri = null;
        }
        if (request == SAVE_FILE) {
            String text = pendingExport;
            pendingExport = null;
            if (result == RESULT_OK && data != null && data.getData() != null && text != null) {
                Uri uri = data.getData();
                new Thread(() -> {
                    try (OutputStream output = getContentResolver().openOutputStream(uri, "wt")) {
                        if (output == null) throw new java.io.IOException("No output stream");
                        output.write(text.getBytes(StandardCharsets.UTF_8));
                        toast(ui(R.string.export_saved));
                    } catch (Exception e) { toast(ui(R.string.export_error)); }
                }, "pizzascan-export").start();
            }
        }
    }
    private void handleBack() {
        web.evaluateJavascript("window.PizzaScan ? window.PizzaScan.back() : false", consumed -> {
            if (!"true".equals(consumed)) new AlertDialog.Builder(this)
                    .setTitle(ui(R.string.exit_title)).setMessage(ui(R.string.exit_message))
                    .setPositiveButton(ui(R.string.exit_close), (d, w) -> finish()).setNegativeButton(ui(R.string.exit_stay), null).show();
        });
    }
    @SuppressWarnings("deprecation") @Override public void onBackPressed() { handleBack(); }
    private String ui(int resource) {
        Configuration config = new Configuration(getResources().getConfiguration());
        config.setLocale(Locale.forLanguageTag(appLanguage.matches("de|en|it|es|fr") ? appLanguage : "de"));
        return createConfigurationContext(config).getString(resource);
    }
    private void toast(String text) { runOnUiThread(() -> Toast.makeText(this, text, Toast.LENGTH_LONG).show()); }
    @Override protected void onPause() { web.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override protected void onDestroy() {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        if (geoCallback != null) geoCallback.invoke(geoOrigin, false, false);
        web.stopLoading();
        web.destroy();
        super.onDestroy();
    }
    WebView webViewForTest() { return web; }
}
