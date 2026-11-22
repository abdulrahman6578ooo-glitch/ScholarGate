# مصادر البحث وتكاملاتها في ScholarGate

تمت مراجعة وثائق المصادر الرسمية في 22 نوفمبر 2026 واختبار استعلام حي محدود. تعتمد النسخة الأولية على خمس واجهات بحث فعلية: PubMed، وarXiv، وOpenAlex، وCrossref، وDOAJ. جرى اختبار واجهة Semantic Scholar دون مفتاح، لكنها أعادت HTTP 429؛ لذلك تظهر حاليًا كرابط بحث مباشر ولا تُستدعى ضمن تجميع النتائج. يتطلب CORE مفتاحًا وشروط ترخيص مناسبة لمشروع المنتج، ولم تُضف بيانات اعتماد؛ لذلك يظهر كرابط مباشر. لا تعرض وثائق Google Scholar واجهة بحث API عامة للمطورين، لذا يفتح الموقع صفحة البحث الرسمية فقط. لا يستخدم المشروع كشط الصفحات أو تجاوز القيود.

## الإتاحة والتنزيل

تُوحّد النتائج الوصفية وتُدمج بحسب DOI، أو العنوان والسنة عند غياب DOI. تظل الملفات على المواقع الأصلية ولا يحتفظ ScholarGate بنسخة منها. شارة الإتاحة تعكس إشارة المصدر ولا تعني بذاتها إذن إعادة الاستخدام. تظهر روابط PDF المباشرة من arXiv وفق واجهة arXiv الرسمية؛ أما روابط PDF من Crossref وOpenAlex وDOAJ فلا تظهر إلا عند توافر رابط مناسب وإشارة ترخيص معروفة تسمح بإعادة الاستخدام. في المصادر الأخرى يُعرض رابط صفحة المصدر. وجود PMCID في PubMed وحده لا يثبت أن الملف مفتوح أو أن إعادة توزيعه مسموحة. إذا لم تظهر رخصة، يعامل الترخيص على أنه غير متحقق.

## حدود الطلبات المطبقة

تستخدم موائمات الخادم تخزينًا مؤقتًا لنتائج بيانات البحث لمدة عشر دقائق، ومهلة اتصال 12 ثانية، وتعاملًا جزئيًا مع فشل أي مصدر. يحدّ موائم arXiv الطلبات إلى طلب واحد كل ثلاث ثوانٍ واتصال واحد في كل مرة على العملية، ويحدّ PubMed إلى فاصل 400 مللي ثانية بين نداءات E-utilities، وDOAJ إلى 500 مللي ثانية، وCrossref إلى 220 مللي ثانية. هذه محددات داخل عملية الخادم؛ عند التوسع إلى عدة نسخ متزامنة يجب نقل الحصص إلى قفل/طابور مشترك، لا الاكتفاء بذاكرة كل نسخة.

تشير وثائق NCBI إلى حد افتراضي 3 طلبات/ثانية دون مفتاح، وحد 10,000 سجل لاستعلام PubMed عبر ESearch؛ كما أن خدمة PMC OAI-PMH لها حد مستقل. يفرض arXiv انتظارًا لا يقل عن ثلاث ثوانٍ بين الطلبات واتصالًا واحدًا مشتركًا عبر أجهزة العميل؛ يمنع تخزين PDF وتقديمه من خادم ScholarGate دون إذن أو ترخيص صالح. تسمح OpenAlex بطلبات بلا مفتاح ضمن ميزانية أقل، لكن المفتاح المجاني يرفع الحصة، وحد `per-page` الأقصى 100؛ وعمليات تنزيل المحتوى منفصلة وتستهلك الميزانية. توصي Crossref بتعريف User-Agent وقراءة ترويسات الحد الفعلية؛ لا تُستخدم روابط Crossref كدليل على أن النص مجاني. يحدد DOAJ حد الطلبات المنشور بطلبين في الثانية. وقد تحدد الخدمات الأخرى حصصًا أو سياسات مختلفة، لذلك يعرض التطبيق فشل المصدر دون إخفاء النتائج المتاحة.

