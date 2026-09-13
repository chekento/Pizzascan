package cloud.kosch.pizzascan;

import android.content.Context;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import org.json.JSONObject;

/**
 * Durable store for downloaded model files.
 *
 * Files live below filesDir/offline-models instead of cacheDir/WebView cache, so ordinary
 * Android cache cleanup does not remove them. They disappear only when PizzaScan explicitly
 * clears them, app data is reset, or the app is uninstalled.
 */
final class PersistentModelStore {
    private static final long INSTALLED_THRESHOLD = 50L * 1024L * 1024L;
    private final File dir;

    PersistentModelStore(Context context) {
        dir = new File(context.getFilesDir(), "offline-models");
        if (!dir.exists()) dir.mkdirs();
        cleanupParts();
    }

    WebResourceResponse intercept(WebResourceRequest request) {
        if (!"GET".equalsIgnoreCase(request.getMethod())) return null;
        Uri uri = request.getUrl();
        if (!isModelUri(uri)) return null;
        try {
            return open(uri);
        } catch (Exception ignored) {
            // Let WebView perform its normal network request if the durable layer cannot.
            return null;
        }
    }

    JSONObject status(String repo) {
        long bytes = 0L;
        int files = 0;
        String needle = repo == null ? "" : repo.toLowerCase(Locale.ROOT);
        File[] metas = dir.listFiles((d, name) -> name.endsWith(".json"));
        if (metas != null) for (File meta : metas) {
            try {
                JSONObject m = new JSONObject(readText(meta));
                String url = m.optString("url").toLowerCase(Locale.ROOT);
                if (!needle.isEmpty() && !url.contains(needle)) continue;
                String base = meta.getName().substring(0, meta.getName().length() - 5);
                File data = new File(dir, base + ".data");
                if (data.isFile() && data.length() > 0) {
                    bytes += data.length();
                    files++;
                }
            } catch (Exception ignored) { }
        }
        JSONObject out = new JSONObject();
        try {
            out.put("bytes", bytes);
            out.put("files", files);
            out.put("installed", bytes >= INSTALLED_THRESHOLD);
            out.put("persistent", true);
        } catch (Exception ignored) { }
        return out;
    }

    void clearAll() {
        File[] files = dir.listFiles();
        if (files != null) for (File f : files) f.delete();
    }

    private WebResourceResponse open(Uri uri) throws Exception {
        String url = uri.toString();
        String key = sha256(url);
        File data = new File(dir, key + ".data");
        File meta = new File(dir, key + ".json");
        if (data.isFile() && data.length() > 0) return cached(data, meta, uri);

        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setInstanceFollowRedirects(true);
        connection.setConnectTimeout(20000);
        connection.setReadTimeout(120000);
        connection.setRequestMethod("GET");
        connection.setRequestProperty("Accept", "*/*");
        connection.setRequestProperty("Accept-Encoding", "identity");
        connection.setRequestProperty("User-Agent", "PizzaScan persistent offline model store");
        connection.connect();

        int code = connection.getResponseCode();
        String reason = connection.getResponseMessage();
        String mime = cleanMime(connection.getContentType(), uri);
        long expected = connection.getContentLengthLong();
        Map<String, String> headers = responseHeaders(expected);

        if (code < 200 || code >= 300) {
            InputStream error = connection.getErrorStream();
            if (error == null) error = new ByteArrayInputStream(new byte[0]);
            return new WebResourceResponse(mime, encodingFor(mime), code,
                    reason == null ? "Network error" : reason, headers,
                    new DisconnectingInputStream(error, connection));
        }

        InputStream input = new BufferedInputStream(connection.getInputStream());
        if (code != 200) {
            return new WebResourceResponse(mime, encodingFor(mime), code,
                    reason == null ? "OK" : reason, headers,
                    new DisconnectingInputStream(input, connection));
        }

        File temp = File.createTempFile(key + "-", ".part", dir);
        FileOutputStream output = new FileOutputStream(temp);
        InputStream tee = new DurableTeeInputStream(input, output, connection, temp, data, meta,
                url, mime, expected);
        return new WebResourceResponse(mime, encodingFor(mime), 200,
                reason == null ? "OK" : reason, headers, tee);
    }

    private WebResourceResponse cached(File data, File meta, Uri uri) throws Exception {
        String mime = cleanMime(null, uri);
        if (meta.isFile()) {
            try { mime = new JSONObject(readText(meta)).optString("mime", mime); }
            catch (Exception ignored) { }
        }
        Map<String, String> headers = responseHeaders(data.length());
        headers.put("X-PizzaScan-Model-Storage", "persistent");
        return new WebResourceResponse(mime, encodingFor(mime), 200, "OK", headers,
                new FileInputStream(data));
    }

