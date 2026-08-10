# The TravelWell slogan family — in active use

*Generated from the live taxonomy by `scripts/gen-tagline-list.ts` on 2026-08-10.
Do not hand-edit — regenerate.*

**The construction:** `If It's [X]… TravelWell™`

The subject `[X]` varies; the closing brand mark never does. The mark is one
word, always, and the line is English-only in every market — it is a coined brand
line, not copy, so it is not translated (the same rule as the "-Well" family).

Rendered by one component (`Tagline` in `src/components/ui/primitives.tsx`), so
every instance on the site is the same construction by build, not by convention.

## Summary

| | |
|---|---|
| Distinct variants in active use | **34** |
| — master | 1 |
| — category (Safer Informed Travel) | 1 |
| — special-interest subjects | 32 (9 on live interests, 23 on preview interests) |
| Closing mark, every variant | `TravelWell™` |

## 1. The master variant

> **If It's Travel… TravelWell™**

In use site-wide: the home page, the mega-menu feature panel, the site footer,
and the Special-Interests master page.

## 2. The category variant

> **If It's Safer Informed Travel… TravelWell™**

The Safer-Informed positioning line. Also carried in the concierge's own voice
instructions, so it is used in conversation as well as in page copy.

## 3. The special-interest variants

One per interest, rendered on that interest's page and on its card on the home
page. **Live interests** are in commerce now; **preview interests** render the
line on a published page that is not yet bookable.

### Live interests (9)

| id | Interest | Subject `[X]` | Rendered line | Subject source |
|---|---|---|---|---|
| `ultra` | Ultra-Luxury | Ultra-Luxury | If It's Ultra-Luxury… TravelWell™ | locked map |
| `tropical` | Tropical Islands | Tropical | If It's Tropical… TravelWell™ | locked map |
| `romance` | Romance, Marriages & Honeymoons | Love | If It's Love… TravelWell™ | locked map |
| `safari` | Safari Adventures | Safari | If It's Safari… TravelWell™ | locked map |
| `expedition` | Global Expedition Adventures | Expedition | If It's Expedition… TravelWell™ | locked map |
| `liveaboard` | Dive Liveaboards | Liveaboards | If It's Liveaboards… TravelWell™ | locked map |
| `river` | River Cruises | River Cruising | If It's River Cruising… TravelWell™ | locked map |
| `ski` | Winter/Ski | Winter | If It's Winter… TravelWell™ | locked map |
| `wine` | Wine & Whiskey/Spirits Tours | Wine & Whiskey/Spirits Tours | If It's Wine & Whiskey/Spirits Tours… TravelWell™ | falls back to full name |

### Preview interests (23)

| id | Interest | Subject `[X]` | Rendered line | Subject source |
|---|---|---|---|---|
| `adventure` | Global Adventures | Adventure | If It's Adventure… TravelWell™ | locked map |
| `diveglobal` | Dive Globally | Diving | If It's Diving… TravelWell™ | locked map |
| `ocean` | Ocean & Watersports | Watersports | If It's Watersports… TravelWell™ | locked map |
| `wellness` | Wellness, Spa & Retreats | Wellness | If It's Wellness… TravelWell™ | locked map |
| `wildlife` | Wildlife & Nature | Wildlife | If It's Wildlife… TravelWell™ | locked map |
| `glamping` | Global Glamping | Global Glamping | If It's Global Glamping… TravelWell™ | falls back to full name |
| `family` | Family Travel | Family | If It's Family… TravelWell™ | locked map |
| `group` | Group Travel | Group Travel | If It's Group Travel… TravelWell™ | falls back to full name |
| `hiking` | Hiking & Trekking | Hiking | If It's Hiking… TravelWell™ | locked map |
| `olympic` | Olympic Travel | the Olympics | If It's the Olympics… TravelWell™ | locked map |
| `senior` | Senior Travel | Senior Travel | If It's Senior Travel… TravelWell™ | falls back to full name |
| `culinary` | Culinary Experiences | Culinary | If It's Culinary… TravelWell™ | locked map |
| `culture` | Culture & Heritage | Culture | If It's Culture… TravelWell™ | locked map |
| `deepdive` | Cultural Deep Dives | Cultural Deep Dives | If It's Cultural Deep Dives… TravelWell™ | falls back to full name |
| `pilgrimage` | Religious & Pilgrimage | Religious & Pilgrimage | If It's Religious & Pilgrimage… TravelWell™ | falls back to full name |
| `entertainment` | Live Entertainment | Live Entertainment | If It's Live Entertainment… TravelWell™ | locked map |
| `nightlife` | Nightlife & City | Nightlife & City | If It's Nightlife & City… TravelWell™ | falls back to full name |
| `sports` | Sports Travel | Sports Travel | If It's Sports Travel… TravelWell™ | falls back to full name |
| `spectator` | Spectator Sports Travel | Spectator Sports Travel | If It's Spectator Sports Travel… TravelWell™ | falls back to full name |
| `prosports` | Pro Sports Team Travel | Pro Sports Team Travel | If It's Pro Sports Team Travel… TravelWell™ | falls back to full name |
| `compsports` | Competitive Sports Team Travel | Competitive Sports Team Travel | If It's Competitive Sports Team Travel… TravelWell™ | falls back to full name |
| `sailing` | Sailing Charters | Sailing Charters | If It's Sailing Charters… TravelWell™ | falls back to full name |
| `yacht` | Yacht Charters | Yacht Charters | If It's Yacht Charters… TravelWell™ | falls back to full name |

## Notes for the file

- **The mark is one word in every variant.** A two-word "Travel Well" is not
  used as the brand anywhere on the site.
- **Some subjects are deliberately not the interest's full name** — `romance`
  renders "Love", `ski` renders "Winter", `liveaboard` renders "Liveaboards".
  Those short forms are the ones in commerce, and they are the ones this list
  records.
- **Subjects marked "falls back to full name"** have no short form set yet; the
  line still renders, using the interest's full name as `[X]`.
- The count grows as the interest board grows. Regenerate before filing.
