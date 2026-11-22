# حالة Semantic Scholar API

وثائق Graph API الرسمية توثق endpoint للبحث في الأوراق. عند اختبار الطلب العام من خادم ScholarGate في 22 نوفمبر 2026، أعاد API الحالة HTTP 429 مع رسالة تطلب الانتظار أو التقدم للحصول على مفتاح API. لذلك لم يُضمّن Semantic Scholar في قائمة المصادر التي تُستدعى آليًا، ويُفتح رابط البحث الرسمي للمستخدم بدلًا من ذلك. لا توجد بيانات اعتماد لمفتاح Semantic Scholar في إعدادات هذا المشروع.

إذا أضيف التكامل مستقبلًا، يجب أولًا طلب المفتاح عبر قناة المستخدم الرسمية، ثم تخزينه كسرّ خادمي لا كمتغير واجهة. يجب البدء بمعدل محافظ والتعامل مع 429 وRetry-After والتخزين المؤقت. نتائج `isOpenAccess` و`openAccessPdf` مؤشرات إتاحة وليست ترخيص إعادة توزيع؛ اعرض المصدر الأصلي ولا تستضف الملفات. الوثائق: [Graph API](https://api.semanticscholar.org/api-docs/graph)، [صفحة API](https://www.semanticscholar.org/product/api)، [الأسئلة الشائعة حول الوصول إلى النص](https://www.semanticscholar.org/faq/access-text).