    private static boolean isModelUri(Uri uri) {
        if (uri == null || !"https".equalsIgnoreCase(uri.getScheme())) return false;
        String host = uri.getHost();
        if (host == null) return false;
        host = host.toLowerCase(Locale.ROOT);
        return host.equals("huggingface.co") || host.endsWith(".huggingface.co") || host.endsWith(".hf.co");
    }

    private static Map<String, String> responseHeaders(long length) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Cross-Origin-Resource-Policy", "cross-origin");
        headers.put("Cache-Control", "no-store");
        if (length >= 0) headers.put("Content-Length", Long.toString(length));
        return headers;
    }

    private static String cleanMime(String contentType, Uri uri) {
        if (contentType != null && !contentType.isEmpty()) {
            int semicolon = contentType.indexOf(';');
            return (semicolon < 0 ? contentType : contentType.substring(0, semicolon)).trim();
        }
        String path = uri == null ? "" : uri.getPath();
        if (path == null) path = "";
        path = path.toLowerCase(Locale.ROOT);
        if (path.endsWith(".json")) return "application/json";
        if (path.endsWith(".txt") || path.endsWith(".model")) return "text/plain";
        if (path.endsWith(".onnx") || path.endsWith(".bin") || path.endsWith(".safetensors")) return "application/octet-stream";
        return "application/octet-stream";
    }

    private static String encodingFor(String mime) {
        return mime != null && (mime.startsWith("text/") || mime.contains("json")) ? "UTF-8" : null;
    }

    private static String sha256(String value) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        StringBuilder out = new StringBuilder(64);
        for (byte b : digest) out.append(String.format(Locale.ROOT, "%02x", b));
        return out.toString();
    }

    private static String readText(File file) throws IOException {
        byte[] data = new byte[(int) Math.min(file.length(), 1024 * 1024)];
        int offset = 0;
        try (InputStream input = new FileInputStream(file)) {
            while (offset < data.length) {
                int n = input.read(data, offset, data.length - offset);
                if (n < 0) break;
                offset += n;
            }
        }
        return new String(data, 0, offset, StandardCharsets.UTF_8);
    }

    private void cleanupParts() {
        File[] parts = dir.listFiles((d, name) -> name.endsWith(".part"));
        if (parts != null) for (File part : parts) part.delete();
    }

    private static final class DisconnectingInputStream extends FilterInputStream {
        private final HttpURLConnection connection;
        DisconnectingInputStream(InputStream input, HttpURLConnection connection) {
            super(input); this.connection = connection;
        }
        @Override public void close() throws IOException {
            try { super.close(); } finally { connection.disconnect(); }
        }
    }

    private static final class DurableTeeInputStream extends FilterInputStream {
        private final FileOutputStream output;
        private final HttpURLConnection connection;
        private final File temp, data, meta;
        private final String url, mime;
        private final long expected;
        private long copied = 0L;
        private boolean finished = false, eof = false;

        DurableTeeInputStream(InputStream input, FileOutputStream output, HttpURLConnection connection,
                              File temp, File data, File meta, String url, String mime, long expected) {
            super(input); this.output = output; this.connection = connection; this.temp = temp;
            this.data = data; this.meta = meta; this.url = url; this.mime = mime; this.expected = expected;
        }

        @Override public int read() throws IOException {
            int value = super.read();
            if (value >= 0) { output.write(value); copied++; }
            else { eof = true; finishIfComplete(); }
            return value;
        }

        @Override public int read(byte[] buffer, int off, int len) throws IOException {
            int count = super.read(buffer, off, len);
            if (count > 0) { output.write(buffer, off, count); copied += count; }
            else if (count < 0) { eof = true; finishIfComplete(); }
            return count;
        }

        private boolean complete() { return eof || (expected >= 0 && copied == expected); }

        private void finishIfComplete() throws IOException {
            if (finished || !complete()) return;
            finished = true;
            output.flush();
            output.getFD().sync();
            output.close();
            if (data.exists()) temp.delete();
            else if (!temp.renameTo(data)) {
                try (InputStream in = new FileInputStream(temp); FileOutputStream out = new FileOutputStream(data)) {
                    byte[] buf = new byte[64 * 1024];
                    for (int n; (n = in.read(buf)) >= 0;) if (n > 0) out.write(buf, 0, n);
                    out.getFD().sync();
                }
                temp.delete();
            }
            JSONObject info = new JSONObject();
            try {
                info.put("url", url); info.put("mime", mime); info.put("bytes", data.length());
                info.put("savedAt", System.currentTimeMillis());
                try (FileOutputStream out = new FileOutputStream(meta)) {
                    out.write(info.toString().getBytes(StandardCharsets.UTF_8)); out.getFD().sync();
                }
            } catch (Exception ignored) { }
        }

        @Override public void close() throws IOException {
            try {
                if (!finished) {
                    if (complete()) finishIfComplete();
                    else { try { output.close(); } finally { temp.delete(); } }
                }
            } finally {
                try { super.close(); } finally { connection.disconnect(); }
            }
        }
    }
}
