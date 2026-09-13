PizzaScan persistent offline model storage

Goal: model files downloaded from Hugging Face are stored in Android app filesDir, not ordinary WebView cache. They survive normal cache cleanup and are removed only by explicit model removal, app data reset, or uninstall.

Implementation branch marker.
