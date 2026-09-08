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
}
