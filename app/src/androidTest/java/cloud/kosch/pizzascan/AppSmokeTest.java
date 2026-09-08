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
            assertEquals("true", js(scenario, "document.getElementById('settings-popup-overlay').style.display === 'flex'"));
            js(scenario, "document.getElementById('deny-location').click(); document.getElementById('dock-menu').click(); document.getElementById('ratings-database-button').click();");
            assertEquals("true", js(scenario, "document.getElementById('ratings-database-area').style.display === 'flex'"));
            assertEquals("true", js(scenario, "PizzaScan.back()"));
            js(scenario, "document.getElementById('theme-toggle').click()");
            String dark = js(scenario,"document.body.classList.contains('dark-mode')");
            scenario.recreate();
            ready(scenario);
            assertEquals(dark, js(scenario,"document.body.classList.contains('dark-mode')"));
            assertEquals("true",js(scenario,"document.getElementById('settings-popup-overlay').style.display === 'none'"));
        }
    }
}
