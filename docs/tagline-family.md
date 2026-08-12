# The TravelWell slogan family — in active use

*Generated from the live taxonomy by `scripts/gen-tagline-list.ts` on 2026-08-12.
Do not hand-edit — regenerate.*

**The construction:** `If It's [X]… TravelWell.™`

The subject `[X]` varies; the closing brand mark never does. The mark is one
word, always, and the ellipsis and closing full stop are part of it — and the line is English-only in every market — it is a coined brand
line, not copy, so it is not translated (the same rule as the "-Well" family).

Rendered by one component (`Tagline` in `src/components/ui/primitives.tsx`), so
every instance on the site is the same construction by build, not by convention.

## Summary

| | |
|---|---|
| Distinct variants in active use | **37** |
| — master | 1 |
| — category (Safer Informed Travel) | 1 |
| — special-interest subjects | 35 (8 on live interests, 27 on preview interests) |
| Closing mark, every variant | `TravelWell.™` |

## 1. The master variant

> **If It's Travel… TravelWell.™**

In use site-wide: the home page, the mega-menu feature panel, the site footer,
and the Special-Interests master page.

## 2. The category variant

> **If It's Safer Informed Travel… TravelWell.™**

The Safer-Informed positioning line. Also carried in the concierge's own voice
instructions, so it is used in conversation as well as in page copy.

## 3. The special-interest variants

One per interest, rendered on that interest's page and on its card on the home
page. **Live interests** are in commerce now; **preview interests** render the
line on a published page that is not yet bookable.

### Live interests (8)

| id | Interest | Subject `[X]` | Rendered line | Subject source |
|---|---|---|---|---|
| `ultra` | Ultra-Luxury | Ultra-Luxury | If It's Ultra-Luxury… TravelWell.™ | locked map |
| `tropical` | Tropical Islands | Tropical | If It's Tropical… TravelWell.™ | locked map |
| `romance` | Romance, Marriages & Honeymoons | Love | If It's Love… TravelWell.™ | locked map |
| `safari` | Safari Adventures | Safari | If It's Safari… TravelWell.™ | locked map |
| `expedition` | Global Expedition Adventures | Expedition | If It's Expedition… TravelWell.™ | locked map |
| `ski` | Winter/Ski | Winter | If It's Winter… TravelWell.™ | locked map |
| `liveaboard` | Dive Liveaboards | Liveaboards | If It's Liveaboards… TravelWell.™ | locked map |
| `river` | River Cruises | River Cruising | If It's River Cruising… TravelWell.™ | locked map |

### Preview interests (27)

| id | Interest | Subject `[X]` | Rendered line | Subject source |
|---|---|---|---|---|
| `golf` | Golf Globally | Golf | If It's Golf… TravelWell.™ | locked map |
| `rail` | Global Rail Journeys | Rail | If It's Rail… TravelWell.™ | locked map |
| `barge` | Hotel-Barge & Canal Cruising | Canal Cruising | If It's Canal Cruising… TravelWell.™ | locked map |
| `privatejet` | Private-Jet Expeditions | Private Jets | If It's Private Jets… TravelWell.™ | locked map |
| `caravan` | Desert & Camel Caravans | the Desert | If It's the Desert… TravelWell.™ | locked map |
| `overland` | Luxury Overland Expeditions | Overland | If It's Overland… TravelWell.™ | locked map |
| `motoring` | Classic-Car & Motorcycle Touring | the Open Road | If It's the Open Road… TravelWell.™ | locked map |
| `adventure` | Global Adventures | Adventure | If It's Adventure… TravelWell.™ | locked map |
| `hiking` | Hiking & Trekking | Hiking | If It's Hiking… TravelWell.™ | locked map |
| `diveglobal` | Dive Globally | Diving | If It's Diving… TravelWell.™ | locked map |
| `ocean` | Ocean & Watersports | Watersports | If It's Watersports… TravelWell.™ | locked map |
| `wellness` | Wellness, Spa & Retreats | Wellness | If It's Wellness… TravelWell.™ | locked map |
| `wildlife` | Wildlife & Nature | Wildlife | If It's Wildlife… TravelWell.™ | locked map |
| `glamping` | Global Glamping | Global Glamping | If It's Global Glamping… TravelWell.™ | falls back to full name |
| `family` | Family Travel | Family | If It's Family… TravelWell.™ | locked map |
| `group` | Group Travel | Group Travel | If It's Group Travel… TravelWell.™ | falls back to full name |
| `senior` | Senior Travel | Senior Travel | If It's Senior Travel… TravelWell.™ | falls back to full name |
| `culture` | Culture & Heritage | Culture | If It's Culture… TravelWell.™ | locked map |
| `deepdive` | Cultural Deep Dives | Cultural Deep Dives | If It's Cultural Deep Dives… TravelWell.™ | falls back to full name |
| `pilgrimage` | Religious & Pilgrimage | Religious & Pilgrimage | If It's Religious & Pilgrimage… TravelWell.™ | falls back to full name |
| `entertainment` | Global Live Entertainment | Live Entertainment | If It's Live Entertainment… TravelWell.™ | locked map |
| `culinary` | Culinary Experiences | Culinary | If It's Culinary… TravelWell.™ | locked map |
| `sports` | Individual Sports | Individual Sports | If It's Individual Sports… TravelWell.™ | falls back to full name |
| `spectator` | Sports Spectator Travel | the Big Game | If It's the Big Game… TravelWell.™ | locked map |
| `sailing` | Sailing Charters | Sailing | If It's Sailing… TravelWell.™ | locked map |
| `yacht` | Yacht Charters | Yachts | If It's Yachts… TravelWell.™ | locked map |
| `wine` | Wine & Whiskey/Spirits Tours | Wine | If It's Wine… TravelWell.™ | locked map |

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
