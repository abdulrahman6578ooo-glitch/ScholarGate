# ScholarGate — بوابة البحث العلمي

React / Express / tRPC / Drizzle starter, adapted from the Sandbox web-db-user template.

- `pnpm dev`: development server; honors `PORT` (default 3000).
- `pnpm build` / `pnpm start`: build and serve `dist/index.js` and `dist/public/`.
- `pnpm db:migrate`: apply checked-in migrations. `pnpm db:push`: generate and apply new schema changes.
- `pnpm check` / `pnpm test`: types and application tests.

Start with the Webdev skill's default-template guide. Platform login, storage, payments and service contracts live in its shared references; read the relevant capability before extending its helper.

`server/_core/publicConfig.ts` exposes only named public runtime values. Private keys stay server-side. The platform serves managed `/manus-storage/` assets; the application does not register a second proxy.

Platform configuration is readable and editable through `webdev.config`. Default settings are initial values, not enforced constraints. The agent may modify the files, commands and configuration or follow the flexible guide for another stack.


## سلوك المنتج ومصادره

تبحث النسخة الحالية عبر واجهات PubMed وarXiv وOpenAlex وCrossref وDOAJ الرسمية، وتجمع النتائج في خادم Express. يوفّر Semantic Scholar وCORE وGoogle Scholar روابط بحث مباشرة فقط؛ لم يتم تفعيل تكامل API مع Semantic Scholar بسبب HTTP 429 دون مفتاح، وCORE يتطلب اعتمادًا وشروط ترخيص ملائمة. تفاصيل الوثائق الرسمية وحدود الطلب وقيود النص الكامل موجودة في `docs/research-sources.md`.

روابط البحث وملفات PDF تظل في المواقع الأصلية. الإشارة إلى الوصول المفتوح مأخوذة من بيانات المصدر ولا تمنح حق إعادة الاستخدام أو إعادة التوزيع. تحفظ المفضلة وسجل البحث في متصفح المستخدم محليًا. لا تحتاج هذه النسخة إلى حساب أو قاعدة بيانات.
