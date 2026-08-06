/**
 * TravelWell.World — catalog-name translations (1c, demo-path pass).
 *
 * The catalog (SIs, regions, wells) is authored in English in taxonomy.ts. This
 * is a thin display-translation layer keyed by `<kind>.<id>.<field>`, used by the
 * cards + demo pages so names read in the traveler's language. It does NOT change
 * the data model — English remains the source; missing locales fall back to it.
 *
 * Brand decision: the Well *names* ("Fly-Well", "Stay-Well") stay English — the
 * "-Well" system is a coined brand, translated names read awkwardly. Their
 * descriptive *tags* translate. SI + region names/lines translate in full.
 *
 * Launch-language strings are demo-ready; a native-speaker polish is worth doing
 * before scale (especially Arabic + the poetic region lines).
 */
import { useStore } from "@/store/useStore";

type L = { es?: string; ar?: string; zh?: string; fr?: string };

export const CATALOG: Record<string, L> = {
  // ── Special Interest names ──────────────────────────────────────────────
  "si.ultra.name": { es: "Ultra-Lujo", ar: "الفخامة القصوى", zh: "超奢华", fr: "Ultra-Luxe" },
  "si.tropical.name": { es: "Islas Tropicales", ar: "جزر استوائية", zh: "热带海岛", fr: "Îles Tropicales" },
  "si.romance.name": { es: "Romance y Lunas de Miel", ar: "رومانسية وشهر العسل", zh: "浪漫与蜜月", fr: "Romance & Lunes de Miel" },
  "si.safari.name": { es: "Aventuras de Safari", ar: "مغامرات السفاري", zh: "野生动物之旅", fr: "Aventures Safari" },
  "si.expedition.name": { es: "Expediciones Globales", ar: "مغامرات استكشافية عالمية", zh: "全球探险远征", fr: "Expéditions Mondiales" },
  "si.adventure.name": { es: "Aventuras Globales", ar: "مغامرات عالمية", zh: "全球探险", fr: "Aventures Mondiales" },
  "si.liveaboard.name": { es: "Cruceros de Buceo", ar: "رحلات الغطس المقيمة", zh: "潜水船宿", fr: "Croisières Plongée" },
  "si.river.name": { es: "Cruceros Fluviales", ar: "رحلات نهرية", zh: "内河游轮", fr: "Croisières Fluviales" },
  "si.diveglobal.name": { es: "Buceo por el Mundo", ar: "الغطس حول العالم", zh: "全球潜水", fr: "Plongée Mondiale" },
  "si.ocean.name": { es: "Océano y Deportes Acuáticos", ar: "المحيط والرياضات المائية", zh: "海洋与水上运动", fr: "Océan & Sports Nautiques" },
  "si.wellness.name": { es: "Bienestar, Spa y Retiros", ar: "العافية والسبا والمنتجعات", zh: "养生、水疗与静修", fr: "Bien-être, Spa & Retraites" },
  "si.wildlife.name": { es: "Fauna y Naturaleza", ar: "الحياة البرّية والطبيعة", zh: "野生动物与自然", fr: "Faune & Nature" },
  "si.glamping.name": { es: "Glamping Global", ar: "التخييم الفاخر عالميًا", zh: "全球豪华野营", fr: "Glamping Mondial" },
  "si.family.name": { es: "Viajes en Familia", ar: "سفر العائلة", zh: "家庭旅行", fr: "Voyages en Famille" },
  "si.group.name": { es: "Viajes en Grupo", ar: "السفر الجماعي", zh: "团体旅行", fr: "Voyages en Groupe" },
  "si.hiking.name": { es: "Senderismo y Trekking", ar: "المشي وتسلّق المسارات", zh: "徒步与越野", fr: "Randonnée & Trekking" },
  "si.ski.name": { es: "Esquí y Nieve", ar: "التزلّج والثلج", zh: "滑雪与冰雪", fr: "Ski & Neige" },
  "si.olympic.name": { es: "Viajes Olímpicos", ar: "سفر أولمبي", zh: "奥运之旅", fr: "Voyages Olympiques" },
  "si.senior.name": { es: "Viajes para Mayores", ar: "سفر كبار السن", zh: "长者旅行", fr: "Voyages Seniors" },
  "si.culinary.name": { es: "Experiencias Culinarias", ar: "تجارب الطهي", zh: "美食体验", fr: "Expériences Culinaires" },
  "si.culture.name": { es: "Cultura y Patrimonio", ar: "الثقافة والتراث", zh: "文化与遗产", fr: "Culture & Patrimoine" },
  "si.deepdive.name": { es: "Inmersiones Culturales", ar: "انغماس ثقافي عميق", zh: "深度文化探索", fr: "Immersions Culturelles" },
  "si.pilgrimage.name": { es: "Religión y Peregrinación", ar: "الدين والحج", zh: "宗教与朝圣", fr: "Religion & Pèlerinage" },
  "si.entertainment.name": { es: "Espectáculos en Vivo", ar: "الترفيه الحيّ", zh: "现场娱乐", fr: "Spectacles en Direct" },
  "si.nightlife.name": { es: "Vida Nocturna y Ciudad", ar: "الحياة الليلية والمدينة", zh: "夜生活与都市", fr: "Vie Nocturne & Ville" },
  "si.sports.name": { es: "Viajes Deportivos", ar: "السفر الرياضي", zh: "体育旅行", fr: "Voyages Sportifs" },
  "si.spectator.name": { es: "Viajes de Espectador Deportivo", ar: "سفر مشاهدة الرياضة", zh: "观赛旅行", fr: "Voyages Spectateur Sportif" },
  "si.prosports.name": { es: "Viajes de Equipos Profesionales", ar: "سفر الفرق المحترفة", zh: "职业球队旅行", fr: "Voyages d'Équipes Pro" },
  "si.compsports.name": { es: "Viajes de Equipos Competitivos", ar: "سفر الفرق التنافسية", zh: "竞技球队旅行", fr: "Voyages d'Équipes Compétitives" },
  "si.sailing.name": { es: "Chárteres de Vela", ar: "رحلات الإبحار المؤجّرة", zh: "帆船包船", fr: "Charters à Voile" },
  "si.yacht.name": { es: "Chárteres de Yate", ar: "رحلات اليخوت المؤجّرة", zh: "游艇包船", fr: "Charters de Yacht" },
  "si.wine.name": { es: "Tours de Vino y Licores", ar: "جولات النبيذ والمشروبات", zh: "葡萄酒与烈酒之旅", fr: "Circuits Vin & Spiritueux" },

  // ── Region names ────────────────────────────────────────────────────────
  "region.01F.name": { es: "Europa Occidental", ar: "أوروبا الغربية", zh: "西欧", fr: "Europe de l'Ouest" },
  "region.02F.name": { es: "El Mediterráneo", ar: "البحر المتوسط", zh: "地中海", fr: "La Méditerranée" },
  "region.03F.name": { es: "Europa del Norte y Nórdicos", ar: "شمال أوروبا والدول الاسكندنافية", zh: "北欧", fr: "Europe du Nord & Nordiques" },
  "region.04A.name": { es: "Oriente Medio, Golfo y Norte de África", ar: "الشرق الأوسط والخليج وشمال إفريقيا", zh: "中东、海湾与北非", fr: "Moyen-Orient, Golfe & Afrique du Nord" },
  "region.05A.name": { es: "África Oriental", ar: "شرق أفريقيا", zh: "东非", fr: "Afrique de l'Est" },
  "region.06A.name": { es: "África Austral", ar: "الجنوب الأفريقي", zh: "南部非洲", fr: "Afrique Australe" },
  "region.07A.name": { es: "Asia del Sur y Sudeste", ar: "جنوب وجنوب شرق آسيا", zh: "南亚与东南亚", fr: "Asie du Sud & du Sud-Est" },
  "region.08A.name": { es: "Asia Oriental", ar: "شرق آسيا", zh: "东亚", fr: "Asie de l'Est" },
  "region.09P.name": { es: "Oceanía y el Pacífico", ar: "أوقيانوسيا والمحيط الهادئ", zh: "大洋洲与太平洋", fr: "Océanie & Pacifique" },
  "region.10S.name": { es: "América Latina", ar: "أمريكا اللاتينية", zh: "拉丁美洲", fr: "Amérique Latine" },
  "region.11C.name": { es: "Caribe y Atlántico", ar: "الكاريبي والأطلسي", zh: "加勒比与大西洋", fr: "Caraïbes & Atlantique" },
  "region.12A.name": { es: "Estados Unidos", ar: "الولايات المتحدة", zh: "美国", fr: "États-Unis" },
  "region.13A.name": { es: "Canadá", ar: "كندا", zh: "加拿大", fr: "Canada" },

  // ── Region lines ────────────────────────────────────────────────────────
  "region.01F.line": { es: "Capitales del viejo mundo, con soltura moderna", ar: "عواصم العالم القديم بيُسر حديث", zh: "旧世界之都，现代从容", fr: "Capitales du vieux monde, aisance moderne" },
  "region.02F.line": { es: "Sol, mar y siglos", ar: "شمس وبحر وقرون", zh: "阳光、海洋与千年", fr: "Soleil, mer et siècles" },
  "region.03F.line": { es: "Fiordos, diseño, luz larga", ar: "مضايق وتصميم وضوء ممتد", zh: "峡湾、设计与漫长的光", fr: "Fjords, design, lumière longue" },
  "region.04A.line": { es: "Donde lo antiguo se encuentra con lo audaz", ar: "حيث يلتقي العريق بالجريء", zh: "古老与大胆相遇之地", fr: "Où l'ancien rencontre l'audace" },
  "region.05A.line": { es: "La cuna del safari", ar: "مهد السفاري", zh: "野生动物之旅的摇篮", fr: "Le berceau du safari" },
  "region.06A.line": { es: "Grandes cielos, mayor fauna", ar: "سماوات واسعة وحياة برّية أوسع", zh: "辽阔天空，更壮野趣", fr: "Grands ciels, plus grand gibier" },
  "region.07A.line": { es: "Templos, islas, especias", ar: "معابد وجزر وتوابل", zh: "庙宇、海岛与香料", fr: "Temples, îles, épices" },
  "region.08A.line": { es: "Tradición a la velocidad del presente", ar: "تقاليد بسرعة الحاضر", zh: "以当下之速承载传统", fr: "La tradition à la vitesse du présent" },
  "region.09P.line": { es: "El fin del mapa, el inicio del asombro", ar: "نهاية الخريطة، بداية الدهشة", zh: "地图的尽头，惊叹的起点", fr: "Le bout de la carte, le début de l'émerveillement" },
  "region.10S.line": { es: "Color, ritmo, horizontes salvajes", ar: "لون وإيقاع وآفاق برّية", zh: "色彩、节奏与狂野地平线", fr: "Couleur, rythme, horizons sauvages" },
  "region.11C.line": { es: "Mil tonos de azul", ar: "ألف درجة من الأزرق", zh: "千种蔚蓝", fr: "Mille nuances de bleu" },
  "region.12A.line": { es: "Cincuenta formas de vagar", ar: "خمسون طريقة للتجوال", zh: "五十种漫游方式", fr: "Cinquante façons de vagabonder" },
  "region.13A.line": { es: "Vasto, salvaje y acogedor", ar: "شاسعة وبرّية وكريمة", zh: "辽阔、狂野而亲切", fr: "Vaste, sauvage et accueillant" },

  // ── Well tags (names stay English brand) ────────────────────────────────
  "well.fly.tag": { es: "Cómo llegar", ar: "الوصول إلى هناك", zh: "抵达", fr: "Y aller" },
  "well.stay.tag": { es: "Dónde descansas", ar: "حيث ترتاح", zh: "何处安歇", fr: "Où vous reposer" },
  "well.eat.tag": { es: "Lo que saboreas", ar: "ما تتذوّقه", zh: "尽享美味", fr: "Ce que vous savourez" },
  "well.move.tag": { es: "Cómo moverte", ar: "التنقّل", zh: "四处通行", fr: "Se déplacer" },
  "well.gear.tag": { es: "Lo que llevas", ar: "ما تحمله", zh: "随身所带", fr: "Ce que vous emportez" },
  "well.beauty.tag": { es: "Verse y sentirse bien", ar: "المظهر والإحساس الجيّد", zh: "美丽与舒适", fr: "Beauté & bien-être" },
  "well.activities.tag": { es: "Lo que te emociona", ar: "ما يثير حماسك", zh: "令你心动", fr: "Ce qui vous passionne" },
  "well.shop.tag": { es: "Llevarlo a casa", ar: "تأخذه معك", zh: "带回家", fr: "Ramener chez soi" },
  "well.insure.tag": { es: "Tranquilidad", ar: "راحة البال", zh: "安心", fr: "Sérénité" },
  "well.ship.tag": { es: "Enviarlo por delante", ar: "إرساله مسبقًا", zh: "先行寄送", fr: "L'envoyer devant" },
  "well.nanny.tag": { es: "Cuidado de los pequeños", ar: "رعاية الصغار", zh: "照护孩子", fr: "S'occuper des petits" },
  "well.security.tag": { es: "Protección discreta", ar: "حماية متحفّظة", zh: "低调守护", fr: "Protection discrète" },
};

