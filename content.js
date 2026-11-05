/* ============================================================
   سجلّ الطيران — Muhannad's flight log
   Moomken Media Center · Photography Unit · 8 Nov → 31 Dec 2026
   Edit content here. The engine (engine.js) and the look (theme.js) read it.
   ============================================================ */
(function () {
var AJ = 'https://elearning.aljazeera.net/ar/courses/';
var MC = 'https://www.masterclass.com/classes/ken-burns-teaches-documentary-filmmaking';

window.TRACKER = {
  id: 'muhannadFlight',
  name: 'مهند',
  file: 'muhannad-progress.json',
  pin: '2001',
  start: new Date(2026, 10, 8),
  end: new Date(2026, 11, 31, 23, 59),
  weeks: 8,
  studyGoal: 10,
  doneLabel: 'أنجزتُها ✈',
  pendingToast: 'أحسنت يا كابتن! المهمة الآن قيد المراجعة — بانتظار برج المراقبة',
  welcome: 'أهلًا كابتن مهند — الطائرة جاهزة للإقلاع ✈',
  confetti: ['#F4B942', '#7FD1FF', '#FFFFFF', '#FF8A5B', '#3AC0EB'],

  chapters: [
    { id: 'P', n: 0, pre: true, badge: '✎', name: 'قبل الصعود', en: 'Boarding', weeks: null, color: '#7FD1FF',
      desc: 'رسالتك إلى «المبدع الصغير» كانت أول خطوة في هذا السجل. منها عرفنا من أين انطلقت، وإلى أين تريد أن تطير.',
      tasks: [{ id: 'p1', k: 'write', w: 1, pre: 1, t: 'رسالة إلى المبدع الصغير — «سلامات مهند الشغوف»' }] },

    { id: 'L1', n: 1, badge: '1', name: 'الإقلاع: لماذا أصوّر؟', en: 'Leg 1 · Take-off — The Why', weeks: [1, 2], color: '#7FD1FF',
      quote: 'الكاميرا لا تصنع الأثر. القلب الذي خلفها هو الذي يصنعه.',
      desc: 'قبل أي لقطة: ما الشعور الذي يجب أن يبقى عند الناس بعد أن يروها؟ في زمن يمتلئ بمحتوى بلا روح يصنعه الذكاء الاصطناعي، تكون قوّتك في الصدق والعاطفة الحقيقية. هذه الرحلة تعيد ترتيب البوصلة: من «أصوّر جيدًا» إلى «أصوّر لأن هذا يستحق أن يُحكى».',
      tasks: [
        { id: 'a1', k: 'mission', w: 1, t: 'خطة الرحلة: أكتب 3 أهداف لهذين الشهرين ولماذا يهمّني كل واحد — وأضيف موادّي ومواعيد امتحاناتي في قسم «الدراسة»', sub: 1 },
        { id: 'a2', k: 'read', w: 1, lang: 'AR', t: 'لماذا تعجز صور الذكاء الاصطناعي عن منافسة عدسة الحقيقة؟ — الجزيرة نت', url: 'https://www.aljazeera.net/media/2025/11/4/%d9%84%d9%85%d8%a7%d8%b0%d8%a7-%d9%84%d8%a7-%d9%8a%d9%85%d9%83%d9%86-%d8%a3%d9%86-%d8%aa%d8%ad%d9%84-%d8%b5%d9%88%d8%b1-%d8%a7%d9%84%d8%b0%d9%83%d8%a7%d8%a1', why: 'لماذا يبقى الإنسان خلف الكاميرا أقوى من أي آلة.' },
        { id: 'a3', k: 'course', w: 1, paid: 1, lang: 'EN', t: 'Ken Burns Teaches Documentary Filmmaking · الدروس 1 – 7', url: MC, why: 'أعظم صانع وثائقيات يشرح كيف تحمل الصورة والصوت عاطفة القصة.' },
        { id: 'a4', k: 'course', w: 2, lang: 'AR', t: 'السرد في الصحافة.. كيف تحكي قصّة متأنية؟ — معهد الجزيرة للإعلام', url: AJ + 'course-3026', why: 'البداية، والتشويق، والنهاية — وأخلاقيات الاستمالة العاطفية.' },
        { id: 'a5', k: 'watch', w: 2, lang: 'EN', t: 'Every Frame a Painting · The Imposter — Looking into the Lens', url: 'https://www.youtube.com/@everyframeapainting/videos', why: 'كيف تصنع النظرة إلى العدسة تعاطفًا مباشرًا مع المشاهد.' },
        { id: 'a8', k: 'course', w: 2, lang: 'EN', t: 'Magnum Learn · Get Started in Photography — أقسام «الرؤية» و«القصة»', url: 'https://magnumphotos.com/learn', why: 'مصوّرو Magnum يشرحون كيف تتحوّل الصورة من لقطة جميلة إلى قصة.' },
        { id: 'a6', k: 'practice', w: 2, sub: 1, t: '«قصة في 5 صور»: 5 صور لشخص واحد في ممكن — بلا كلام ولا نص، العاطفة من الصورة وحدها' },
        { id: 'a7', k: 'review', w: 2, t: 'جلسة مع المشرف: هل وصل الشعور؟ ولماذا؟' }
      ] },

    { id: 'L2', n: 2, badge: '2', name: 'الاتصال: الناس قبل الكاميرا', en: 'Leg 2 · Connection', weeks: [3, 4], color: '#F4B942',
      quote: 'الناس لا يتذكّرون ما قلته… يتذكّرون كيف جعلتهم يشعرون.',
      desc: 'أصدق اللحظات لا تُطلب، بل تُكسب بالثقة. في هذه الرحلة تتعلّم كيف تقترب من الناس بكرامة، كيف تحاورهم لتصل إلى الجملة التي تحمل القصة كلها، ومتى لا تصوّر أصلًا.',
      tasks: [
        { id: 'b1', k: 'course', w: 3, lang: 'AR', t: 'وراء كل لاجئ قصة.. السرد الصحفي للقضايا الإنسانية — معهد الجزيرة للإعلام', url: AJ + 'course-69', why: 'كيف تُظهر الإنسان بلا صور نمطية، وتجد قصته الحقيقية.' },
        { id: 'b2', k: 'read', w: 3, lang: 'AR', t: 'مسؤوليتنا تجاه الناس الذين نلتقط صورهم — أطباء بلا حدود', url: 'https://www.msf.org/ar/%D8%A7%D9%84%D8%AA%D9%82%D8%B1%D9%8A%D8%B1-%D8%A7%D9%84%D8%AF%D9%88%D9%84%D9%8A-%D8%B9%D9%86-%D8%A3%D9%86%D8%B4%D8%B7%D8%A9-%D8%A3%D8%B7%D8%A8%D8%A7%D8%A1-%D8%A8%D9%84%D8%A7-%D8%AD%D8%AF%D9%88%D8%AF-%D9%84%D8%B9%D8%A7%D9%85-2022/%D9%85%D8%B3%D8%A4%D9%88%D9%84%D9%8A%D8%AA%D9%86%D8%A7-%D8%AA%D8%AC%D8%A7%D9%87-%D8%A7%D9%84%D9%86%D8%A7%D8%B3-%D8%A7%D9%84%D8%B0%D9%8A%D9%86-%D9%86%D9%84%D8%AA%D9%82%D8%B7-%D8%B5%D9%88%D8%B1%D9%87%D9%85', why: 'نموذج مباشر لمؤسسة إنسانية تراجع صورها من أجل كرامة الناس.' },
        { id: 'b3', k: 'course', w: 3, paid: 1, lang: 'EN', t: 'Ken Burns · الدروس 8 – 14 (المقابلة، والشخصية، والأرشيف)', url: MC },
        { id: 'b4', k: 'read', w: 4, lang: 'AR', t: 'إرشادات أخلاقية لاستخدام الفيديو في المناصرة — WITNESS (النسخة العربية)', url: 'https://www.witness.org/portfolio_page/ethical-guidelines-for-using-videos-in-human-rights-reporting-and-advocacy/', why: 'الموافقة، والأمان، وتقليل الضرر — أساس كل عمل في منظمة مجتمع مدني.' },
        { id: 'b5', k: 'practice', w: 4, sub: 1, t: '«البورتريه والجملة»: حوار 10 دقائق مع متطوّع أو مستفيد (بموافقته) ثم بورتريه له — ومعه الجملة الواحدة منه التي تحمل قصته' },
        { id: 'b6', k: 'write', w: 4, t: 'أول تسجيل في «الصندوق الأسود»: موقف أخطأت فيه — ماذا حدث، ماذا تعلّمت، ماذا سأفعل في المرة القادمة' },
        { id: 'b7', k: 'review', w: 4, t: 'جلسة مع المشرف على البورتريه والجملة' }
      ] },

    { id: 'L3', n: 3, badge: '3', name: 'العين: لغة الصورة والزاوية', en: 'Leg 3 · The Eye', weeks: [5, 6], color: '#FF8A5B',
      quote: 'الزاوية ليست مكان الكاميرا… بل موقفك من الإنسان الذي أمامها.',
      desc: 'كل صورة جملة، وكل زاوية كلمة فيها. من الأسفل قوة، من الأعلى ضعف، على مستوى العين احترام، واللقطة القريبة حميمية. هنا تتعلّم أن تختار الزاوية والضوء والإطار بنيّة — فتقول الصورة ما تريد دون أن تحتاج إلى شرح.',
      tasks: [
        { id: 'c1', k: 'read', w: 5, lang: 'AR', t: 'أنواع اللقطات وزوايا الكاميرا ومعانيها النفسية — Adobe (عربي)', url: 'https://www.adobe.com/ae_ar/creativecloud/video/production/cinematography/camera-shots-and-angles.html', why: 'الزاوية المنخفضة قوة، ومستوى العين احترام، واللقطة القريبة حميمية.' },
        { id: 'c2', k: 'read', w: 5, lang: 'EN', t: 'StudioBinder · The Ultimate Guide to Camera Shots', url: 'https://studiobinder.com/blog/types-of-camera-shots/' },
        { id: 'c3', k: 'course', w: 5, paid: 1, lang: 'EN', t: 'Annie Leibovitz Teaches Photography · دروس البورتريه والضوء (اختر 5)', url: 'https://www.masterclass.com/classes/annie-leibovitz-teaches-photography', why: 'ضمن العضوية نفسها: كيف تبني بورتريه يقول من هو الإنسان.' },
        { id: 'c4', k: 'practice', w: 5, sub: 1, t: '«زاوية واحدة، ثلاثة معانٍ»: الشخص نفسه من الأسفل، وعلى مستوى العين، ومن الأعلى + لقطة واسعة وأخرى قريبة — وأكتب ما تقوله كل صورة' },
        { id: 'c5', k: 'read', w: 6, lang: 'AR', t: 'البرنامج العربي للتصوير الوثائقي — أدرس 3 مقالات مصوّرة: لماذا اختار المصوّر هذا الترتيب؟', url: 'https://www.arabdocphotography.org/project/86', why: 'قصص مصوّرة عربية شخصية وعاطفية تشبه قصص مجتمعنا.' },
        { id: 'c6', k: 'practice', w: 6, sub: 1, t: '«الضوء يحكي»: 6 صور لمكان واحد في ممكن في 3 أوقات مختلفة من اليوم — ما الشعور الذي يصنعه كل ضوء؟' },
        { id: 'c7', k: 'review', w: 6, t: 'جلسة مع المشرف على الزوايا والضوء' }
      ] },

    { id: 'L4', n: 4, badge: '4', name: 'الهبوط: قصة الأثر', en: 'Leg 4 · Landing — The Impact Story', weeks: [7, 8], color: '#3AC0EB',
      quote: 'نسعى في هذه الحياة لترك الأثر. — مهند',
      desc: 'كل ما تعلّمته يجتمع في قصة واحدة: إنسان حقيقي، رحلة شعورية لها بداية ووسط ونهاية، وصور بزوايا مختارة بنيّة. والذكاء الاصطناعي هنا مساعد صامت للمهام المرهقة فقط — لا يصنع اللحظة ولا يغيّر الحقيقة.',
      tasks: [
        { id: 'd1', k: 'course', w: 7, lang: 'EN', t: 'Vertical Storytelling — Al Jazeera Media Institute', url: 'https://elearning.aljazeera.net/en/courses/vertical-storytelling', why: 'بُنى القصة العمودية، والحبكة والنهاية، وقياس الأثر.' },
        { id: 'd3', k: 'ai', w: 7, lang: 'AR', t: 'الذكاء الاصطناعي للجميع (الوحدتان 1 و2) — DeepLearning.AI على Coursera بالعربية', url: 'https://www.coursera.org/learn/ai-for-everyone-ar' },
        { id: 'd4', k: 'ai', w: 7, t: 'أقرأ «قواعد الذكاء الاصطناعي في غرفة التحرير» في أسفل الصفحة — وأكتب ما سأستخدم فيه الذكاء الاصطناعي في مشروعي النهائي وما لن أستخدمه فيه', sub: 1 },
        { id: 'd5', k: 'course', w: 7, paid: 1, lang: 'EN', t: 'Ken Burns · الدروس 15 – 26 (البناء، والمونتاج، والموسيقى)', url: MC },
        { id: 'd6', k: 'project', w: 8, sub: 1, t: 'قصة الأثر: مقال مصوّر من 8 – 10 صور عن إنسان حقيقي برحلة شعورية وتعليقات قصيرة، ونسخة عمودية قصيرة للمنصّات — وسجلّ قصير لما ساعد فيه الذكاء الاصطناعي' },
        { id: 'd7', k: 'milestone', w: 8, t: 'الهبوط: عرض «قصة الأثر» أمام فريق المركز الإعلامي' },
        { id: 'd8', k: 'write', w: 8, sub: 1, t: 'رسالة ثانية إلى «المبدع الصغير» — ماذا تغيّر في نظرتك إلى الكاميرا منذ رسالتك الأولى؟' },
        { id: 'd9', k: 'write', w: 8, optional: 1, t: '(اختياري) مشروعي الصغير في صفحة: خدمة تصوير أو محتوى يمكن أن أقدّمها، لمن، وبكم — للنقاش مع المشرف' }
      ] }
  ],

  checks: [
    { id: 'pf', t: 'قائمة ما قبل الإقلاع', d: 'قبل كل تصوير هذا الأسبوع' },
    { id: 'bb', t: 'تسجيل في الصندوق الأسود', d: 'خطأ أو موقف — بلا لوم، للتعلّم' },
    { id: 'scene', t: 'مشهد بعين المحلّل', d: 'حلّلت مشهدًا أو ريلز: ما الشعور؟ وكيف صُنع؟' },
    { id: 'gift', t: 'نصيحة في الطابور', d: 'شاركت معلومة مفيدة مع زميل أو مع جمهورك' }
  ],

  preflight: [
    'ما الشعور الذي يجب أن يبقى عند من يشاهد؟ (كلمة واحدة)',
    'من صاحب القصة؟ هل أخذت موافقته؟',
    'البطاريات وبطاقات الذاكرة ومساحتها',
    'الضوء: من أين يأتي؟ وهل الوجه واضح أم في الظل؟',
    'قائمة اللقطات: واسعة، متوسطة، قريبة، وتفصيلة واحدة',
    'نيّة الزاوية: لماذا هذه الزاوية بالذات؟',
    'أول 3 ثوانٍ: ما الذي سيشدّ المشاهد؟',
    'بعد التصوير: نسخة احتياطية وتسمية الملفات'
  ],

  resources: [
    { h: '🎓 الدورات الأساسية', items: [
      { t: 'Ken Burns Teaches Documentary Filmmaking', by: 'MasterClass · 26 درسًا', lang: 'EN', paid: 'نحو 120$ سنويًا', url: MC, d: 'العضوية نفسها تفتح Annie Leibovitz في التصوير، وJimmy Chin في تصوير المغامرة.' },
      { t: 'من الفكرة إلى النشر.. كيف تصنع قصتك الرقمية؟', by: 'معهد الجزيرة · AJ+', lang: 'AR', url: AJ + 'course-183' },
      { t: 'الوسائط المتعددة.. أدواتك لتشكيل سرد قصصي جذاب', by: 'معهد الجزيرة للإعلام', lang: 'AR', url: AJ + 'course-58' },
      { t: 'وثائقي الهاتف المحمول', by: 'معهد الجزيرة للإعلام', lang: 'AR', url: AJ + 'course-61' },
      { t: 'لكل منصة خصوصيتها', by: 'معهد الجزيرة للإعلام', lang: 'AR', url: AJ + 'course-3908' }
    ] },
    { h: '▶ قنوات تشاهدها بعين المحلّل', items: [
      { t: 'Every Frame a Painting', by: 'YouTube', lang: 'EN', url: 'https://www.youtube.com/@everyframeapainting/videos', kind: 'قناة' },
      { t: 'Lessons from the Screenplay', by: 'YouTube', lang: 'EN', url: 'https://www.youtube.com/channel/UCErSSa3CaP_GJxmFpdjG9Jw', kind: 'قناة', d: 'بناء القصة والشخصية.' },
      { t: 'StudioBinder', by: 'YouTube', lang: 'EN', url: 'https://www.youtube.com/channel/UCUFoQUaVRt3MVFxqwPUMLCQ', kind: 'قناة', d: 'اللقطات والزوايا والتكوين.' }
    ] },
    { h: '🎙 مكمّل لاحقًا: التعليق الصوتي', items: [
      { t: 'فن الأداء الصوتي', by: 'معهد الجزيرة للإعلام', lang: 'AR', url: AJ + 'course-63', d: 'بعد أن تتقن الصورة: كيف يتحوّل النص إلى قصة حيّة.' },
      { t: 'فن التعليق الصوتي للفيلم الوثائقي', by: 'مجلة معهد الجزيرة', lang: 'AR', url: 'https://institute.aljazeera.net/en/node/449' },
      { t: 'Narration: Writing for the Ear', by: 'Transom', lang: 'EN', url: 'https://hearingvoices.com/tow/narration-writing-for-the-ear' },
      { t: 'Werner Herzog Teaches Filmmaking', by: 'MasterClass · ضمن العضوية', lang: 'EN', paid: 'ضمن العضوية', url: 'https://www.masterclass.com/classes/werner-herzog-teaches-filmmaking' }
    ] },
    { h: '📖 كتب', items: [
      { t: 'اللغة السينمائية — مارسيل مارتان', by: 'ترجمة سعد مكاوي · أقلام عربية', lang: 'AR', paid: 'للشراء', url: 'https://www.abjjad.com/book/2778169348/%D8%A7%D9%84%D9%84%D8%BA%D8%A9-%D8%A7%D9%84%D8%B3%D9%8A%D9%86%D9%85%D8%A7%D8%A6%D9%8A%D8%A9/2779217924' },
      { t: 'In the Blink of an Eye — Walter Murch', by: 'Silman-James', lang: 'EN', paid: 'نحو 14$', url: 'https://www.porchlightbooks.com/product/in-the-blink-of-an-eye-a-perspective-on-film-editing--walter-murch/isbn/9781879505629', d: 'قاعدة المونتاج الأولى: العاطفة.' },
      { t: "The Photographer's Eye — Michael Freeman", by: 'Ilex Press', lang: 'EN', paid: 'للشراء', url: 'https://openlibrary.org/search?q=The+Photographer%27s+Eye+Michael+Freeman', d: 'التكوين والإطار: كيف تقرأ الصورة وتبنيها.' }
    ] }
  ]
};
})();