## ملاحظات المصدر

**PubMed / NCBI.** يبحث الخادم بواسطة ESearch، ثم يجلب البيانات عبر ESummary والملخصات المتاحة عبر EFetch. رابط النتيجة يقود إلى صفحة PubMed. لا تُعد روابط LinkOut المجانية أو بيانات PMCID إذنًا تلقائيًا للتنزيل أو إعادة الاستخدام؛ يجب فحص ترخيص كل مادة إذا توسعت الميزة إلى تنزيل آلي. [1] [2] [3] [4] [5] [6] [7]

**arXiv.** يبحث عبر Atom API الرسمية، ويعرض صفحة arXiv الأصلية. عند إرجاع API رابط PDF، يفتح المستخدم ذلك الملف من arXiv مباشرة. لا يقوم الموقع بتحميل الملف أو حفظه أو إعادة توزيعه. [8] [9] [10] [11] [12] [13]

**OpenAlex.** يستخدم بحث `/works?search=...` لاسترجاع البيانات الوصفية ومؤشرات الوصول ومواقع النسخ. رابط `pdf_url` لا يثبت حق إعادة الاستخدام؛ يُعرض PDF فقط عند وجود رخصة معروفة في السجل. لا يستخدم المشروع خدمة تنزيل محتوى OpenAlex في النسخة الأولى. [14] [15] [16] [17] [18] [19] [20]

**Crossref.** يبحث في سجل الأعمال الوصفية وروابط DOI والناشر. Crossref لا يستضيف النص الكامل؛ وقد تكون روابطه مدفوعة أو مقيدة بشروط الناشر. تتطلب روابط PDF ترخيصًا مناسبًا قبل إظهارها كتنزيل. [21] [22] [23] [24] [25] [26]

**DOAJ.** يستخدم واجهة البحث عن المقالات لإحضار سجلات المجلات المفتوحة وروابط المقالات. تُعامل ملفات المقالات ورخصها كلٌ على حدة؛ ترخيص بيانات DOAJ الوصفية لا يشمل تلقائيًا نص المقال. [27] [28] [29] [30] [31] [32]

**Semantic Scholar.** وثائق Graph API توثق نقطة البحث وحقول PDF والإتاحة، لكن الاختبار الحي بدون مفتاح أعاد HTTP 429. يبقى رابط الموقع الأصلي هو المسار الحالي؛ يمكن تفعيل API لاحقًا بعد تأمين حصة مناسبة ومفتاح محفوظ على الخادم إن تطلبت سياسة الخدمة ذلك. رابط PDF أو مؤشر الإتاحة لا يمثل ترخيص إعادة توزيع. [33] [34] [35] [36] [37] [38]

**CORE.** توجد API رسمية v3 وروابط تنزيل في بعض السجلات، لكن المفتاح والترخيص والحصة تتغير باختلاف فئة الاستخدام؛ لم تُضف إلى التجميع الآلي قبل توفير الاعتماد والتأكد من أهلية الترخيص. يمكن البحث من الرابط الخارجي. [39] [40] [41] [42]

**Google Scholar.** توضح صفحات المساعدة البحث عبر الويب وميزات الاقتباس؛ لم يظهر توثيق API بحث عام للمطورين في الصفحات الرسمية المفتوحة. لذلك لا يجري كشط نتائجه أو استدعاؤها آليًا. [43] [44] [45]

## المراجع الرسمية

