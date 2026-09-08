package cloud.kosch.pizzascan;

import static org.junit.Assert.*;
import android.os.SystemClock;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class AppSmokeTest {
    private String js(ActivityScenario<MainActivity> scenario, String script) throws Exception {
        AtomicReference<String> value = new AtomicReference<>();
        CountDownLatch latch = new CountDownLatch(1);
        scenario.onActivity(a -> a.webViewForTest().evaluateJavascript(script, result -> { value.set(result); latch.countDown(); }));
        assertTrue("WebView callback timed out", latch.await(10, TimeUnit.SECONDS));
        return value.get();
    }
    private void ready(ActivityScenario<MainActivity> scenario) throws Exception {
        long deadline = SystemClock.elapsedRealtime() + 25000;
        while (SystemClock.elapsedRealtime() < deadline) {
            if ("true".equals(js(scenario, "!!window.PizzaScan?.ready"))) return;
            SystemClock.sleep(250);
        }
        fail("Packaged app did not initialize");
    }
    @Test public void packagedAppStartsAndKeepsDataAcrossRecreation() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            ready(scenario);
            assertEquals("true", js(scenario, "PizzaScan.diagnostics().native"));
            assertEquals("true", js(scenario, "!!window.L && location.protocol === 'https:'"));
            scenario.onActivity(a -> {
                assertFalse(a.webViewForTest().getSettings().getAllowFileAccess());
                assertEquals(android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW, a.webViewForTest().getSettings().getMixedContentMode());
            });
            js(scenario, "if(document.getElementById('welcome').open)document.getElementById('welcome-start').click(); document.getElementById('nav-photo').click();");
            assertEquals("true", js(scenario, "document.getElementById('photo-view').classList.contains('active')"));
            assertEquals("true", js(scenario, "PizzaScan.back()"));
            js(scenario, "document.getElementById('settings-open').click(); document.querySelector('input[value=clip16]').click(); document.getElementById('dark-mode').click(); document.getElementById('settings-save').click();");
            String dark = js(scenario,"document.body.classList.contains('dark')");
            assertEquals("true", js(scenario, "PizzaScan.diagnostics().model === 'clip16'"));
            js(scenario, "window.nativeCheck='pending';bridge('copy',{text:'PizzaScan Android Test'}).then(()=>window.nativeCheck='ok');");
            long replyDeadline = SystemClock.elapsedRealtime() + 10000;
            while (!"\"ok\"".equals(js(scenario,"window.nativeCheck")) && SystemClock.elapsedRealtime()<replyDeadline) SystemClock.sleep(200);
            assertEquals("\"ok\"", js(scenario,"window.nativeCheck"));
            scenario.recreate();
            ready(scenario);
            assertEquals(dark, js(scenario,"document.body.classList.contains('dark')"));
            assertEquals("true", js(scenario,"!document.getElementById('welcome').open"));
            assertEquals("true", js(scenario,"PizzaScan.diagnostics().model === 'clip16'"));

        }
    }
    @Test public void realLocalModelRunsInPackagedAndroidWorker() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            ready(scenario);
            try (java.io.InputStream input = androidx.test.platform.app.InstrumentationRegistry.getInstrumentation().getContext().getAssets().open("pizza.jpg")) {
                android.graphics.Bitmap source = android.graphics.BitmapFactory.decodeStream(input);
                android.graphics.Bitmap scaled = android.graphics.Bitmap.createScaledBitmap(source, 400, 300, true);
                java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream();
                scaled.compress(android.graphics.Bitmap.CompressFormat.JPEG, 85, bytes);
                String photo = "data:image/jpeg;base64," + android.util.Base64.encodeToString(bytes.toByteArray(), android.util.Base64.NO_WRAP);
                scaled.recycle(); source.recycle();
                js(scenario, "window.nativeModelResult='pending';window.nativeModelWorker=new Worker('vendor/ai-worker.js',{type:'module'});"
                    + "nativeModelWorker.onerror=e=>window.nativeModelResult='worker error: '+e.message;"
                    + "nativeModelWorker.onmessage=e=>{if(e.data.type==='error')window.nativeModelResult=e.data.message;"
                    + "if(e.data.type==='result'){window.nativeModelResult=e.data.scores.length===25&&e.data.pizzaMatch>=.35?'ok':'invalid result';nativeModelWorker.terminate();}};"
                    + "nativeModelWorker.postMessage({type:'analyze',id:'clip32',photo:" + org.json.JSONObject.quote(photo) + "});");
            }
            long deadline = SystemClock.elapsedRealtime() + 240000;
            String result;
            do { SystemClock.sleep(500); result = js(scenario, "window.nativeModelResult"); }
            while ("\"pending\"".equals(result) && SystemClock.elapsedRealtime()<deadline);
            assertEquals("Real local model must run in the packaged HTTPS WebView", "\"ok\"", result);
            js(scenario, "window.identityCheck='pending';PizzaCommunity.identity(bridge).then(k=>{localStorage.setItem('pizzascan-test-pubkey',k);window.identityCheck='ok';}).catch(()=>window.identityCheck='error');");
            long keyDeadline = SystemClock.elapsedRealtime() + 10000;
            while (!"\"ok\"".equals(js(scenario,"window.identityCheck")) && SystemClock.elapsedRealtime()<keyDeadline) SystemClock.sleep(200);
            assertEquals("\"ok\"", js(scenario,"window.identityCheck"));
            scenario.recreate(); ready(scenario);
            js(scenario, "window.identityCheck='pending';PizzaCommunity.identity(bridge).then(k=>window.identityCheck=k===localStorage.getItem('pizzascan-test-pubkey')?'ok':'changed').catch(()=>window.identityCheck='error');");
            keyDeadline = SystemClock.elapsedRealtime() + 10000;
            while (!"\"ok\"".equals(js(scenario,"window.identityCheck")) && SystemClock.elapsedRealtime()<keyDeadline) SystemClock.sleep(200);
            assertEquals("Encrypted community identity must survive activity recreation", "\"ok\"", js(scenario,"window.identityCheck"));
        }
    }

}
