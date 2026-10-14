# WindowFern

Find a shared meeting window in Discord without publishing everyone's separate schedule. / Discord'da herkesin ayrı programını yayımlamadan ortak zaman bulun.

**[Türkçe](#türkçe) · [English](#english)**

## Türkçe

### Amaç ve özellikler

WindowFern; oyun, çalışma ve gönüllü toplulukları için gerçek bir Discord Gateway botudur. `/windowfern` komutu bir form açar. 2–6 kişinin gönüllü olarak verdiği, açık UTC farkı içeren tarih aralıklarını karşılaştırır. İstenen süreye uygun ortak aralık varsa tüm paylaşılacak metni özel önizlemede gösterir. **Ortak aralığı paylaş** düğmesi yalnızca ortak başlangıç, bitiş, süre, aralık sayısı ve etkinlik başlığını mevcut kanala yollar. **Vazgeç** hiçbir şey yayımlamaz.

Türkçe/İngilizce arayüz, tıklanabilir onay, görüntüleyenin saat dilimindeki Discord zaman damgaları ve anlaşılır doğrulama mesajları vardır. Ortak aralık yeterince uzun değilse paylaşım düğmesi oluşmaz. Katılımcı isimleri veya ayrı uygunluk satırları kamuya açık sonuca eklenmez.

Bot takvim bağlamaz, randevu ayırmaz, kayıt toplamaz, katılımcı onayını doğrulamaz, hatırlatma/DM yollamaz, ses kanalına girmez ve mesajları okumaz. Bir kişinin birden fazla uygunluk aralığını birleştirmez: **her satır tek kişinin tek kesintisiz aralığıdır**. Ayrı gruplar için ayrı hesap yapın. Sonuç bir öneridir; rezervasyon veya yoklama değildir.

### Gereksinimler

- [Node.js 24 LTS](https://nodejs.org/en/download) ve birlikte gelen npm; Windows, macOS veya Linux.
- Kendi Discord hesabınız, yeni bir Discord uygulaması ve bot tokenı.
- Botu sunucuya ekleyebilmek için Sunucuyu Yönet yetkisi; kullanılacak kanalda gerekli izinler.
- İnternet erişimi ve kullanım boyunca açık kalan tek bir bilgisayar/işlem. GitHub deposu botu barındırmaz. Ücretli hizmet zorunlu değildir; kendi barındırmanızın maliyetini siz belirlersiniz.

### Developer Portal kurulumu

1. [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**; bir isim seçin. Bu bot için ayrı uygulama kullanın.
2. **General Information** bölümünden **Application ID** değerini alın. Bu bir token değildir.
3. **Bot** sayfasında bot kullanıcısını oluşturun/görüntüleyin; **Reset Token** ile token üretin. Tokenı parola gibi saklayın. Issue, ekran görüntüsü, sohbet veya Git'e koymayın. Sızarsa hemen sıfırlayın. **Public Bot** ayarını diğer sunuculara kurulmasını istemiyorsanız kapatabilirsiniz; kaynak deponun public olması bu ayarı zorunlu kılmaz.
4. **Privileged Gateway Intents** içindeki Presence, Server Members ve Message Content anahtarlarını **kapalı** bırakın. Bot yalnızca ayrıcalıksız `Guilds` intent kullanır.
5. **Installation** bölümünde **Guild Install** seçin; `bot` ve `applications.commands` kapsamlarını, yalnızca **View Channels** ve **Send Messages** izinlerini seçin. Administrator vermeyin. Bu uygulama sunucuya kurulur; User Install/DM akışı yoktur.
6. Discord **User Settings → Advanced → Developer Mode** açın. Sunucu adına sağ tıklayın → **Copy Server ID**. Bu değeri kurulumda kullanın.
7. Portalda **Interactions Endpoint URL** tanımlamayın; uygulama Gateway üzerinden çalışır. Uygulamanın aynı komutlarını yöneten başka bir bot işlemi çalıştırmayın.

### İndirme, kurulum ve çalıştırma

Bu sayfada **Code → Download ZIP** seçin ve arşivi kendi klasörünüze çıkarın. Terminali bu klasörde açın. Kod dosyalarını değiştirmeniz gerekmez.

**Windows:** klasörde `setup.cmd` çalıştırın. Sorun olursa PowerShell/Komut İstemi içinden çalıştırın; Node.js kurulumu sonrasında terminali yeniden açın. Yardımcı dosya bağımlılıkları kilitli sürümlerden kurar, derler ve soruları sorar.

**macOS/Linux:** Terminalde `bash setup.sh` çalıştırın. Çalıştırılabilir dosya izni ayarlamanız gerekmez.

Her sistemde aynı adımlar elle de kullanılabilir:

```sh
npm ci --ignore-scripts
npm run build
npm run setup
```

Kurulum tokenı **ekranda göstermeden** alır; ardından Application ID ve Server ID ister. Ctrl+C ile iptal edin. Yerel `.env` dosyasını oluşturur, mevcut `.env` üzerine yazmaz. Ekrandaki davet bağlantısını açın ve doğru sunucuya botu kurun. Link token içermez; istenen izin sayısı `3072` (Kanalı Görüntüle + Mesaj Gönder).

Sonra `register.cmd` veya `bash register.sh` (ya da `npm run register`) ile `/windowfern` komutunu sunucunuza kaydedin. Kayıt yalnızca bu komutu ekler/günceller; uygulamanın diğer komutlarını topluca silmez. Son olarak `start.cmd`, `bash start.sh` veya `npm start` kullanın. Terminalde “WindowFern bağlandı” mesajını bekleyin. Başarılı başlatma tokenı göstermez.

### Yapılandırma ve botu açık tutma

Gerekli üç ayar `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID`, `DISCORD_GUILD_ID` değerleridir. Sihirbaz bunları `.env` içine yazar; kaynak kod düzenlemeniz gerekmez. Hosting hizmetinde aynı isimli gizli ortam değişkenleri kullanabilirsiniz; ortam değerleri `.env` üzerine önceliklidir. Aynı uygulama ve sunucu için yalnızca bir işlem çalıştırın. Tokenı veya sunucuyu değiştirmek için botu durdurun, eski `.env` dosyasını güvenli şekilde kaldırın ve sihirbazı yeniden çalıştırın; token sızdıysa Portal'da sıfırlayın. Yeni sunucuda komut kaydını tekrarlayın.

Bilgisayar kapanır, uyur veya terminal kapanırsa bot durur. Sürekli kullanım için Node.js 24 destekli bir sunucuda tek `npm start` işlemini hizmet yöneticisiyle çalıştırın; yeniden başlatma, işletim sistemi güncellemeleri ve dosya erişim izinleri sizin sorumluluğunuzdadır. `.env` dosyasına Windows'ta yalnızca botu çalıştıran hesap erişsin; Unix'te sihirbaz 0600 dosya modu ister. Aygıt/hesap yedekleri de token içerebilir. Güncellemede botu durdurun, `.env` dosyanızı gizli koruyun, yeni kaynağı indirip `npm ci --ignore-scripts` ve `npm run build` çalıştırın; sonra yeniden başlatın. Komut şeması değiştiyse kaydı yenileyin.

### Kullanım ve tarih biçimi

1. Normal sunucu metin/duyuru kanalında `/windowfern` yazın. İsterseniz `language: Türkçe` seçin; yoksa Discord diliniz kullanılır (diğer diller İngilizceye düşer).
2. Özel bilgi içermeyen bir etkinlik başlığı girin (1–70 karakter; bağlantı/etiket/kontrol karakteri kabul edilmez).
3. Her katılımcının **onayıyla** tek uygunluk aralığını ayrı satıra girin. İsim, kullanıcı kimliği veya açıklama eklemeyin:

```text
2026-10-20T18:00+03:00 / 2026-10-20T21:00+03:00
2026-10-20T16:00Z / 2026-10-20T19:00Z
```

4. En az ortak süreyi dakika olarak girin; örneğin `30`. Bu örnekte sonuç 16:00–18:00 UTC, yani 120 dakikadır. Türkiye'de Discord bunu 19:00–21:00 gösterir. Tüm ortak aralık paylaşılır; en az süre kadar ayrı bir toplantı otomatik seçilmez.
5. Önizlemeyi kontrol edin. **Ortak aralığı paylaş** mevcut kanala özet gönderir; **Vazgeç** taslağı siler. Özel önizlemedeki bütün sonuç ve uyarı metni paylaşılır; özel önizleme açıklaması ve düğmeler paylaşılmaz.

Biçim tam olarak `YYYY-MM-DDTHH:mmZ` veya `YYYY-MM-DDTHH:mm+HH:mm`/`-HH:mm` olmalı; saniye yazmayın. UTC `Z` ile gösterilir. UTC farkı ±14:00 sınırındadır; bilinmeyen fark anlamındaki `-00:00` reddedilir. Yerel ve sonuç UTC yılları 2000–2100 olmalı. Bitiş başlangıçtan sonra ve en çok 48 saat ileride olmalı; gece yarısı geçişinde bitişe doğru tarihi yazın. En az süre 5–720 tam dakikadır. Aynı anda 2–6 satır ve toplam en çok 1000 karakter alınır. Geçmiş tarihler de hesaplanır; bot gelecekte bir rezervasyon yaptığını iddia etmez.

IANA bölge adı veya yaz/kış saati kuralı çözülmez. Her başlangıç/bitiş için o tarihteki **gerçek UTC farkını** katılımcı belirlemelidir; değişim gecesinde iki ucun farkı farklı olabilir. Aynı anlar farklı UTC farklarıyla yazılmışsa aynı kabul edilir. Aralıkların yalnızca uç noktada buluşması toplantı süresi sağlamaz; hesaplama `en geç başlangıç` ile `en erken bitiş` arasındaki kesintisiz ortak bölümdür. Yetersiz/boş kesişimde yalnızca özel sonuç verilir.

### İzinler, güvenlik ve gizlilik

Bot: **View Channel + Send Messages**; üye de aynı kanalı görüp mesaj gönderebilmeli. Üyenin slash komut kullanabilmesi için sunucunun **Use Application Commands** erişimi de açık olmalı. Bot Administrator, Manage Server, Manage Messages, Read Message History, Embed Links, Mention Everyone veya ayrıcalıklı intent istemez. Yalnızca normal metin/duyuru kanalları desteklenir; thread/forum/DM/ses yoktur. Duyuru mesajları çapraz yayımlanmaz. Sunucu yöneticisi Discord'un Integrations ayarlarından `/windowfern` erişimini daraltabilir.

Form ve önizleme her biri en çok beş dakika RAM'de tutulur. Hesaplamadan sonra bireysel uygunluk satırları uygulama taslağına alınmaz; yalnızca ortak sonuç, dil, sahip/sunucu/kanal/uygulama/önizleme kimlikleri tutulur. En fazla 100 taslak, her hız sınırı haritasında 500 kayıt; 30 saniyede bir temizlik vardır. Üye/sunucu başına beş saniyede bir form; kanal başına dakikada bir paylaşım. Aynı kullanıcının yeni formu o sunucudaki eski taslağını iptal eder. İşlem başlamadan taslak tüketilir: iki kez tıklama iki mesaj göndermez. Başarısız izin/ağ işlemi de taslağı tüketir; yeni önizleme gerekir. Ağ belirsizliğinde tekrar denemeden önce kanala bakın.

Paylaşımda roller, kanal, üye ve botun izinleri yeniden alınır. Düğmeler sahibine, kanala, sunucuya, uygulamaya ve botun özel önizleme mesajına bağlıdır. Üye/mesaj/kullanıcı SDK önbellekleri kapalıdır. Metin biçimlendirmesi kaçırılır, etiketler devre dışıdır, bağlantı önizlemeleri bastırılır. Başlığa kişisel veya gizli bilgi yazmayın: kapsamlı sır algılama yoktur. Raw hata/etkileşim/token loglanmaz; yalnızca genel durum/hata mesajları yazılır. Disk veritabanı, dosyaya program kaydı, analitik veya üçüncü taraf API çağrısı yoktur; Discord API ve Gateway kullanılır.

**Özel mesaj uçtan uca şifreli değildir.** Discord formdaki tüm girdileri alır; bot operatörü makine/RAM üzerinde kontrol sahibidir. Discord önizlemesi, kullanıcı ekran görüntüleri ve herkese açık sonuçlar RAM süresinden uzun yaşayabilir. Yeniden başlatma tüm taslakları ve hız sınırlarını kaybettirir; eski düğmeler geçersiz olur, paylaşılan mesajlar kanalda kalır. Silmek için Discord arayüzünü veya yetkili moderatörü kullanın; bot silme/yok etme garantisi vermez. Botu kaldırmak için Discord sunucu entegrasyonlarını, yerel işlemi ve gizli yapılandırmayı yönetin. Dağıtım bölgenizdeki veri yükümlülüklerini operatör değerlendirmelidir.

### Sorun giderme

- **Komut yok:** doğru sunucuya kurun; Application ID/Server ID'yi kontrol edip `npm run register` tekrarlayın; Discord'u yenileyin ve Integrations komut erişimine bakın.
- **Bot çevrimdışı:** Node.js 24 kurulu mu, terminal açık mı, internet var mı, token geçerli mi kontrol edin. Gateway kullanırken webhook Interactions Endpoint URL ayarlamayın.
- **Kurulum açılmıyor:** ZIP'i çıkarın; terminali klasörde açın. Node kurulumundan sonra yeni terminal açın. Sihirbaz etkileşimli terminal ister; CI/boru çıktısında çalışmaz. `.env` varsa üzerine yazmaz.
- **Tarih reddedildi:** gerçek takvim günü, `T`, dakika ve açık UTC farkı kullanın. Bitişin tarihini ve farkını da yazın; örneği kopyalayıp düzenleyin. Satırlara isim eklemeyin.
- **Paylaşım reddedildi:** hem üyenin hem botun kanal izinlerine, kanal türüne ve hız sınırına bakın. Beş dakika dolduysa, bot yeniden başladıysa veya başka form açtıysanız yeni önizleme gerekir.
- **İşlem tamamlanamadı:** kanalda sonuç oluşup oluşmadığını kontrol edin; ağ zaman aşımı belirsiz olabilir. Tokenı/ham hatayı paylaşmayın. Çoklu bot işlemlerini kapatın.
- **Yanlış yerel saat:** Discord cihaz/saat dilimi ayarına ve girilen tarihteki UTC farkına bakın. Bot DST farkı tahmin etmez.

### Testler, canlı kullanım ve katkı

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
```

`check`: katı TypeScript (bağımlılık tipleri dahil), Node testleri, Biome önerilen kurallar/biçim ve bağımlılık lisans/kayıt kaynağı/SHA-512/kurulum betiği/gizli bilgi örüntüsü kontrolleri. GitHub Actions aynı denetimleri Windows, Ubuntu ve macOS 15 Intel'de çalıştırır; Node/Bash yardımcı söz dizimi ve temiz Git farkını da denetler. CI yalnızca kaynak okuma iznine sahiptir; gerçek bot tokenı kullanmaz. Tarih/kesişim, özel akış, sahip/mesaj bağları, çift tıklama, süre/hız sınırı, izin iptali ve yapılandırmasız güvenli çıkış testleri vardır. Gizli bilgi taraması örüntüseldir; garanti değildir.

Etkileşim testleri sahtedir; yayın kontrolü gerçek Discord kurulumu veya 7/24 çalışma kanıtı değildir. Canlı kullanım öncesi kendi test sunucunuzda TR/EN form/önizleme/vazgeç/paylaş, ikinci kullanıcının erişim reddi, izin geri alma, mobil/ekran okuyucu, token gizli girişini ve yeniden başlatmayı doğrulayın. Gerçek token/sunucu veya VDS testi bu proje hazırlanırken kullanılmadı. Kendi uygulamanız/tokenınız ve sürekli açık Node 24 işlemi gerekir.

Katkı için [CONTRIBUTING.md](CONTRIBUTING.md), güvenlik için [SECURITY.md](SECURITY.md) okuyun. [MIT lisansı](LICENSE); garanti verilmez. Discord ile bağlantı veya onay iddiası yoktur.

### Resmi kaynaklar

[Discord etkileşimleri](https://docs.discord.com/developers/interactions/receiving-and-responding), [bileşenler](https://docs.discord.com/developers/components/reference), [izinler](https://docs.discord.com/developers/topics/permissions), [Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy), [discord.js](https://discord.js.org/docs/packages/discord.js/main).

## English

### Purpose and features

WindowFern is a real Discord Gateway bot for gaming, study and volunteer communities. `/windowfern` opens a private form comparing **2–6 explicitly dated availability intervals**. If their intersection meets the requested minimum duration, it shows the complete proposed public summary privately. **Share common window** sends only the event title, shared start/end, duration and number of intervals to the current channel; **Discard** publishes nothing. Individual schedules and participant names are excluded from the public output.

The interface supports Turkish/English, clickable confirmation, viewer-local Discord timestamps and actionable validation. There are no share buttons when the overlap is insufficient. Each line represents one person's one continuous interval. Multiple windows per person, calendar access, bookings, signups, attendance checks, reminders, DMs, voice and message reading are unsupported. The bot does not verify participant consent or confirm a meeting.

### Requirements

- [Node.js 24 LTS](https://nodejs.org/en/download), bundled npm, Windows/macOS/Linux and internet access.
- Your own Discord application and bot token; Manage Server to install it.
- A normal server text/announcement channel with the permissions below.
- One computer/process that stays on during use. A GitHub repository does not host the running bot. No paid service is required; hosting costs depend on your choice.

### Developer Portal setup

1. Open [Developer Portal](https://discord.com/developers/applications), choose **New Application** and give it a name. Use a dedicated application.
2. Copy **General Information → Application ID**; this is not the secret token.
3. Open **Bot**, create/view the bot user and use **Reset Token**. Keep the token secret like a password; never put it in chat, issues, screenshots or Git. Reset exposed tokens immediately. You may disable **Public Bot** for your own installation; a public source repository does not require that toggle to be enabled.
4. Leave **Presence**, **Server Members** and **Message Content** privileged intents **off**. Only the unprivileged `Guilds` intent is used.
5. Under **Installation**, use **Guild Install**, scopes `bot` and `applications.commands`, and only **View Channels** and **Send Messages**. Do not grant Administrator. User Install/DM use is unsupported.
6. In Discord enable **User Settings → Advanced → Developer Mode**. Right-click your server → **Copy Server ID**.
7. Leave **Interactions Endpoint URL** unset: this bot receives interactions through the Gateway. Do not run another process managing the same application's command.

### Download, install and run

Choose **Code → Download ZIP** on this repository and extract it to its own folder. No source editing is required. Install Node.js 24, then reopen your terminal if necessary.

On **Windows**, run `setup.cmd` from the extracted folder. On **macOS/Linux**, open a terminal in the folder and run `bash setup.sh`; executable permissions are unnecessary. The helpers install locked dependencies with install scripts disabled, compile and launch the setup wizard. Equivalent commands:

```sh
npm ci --ignore-scripts
npm run build
npm run setup
```

The wizard asks for the bot token **without echoing it**, Application ID and Server ID. Ctrl+C cancels. It creates local `.env` and refuses to overwrite an existing file. Open the printed installation URL and select your server. The URL contains no token and requests permissions `3072` (View Channel + Send Messages).

Run `register.cmd`, `bash register.sh` or `npm run register` to register `/windowfern` in the configured server. Registration upserts only this command; unrelated commands are preserved. Then run `start.cmd`, `bash start.sh` or `npm start`. Wait for “WindowFern connected.” Successful startup does not print your token.

### Configuration and continuous hosting

The required settings are `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID` and `DISCORD_GUILD_ID`. The wizard writes them to `.env`; no source edits are needed. Hosting platforms may provide secret environment variables with the same names; environment values take precedence. Run exactly one process per application/server. To replace local configuration, stop the bot, securely remove the old `.env` and rerun the wizard. Reset a leaked token in Developer Portal first. Register again when changing servers.

Closing the terminal, sleeping or shutting down the computer stops the bot. For continuous use, run one `npm start` process under a service manager on a Node.js 24 host. The operator maintains restarts, OS updates and file access. Restrict `.env` to the hosting account on Windows; the wizard requests Unix mode 0600. Backups may also contain the token. For an update, stop the bot, protect `.env`, download the new source, run `npm ci --ignore-scripts` and `npm run build`, then restart. Register again if the command schema changed.

### Usage and date format

1. In an ordinary server text/announcement channel, use `/windowfern`. Optionally choose `language: English` or `Türkçe`; otherwise Turkish Discord locales use Turkish and other locales use English.
2. Enter a non-sensitive event title, 1–70 characters; links, mentions and control characters are rejected.
3. With each participant's consent, enter one interval per line without names or IDs:

```text
2026-10-20T18:00+03:00 / 2026-10-20T21:00+03:00
2026-10-20T16:00Z / 2026-10-20T19:00Z
```

4. Enter minimum shared minutes, such as `30`. The example intersects at 16:00–18:00 UTC: 120 minutes. Discord renders this in each viewer's timezone (19:00–21:00 in Turkey). The entire common interval is offered; the bot does not pick a meeting of exactly the requested minimum length.
5. Review the private preview. **Share common window** posts its summary and warning to the current channel; the private-only explanation and buttons are excluded. **Discard** deletes the draft without posting.

Use exactly `YYYY-MM-DDTHH:mmZ` or `YYYY-MM-DDTHH:mm+HH:mm`/`-HH:mm`, without seconds. `Z` means UTC. Offsets are bounded at ±14:00; unknown offset `-00:00` is rejected. Both local and resulting UTC years must be 2000–2100. Each end must follow its start by no more than 48 hours; use the next date for overnight intervals. Minimum duration is 5–720 whole minutes. Enter 2–6 lines and at most 1000 total characters. Historical intervals are accepted for calculation; the bot makes no future-booking claim.

No IANA timezone/DST rules are inferred. Participants must supply the correct offset for **each endpoint on that date**; endpoints may have different offsets across a clock change. Equivalent instants in different offsets compare equally. The intersection is from the latest start to the earliest end. Merely touching endpoints provides zero meeting duration. Insufficient/no overlap produces a private result with no share option.

### Permissions, security and privacy

The bot needs **View Channel + Send Messages**. The member also needs these permissions in that channel and **Use Application Commands** access to invoke the command. Administrator, Manage Server, Manage Messages, Read Message History, Embed Links, Mention Everyone and privileged intents are unnecessary. Threads, forums, DMs and voice are unsupported; announcement posts are not crossposted. Administrators can limit command access in Discord's Integrations settings.

Forms and previews each expire after five minutes in bounded RAM. Individual interval rows are discarded after calculation; the stored preview contains the aggregate result, language and owner/server/channel/application/preview message identifiers. Limits: 100 drafts, 500 entries in each cooldown map, cleanup every 30 seconds, one form per member/server every five seconds, one share per channel/minute. Opening a new form replaces that member's prior draft in the server. Drafts are consumed before any asynchronous publication; duplicate clicks cannot send twice. Permission/network failures also consume the draft; create a fresh preview. Inspect the channel before retrying an ambiguous network failure.

Roles, channel and both member/bot permissions are fetched again before sending. Controls are bound to the owner, server, channel, application and bot-authored ephemeral preview. SDK user/member/message caches are disabled. Markdown is escaped, mentions disabled and link previews suppressed. Keep sensitive data out of the title: there is no comprehensive secret detector. Raw errors, interactions and tokens are not logged; only generic status/error text is emitted. There is no database, schedule file, analytics or third-party API request; the bot uses Discord API/Gateway.

**Ephemeral is not end-to-end encrypted.** Discord receives all modal input, and the operator controls the machine/RAM. Discord previews, screenshots and public messages may outlive application RAM expiry. Restart loses drafts and cooldowns; old buttons stop working while public messages remain. Use Discord or an authorized moderator to delete them; there is no deletion guarantee. To remove the bot, manage the server integration, stop the local process and remove its secret configuration. Operators assess data obligations for their deployment.

### Troubleshooting

- **Missing command:** install in the intended server, confirm Application/Server IDs, rerun `npm run register`, refresh Discord and check Integrations command access.
- **Offline:** confirm Node.js 24, an open terminal, internet and a valid token. Leave Interactions Endpoint URL unset for Gateway operation.
- **Setup fails:** extract the ZIP and open an interactive terminal in its folder. Reopen after installing Node. The wizard refuses existing `.env` and noninteractive/CI input.
- **Invalid date:** use a real calendar day, `T`, minutes and an explicit offset at both endpoints. Include the correct end date for overnight intervals. Do not include names or blank lines.
- **Share denied:** check both parties' permissions, channel type and cooldown. Expiry, restart or a replacement form require a fresh preview.
- **Action could not finish:** check whether a result already appeared before retrying; a timeout is ambiguous. Do not post raw errors/tokens. Stop duplicate processes.
- **Wrong local time:** check Discord device timezone settings and the supplied offset for that date. DST offsets are not guessed.

### Tests, live validation and contributing

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
```

`check` runs strict TypeScript including dependency types, Node tests, Biome recommended lint/format rules and dependency license/registry/SHA-512/no-install-script plus source credential-pattern checks. GitHub Actions runs these on Ubuntu, Windows and macOS 15 Intel, plus Node/Bash helper syntax and clean Git diff checks. CI has read-only source permissions and no live bot token. Tests cover calendars/intersection, private flows, owner/message binding, duplicate clicks, expiry/cooldowns, revoked permissions and safe unconfigured exits. Credential scanning is heuristic, not a guarantee.

Interaction tests use mocks. Passing CI does not prove a real Discord installation or continuous operation. Before deployment, validate both languages, forms/previews/discard/share, other-user rejection, revoked permissions, mobile/screen-reader behavior, hidden-token input and restart in your own test server. No live Discord token/server or VDS was used during preparation. You need your own application/token and an always-on Node.js 24 process.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Licensed under [MIT](LICENSE) without warranty. No Discord affiliation or endorsement is claimed.

### Official references

[Discord interactions](https://docs.discord.com/developers/interactions/receiving-and-responding), [components](https://docs.discord.com/developers/components/reference), [permissions](https://docs.discord.com/developers/topics/permissions), [Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy), [discord.js](https://discord.js.org/docs/packages/discord.js/main).