// Chip labels — keyed by their English text so callers pass the raw string.
// Brand/code chips (Fly-Well, "01F · …" region codes) that aren't here fall
// back to English. Detail chips; demo-ready, worth a native polish.
export const CHIPS: Record<string, L> = {
  // Well category chips
  "Scheduled flights": { es: "Vuelos regulares", ar: "رحلات مجدولة", zh: "定期航班", fr: "Vols réguliers" },
  "Bush & light aircraft": { es: "Avionetas y vuelos ligeros", ar: "طائرات صغيرة وأدغال", zh: "丛林轻型飞机", fr: "Avions légers & brousse" },
  "Private charter": { es: "Chárter privado", ar: "رحلات خاصّة", zh: "私人包机", fr: "Charter privé" },
  "Upgrades & lounges": { es: "Mejoras y salas VIP", ar: "ترقيات وصالات", zh: "升舱与贵宾厅", fr: "Surclassements & salons" },
  "Lodges & camps": { es: "Lodges y campamentos", ar: "نُزُل ومخيّمات", zh: "旅舍与营地", fr: "Lodges & camps" },
  "Boutique hotels": { es: "Hoteles boutique", ar: "فنادق بوتيك", zh: "精品酒店", fr: "Hôtels de charme" },
  "Resorts & villas": { es: "Resorts y villas", ar: "منتجعات وفلل", zh: "度假村与别墅", fr: "Resorts & villas" },
  "Heritage stays": { es: "Estancias históricas", ar: "إقامات تراثية", zh: "遗产住宿", fr: "Séjours patrimoine" },
  "Fine dining": { es: "Alta cocina", ar: "مطاعم راقية", zh: "精致餐饮", fr: "Gastronomie" },
  "Local & street food": { es: "Comida local y callejera", ar: "أطعمة محلية وشارع", zh: "当地与街头美食", fr: "Cuisine locale & de rue" },
  "Cooking experiences": { es: "Experiencias de cocina", ar: "تجارب طهي", zh: "烹饪体验", fr: "Ateliers de cuisine" },
  "In-villa chefs": { es: "Chefs a domicilio", ar: "طهاة في الفيلا", zh: "别墅私厨", fr: "Chefs en villa" },
  "Private transfers": { es: "Traslados privados", ar: "تنقّلات خاصّة", zh: "私人接送", fr: "Transferts privés" },
  "Car & driver": { es: "Coche con conductor", ar: "سيارة بسائق", zh: "专车与司机", fr: "Voiture avec chauffeur" },
  "Rail & coach": { es: "Tren y autocar", ar: "قطار وحافلة", zh: "火车与巴士", fr: "Train & autocar" },
  "Inter-camp flights": { es: "Vuelos entre campamentos", ar: "رحلات بين المخيّمات", zh: "营地间航班", fr: "Vols inter-camps" },
  "Apparel & layers": { es: "Ropa y capas", ar: "ملابس وطبقات", zh: "服装与层叠衣物", fr: "Vêtements & couches" },
  "Luggage & bags": { es: "Equipaje y bolsos", ar: "حقائب وأمتعة", zh: "行李与包袋", fr: "Bagages & sacs" },
  "Optics & tech": { es: "Óptica y tecnología", ar: "بصريات وتقنية", zh: "光学与科技", fr: "Optique & tech" },
  "Rentals": { es: "Alquileres", ar: "تأجير", zh: "租赁", fr: "Locations" },
  "Spa & massage": { es: "Spa y masaje", ar: "سبا وتدليك", zh: "水疗与按摩", fr: "Spa & massage" },
  "Salon & grooming": { es: "Salón y estética", ar: "صالون وعناية", zh: "美容与造型", fr: "Salon & soins" },
  "Recovery & IV": { es: "Recuperación e IV", ar: "تعافٍ ووريد", zh: "恢复与静脉输液", fr: "Récupération & IV" },
  "Pre-trip prep": { es: "Preparación pre-viaje", ar: "تحضير ما قبل الرحلة", zh: "行前准备", fr: "Préparation avant voyage" },
  "Guided experiences": { es: "Experiencias guiadas", ar: "تجارب مُرشَدة", zh: "向导体验", fr: "Expériences guidées" },
  "Wildlife & nature": { es: "Fauna y naturaleza", ar: "حياة برّية وطبيعة", zh: "野生动物与自然", fr: "Faune & nature" },
  "Culture & history": { es: "Cultura e historia", ar: "ثقافة وتاريخ", zh: "文化与历史", fr: "Culture & histoire" },
  "Adventure & water": { es: "Aventura y agua", ar: "مغامرة وماء", zh: "探险与水上", fr: "Aventure & eau" },
  "Artisan & crafts": { es: "Artesanía", ar: "حِرَف يدوية", zh: "手工艺", fr: "Artisanat" },
  "Markets": { es: "Mercados", ar: "أسواق", zh: "市集", fr: "Marchés" },
  "Design & home": { es: "Diseño y hogar", ar: "تصميم ومنزل", zh: "设计与家居", fr: "Design & maison" },
  "Edible souvenirs": { es: "Recuerdos comestibles", ar: "هدايا مأكولة", zh: "可食纪念品", fr: "Souvenirs gourmands" },
  "Trip protection": { es: "Protección del viaje", ar: "حماية الرحلة", zh: "行程保障", fr: "Protection voyage" },
  "Medical & evacuation": { es: "Médico y evacuación", ar: "طبي وإخلاء", zh: "医疗与撤离", fr: "Médical & évacuation" },
  "Cancellation": { es: "Cancelación", ar: "إلغاء", zh: "取消保障", fr: "Annulation" },
  "Gear & baggage": { es: "Equipo y equipaje", ar: "معدّات وأمتعة", zh: "装备与行李", fr: "Équipement & bagages" },
  "Luggage forwarding": { es: "Envío de equipaje", ar: "شحن الأمتعة", zh: "行李前送", fr: "Envoi de bagages" },
  "Purchase shipping": { es: "Envío de compras", ar: "شحن المشتريات", zh: "购物寄送", fr: "Envoi d'achats" },
  "Customs handling": { es: "Gestión aduanera", ar: "معالجة جمركية", zh: "清关处理", fr: "Gestion douanière" },
  "Returns": { es: "Devoluciones", ar: "إرجاع", zh: "退货", fr: "Retours" },
  "In-resort childcare": { es: "Cuidado infantil en el resort", ar: "رعاية أطفال بالمنتجع", zh: "度假村托儿", fr: "Garde d'enfants au resort" },
  "Private nannies": { es: "Niñeras privadas", ar: "مربّيات خاصّات", zh: "私人保姆", fr: "Nounous privées" },
  "Kids' experiences": { es: "Experiencias para niños", ar: "تجارب للأطفال", zh: "儿童体验", fr: "Expériences enfants" },
  "Evening sitting": { es: "Cuidado nocturno", ar: "جليس مسائي", zh: "晚间看护", fr: "Garde en soirée" },
  "Close protection": { es: "Protección personal", ar: "حماية شخصية", zh: "贴身保护", fr: "Protection rapprochée" },
  "Risk advisory": { es: "Asesoría de riesgos", ar: "استشارات المخاطر", zh: "风险咨询", fr: "Conseil en risques" },
  "Secure transfers": { es: "Traslados seguros", ar: "تنقّلات آمنة", zh: "安全接送", fr: "Transferts sécurisés" },
  "Event security": { es: "Seguridad de eventos", ar: "أمن الفعاليات", zh: "活动安保", fr: "Sécurité événementielle" },
  // Home Operating-System band chips (brand/code chips fall back to English)
  "Safari & Wildlife": { es: "Safari y fauna", ar: "سفاري وحياة برّية", zh: "野生动物", fr: "Safari & faune" },
  "Culinary Journeys": { es: "Viajes gastronómicos", ar: "رحلات طهي", zh: "美食之旅", fr: "Voyages gastronomiques" },
  "Wellness & Spa": { es: "Bienestar y spa", ar: "عافية وسبا", zh: "养生与水疗", fr: "Bien-être & spa" },
  "+22 more": { es: "+22 más", ar: "+22 أخرى", zh: "还有 22 项", fr: "+22 autres" },
  "+10 more": { es: "+10 más", ar: "+10 أخرى", zh: "还有 10 项", fr: "+10 autres" },
  "01F · Western Europe": { es: "01F · Europa Occidental", ar: "01F · أوروبا الغربية", zh: "01F · 西欧", fr: "01F · Europe de l'Ouest" },
  "05A · East Africa": { es: "05A · África Oriental", ar: "05A · شرق أفريقيا", zh: "05A · 东非", fr: "05A · Afrique de l'Est" },
  "11C · Caribbean": { es: "11C · Caribe", ar: "11C · الكاريبي", zh: "11C · 加勒比", fr: "11C · Caraïbes" },
  "Top picks first": { es: "Mejores primero", ar: "الأفضل أولًا", zh: "优选优先", fr: "Meilleurs d'abord" },
  "Straight about commissions": { es: "Claros con las comisiones", ar: "صراحة بشأن العمولات", zh: "佣金坦诚", fr: "Transparents sur les commissions" },
  "You decide & book": { es: "Tú decides y reservas", ar: "أنت تقرّر وتحجز", zh: "你决定并预订", fr: "Vous décidez & réservez" },
  "Insure-Well · soon": { es: "Insure-Well · pronto", ar: "Insure-Well · قريبًا", zh: "Insure-Well · 即将", fr: "Insure-Well · bientôt" },
};

export function catalogT(key: string, locale: string, fallback: string): string {
  if (locale === "en") return fallback;
  const e = CATALOG[key] as Record<string, string> | undefined;
  return (e && e[locale]) || fallback;
}

/** Hook: `ct("si.tropical.name", s.name)` → localized name, English fallback. */
export function useCatalogName() {
  const locale = useStore((s) => s.locale);
  return (key: string, fallback: string) => catalogT(key, locale, fallback);
}

/** Hook: `chip("Resorts & villas")` → localized chip label, English fallback. */
export function useChip() {
  const locale = useStore((s) => s.locale);
  return (text: string) => {
    if (locale === "en") return text;
    const e = CHIPS[text] as Record<string, string> | undefined;
    return (e && e[locale]) || text;
  };
}