[1]: https://www.ncbi.nlm.nih.gov/books/NBK25497/ "Entrez Programming Utilities Help"
[2]: https://www.ncbi.nlm.nih.gov/books/NBK25499/ "E-utilities Usage Guidelines"
[3]: https://pubmed.ncbi.nlm.nih.gov/help/ "PubMed Help"
[4]: https://pmc.ncbi.nlm.nih.gov/tools/developers/ "PMC Developer Resources"
[5]: https://pmc.ncbi.nlm.nih.gov/tools/openftlist/ "PMC Open Access Subset"
[6]: https://pmc.ncbi.nlm.nih.gov/tools/oai/ "PMC OAI-PMH Service"
[7]: https://pmc.ncbi.nlm.nih.gov/tools/pmcaws/ "PMC Open Access AWS Service"
[8]: https://info.arxiv.org/help/api/index.html "arXiv API"
[9]: https://info.arxiv.org/help/api/basics.html "arXiv API Basics"
[10]: https://info.arxiv.org/help/api/user-manual.html "arXiv API User Manual"
[11]: https://info.arxiv.org/help/api/tou.html "arXiv API Terms of Use"
[12]: https://info.arxiv.org/help/license/index.html "arXiv License Information"
[13]: https://export.arxiv.org/api/query?search_query=all:electron&start=0&max_results=1 "arXiv API Example Query"
[14]: https://docs.openalex.org/how-to-use-the-api/get-lists-of-entities/search-entities "OpenAlex Search Entities"
[15]: https://help.openalex.org/api/authentication/ "OpenAlex API Authentication"
[16]: https://help.openalex.org/access/pricing/ "OpenAlex API Pricing and Limits"
[17]: https://docs.openalex.org/api-entities/works/work-object "OpenAlex Work Object"
[18]: https://help.openalex.org/access/fulltext/ "OpenAlex Full Text"
[19]: https://help.openalex.org/data/works/open-access/ "OpenAlex Open Access Data"
[20]: https://help.openalex.org/data/locations/ "OpenAlex Locations"
[21]: https://api.crossref.org/ "Crossref REST API"
[22]: https://www.crossref.org/documentation/retrieve-metadata/rest-api/ "Crossref REST API Documentation"
[23]: https://www.crossref.org/documentation/retrieve-metadata/rest-api/access-and-authentication/ "Crossref API Access and Authentication"
[24]: https://www.crossref.org/documentation/retrieve-metadata/text-and-data-mining/ "Crossref Text and Data Mining"
[25]: https://www.crossref.org/documentation/schema-library/markup-guide-metadata-segments/full-text-urls/ "Crossref Full Text Links"
[26]: https://www.crossref.org/documentation/retrieve-metadata/rest-api/tips-for-using-the-crossref-rest-api/ "Crossref API Usage Tips"
[27]: https://doaj.org/api/v2/docs "DOAJ API Documentation"
[28]: https://doaj.org/docs/api/ "DOAJ API Guide"
[29]: https://doaj.org/docs/faq/ "DOAJ FAQ"
[30]: https://doaj.github.io/doaj-docs/master/data_models/IncomingAPIArticle "DOAJ Article Data Model"
[31]: https://doaj.org/terms/ "DOAJ Terms"
[32]: https://doaj.org/apply/guide/ "DOAJ Application Guide"
[33]: https://www.semanticscholar.org/product/api "Semantic Scholar API Product"
[34]: https://api.semanticscholar.org/api-docs/graph "Semantic Scholar Graph API"
[35]: https://www.semanticscholar.org/product/api/tutorial "Semantic Scholar API Tutorial"
[36]: https://www.semanticscholar.org/faq/public-api "Semantic Scholar API FAQ"
[37]: https://www.semanticscholar.org/faq/access-text "Semantic Scholar Access and Text FAQ"
[38]: https://www.semanticscholar.org/product/api/license "Semantic Scholar API License"
[39]: https://api.core.ac.uk/docs/v3 "CORE API v3 Documentation"
[40]: https://core.ac.uk/services/api "CORE API Service"
[41]: https://core.ac.uk/api-keys/register "CORE API Key Registration"
[42]: https://core.ac.uk/terms "CORE Terms"
[43]: https://scholar.google.com/intl/en/scholar/help.html "Google Scholar Help"
[44]: https://scholar.google.com/intl/en/scholar/about.html "Google Scholar About"
[45]: https://scholar.google.com/robots.txt "Google Scholar Robots Rules"
