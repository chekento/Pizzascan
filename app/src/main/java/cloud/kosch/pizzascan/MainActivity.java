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
import java.io.FileInputStream;
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
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import org.json.JSONObject;

/** Only packaged content can access the origin-scoped native message channel. */
public class MainActivity extends Activity {
    static final String ORIGIN = "https://appassets.androidplatform.net";
    static final String START_URL = ORIGIN + "/assets/index.html";
    private static final int LOCATION = 41, PICK_FILE = 42, SAVE_FILE = 43;
    private static final int MAX_OVERPASS_BYTES = 16 * 1024 * 1024;
    private static final int MAX_OVERPASS_TIMEOUT_MS = 70000;
    private static final int MIRROR_OVERPASS_TIMEOUT_MS = 30000;
    private static final String[] OVERPASS_ENDPOINTS = new String[]{
            "https://overpass-api.de/api/interpreter",
            "https://overpass.private.coffee/api/interpreter",
            "https://overpass.osm.jp/api/interpreter",
            "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
    };
    private WebView web;
    private PersistentModelStore modelStore;
    private ValueCallback<Uri[]> fileCallback;
    private Uri captureUri;
    private File captureFile;
    private static final long MAX_EXPORT_BYTES = 512L * 1024L * 1024L;
    private String pendingExport;
    private File pendingExportTemp;
    private OutputStream pendingExportStream;
    private long pendingExportBytes;
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
    private static boolean isAllowedOverpass(String endpoint) {
        if (endpoint == null) return false;
        for (String allowed : OVERPASS_ENDPOINTS) if (allowed.equals(endpoint)) return true;
        return false;
    }
    private static String readLimited(InputStream input, int limit) throws Exception {
        if (input == null) return "";
        try (InputStream in = input; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[16 * 1024];
            int total = 0, n;
            while ((n = in.read(buffer)) != -1) {
                total += n;
                if (total > limit) throw new java.io.IOException("Overpass response too large");
                out.write(buffer, 0, n);
            }
            return out.toString(StandardCharsets.UTF_8.name());
        }
    }
    private static String fetchOverpass(String endpoint, String query, int requestedTimeout) throws Exception {
        if (!isAllowedOverpass(endpoint)) throw new SecurityException("Overpass endpoint not allowed");
        if (query == null || query.isEmpty() || query.length() > 120000) throw new IllegalArgumentException("Invalid Overpass query");
        int timeout = Math.max(5000, Math.min(MAX_OVERPASS_TIMEOUT_MS, requestedTimeout));
        HttpURLConnection connection = (HttpURLConnection) new URL(endpoint).openConnection();
        try {
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(Math.min(timeout, 15000));
            connection.setReadTimeout(timeout);
            connection.setInstanceFollowRedirects(false);
            connection.setDoOutput(true);
            connection.setUseCaches(false);
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
            connection.setRequestProperty("User-Agent", "PizzaScan/" + BuildConfig.VERSION_NAME + " Android");
            byte[] body = ("data=" + URLEncoder.encode(query, "UTF-8")).getBytes(StandardCharsets.UTF_8);
            connection.setFixedLengthStreamingMode(body.length);
            try (OutputStream output = connection.getOutputStream()) { output.write(body); }
            int status = connection.getResponseCode();
            String response = readLimited(status >= 200 && status < 300 ? connection.getInputStream() : connection.getErrorStream(), MAX_OVERPASS_BYTES);
            if (status < 200 || status >= 300) throw new java.io.IOException("Overpass HTTP " + status);
            JSONObject parsed = new JSONObject(response);
            if (parsed.optJSONArray("elements") == null) throw new java.io.IOException("Invalid Overpass JSON");
            return response;
        } finally { connection.disconnect(); }
    }
    /**
     * Keep the exact WebSim query intact while making the native transport
     * independent of the availability of one Overpass host.
     */
    private static String fetchOverpassWithFailover(String preferred, String query, int requestedTimeout) throws Exception {
        String[] order = new String[OVERPASS_ENDPOINTS.length + 1];
        int count = 0;
        if (isAllowedOverpass(preferred)) order[count++] = preferred;
        for (String endpoint : OVERPASS_ENDPOINTS) {
            boolean alreadyQueued = false;
            for (int i = 0; i < count; i++) if (endpoint.equals(order[i])) {
                alreadyQueued = true;
                break;
            }
            if (!alreadyQueued) order[count++] = endpoint;
        }
        Exception last = null;
        StringBuilder failures = new StringBuilder();
        for (int i = 0; i < count; i++) {
            int timeout = i == 0
                    ? Math.min(MAX_OVERPASS_TIMEOUT_MS, Math.max(5000, requestedTimeout))
                    : MIRROR_OVERPASS_TIMEOUT_MS;
            try {
                return fetchOverpass(order[i], query, timeout);
            } catch (Exception error) {
                last = error;
                if (failures.length() > 0) failures.append(" · ");
                failures.append(new URL(order[i]).getHost()).append(": ")
                        .append(error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage());
            }
        }
        throw new java.io.IOException("Alle Overpass-Quellen fehlgeschlagen"
                + (failures.length() == 0 ? "" : ": " + failures), last);
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
    private void discardPendingExport() {
        try { if (pendingExportStream != null) pendingExportStream.close(); } catch (Exception ignored) {}
        pendingExportStream = null;
        if (pendingExportTemp != null) pendingExportTemp.delete();
        pendingExportTemp = null;
        pendingExport = null;
        pendingExportBytes = 0L;
    }

    private void handleMessage(JSONObject request) {
        try {
            switch (request.optString("type")) {
                case "setLanguage": {
                    String language = request.optString("language");
                    if (!language.matches("de|en|it|es|fr|pt|nl|pl|tr|ru|ja|zh|ko|ar")) throw new IllegalArgumentException("Unsupported language");
                    appLanguage = language;
                    break;
                }
                case "copy": {
                    ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                    clipboard.setPrimaryClip(ClipData.newPlainText(ui(R.string.review_clip), request.optString("text")));
                    break;
                }
                case "save": {
                    if (pendingExport != null || pendingExportStream != null || pendingExportTemp != null) throw new IllegalStateException("Bitte laufenden Export abschließen");
                    pendingExport = request.optString("text");
                    Intent create = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    create.addCategory(Intent.CATEGORY_OPENABLE); create.setType("application/json");
                    create.putExtra(Intent.EXTRA_TITLE, request.optString("name", "pizzascan-backup.json").replaceAll("[^a-zA-Z0-9._-]", "_"));
                    try { startActivityForResult(create, SAVE_FILE); } catch (Exception e) { pendingExport = null; throw e; }
                    break;
                }
                case "saveStart": {
                    if (pendingExport != null || pendingExportStream != null || pendingExportTemp != null) throw new IllegalStateException("Bitte laufenden Export abschließen");
                    File dir = getCacheDir();
                    if (!dir.exists() && !dir.mkdirs()) throw new java.io.IOException("Export-Speicher nicht verfügbar");
                    pendingExportTemp = File.createTempFile("pizzascan-export-", ".json", dir);
                    pendingExportStream = new FileOutputStream(pendingExportTemp);
                    pendingExportBytes = 0L;
                    Intent create = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    create.addCategory(Intent.CATEGORY_OPENABLE); create.setType("application/json");
                    create.putExtra(Intent.EXTRA_TITLE, request.optString("name", "pizzascan-backup.json").replaceAll("[^a-zA-Z0-9._-]", "_"));
                    try { startActivityForResult(create, SAVE_FILE); } catch (Exception e) { discardPendingExport(); throw e; }
                    break;
                }
                case "saveChunk": {
                    if (pendingExportStream == null) throw new IllegalStateException("Kein großer Export gestartet");
                    byte[] chunk = request.optString("chunk").getBytes(StandardCharsets.UTF_8);
                    if (pendingExportBytes + chunk.length > MAX_EXPORT_BYTES) {
                        discardPendingExport();
                        throw new IllegalStateException("Export ist größer als 512 MB");
                    }
                    pendingExportStream.write(chunk);
                    pendingExportBytes += chunk.length;
                    break;
                }
                case "saveEnd": {
                    if (pendingExportStream != null) {
                        pendingExportStream.flush();
                        pendingExportStream.close();
                        pendingExportStream = null;
                    }
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
                case "overpass": {
                    String endpoint = request.optString("endpoint");
                    String query = request.optString("query");
                    int timeout = request.optInt("timeout", 22000);
                    if (!isAllowedOverpass(endpoint) || query.isEmpty()) throw new SecurityException("Invalid Overpass request");
                    new Thread(() -> {
                        try {
                            String response = fetchOverpassWithFailover(endpoint, query, timeout);
                            runOnUiThread(() -> reply(request, response, null));
                        } catch (Exception e) {
                            runOnUiThread(() -> reply(request, "", ui(R.string.action_error) + ": " + e.getClass().getSimpleName()));
                        }
                    }, "pizzascan-overpass").start();
                    return;
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
        } catch (Exception e) { reply(request, "", ui(R.string.action_error)); }
    }

    private void openExternal(Uri uri) {
        if (uri == null || !"https".equals(uri.getScheme())) return;
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
        catch (Exception e) { toast(ui(R.string.no_browser)); }
    }
    private String ui(int id) {
        try {
            Locale locale = Locale.forLanguageTag(appLanguage == null ? "" : appLanguage);
            if (locale.getLanguage().isEmpty()) locale = Locale.getDefault();
            Configuration configuration = new Configuration(getResources().getConfiguration());
            configuration.setLocale(locale);
            return createConfigurationContext(configuration).getResources().getString(id);
        } catch (Exception ignored) { return getString(id); }
    }
    private void toast(String text) { runOnUiThread(() -> Toast.makeText(this, text, Toast.LENGTH_LONG).show()); }

    @Override public void onBackPressed() { handleBack(); }
    private void handleBack() {
        web.evaluateJavascript("window.PizzaScan?.back?.() === true", value -> {
            if (!"true".equals(value)) runOnUiThread(() -> {
                if (web.canGoBack()) web.goBack(); else finish();
            });
        });
    }
    @Override protected void onActivityResult(int code, int result, Intent data) {
        super.onActivityResult(code, result, data);
        if (code == PICK_FILE) {
            if (fileCallback != null) {
                Uri uri = result == RESULT_OK && data != null ? data.getData() : null;
                if (uri == null && result == RESULT_OK && captureUri != null) uri = captureUri;
                fileCallback.onReceiveValue(uri == null ? null : new Uri[]{uri}); fileCallback = null;
            }
            if (captureFile != null && (captureUri == null || result != RESULT_OK)) captureFile.delete();
            captureUri = null; captureFile = null;
        } else if (code == SAVE_FILE) {
            File exportTemp = pendingExportTemp;
            String exportText = pendingExport;
            try {
                if (pendingExportStream != null) {
                    pendingExportStream.close();
                    pendingExportStream = null;
                }
                if (result == RESULT_OK && data != null && (exportText != null || exportTemp != null)) {
                    try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                        if (exportTemp != null) {
                            try (InputStream in = new FileInputStream(exportTemp)) {
                                byte[] buffer = new byte[64 * 1024];
                                int count;
                                while ((count = in.read(buffer)) != -1) out.write(buffer, 0, count);
                            }
                        } else {
                            out.write(exportText.getBytes(StandardCharsets.UTF_8));
                        }
                        toast(ui(R.string.export_saved));
                    } catch (Exception e) { toast(ui(R.string.export_failed)); }
                }
            } catch (Exception e) { toast(ui(R.string.export_failed)); }
            finally {
                if (exportTemp != null) exportTemp.delete();
                pendingExportTemp = null;
                pendingExport = null;
                pendingExportBytes = 0L;
            }
        }
    }

    @Override protected void onDestroy() {
        discardPendingExport();
        if (geoCallback != null) { geoCallback.invoke(geoOrigin, false, false); geoCallback = null; }
        if (web != null) { web.stopLoading(); web.loadUrl("about:blank"); web.removeAllViews(); web.destroy(); }
        super.onDestroy();
    }
}
