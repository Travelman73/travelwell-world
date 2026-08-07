/**
 * TravelWell.World — Curated cinematic image resolver (placeholder Unsplash).
 * Ported from js/images.js. Swap for licensed/real photography at production.
 */
const U = (id: string, w: number, q = 75) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`;

const IDS: Record<string, string> = {
  safariGiraffe: "1516426122078-c23e76319801",
  lion: "1547970810-dc1eac37d174",
  safariJeep: "1534177616072-ef7dc120449d",
  elephant: "1564760055775-d63b17a55c44",
  tropicalBeach: "1507525428034-b723cf961d3e",
  oceanAerial: "1505228395891-9a51e7e86bf6",
  maldivesResort: "1582719508461-905c673771fd",
  mountainValley: "1469474968028-56623f02e42e",
  desertDunes: "1509316785289-025f5b846b35",
  northernLights: "1531366936337-7c912a4589a7",
  baliRice: "1518548419970-58e3b4079ab2",
  paris: "1502602898657-3e91760cbb34",
  venice: "1514890547357-a9ee288728e0",
  marrakech: "1597212618440-806262de4f6b",
  dubai: "1512453979798-5ea266f8880c",
  kyoto: "1545569341-9eb8b30979d9",
  santorini: "1533105079780-92b9be482077",
  restaurant: "1414235077428-338989a2e8c0",
  spaWellness: "1540555700478-4be289fbecef",
  luxuryPool: "1571896349842-33c89424de2d",
};

const SI_IMG: Record<string, string> = {
  ultra: "luxuryPool", tropical: "tropicalBeach", romance: "venice", safari: "safariGiraffe",
  expedition: "mountainValley", adventure: "desertDunes",
  liveaboard: "oceanAerial", river: "venice", diveglobal: "oceanAerial", ocean: "maldivesResort", wellness: "spaWellness",
  family: "baliRice", hiking: "mountainValley", ski: "northernLights", olympic: "dubai", senior: "santorini",
  culinary: "restaurant", culture: "kyoto", deepdive: "marrakech", entertainment: "dubai", nightlife: "dubai",
  sports: "mountainValley", spectator: "dubai", prosports: "paris", compsports: "oceanAerial",
};

const REGION_IMG: Record<string, string> = {
  "01F": "paris", "02F": "santorini", "03F": "northernLights", "04A": "dubai",
  "05A": "safariGiraffe", "06A": "elephant", "07A": "baliRice", "08A": "kyoto",
  "09P": "tropicalBeach", "10S": "mountainValley", "11C": "oceanAerial",
  "12A": "desertDunes", "13A": "northernLights",
};

/**
 * The neutral placeholder for any token we don't recognise. Never return "" —
 * an empty src is a visibly broken image, and the token is only ever the INSTANT
 * placeholder anyway: destination heroes and cards fetch the real, matched photo
 * from Unsplash by "{name}, {country}" and swap it in (see useUnsplashImage).
 * So an ingested dossier can carry any sensible token — or a token we've never
 * seen — and the page still looks right.
 */
export const FALLBACK_IMG = "mountainValley";

export const img = (key: string, w = 1400, q?: number) =>
  U(IDS[key] ?? IDS[FALLBACK_IMG], w, q);
/** The tokens a conformed dossier can use as its placeholder (see docs/ingest-contract.md). */
export const IMAGE_TOKENS = Object.keys(IDS);
export const siImg = (siId: string, w = 900) => img(SI_IMG[siId] || FALLBACK_IMG, w);
export const regionImg = (code: string, w = 900) => img(REGION_IMG[code] || FALLBACK_IMG, w);
