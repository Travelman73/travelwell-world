/**
 * TravelWell.World — lightweight i18n for the core-flow screens (1c).
 *
 * No framework: a typed message dictionary + a `useT()` hook that reads the
 * live locale from the store, so switching language re-renders localized copy
 * in place (Arabic then renders as real RTL text — numbers and punctuation
 * correct, unlike dir=rtl over English). Scope is deliberately the demo-critical
 * surface a cold visitor sees first — the header nav + the home hero — not the
 * whole app (the full string extraction is the larger i18n retrofit).
 *
 * Keys fall back to English when a locale is missing (the staged languages
 * de/pt/ja/ko show English until translated). Brand + product names —
 * "TravelWell", "Atlas" — are never translated.
 *
 * These launch-language strings are demo-ready; a native-speaker polish pass is
 * worth doing before scale (especially the Arabic).
 */
import { useStore } from "@/store/useStore";

type Dict = { en: string; es?: string; ar?: string; zh?: string; fr?: string };

export const MESSAGES: Record<string, Dict> = {
  // ── Header nav ──────────────────────────────────────────────────────────
  "nav.worlds":  { en: "Worlds of Adventure", es: "Mundos de Aventura", ar: "عوالم المغامرة", zh: "冒险世界", fr: "Mondes d'Aventure" },
  "nav.plan":    { en: "Plan", es: "Planificar", ar: "خطّط", zh: "规划", fr: "Planifier" },
  // "Read Before Travel", not "Guides" (David 2026-08-10). It's an instruction
  // rather than a label, and it's the half that was doing the work — measured, the
  // header had no room for both.
  "nav.guides":  { en: "Read Before Travel", es: "Léelo antes de viajar", ar: "اقرأ قبل السفر", zh: "出行前必读", fr: "À lire avant de partir" },
  "nav.about":   { en: "About", es: "Acerca de", ar: "من نحن", zh: "关于", fr: "À propos" },
  "nav.signin":  { en: "Sign in", es: "Iniciar sesión", ar: "تسجيل الدخول", zh: "登录", fr: "Se connecter" },
  "nav.atlas":   { en: "Speak with Atlas", es: "Habla con Atlas", ar: "تحدّث مع Atlas", zh: "与 Atlas 对话", fr: "Parler avec Atlas" },

  // ── Home hero (first screen a cold visitor sees) ────────────────────────
  "hero.eyebrow": { en: "A Travel Operating System", es: "Un Sistema Operativo de Viajes", ar: "نظام تشغيل للسفر", zh: "旅行操作系统", fr: "Un Système d'Exploitation du Voyage" },
  "hero.title1":  { en: "Your next journey, ", es: "Tu próximo viaje, ", ar: "رحلتك القادمة، ", zh: "你的下一段旅程，", fr: "Votre prochain voyage, " },
  "hero.title2":  { en: "designed around you.", es: "diseñado en torno a ti.", ar: "مصمَّمة حولك.", zh: "为你而设计。", fr: "conçu autour de vous." },
  "hero.lead":    {
    en: "Tell us what moves you. We route you from a single spark — an interest, a place, a feeling — all the way to a booked, beautifully organized trip. One clear step at a time.",
    es: "Cuéntanos qué te mueve. Te llevamos desde una sola chispa —un interés, un lugar, una emoción— hasta un viaje reservado y bellamente organizado. Un paso claro a la vez.",
    ar: "أخبِرنا بما يحرّكك، وننطلق بك من شرارة واحدة — اهتمامٌ أو مكانٌ أو شعور — إلى رحلة محجوزة ومنظَّمة بعناية، خطوةً واضحةً في كل مرّة.",
    zh: "告诉我们什么打动你。我们从一个火花——一种兴趣、一个地方、一种感觉——一路带你抵达一趟已预订、精心安排的旅程。每次一个清晰的步骤。",
    fr: "Dites-nous ce qui vous inspire. Nous vous menons d'une simple étincelle — un intérêt, un lieu, une émotion — jusqu'à un voyage réservé et magnifiquement organisé. Une étape claire à la fois.",
  },
  "hero.cta1": { en: "Design Your Dream Journey", es: "Diseña el viaje de tus sueños", ar: "صمِّم رحلة أحلامك", zh: "设计你的梦想旅程", fr: "Concevez le voyage de vos rêves" },
  "hero.cta2": { en: "Not sure? Speak with Atlas", es: "¿No estás seguro? Habla con Atlas", ar: "لست متأكّدًا؟ تحدّث مع Atlas", zh: "还不确定？与 Atlas 对话", fr: "Pas sûr ? Parlez avec Atlas" },
  "hero.taps1": { en: "4 taps from here to a booked trip", es: "De aquí a un viaje reservado en 4 toques", ar: "من هنا إلى رحلة محجوزة في 4 نقرات", zh: "从这里到预订成行，只需 4 步", fr: "4 étapes d'ici à un voyage réservé" },
  "hero.taps2": { en: "No account needed to start", es: "No necesitas cuenta para empezar", ar: "لا حاجة إلى حساب للبدء", zh: "无需账户即可开始", fr: "Aucun compte requis pour commencer" },

  // ── Home · "What is TravelWell" ─────────────────────────────────────────
  "what.eyebrow": { en: "What is TravelWell", es: "Qué es TravelWell", ar: "ما هو TravelWell", zh: "什么是 TravelWell", fr: "Qu'est-ce que TravelWell" },
  "what.title1":  { en: "A travel operating system that designs the whole trip — ", es: "Un sistema operativo de viajes que diseña todo el viaje — ", ar: "نظام تشغيل للسفر يصمِّم الرحلة بأكملها — ", zh: "一个为你设计整趟旅程的旅行操作系统 — ", fr: "Un système d'exploitation du voyage qui conçoit tout le voyage — " },
  "what.title2":  { en: "around you.", es: "en torno a ti.", ar: "حولك.", zh: "围绕你。", fr: "autour de vous." },
  "what.lead": {
    en: "Most sites sell you one booking and leave the rest to you. TravelWell starts with what moves you, then assembles every piece — flights, stays, dining, transport, activities and more — into one beautifully organized journey you actually control.",
    es: "La mayoría de los sitios te venden una reserva y te dejan el resto a ti. TravelWell empieza por lo que te mueve y reúne cada pieza —vuelos, alojamientos, gastronomía, transporte, actividades y más— en un viaje bellamente organizado que tú controlas de verdad.",
    ar: "معظم المواقع تبيعك حجزًا واحدًا وتترك لك الباقي. يبدأ TravelWell بما يحرّكك، ثم يجمع كل التفاصيل — الطيران، الإقامة، الطعام، التنقّل، الأنشطة والمزيد — في رحلة واحدة منظَّمة بأناقة، وأنت مَن يمسك بزمامها.",
    zh: "大多数网站只卖你一次预订，其余的都留给你。TravelWell 从打动你的事物开始，再把每个环节——机票、住宿、餐饮、交通、活动等——组合成一趟精心安排、真正由你掌控的旅程。",
    fr: "La plupart des sites vous vendent une réservation et vous laissent le reste. TravelWell part de ce qui vous inspire, puis assemble chaque élément — vols, hébergements, restauration, transport, activités et plus — en un voyage magnifiquement organisé que vous contrôlez vraiment.",
  },
  "what.cta":     { en: "Start designing — it's free", es: "Empieza a diseñar — es gratis", ar: "ابدأ التصميم — مجّانًا", zh: "开始设计——免费", fr: "Commencez à concevoir — c'est gratuit" },
  "what.ctaNote": { en: "4 taps to a booked trip · no account needed to start", es: "4 toques hasta un viaje reservado · sin cuenta para empezar", ar: "4 نقرات إلى رحلة محجوزة · لا حاجة إلى حساب للبدء", zh: "4 步即可预订成行 · 无需账户即可开始", fr: "4 étapes vers un voyage réservé · aucun compte requis" },

  // ── Home · How-it-works steps ───────────────────────────────────────────
  "step1.title": { en: "Tell us what moves you", es: "Cuéntanos qué te mueve", ar: "أخبِرنا بما يحرّكك", zh: "告诉我们什么打动你", fr: "Dites-nous ce qui vous inspire" },
  "step1.body":  { en: "Pick the ways you love to travel — safari, romance, culinary, and more. Or just speak with Atlas.", es: "Elige las formas en que te gusta viajar —safari, romance, gastronomía y más. O habla con Atlas.", ar: "اختر الطرق التي تحب السفر بها — سفاري، رومانسية، تجارب طهي والمزيد. أو تحدّث مع Atlas.", zh: "选择你喜欢的旅行方式——野生动物、浪漫、美食等等。或者直接与 Atlas 对话。", fr: "Choisissez vos façons de voyager préférées — safari, romance, gastronomie et plus. Ou parlez avec Atlas." },
  "step2.title": { en: "Choose where in the world", es: "Elige dónde en el mundo", ar: "اختر وجهتك في العالم", zh: "选择世界的何处", fr: "Choisissez où dans le monde" },
  "step2.body":  { en: "Thirteen regions, each with researched destinations and an accurate Safety Card you can trust.", es: "Trece regiones, cada una con destinos investigados y una Tarjeta de Seguridad precisa en la que puedes confiar.", ar: "ثلاث عشرة منطقة، كلٌّ بوجهات مدروسة وبطاقة أمان دقيقة يمكنك الوثوق بها.", zh: "十三个地区，每个都有经过研究的目的地和一张你可以信赖的准确安全卡。", fr: "Treize régions, chacune avec des destinations étudiées et une Carte de Sécurité fiable." },
  "step3.title": { en: "Move through the Wells", es: "Recorre los Wells", ar: "تنقّل عبر الـ Wells", zh: "穿行于各个 Well", fr: "Parcourez les Wells" },
  "step3.body":  { en: "Flights, stays, dining, transport, activities — each Well surfaces the best 6 providers, matched to you.", es: "Vuelos, alojamientos, gastronomía, transporte, actividades — cada Well muestra los 6 mejores proveedores, elegidos para ti.", ar: "الطيران، الإقامة، الطعام، التنقّل، الأنشطة — كل Well يعرض أفضل 6 مزوّدين، مختارين لك.", zh: "机票、住宿、餐饮、交通、活动——每个 Well 呈现最匹配你的 6 家优选供应商。", fr: "Vols, hébergements, restauration, transport, activités — chaque Well présente les 6 meilleurs prestataires, choisis pour vous." },
  "step4.title": { en: "Book it — all in one trip", es: "Resérvalo — todo en un solo viaje", ar: "احجزها — كلّها في رحلة واحدة", zh: "预订——全部集于一趟行程", fr: "Réservez — tout en un seul voyage" },
  "step4.body":  { en: "Everything lands in a single itinerary, always saved. You always choose, and you always book.", es: "Todo queda en un único itinerario, siempre guardado. Tú siempre eliges, y tú siempre reservas.", ar: "كل شيء يجتمع في مسار واحد، محفوظ دائمًا. أنت دائمًا من يختار، وأنت دائمًا من يحجز.", zh: "一切都归入一份始终保存的行程。你始终选择，你始终预订。", fr: "Tout se réunit dans un seul itinéraire, toujours enregistré. Vous choisissez et réservez toujours." },

  // ── Home · Featured interests header ────────────────────────────────────
  "feat.eyebrow": { en: "Start with what moves you", es: "Empieza por lo que te mueve", ar: "ابدأ بما يحرّكك", zh: "从打动你的事物开始", fr: "Commencez par ce qui vous inspire" },
  "feat.title":   { en: "Pick up to 3. Two is the sweet spot.", es: "Elige hasta 3. Dos es el punto ideal.", ar: "اختر حتى 3. اثنان هو الأمثل.", zh: "最多选 3 个，两个最理想。", fr: "Choisissez-en jusqu'à 3. Deux, c'est l'idéal." },
  "feat.lead":    { en: "Tap the ways you love to travel — they light up as you go. Most journeys shine with 1–2, but some need 3 (Family + Tropical + Romance, say). You can fine-tune anytime.", es: "Toca las formas en que te gusta viajar — se iluminan a medida que avanzas. La mayoría de los viajes brillan con 1–2, pero algunos necesitan 3 (Familia + Tropical + Romance, por ejemplo). Ajústalo cuando quieras.", ar: "انقر على الطرق التي تحب السفر بها — تُضيء أثناء تقدّمك. معظم الرحلات تتألّق بواحدة أو اثنتين، لكن بعضها يحتاج ثلاثًا (عائلة + استوائي + رومانسية مثلًا). يمكنك التعديل في أي وقت.", zh: "点选你喜欢的旅行方式——它们会随之亮起。大多数旅程有 1–2 个就很出彩，有些需要 3 个（比如家庭 + 热带 + 浪漫）。你随时可以微调。", fr: "Touchez vos façons de voyager préférées — elles s'illuminent au fil de votre choix. La plupart des voyages brillent avec 1–2, mais certains en demandent 3 (Famille + Tropical + Romance). Ajustez à tout moment." },
  "feat.link":    { en: "All {n} interests", es: "Los {n} intereses", ar: "كل الاهتمامات الـ{n}", zh: "全部 {n} 种兴趣", fr: "Les {n} centres d'intérêt" },
  "pill.live":    { en: "Live", es: "En vivo", ar: "متاح", zh: "已上线", fr: "En ligne" },
  "pill.preview": { en: "Preview", es: "Próximamente", ar: "قريبًا", zh: "预览", fr: "Bientôt" },
  "card.lux":     { en: "Luxury & Ultra", es: "Lujo y Ultra", ar: "الفخامة و Ultra", zh: "奢华与 Ultra", fr: "Luxe & Ultra" },
  "card.all":     { en: "All travelers", es: "Todos los viajeros", ar: "لكل المسافرين", zh: "所有旅行者", fr: "Tous les voyageurs" },

  // ── Home · Operating-System bands ───────────────────────────────────────
  "os.eyebrow": { en: "How it all fits together", es: "Cómo encaja todo", ar: "كيف يتكامل كل شيء", zh: "一切如何契合", fr: "Comment tout s'articule" },
  "os.title":   { en: "A Travel Operating System.", es: "Un Sistema Operativo de Viajes.", ar: "نظام تشغيل للسفر.", zh: "旅行操作系统。", fr: "Un Système d'Exploitation du Voyage." },
  "os.lead":    { en: "Behind the calm surface, an organized engine routes every traveler from a spark of interest, to a place, to what excites them, to every need met — ending in a vetted, booked plan. Four moving parts, one effortless journey.", es: "Tras la superficie serena, un motor organizado guía a cada viajero desde una chispa de interés, a un lugar, a lo que le emociona, hasta cubrir cada necesidad — terminando en un plan verificado y reservado. Cuatro piezas, un viaje sin esfuerzo.", ar: "خلف السطح الهادئ، محرّك منظَّم يقود كل مسافر من شرارة اهتمام، إلى مكان، إلى ما يثيره، إلى تلبية كل حاجة — لينتهي بخطة موثوقة ومحجوزة. أربعة عناصر متناغمة، ورحلة واحدة بلا عناء.", zh: "在平静的表象之下，一套有序的引擎将每位旅行者从一丝兴趣，引向一个地方、引向令其心动之处、直至满足每一项需求——最终成就一份经过甄选、已然预订的方案。四个环节，一趟轻松的旅程。", fr: "Sous la surface paisible, un moteur organisé mène chaque voyageur d'une étincelle d'intérêt, à un lieu, à ce qui l'enthousiasme, à chaque besoin comblé — pour aboutir à un plan vérifié et réservé. Quatre pièces, un voyage sans effort." },
  "os.band1.eyebrow": { en: "Ways to travel", es: "Formas de viajar", ar: "طرق السفر", zh: "旅行的方式", fr: "Façons de voyager" },
  "os.band1.title":   { en: "Special Interests", es: "Intereses Especiales", ar: "الاهتمامات الخاصّة", zh: "特别兴趣", fr: "Centres d'Intérêt" },
  "os.band1.body":    { en: "Twenty-five reasons to go — from Safari & Wildlife to Culinary Journeys to Wellness. Pick one or two, and the system shapes everything else around them.", es: "Veinticinco razones para ir — de Safari y Vida Salvaje a Viajes Gastronómicos y Bienestar. Elige uno o dos, y el sistema moldea todo lo demás en torno a ellos.", ar: "خمسة وعشرون سببًا للسفر — من السفاري والحياة البرّية إلى رحلات الطهي والعافية. اختر واحدًا أو اثنين، ويشكّل النظام كل شيء آخر حولها.", zh: "二十五个出发的理由——从野生动物到美食之旅再到养生。选一两个，系统便围绕它们安排其余一切。", fr: "Vingt-cinq raisons de partir — du safari aux voyages gastronomiques en passant par le bien-être. Choisissez-en un ou deux, et le système organise tout le reste autour." },
  "os.band1.cta":     { en: "Explore all {n}", es: "Explora los {n}", ar: "استكشف الـ{n} كلّها", zh: "浏览全部 {n} 种", fr: "Explorer les {n}" },
  "os.band2.eyebrow": { en: "Every travel need, met", es: "Cada necesidad, cubierta", ar: "كل حاجة سفر مُلبّاة", zh: "每一项旅行需求，皆有着落", fr: "Chaque besoin, comblé" },
  "os.band2.title":   { en: "The Wells", es: "Los Wells", ar: "الـ Wells", zh: "各个 Well", fr: "Les Wells" },
  "os.band2.body":    { en: "Each Well maps to a need the way an organ maps to the body — Fly, Stay, Eat, Move, and more. Fill them as you go; the journey is whole when they are.", es: "Cada Well corresponde a una necesidad como un órgano al cuerpo — Fly, Stay, Eat, Move y más. Complétalos a medida que avanzas; el viaje está completo cuando ellos lo están.", ar: "كل Well يقابل حاجة كما يقابل العضو الجسد — الطيران، الإقامة، الطعام، التنقّل والمزيد. املأها تباعًا؛ تكتمل الرحلة باكتمالها.", zh: "每个 Well 都对应一项需求，如同器官之于身体——飞行、住宿、餐饮、出行等等。边走边填满它们；当它们齐全，旅程也就完整。", fr: "Chaque Well correspond à un besoin comme un organe au corps — Fly, Stay, Eat, Move et plus. Remplissez-les au fil du temps ; le voyage est complet quand ils le sont." },
  "os.band2.cta":     { en: "Discover the Wells", es: "Descubre los Wells", ar: "اكتشف الـ Wells", zh: "了解各个 Well", fr: "Découvrir les Wells" },
  "os.band3.eyebrow": { en: "From 01F to 13A", es: "De 01F a 13A", ar: "من 01F إلى 13A", zh: "从 01F 到 13A", fr: "De 01F à 13A" },
  "os.band3.title":   { en: "World Regions", es: "Regiones del Mundo", ar: "مناطق العالم", zh: "世界地区", fr: "Régions du Monde" },
  "os.band3.body":    { en: "The whole map, organized — Western Europe to the Caribbean, each region scored for safety and stitched into your route, never a detour off it.", es: "Todo el mapa, organizado — de Europa Occidental al Caribe, cada región puntuada por seguridad e integrada en tu ruta, nunca un desvío.", ar: "الخريطة كاملة، منظَّمة — من أوروبا الغربية إلى الكاريبي، كل منطقة مُقيَّمة أمنيًّا ومنسوجة في مسارك، لا التفافًا عنه.", zh: "整张地图，井然有序——从西欧到加勒比，每个地区都经过安全评分，并编织进你的路线，绝不偏离。", fr: "Toute la carte, organisée — de l'Europe de l'Ouest aux Caraïbes, chaque région évaluée pour sa sécurité et intégrée à votre itinéraire, jamais un détour." },
  "os.band3.cta":     { en: "Browse all {n} regions", es: "Explora las {n} regiones", ar: "تصفّح المناطق الـ{n}", zh: "浏览全部 {n} 个地区", fr: "Parcourir les {n} régions" },
  "os.band4.eyebrow": { en: "Curated, never overwhelming", es: "Seleccionado, nunca abrumador", ar: "منتقى، دون إرباك", zh: "精选，绝不冗杂", fr: "Sélectionné, jamais accablant" },
  "os.band4.title":   { en: "The best matches, not endless lists", es: "Las mejores opciones, no listas interminables", ar: "أفضل الخيارات، لا قوائم لا تنتهي", zh: "最佳匹配，而非无尽清单", fr: "Les meilleures options, pas des listes sans fin" },
  "os.band4.body":    { en: "Six best recommendations for each part of your trip — matched to you and your budget. Want more? Tap “See more.” And if a booking earns us a commission, we say so right there.", es: "Seis mejores recomendaciones para cada parte de tu viaje — según tú y tu presupuesto. ¿Quieres más? Toca «Ver más». Y si una reserva nos da comisión, lo decimos ahí mismo.", ar: "ست توصيات هي الأفضل لكل جزء من رحلتك — مختارة لك ولميزانيتك. تريد المزيد؟ انقر «عرض المزيد». وإن كان الحجز يمنحنا عمولة، نقول ذلك هناك مباشرة.", zh: "为你旅程的每一环节精选六项最佳推荐——契合你与你的预算。想看更多？点“查看更多”。若某项预订让我们获得佣金，我们会当场说明。", fr: "Six meilleures recommandations pour chaque partie de votre voyage — selon vous et votre budget. Envie de plus ? Touchez « Voir plus ». Et si une réservation nous rapporte une commission, nous le disons sur-le-champ." },
  "os.band4.cta":     { en: "See how it works", es: "Cómo funciona", ar: "كيف يعمل", zh: "了解运作方式", fr: "Voir comment ça marche" },
  "os.arch":          { en: "See the full architecture", es: "Ver la arquitectura completa", ar: "اطّلع على البنية الكاملة", zh: "查看完整架构", fr: "Voir l'architecture complète" },

  // ── Home · Concierge / "Just talk to me" ────────────────────────────────
  "talk.eyebrow": { en: "Meet your Concierge", es: "Conoce a tu Concierge", ar: "تعرّف على مرشدك", zh: "认识你的专属礼宾", fr: "Rencontrez votre Concierge" },
  "talk.title1":  { en: "Don't know where to start? ", es: "¿No sabes por dónde empezar? ", ar: "لا تعرف من أين تبدأ؟ ", zh: "不知从何开始？", fr: "Vous ne savez pas par où commencer ? " },
  "talk.title2":  { en: "Just talk to me.", es: "Solo háblame.", ar: "فقط تحدّث معي.", zh: "跟我说说就好。", fr: "Parlez-moi, tout simplement." },
  "talk.lead":    { en: "Your Concierge is a travel expert that lives on every page. Tell it your dream in plain words — by typing or speaking — and watch a real, bookable trip take shape in seconds. No forms, no jargon.", es: "Tu Concierge es un experto en viajes que vive en cada página. Cuéntale tu sueño con palabras sencillas — escribiendo o hablando — y mira cómo un viaje real y reservable toma forma en segundos. Sin formularios, sin jerga.", ar: "مرشدك خبير سفر يعيش في كل صفحة. أخبِره بحلمك بكلمات بسيطة — كتابةً أو حديثًا — وشاهد رحلة حقيقية قابلة للحجز تتشكّل في ثوانٍ. بلا نماذج، بلا مصطلحات.", zh: "你的礼宾是常驻每个页面的旅行专家。用平实的话告诉它你的梦想——打字或说话皆可——看着一趟真实、可预订的行程在数秒内成形。没有表单，没有术语。", fr: "Votre Concierge est un expert du voyage présent sur chaque page. Dites-lui votre rêve en mots simples — en tapant ou en parlant — et voyez un vrai voyage réservable prendre forme en quelques secondes. Sans formulaires, sans jargon." },
  "talk.feat1.b": { en: "Type or talk", es: "Escribe o habla", ar: "اكتب أو تحدّث", zh: "打字或说话", fr: "Écrivez ou parlez" },
  "talk.feat1.s": { en: "Chat by keyboard or just speak — whatever feels easy.", es: "Chatea con el teclado o simplemente habla — lo que te resulte fácil.", ar: "دردش بلوحة المفاتيح أو تحدّث فحسب — كما يناسبك.", zh: "用键盘聊天，或直接说话——怎么方便怎么来。", fr: "Discutez au clavier ou parlez simplement — comme il vous plaît." },
  "talk.feat2.b": { en: "Read or hear it", es: "Léelo o escúchalo", ar: "اقرأه أو استمع إليه", zh: "可读可听", fr: "Lisez ou écoutez" },
  "talk.feat2.s": { en: "It answers in text, or reads replies aloud to you.", es: "Responde por texto, o te lee las respuestas en voz alta.", ar: "يجيب نصًّا، أو يقرأ الردود بصوتٍ عالٍ لك.", zh: "以文字作答，或将回复朗读给你听。", fr: "Il répond par écrit, ou vous lit les réponses à voix haute." },
  "talk.feat3.b": { en: "It knows your trip", es: "Conoce tu viaje", ar: "يعرف رحلتك", zh: "它了解你的行程", fr: "Il connaît votre voyage" },
  "talk.feat3.s": { en: "Sees your interests, region & plan — so advice fits you.", es: "Ve tus intereses, región y plan — para que el consejo te encaje.", ar: "يرى اهتماماتك ومنطقتك وخطّتك — لتناسبك النصيحة.", zh: "了解你的兴趣、地区与计划——让建议贴合你。", fr: "Il voit vos intérêts, votre région et votre plan — pour des conseils adaptés." },
  "talk.feat4.b": { en: "You're in control", es: "Tú tienes el control", ar: "أنت المتحكّم", zh: "你掌控一切", fr: "Vous gardez le contrôle" },
  "talk.feat4.s": { en: "It suggests; you always choose and book. Say “stop” anytime.", es: "Sugiere; tú siempre eliges y reservas. Di «para» cuando quieras.", ar: "يقترح؛ وأنت من يختار ويحجز دائمًا. قل «توقّف» متى شئت.", zh: "它提建议；你始终自主选择与预订。随时说“停”。", fr: "Il suggère ; vous choisissez et réservez toujours. Dites « stop » à tout moment." },
  "talk.cta":     { en: "Try the Concierge", es: "Prueba el Concierge", ar: "جرّب المرشد", zh: "试用礼宾", fr: "Essayer le Concierge" },
  "talk.note":    { en: "Free to try · no account needed · powered by Atlas", es: "Gratis para probar · sin cuenta · con la tecnología de Atlas", ar: "تجربة مجّانية · بلا حساب · مدعوم بـ Atlas", zh: "免费试用 · 无需账户 · 由 Atlas 提供支持", fr: "Essai gratuit · sans compte · propulsé par Atlas" },

  // ── Footer ──────────────────────────────────────────────────────────────
  "foot.sig":       { en: "If it's a once-in-a-lifetime journey…", es: "Si es un viaje único en la vida…", ar: "إن كانت رحلة العمر…", zh: "如果这是一生一次的旅程……", fr: "Si c'est un voyage unique…" },
  "foot.system":    { en: "The System", es: "El Sistema", ar: "النظام", zh: "系统", fr: "Le Système" },
  "foot.journeys":  { en: "Journeys", es: "Viajes", ar: "الرحلات", zh: "旅程", fr: "Voyages" },
  "foot.partners":  { en: "Partners & Proof", es: "Socios y Pruebas", ar: "الشركاء والإثبات", zh: "合作伙伴与实证", fr: "Partenaires & Preuves" },
  "foot.company":   { en: "Company", es: "Empresa", ar: "الشركة", zh: "公司", fr: "Entreprise" },
  "foot.about":     { en: "About / Architecture", es: "Acerca de / Arquitectura", ar: "من نحن / البنية", zh: "关于 / 架构", fr: "À propos / Architecture" },
  "foot.si":        { en: "{n} Special Interests", es: "{n} Intereses Especiales", ar: "{n} اهتمامًا خاصًّا", zh: "{n} 种特别兴趣", fr: "{n} Centres d'Intérêt" },
  "foot.regions":   { en: "{n} Regions", es: "{n} Regiones", ar: "{n} منطقة", zh: "{n} 个地区", fr: "{n} Régions" },
  "foot.wells":     { en: "{n} Wells", es: "{n} Wells", ar: "{n} Wells", zh: "{n} 个 Well", fr: "{n} Wells" },
  "foot.providers": { en: "200+ Providers", es: "Más de 200 proveedores", ar: "أكثر من 200 مزوّد", zh: "200+ 家供应商", fr: "200+ prestataires" },
  "foot.plan":      { en: "Plan Your Trip", es: "Planifica tu viaje", ar: "خطّط لرحلتك", zh: "规划你的行程", fr: "Planifiez votre voyage" },
  "foot.guides":    { en: "Travel Guides", es: "Guías de viaje", ar: "أدلّة السفر", zh: "旅行指南", fr: "Guides de voyage" },
  "foot.luxury":    { en: "Luxury Worlds", es: "Mundos de Lujo", ar: "عوالم الفخامة", zh: "奢华世界", fr: "Mondes de Luxe" },
  "foot.destinations": { en: "Destinations", es: "Destinos", ar: "الوجهات", zh: "目的地", fr: "Destinations" },
  "foot.itinerary": { en: "Your Itinerary", es: "Tu itinerario", ar: "مسارك", zh: "你的行程", fr: "Votre itinéraire" },
  "foot.demo":      { en: "Public Demo", es: "Demo pública", ar: "عرض عام", zh: "公开演示", fr: "Démo publique" },
  "foot.vcdemo":    { en: "VC Demo", es: "Demo para inversores", ar: "عرض للمستثمرين", zh: "投资人演示", fr: "Démo investisseurs" },
  "foot.firstaid":  { en: "First Aid Kit", es: "Botiquín", ar: "حقيبة الإسعافات", zh: "急救包", fr: "Trousse de secours" },
  "foot.sitemap":   { en: "Sitemap", es: "Mapa del sitio", ar: "خريطة الموقع", zh: "网站地图", fr: "Plan du site" },
  "foot.disclosure":{ en: "Affiliate Disclosure", es: "Divulgación de afiliados", ar: "إفصاح الشراكة", zh: "联盟披露", fr: "Divulgation d'affiliation" },
  "foot.contact":   { en: "Contact", es: "Contacto", ar: "اتصل بنا", zh: "联系我们", fr: "Contact" },
  "foot.privacy":   { en: "Privacy Policy", es: "Política de privacidad", ar: "سياسة الخصوصية", zh: "隐私政策", fr: "Politique de confidentialité" },
  "foot.terms":     { en: "Terms of Service", es: "Términos del servicio", ar: "شروط الخدمة", zh: "服务条款", fr: "Conditions d'utilisation" },
  "foot.copy":      { en: "© 2026 TravelWell.World — every link disclosed, every fact real.", es: "© 2026 TravelWell.World — cada enlace declarado, cada dato real.", ar: "© 2026 TravelWell.World — كل رابط مُفصَح عنه، وكل معلومة حقيقية.", zh: "© 2026 TravelWell.World — 每个链接都已披露，每个事实都真实。", fr: "© 2026 TravelWell.World — chaque lien divulgué, chaque fait réel." },

  // ── Regions page ────────────────────────────────────────────────────────
  "reg.eyebrow": { en: "The Dream Journey · Step 2 of 4", es: "El Viaje Soñado · Paso 2 de 4", ar: "رحلة الأحلام · الخطوة 2 من 4", zh: "梦想旅程 · 第 2 步 / 共 4 步", fr: "Le Voyage de Rêve · Étape 2 sur 4" },
  "reg.h1": { en: "Now — where in the world?", es: "Ahora — ¿dónde en el mundo?", ar: "الآن — إلى أين في العالم؟", zh: "现在——去世界的哪里？", fr: "Maintenant — où dans le monde ?" },
  "reg.lead": { en: "Thirteen regions, each a different promise. We've ordered them by how well they fit the way you love to travel.", es: "Trece regiones, cada una una promesa distinta. Las hemos ordenado según lo bien que encajan con tu forma de viajar.", ar: "ثلاث عشرة منطقة، كلٌّ وعدٌ مختلف. رتّبناها بحسب مدى ملاءمتها لطريقتك في السفر.", zh: "十三个地区，各有不同的允诺。我们按它们与你旅行方式的契合度排序。", fr: "Treize régions, chacune une promesse différente. Nous les avons classées selon leur adéquation à votre façon de voyager." },
  "reg.sortMatch": { en: "Best for your interests", es: "Mejor para tus intereses", ar: "الأنسب لاهتماماتك", zh: "最契合你的兴趣", fr: "Idéal pour vos intérêts" },
  "reg.sortAll": { en: "All regions", es: "Todas las regiones", ar: "كل المناطق", zh: "所有地区", fr: "Toutes les régions" },
  "reg.pick": { en: "{n} regions · pick one to keep building", es: "{n} regiones · elige una para seguir construyendo", ar: "{n} منطقة · اختر واحدة لمواصلة البناء", zh: "{n} 个地区 · 选一个继续搭建", fr: "{n} régions · choisissez-en une pour continuer" },
  "reg.countries": { en: "Countries", es: "Países", ar: "الدول", zh: "国家", fr: "Pays" },
  "reg.gateways": { en: "Gateways", es: "Puertas de entrada", ar: "بوّابات الوصول", zh: "门户机场", fr: "Portes d'entrée" },
  "reg.explore": { en: "Explore", es: "Explorar", ar: "استكشف", zh: "探索", fr: "Explorer" },
  "reg.strong": { en: "Strong match", es: "Coincidencia fuerte", ar: "تطابق قوي", zh: "高度契合", fr: "Forte correspondance" },
  "reg.good": { en: "Good match", es: "Buena coincidencia", ar: "تطابق جيّد", zh: "良好契合", fr: "Bonne correspondance" },
  "reg.subChip": { en: "Sub-regions", es: "Subregiones", ar: "مناطق فرعية", zh: "子地区", fr: "Sous-régions" },

  // ── Special Interests page ──────────────────────────────────────────────
  "sip.eyebrow": { en: "The Dream Journey · Step 1 of 4", es: "El Viaje Soñado · Paso 1 de 4", ar: "رحلة الأحلام · الخطوة 1 من 4", zh: "梦想旅程 · 第 1 步 / 共 4 步", fr: "Le Voyage de Rêve · Étape 1 sur 4" },
  "sip.h1": { en: "How do you love to travel?", es: "¿Cómo te gusta viajar?", ar: "كيف تحب أن تسافر؟", zh: "你喜欢怎样旅行？", fr: "Comment aimez-vous voyager ?" },
  "sip.now": { en: "Ready now", es: "Disponible ahora", ar: "متاح الآن", zh: "现已就绪", fr: "Prêt maintenant" },
  "sip.all": { en: "All", es: "Todos", ar: "الكل", zh: "全部", fr: "Tous" },
  "sip.soon": { en: "Coming soon", es: "Próximamente", ar: "قريبًا", zh: "即将推出", fr: "Bientôt" },
  "sip.lead": { en: "Start with the feeling, not the place. Pick the ways of traveling that pull at you — we'll shape everything else around them.", es: "Empieza por la sensación, no por el lugar. Elige las formas de viajar que te atraen — daremos forma a todo lo demás en torno a ellas.", ar: "ابدأ بالإحساس، لا بالمكان. اختر طرق السفر التي تجذبك — وسنشكّل كل شيء آخر حولها.", zh: "从感觉开始，而非地点。选出吸引你的旅行方式——我们会围绕它们安排其余一切。", fr: "Commencez par le ressenti, pas par le lieu. Choisissez les façons de voyager qui vous attirent — nous façonnerons tout le reste autour." },
  "sip.sweet": { en: "Choose up to 3", es: "Elige hasta 3", ar: "اختر حتى 3", zh: "最多选 3 个", fr: "Choisissez-en jusqu'à 3" },
  "sip.sweetTail": { en: "1–2 is the sweet spot", es: "1–2 es el punto ideal", ar: "1–2 هو الأمثل", zh: "1–2 个最理想", fr: "1–2, c'est l'idéal" },
  "sip.view": { en: "View", es: "Ver", ar: "عرض", zh: "查看", fr: "Voir" },
  "sip.add": { en: "Add", es: "Añadir", ar: "أضف", zh: "添加", fr: "Ajouter" },
  "sip.added": { en: "Added", es: "Añadido", ar: "مُضاف", zh: "已添加", fr: "Ajouté" },
  "sip.addLabel": { en: "Add {name} to your journey", es: "Añadir {name} a tu viaje", ar: "أضف {name} إلى رحلتك", zh: "将{name}加入你的旅程", fr: "Ajouter {name} à votre voyage" },
  "sip.removeLabel": { en: "Remove {name} from your journey", es: "Quitar {name} de tu viaje", ar: "أزل {name} من رحلتك", zh: "从旅程中移除{name}", fr: "Retirer {name} de votre voyage" },
  "sip.openLabel": { en: "Open {name}", es: "Abrir {name}", ar: "افتح {name}", zh: "打开{name}", fr: "Ouvrir {name}" },
  "sip.openSoonLabel": { en: "{name} — coming soon. Open its page.", es: "{name} — próximamente. Abrir su página.", ar: "{name} — قريبًا. افتح صفحته.", zh: "{name}——即将推出。打开其页面。", fr: "{name} — bientôt. Ouvrir sa page." },

  // ── Wells page ──────────────────────────────────────────────────────────
  "wl.eyebrow": { en: "The TravelWell Ecosystem", es: "El Ecosistema TravelWell", ar: "منظومة TravelWell", zh: "TravelWell 生态", fr: "L'Écosystème TravelWell" },
  "wl.h1": { en: "Every need a trip has, in its own Well.", es: "Cada necesidad de un viaje, en su propio Well.", ar: "كل حاجة للرحلة، في Well خاصّ بها.", zh: "旅程的每一项需求，各归其 Well。", fr: "Chaque besoin d'un voyage, dans son propre Well." },
  "wl.lead": { en: "We organized travel the way the body works — ten interconnected systems, each covering one part of your journey, all feeding one itinerary. Pick a Well to meet its vetted partners.", es: "Organizamos el viaje como funciona el cuerpo — diez sistemas interconectados, cada uno cubre una parte de tu viaje, todos alimentan un único itinerario. Elige un Well para conocer a sus socios verificados.", ar: "نظّمنا السفر كما يعمل الجسد — عشرة أنظمة مترابطة، كلٌّ يغطّي جزءًا من رحلتك، وجميعها تصبّ في مسار واحد. اختر Well لتتعرّف على شركائه الموثوقين.", zh: "我们像人体运作那样组织旅行——十个相互关联的系统，各自涵盖旅程的一部分，全部汇入一份行程。选择一个 Well，认识它甄选的合作伙伴。", fr: "Nous avons organisé le voyage comme fonctionne le corps — dix systèmes interconnectés, chacun couvrant une partie de votre voyage, tous alimentant un seul itinéraire. Choisissez un Well pour rencontrer ses partenaires vérifiés." },
  "wl.tenLabel": { en: "The ten Wells", es: "Los diez Wells", ar: "الـ Wells العشرة", zh: "十个 Well", fr: "Les dix Wells" },
  "wl.meet": { en: "Meet the partners", es: "Conoce a los socios", ar: "تعرّف على الشركاء", zh: "认识合作伙伴", fr: "Rencontrer les partenaires" },
  "wl.activated": { en: "Activated at Launch", es: "Activado en el lanzamiento", ar: "يُفعَّل عند الإطلاق", zh: "上线时启用", fr: "Activé au lancement" },
  "wl.comingFoot": { en: "Coming at launch — partners being vetted now", es: "Llega en el lanzamiento — socios en verificación", ar: "قادم عند الإطلاق — يجري تدقيق الشركاء الآن", zh: "上线时推出——正在甄选合作伙伴", fr: "À venir au lancement — partenaires en cours de vérification" },

  // ── Journey rail (steps) + breadcrumbs ──────────────────────────────────
  "step.interest": { en: "Interest", es: "Interés", ar: "اهتمام", zh: "兴趣", fr: "Intérêt" },
  "step.region": { en: "Region", es: "Región", ar: "المنطقة", zh: "地区", fr: "Région" },
  "step.activities": { en: "Activities", es: "Actividades", ar: "الأنشطة", zh: "活动", fr: "Activités" },
  "step.wells": { en: "Wells", es: "Wells", ar: "الـ Wells", zh: "Well", fr: "Wells" },
  "step.bookit": { en: "Book It", es: "Reservar", ar: "احجز", zh: "预订", fr: "Réserver" },
  "crumb.home": { en: "Home", es: "Inicio", ar: "الرئيسية", zh: "首页", fr: "Accueil" },
  "crumb.si": { en: "Special Interests", es: "Intereses Especiales", ar: "الاهتمامات الخاصّة", zh: "特别兴趣", fr: "Centres d'Intérêt" },
  "crumb.regions": { en: "Regions", es: "Regiones", ar: "المناطق", zh: "地区", fr: "Régions" },
  "crumb.wells": { en: "Wells", es: "Wells", ar: "الـ Wells", zh: "Well", fr: "Wells" },
  "crumb.activities": { en: "Activities", es: "Actividades", ar: "الأنشطة", zh: "活动", fr: "Activités" },
  "crumb.itinerary": { en: "Your Itinerary", es: "Tu itinerario", ar: "مسارك", zh: "你的行程", fr: "Votre itinéraire" },

  // ── Cookie consent ──────────────────────────────────────────────────────
  "consent.text": { en: "We use essential cookies and local storage to remember your trip and preferences.", es: "Usamos cookies esenciales y almacenamiento local para recordar tu viaje y preferencias.", ar: "نستخدم ملفات تعريف ارتباط أساسية وتخزينًا محليًا لتذكّر رحلتك وتفضيلاتك.", zh: "我们使用必要的 Cookie 和本地存储来记住你的行程与偏好。", fr: "Nous utilisons des cookies essentiels et le stockage local pour mémoriser votre voyage et vos préférences." },
  "consent.see": { en: "See our", es: "Consulta nuestra", ar: "اطّلع على", zh: "查看我们的", fr: "Consultez notre" },
  "consent.ok": { en: "Got it", es: "Entendido", ar: "حسنًا", zh: "知道了", fr: "Compris" },

  // ── SI groups ───────────────────────────────────────────────────────────
  "grp.premium.name": { en: "Premium & Signature", es: "Premium y Distintivos", ar: "المميّزة والأساسية", zh: "尊享与招牌", fr: "Premium & Signature" },
  "grp.premium.blurb": { en: "Our flagship ways to travel.", es: "Nuestras formas insignia de viajar.", ar: "طرقنا الرائدة للسفر.", zh: "我们的旗舰旅行方式。", fr: "Nos façons de voyager phares." },
  "grp.journeys.name": { en: "Journeys of a Lifetime", es: "Viajes de una Vida", ar: "رحلات العمر", zh: "此生必行", fr: "Voyages d'une Vie" },
  "grp.journeys.blurb": { en: "Where the journey itself is the destination.", es: "Donde el viaje mismo es el destino.", ar: "حيث الرحلة نفسها هي الوجهة.", zh: "旅程本身就是目的地。", fr: "Où le voyage lui-même est la destination." },
  "grp.adventure.name": { en: "Adventure & Active", es: "Aventura y Actividad", ar: "المغامرة والنشاط", zh: "探险与活力", fr: "Aventure & Actif" },
  "grp.adventure.blurb": { en: "The world, on your own two feet.", es: "El mundo, con tus propios pies.", ar: "العالم، على قدميك.", zh: "用双脚丈量世界。", fr: "Le monde, à vos propres pieds." },
  "grp.water.name": { en: "Water & Cruise", es: "Agua y Cruceros", ar: "الماء والرحلات البحرية", zh: "水上与游轮", fr: "Eau & Croisière" },
  "grp.water.blurb": { en: "On, under and beside the water.", es: "Sobre, bajo y junto al agua.", ar: "على الماء وتحته وبجانبه.", zh: "水上、水下与水畔。", fr: "Sur, sous et au bord de l'eau." },
  "grp.nature.name": { en: "Nature & Wellbeing", es: "Naturaleza y Bienestar", ar: "الطبيعة والعافية", zh: "自然与身心", fr: "Nature & Bien-être" },
  "grp.nature.blurb": { en: "Wild places, and coming home to yourself.", es: "Lugares salvajes, y reencontrarte contigo.", ar: "أماكن برّية، والعودة إلى ذاتك.", zh: "荒野之地，回归自我。", fr: "Lieux sauvages, et se retrouver soi-même." },
  "grp.lifestage.name": { en: "Life-Stage", es: "Etapas de la Vida", ar: "مراحل الحياة", zh: "人生阶段", fr: "Âges de la Vie" },
  "grp.lifestage.blurb": { en: "For every age, pace and party.", es: "Para cada edad, ritmo y compañía.", ar: "لكل عمر وإيقاع ورفقة.", zh: "适合每个年龄、节奏与同行人。", fr: "Pour chaque âge, rythme et compagnie." },
  "grp.culture.name": { en: "Culture, Heritage & Pilgrimage", es: "Cultura, Patrimonio y Peregrinación", ar: "الثقافة والتراث والحجّ", zh: "文化、遗产与朝圣", fr: "Culture, Patrimoine & Pèlerinage" },
  "grp.culture.blurb": { en: "The soul of a place, and the road to it.", es: "El alma de un lugar, y el camino hacia él.", ar: "روح المكان، والطريق إليه.", zh: "一个地方的灵魂，以及通往它的路。", fr: "L'âme d'un lieu, et la route qui y mène." },
  "grp.entertainment.name": { en: "Global Entertainment", es: "Entretenimiento Global", ar: "الترفيه العالمي", zh: "全球娱乐", fr: "Divertissement Mondial" },
  "grp.entertainment.blurb": { en: "The lights come up, wherever you are.", es: "Se encienden las luces, estés donde estés.", ar: "تُضاء الأنوار، أينما كنت.", zh: "灯光亮起，无论你在哪里。", fr: "Les lumières s'allument, où que vous soyez." },
  "grp.culinary.name": { en: "Culinary, Wine & Spirits", es: "Gastronomía, Vino y Destilados", ar: "الطهي والنبيذ والمشروبات", zh: "美食、葡萄酒与烈酒", fr: "Gastronomie, Vin & Spiritueux" },
  "grp.culinary.blurb": { en: "A table, a vineyard, a distillery worth the flight.", es: "Una mesa, un viñedo, una destilería que valen el vuelo.", ar: "مائدة أو كرم أو معمل تقطير يستحق الرحلة.", zh: "值得专程一飞的餐桌、酒庄与酒厂。", fr: "Une table, un vignoble, une distillerie qui valent le vol." },
  "grp.sports.name": { en: "Sports", es: "Deportes", ar: "الرياضة", zh: "体育", fr: "Sport" },
  "grp.sports.blurb": { en: "Take part, or take a seat.", es: "Participa, o toma asiento.", ar: "شارك، أو خذ مقعدك.", zh: "亲身参与，或落座观赛。", fr: "Participez, ou prenez place." },
  "grp.live": { en: "live", es: "en vivo", ar: "متاح", zh: "已上线", fr: "en ligne" },
  "grp.total": { en: "total", es: "en total", ar: "الإجمالي", zh: "共计", fr: "au total" },

  // ── Regions helper note ─────────────────────────────────────────────────
  "reg.browsePre": { en: "Browsing all {n} regions.", es: "Explorando las {n} regiones.", ar: "تصفّح المناطق الـ{n} كلّها.", zh: "正在浏览全部 {n} 个地区。", fr: "Exploration des {n} régions." },
  "reg.browseLink": { en: "Pick a couple of interests first", es: "Elige primero un par de intereses", ar: "اختر بعض الاهتمامات أولًا", zh: "先选几个兴趣", fr: "Choisissez d'abord quelques intérêts" },
  "reg.browsePost": { en: "and we'll rank these for you — or just choose a region below.", es: "y las ordenaremos para ti — o elige una región abajo.", ar: "وسنرتّبها لك — أو اختر منطقة أدناه.", zh: "我们会为你排序——或直接在下方选择一个地区。", fr: "et nous les classerons pour vous — ou choisissez une région ci-dessous." },
  "reg.ranked": { en: "Ranked for your interests.", es: "Ordenadas según tus intereses.", ar: "مرتّبة حسب اهتماماتك.", zh: "已按你的兴趣排序。", fr: "Classées selon vos intérêts." },
  "reg.rankedMid": { en: "Regions that fit", es: "Las regiones que encajan con", ar: "المناطق التي تناسب", zh: "契合", fr: "Les régions correspondant à" },
  "reg.rankedTail": { en: "rise to the top.", es: "suben a lo más alto.", ar: "تتصدّر القائمة.", zh: "会升至前列。", fr: "remontent en tête." },

  // ── Marquee Moments (TLEU forward calendar) ─────────────────────────────
  "mrq.eyebrow": { en: "Marquee Moments", es: "Momentos Estelares", ar: "لحظات بارزة", zh: "标志性时刻", fr: "Moments Phares" },
  "mrq.title": { en: "The moments worth planning around", es: "Los momentos que vale la pena planear", ar: "اللحظات التي تستحقّ التخطيط حولها", zh: "值得为之规划的时刻", fr: "Les moments qui méritent qu'on s'organise autour" },
  "mrq.lead": { en: "The world's peak events — tracked years out, with the booking window to catch them while access is still open.", es: "Los grandes eventos del mundo — seguidos con años de antelación, con la ventana de reserva para alcanzarlos mientras aún hay acceso.", ar: "أبرز أحداث العالم — نتتبّعها قبل سنوات، مع نافذة الحجز لاغتنامها قبل نفاد الأماكن.", zh: "全球顶级盛事——提前数年追踪，并标注预订窗口，让你在名额尚在时抢先把握。", fr: "Les grands événements du monde — suivis des années à l'avance, avec la fenêtre de réservation pour les saisir tant que l'accès est ouvert." },
  "mrq.flagship": { en: "Flagship", es: "Insignia", ar: "الحدث الرئيسي", zh: "旗舰", fr: "Phare" },
  "mrq.bookBy": { en: "Book by", es: "Reserva antes de", ar: "احجز قبل", zh: "预订窗口", fr: "Réserver avant" },
  "mrq.when": { en: "When", es: "Cuándo", ar: "متى", zh: "时间", fr: "Quand" },
  "mrq.seeAll": { en: "See all 70 events", es: "Ver los 70 eventos", ar: "عرض كل الأحداث الـ70", zh: "查看全部 70 项盛事", fr: "Voir les 70 événements" },
  "mrq.pageTitle": { en: "The Forward Calendar", es: "El Calendario Anticipado", ar: "التقويم الاستباقي", zh: "前瞻日历", fr: "Le Calendrier Anticipé" },
  "mrq.pageLead": { en: "70 marquee events, tracked two to four years out — so we can position you while access and inventory are still open.", es: "70 eventos estelares, seguidos con dos a cuatro años de antelación — para posicionarte mientras aún hay acceso e inventario.", ar: "70 حدثًا بارزًا، نتتبّعها قبل عامين إلى أربعة أعوام — لنهيّئ لك مكانك بينما لا يزال الوصول والأماكن متاحة.", zh: "70 项标志性盛事，提前两到四年追踪——以便在名额与资源尚在时为你抢占先机。", fr: "70 événements phares, suivis de deux à quatre ans à l'avance — pour vous positionner tant que l'accès et les places sont ouverts." },

  // ── Safety button (surfaces the emergency-numbers + first-aid data) ─────
  "safety.label": { en: "Safety", es: "Seguridad", ar: "الأمان", zh: "安全", fr: "Sécurité" },
  "safety.aria": { en: "Safety & emergency help — local numbers and first aid", es: "Seguridad y ayuda de emergencia — números locales y primeros auxilios", ar: "الأمان والمساعدة الطارئة — أرقام محلية وإسعافات أوّلية", zh: "安全与紧急求助——当地号码与急救", fr: "Sécurité & aide d'urgence — numéros locaux et premiers secours" },

  // ── Vision loop (onboarding: Atlas writes the dream back, you confirm) ───
  "vis.ask": { en: "Before we plan a single thing — tell me the dream in one sentence. The trip you're picturing, and the moment you're building it around.", es: "Antes de planear nada — cuéntame el sueño en una frase. El viaje que imaginas, y el momento en torno al cual lo construyes.", ar: "قبل أن نخطّط لأي شيء — أخبِرني بالحلم في جملة واحدة: الرحلة التي تتخيّلها، واللحظة التي تبنيها حولها.", zh: "在规划任何事之前——用一句话告诉我你的梦想：你所构想的旅程，以及你想围绕的那一刻。", fr: "Avant de rien planifier — dis-moi le rêve en une phrase. Le voyage que tu imagines, et le moment autour duquel tu le construis." },
  "vis.heard": { en: "Here's what I heard — tell me if I've got it right, then pick the ways you love to travel and I'll build everything around them.", es: "Esto es lo que escuché — dime si lo he entendido bien, luego elige las formas en que te gusta viajar y construiré todo en torno a ellas.", ar: "هذا ما سمعته — أخبِرني إن كنت قد فهمته جيّدًا، ثم اختر طرق السفر التي تحبّها وسأبني كل شيء حولها.", zh: "这是我听到的——告诉我是否准确，然后选择你喜欢的旅行方式，我会围绕它们搭建一切。", fr: "Voici ce que j'ai entendu — dis-moi si j'ai bien compris, puis choisis tes façons de voyager préférées et je construirai tout autour." },
  "vis.dreamLabel": { en: "The dream you gave me", es: "El sueño que me diste", ar: "الحلم الذي شاركتني به", zh: "你给我的梦想", fr: "Le rêve que tu m'as confié" },
  "vis.pickPrompt": { en: "The ways you love to travel", es: "Las formas en que te gusta viajar", ar: "طرق السفر التي تحبّها", zh: "你喜欢的旅行方式", fr: "Tes façons de voyager préférées" },
  "vis.confirm": { en: "Yes — that's my trip", es: "Sí — ese es mi viaje", ar: "نعم — هذه رحلتي", zh: "对，这就是我的旅程", fr: "Oui — c'est mon voyage" },
  "vis.done": { en: "Beautiful — I've got your vision. Let's bring it to life.", es: "Precioso — tengo tu visión. Vamos a darle vida.", ar: "رائع — التقطتُ رؤيتك. لنمنحها الحياة.", zh: "太好了——我已掌握你的愿景。让我们把它变为现实。", fr: "Magnifique — j'ai ta vision. Donnons-lui vie." },
  "vis.cta": { en: "Show me where it comes alive", es: "Muéstrame dónde cobra vida", ar: "أرِني أين تنبض بالحياة", zh: "带我看看它在哪里成真", fr: "Montre-moi où il prend vie" },

  // ── Atlas voice controls ────────────────────────────────────────────────
  "io.read": { en: "Read", es: "Leer", ar: "قراءة", zh: "阅读", fr: "Lire" },
  "io.hear": { en: "Hear", es: "Escuchar", ar: "استماع", zh: "听", fr: "Écouter" },
  "io.both": { en: "Both", es: "Ambos", ar: "كلاهما", zh: "两者", fr: "Les deux" },
  "atlas.cue": { en: "Type and press Enter, or tap the mic to talk. Choose Hear to have Atlas speak back.", es: "Escribe y pulsa Enter, o toca el micrófono para hablar. Elige Escuchar para que Atlas responda en voz alta.", ar: "اكتب واضغط Enter، أو انقر الميكروفون للتحدّث. اختر «استماع» ليجيبك Atlas بصوته.", zh: "输入后按 Enter，或点麦克风说话。选择“听”让 Atlas 出声回答。", fr: "Écrivez et appuyez sur Entrée, ou touchez le micro pour parler. Choisissez Écouter pour qu'Atlas réponde à voix haute." },
};

/**
 * `vars` fills `{name}` placeholders. It exists for counts: "All 25 interests"
 * had the number baked into five languages, so growing the catalog meant editing
 * translated copy — which is how a stale number survives. Now the string carries
 * `{n}` and the count is passed in from the live catalog.
 */
export type TVars = Record<string, string | number>;

export function translate(key: string, locale: string, vars?: TVars): string {
  const entry = MESSAGES[key];
  if (!entry) return key;
  const s = (entry as Record<string, string | undefined>)[locale] ?? entry.en ?? key;
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}

/** Hook: returns `t(key, vars?)` bound to the live locale; re-renders on switch. */
export function useT() {
  const locale = useStore((s) => s.locale);
  return (key: string, vars?: TVars) => translate(key, locale, vars);
}
