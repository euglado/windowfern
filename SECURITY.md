# Security / Güvenlik

Never report a token or private schedule publicly. Revoke a leaked token immediately in Developer Portal → Bot → Reset Token, update local configuration and restart the process. Delete affected Discord messages if needed. Git history removal alone does not revoke credentials.

Token veya özel programı herkese açık bildirimde paylaşmayın. Sızan tokenı hemen Developer Portal → Bot → Reset Token ile iptal edin; yerel ayarı yenileyin ve işlemi yeniden başlatın. Gerekirse ilgili Discord mesajlarını silin. Git geçmişinden silmek tokenı iptal etmez.

Use GitHub's private vulnerability reporting when available on this repository. If unavailable, create an issue asking for a private reporting route without exploit details or sensitive values. There is no guaranteed response time. Reports must describe the affected version and a minimal reproduction with invented data.

Depoda açıksa GitHub özel güvenlik bildirimi kullanın. Açık değilse, açık veya gizli değerleri yazmadan özel iletişim yolu isteyen bir issue açın. Yanıt süresi garantisi yoktur. Etkilenen sürümü ve kurgu verilerle en küçük örneği belirtin.

The bot does not verify consent, detect secrets comprehensively, infer DST rules, prove attendance or make bookings. The operator controls the machine and could inspect RAM. Discord receives all modal values even though individual intervals are discarded by this application after calculation. Ephemeral messages are not end-to-end encrypted or guaranteed to disappear when RAM expires.
