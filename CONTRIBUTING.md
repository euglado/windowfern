# Contributing / Katkı

Use Node.js 24, then `npm ci --ignore-scripts`, `npm run check` and `npm audit --audit-level=low`. Include regression tests for time arithmetic, privacy or permission changes. Keep dependencies pinned and do not disable checks to make a change pass. The three-OS GitHub Actions workflow must pass.

Node.js 24 kullanın; `npm ci --ignore-scripts`, `npm run check` ve `npm audit --audit-level=low` çalıştırın. Zaman, gizlilik veya izin değişikliklerine regresyon testi ekleyin. Bağımlılık sürümlerini sabit tutun; kontrolleri kapatmayın. Üç işletim sisteminin CI kontrolleri geçmeli.

Open an issue describing the observed behavior and expected result with synthetic dates. Do not attach tokens, private availability, `.env`, real server/member IDs or raw Discord interaction payloads. Discuss features before adding storage, privileged intents, new permissions, external requests or reminders. Keep the Turkish and English documentation consistent.

Issue açarken gözlenen ve beklenen davranışı kurgu tarihlerle açıklayın. Token, özel uygunluk verisi, `.env`, gerçek sunucu/üye kimlikleri veya ham Discord etkileşimleri paylaşmayın. Depolama, ayrıcalıklı intent, yeni izin, dış istek veya hatırlatma eklemeden önce tartışma açın. Türkçe ve İngilizce belgeleri birlikte güncelleyin.
