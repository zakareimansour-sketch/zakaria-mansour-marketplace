# نشر منصة ZAKARIA MANSOUR

## متطلبات الإنتاج الإلزامية

- Node.js 20+
- نطاق HTTPS
- قرص دائم للمجلد `/app/data` عند استخدام SQLite والتخزين المحلي
- متغيرات البيئة التالية:

```env
NODE_ENV=production
API_PORT=3001
DATABASE_PATH=/app/data/marketplace.sqlite
STORAGE_PATH=/app/data/storage
JWT_SECRET=ضع_سرًا_عشوائيًا_طويلًا_48_حرفًا_على_الأقل
SETUP_TOKEN=رمز_إعداد_المالك_مرة_واحدة_24_حرفًا_على_الأقل
ALLOWED_ORIGINS=https://your-domain.com
GROQ_API_KEY=
```

## Docker

```bash
docker build -t zakaria-marketplace .
docker run -p 3001:3001 --env-file .env -v zakaria-data:/app/data zakaria-marketplace
```

بعد التشغيل افتح النطاق، وأكمل إعداد حساب المالك باستخدام `SETUP_TOKEN`. بعد إنشاء المالك يمكن حذف `SETUP_TOKEN` من البيئة عند اعتماد آلية إدارة آمنة، ومسار الإعداد يرفض إنشاء مالك ثانٍ تلقائيًا.

## ملاحظات مهمة

- لا تستخدم استضافة تحذف القرص عند إعادة التشغيل؛ الصور والملفات وقاعدة SQLite تحتاج قرصًا دائمًا.
- قبل التوسع الكبير، تُنقل البيانات إلى PostgreSQL والملفات إلى Object Storage.
- الدفع الحالي يدوي/تحويل بنكي مع تأكيد الإدارة. لا تُعرض أي علامة بوابة دفع قبل تفعيلها فعليًا.
- الربط الحقيقي بـGroq يحتاج مفتاح API يوضع في Environment Variables فقط.
