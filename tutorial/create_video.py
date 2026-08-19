from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

W,H=1280,720
root=Path(__file__).parent
out=root/'slides'; out.mkdir(parents=True,exist_ok=True)
regular=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',30)
bold=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',42)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
brand=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',26)
slides=[
('خطة إنهاء المتجر الآلي',['الواجهة منشورة للعرض على GitHub Pages','قاعدة Supabase جاهزة','الخادم الجديد أصبح متوافقًا مع Supabase','ثلاث مراحل فقط تفصلنا عن التشغيل الآلي'],'مقدمة'),
('المرحلة الأولى: وظائف Supabase',['افتح الملف functions.sql','Supabase ← SQL Editor ← New query','الصق الكود كاملًا واضغط Run مرة واحدة','علامة النجاح: Marketplace functions created successfully'],'قاعدة البيانات'),
('المرحلة الثانية: تحديث GitHub',['نزّل ZAKARIA_MANSOUR_SUPABASE_UPDATE.zip','فك الضغط وافتح مجلد المشروع','GitHub ← Add file ← Upload files','ارفع المحتويات واحفظ التغييرات'],'الكود'),
('المرحلة الثالثة: تشغيل الاستضافة',['اختر المستودع والفرع main','استخدم Dockerfile الموجود في الجذر','أضف مفاتيح Supabase داخل Secrets','اضبط JWT_SECRET وSETUP_TOKEN وALLOWED_ORIGINS'],'الخادم الدائم'),
('إعداد المالك واختبار دورة البيع',['أنشئ حساب المالك من شاشة الإعداد الأولى','أضف المنتج كمسودة وارفع الصورة والملف','انشر المنتج وأنشئ طلبًا تجريبيًا','أكد الدفع واختبر التحميل من مكتبة العميل'],'الاختبار النهائي'),
('النتيجة النهائية',['حسابات عملاء وبائعين','منتجات وسلة وطلبات','إدارة دفع ومراجعات','تسليم رقمي آمن ومحدود','لا تستخدم روابط Cloudflare المؤقتة'],'متجر آلي بالكامل')]
for i,(title,bullets,label) in enumerate(slides,1):
 im=Image.new('RGB',(W,H),(7,7,9));d=ImageDraw.Draw(im)
 # background accents
 d.ellipse((-180,-200,420,400),fill=(20,15,7));d.ellipse((1020,470,1450,900),fill=(17,11,28))
 d.rectangle((0,0,W,8),fill=(214,167,82));d.rectangle((78,92,87,610),fill=(214,167,82))
 d.text((W-70,45),'ZAKARIA MANSOUR',font=brand,fill=(241,206,131),anchor='ra')
 d.text((W-70,92),title,font=bold,fill=(245,239,227),anchor='ra',direction='rtl',language='ar')
 d.text((W-70,154),label,font=small,fill=(214,167,82),anchor='ra',direction='rtl',language='ar')
 y=235
 for b in bullets:
  d.ellipse((W-105,y+12,W-91,y+26),fill=(214,167,82))
  d.text((W-125,y),b,font=regular,fill=(205,206,210),anchor='ra',direction='rtl',language='ar')
  y+=76
 d.rounded_rectangle((70,H-70,W-70,H-38),radius=13,fill=(18,19,23),outline=(65,52,31),width=2)
 progress=(W-140)*i/len(slides)
 d.rounded_rectangle((70,H-70,70+progress,H-38),radius=13,fill=(151,105,40))
 d.text((70,H-92),f'{i} / {len(slides)}',font=small,fill=(130,131,136),anchor='la')
 im.save(out/f'{i:02}.png')
print(f'Created {len(slides)} slides in {out}')
