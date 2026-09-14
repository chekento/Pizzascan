# PizzaScan APK-Archiv

Hier bleiben die im Repository erhaltenen technischen PizzaScan-Test-APKs für Regressionstests, Gerätevergleiche und Fehlersuche direkt herunterladbar.

> Diese Dateien sind **technische Vorab-APKs**. Sie sind nicht die spätere, über den geschlossenen Google-Play-Test verteilte Tester-App.

| Version | Status | Größe | SHA-256 | Download |
|---|---|---:|---|---|
| **2.3.4 · Build 24** | aktueller Release-Kandidat | wird nach grünem CI-Lauf eingetragen | [aktuelle Prüfsumme](SHA256SUMS-2.3.4.txt) | [⬇️ APK](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.4-Test.apk) · [Checksum](SHA256SUMS-2.3.4.txt) |
| **2.3.3** | Archiv / Maintenance-Line | ca. 14,6 MB | [Prüfsumme](SHA256SUMS-2.3.3.txt) | [⬇️ APK](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.3-Test.apk) · [Checksum](SHA256SUMS-2.3.3.txt) |
| **2.3.2** | Archiv / Regression | 14.545.568 Byte | `3743978624aa52a624ab5eb4be6e4de35660ad94a84fb85a63fd55cee82229a0` | [⬇️ APK](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.2-Test.apk) · [Checksum](SHA256SUMS-2.3.2.txt) |
| **2.3.1** | Archiv / Regression | 14.531.796 Byte | `c56223cf985dfc189d5946edd38fc316ad3538c6059f393599a300ab6f198f71` | [⬇️ APK](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.1-Test.apk) · [Checksum](SHA256SUMS-2.3.1.txt) |
| **2.3.0** | Archiv / 2.3-Basisstand | 12.141.121 Byte | `d2576f346d9b3ec3a0970c73eb64a7fea30e7718e0b8ec8cb5c4c5ff4815b4a8` | [⬇️ APK](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.0-Test.apk) · [Archiv-Checksums](SHA256SUMS.txt) |

## Welche Version sollte ich installieren?

Für normale Tests nach erfolgreicher CI-Veröffentlichung immer die **neueste 2.3.4-Test-APK** verwenden. 2.3.3 und ältere Versionen sind vor allem sinnvoll, wenn ein Verhalten mit einem früheren Stand verglichen werden soll – beispielsweise POI-Menge, Kartenmarker, Suche, Filter oder Ratings.

## Wichtiger Downgrade-Hinweis

Android akzeptiert normalerweise kein APK mit niedrigerem `versionCode` als Update über eine bereits installierte neuere Version. Für einen Rücktest kann deshalb eine Deinstallation der aktuellen Test-App nötig sein.

**Vor einer Deinstallation:** persönliche PizzaScan-Daten exportieren bzw. sichern. App-lokale Daten, Review-Entwürfe und heruntergeladene Offline-Modelle können beim Entfernen der App verloren gehen.

## Prüfsummen

Für den aktuellen 2.3.4-Release-Kandidaten ist nach Veröffentlichung [SHA256SUMS-2.3.4.txt](SHA256SUMS-2.3.4.txt) maßgeblich. Die archivierte 2.3.3-APK behält ihre eigene Prüfsummendatei [SHA256SUMS-2.3.3.txt](SHA256SUMS-2.3.3.txt).

Die zentrale Datei [SHA256SUMS.txt](SHA256SUMS.txt) enthält die festen Prüfsummen der archivierten Versionen 2.3.0–2.3.2. Unter Android/Linux kann eine heruntergeladene Datei beispielsweise mit `sha256sum <Datei.apk>` geprüft werden.

## Versionshistorie

Das ausführliche Changelog befindet sich im Repository unter [../CHANGELOG.md](../CHANGELOG.md).
