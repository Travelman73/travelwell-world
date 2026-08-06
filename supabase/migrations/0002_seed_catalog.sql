-- TravelWell.World — seed the world-readable catalog (wells + regions).
--
-- Trip persistence needs these rows to exist: public.trip_blocks.well has a
-- NOT NULL FK to public.wells(id), and public.journeys.region_code FKs to
-- public.regions(code). Until the catalog lived only in src/data/*.ts, those
-- inserts would fail. This mirrors WELLS/LUX_WELLS and REGIONS in taxonomy.ts.
--
-- Idempotent: ON CONFLICT DO UPDATE keeps the rows in sync with the taxonomy,
-- so re-running on deploy refreshes the catalog without duplicating.
--
-- Apply:  supabase db push   (or paste into the Supabase SQL editor)

-- Wells -----------------------------------------------------------------------
insert into public.wells (id, name, tag, body, status, icon, is_lux) values
  ('fly',        'Fly-Well',      'Getting there',          'Breath',      'live', 'plane',    false),
  ('stay',       'Stay-Well',     'Where you rest',         'Skin',        'live', 'bed',      false),
  ('eat',        'Eat-Well',      'What you savor',         'Digestion',   'live', 'utensils', false),
  ('move',       'Move-Well',     'Getting around',         'Muscle',      'live', 'car',      false),
  ('gear',       'Gear-Well',     'What you carry',         'Bones',       'live', 'bag',      false),
  ('beauty',     'Beauty-Well',   'Looking & feeling well', 'Senses',      'live', 'sparkle',  false),
  ('activities', 'Activities-Well','What excites you',      'Heart',       'live', 'compass',  false),
  ('shop',       'Shop-Well',     'Taking it home',         'Memory',      'live', 'gift',     false),
  ('insure',     'Insure-Well',   'Peace of mind',          'Immunity',    'soon', 'shield',   false),
  ('ship',       'Ship-Well',     'Sending it ahead',       'Circulation', 'soon', 'box',      false),
  ('nanny',      'Nanny-Well',    'Care for the little ones','Nurture',    'live', 'heart',    true),
  ('security',   'Security-Well', 'Discreet protection',    'Defense',     'live', 'lock',     true)
on conflict (id) do update set
  name = excluded.name, tag = excluded.tag, body = excluded.body,
  status = excluded.status, icon = excluded.icon, is_lux = excluded.is_lux;

-- Regions ---------------------------------------------------------------------
insert into public.regions (code, name, line, countries, gateways, status, has_sub) values
  ('01F', 'Western Europe',             'Old-world capitals, modern ease',          8,  'CDG · LHR · AMS', 'live',    false),
  ('02F', 'The Mediterranean',          'Sun, sea, and centuries',                  9,  'BCN · FCO · ATH', 'live',    false),
  ('03F', 'Northern Europe & Nordics',  'Fjords, design, long light',               7,  'CPH · OSL · HEL', 'live',    false),
  ('04A', 'Middle East, Gulf & North Africa', 'Where ancient meets audacious',        8,  'DXB · CAI · DOH', 'live',    false),
  ('05A', 'East Africa',                'The cradle of the safari',                 5,  'NBO · JRO · KGL', 'live',    false),
  ('06A', 'Southern Africa',            'Big skies, bigger game',                   5,  'CPT · JNB · WDH', 'live',    false),
  ('07A', 'South & Southeast Asia',     'Temples, islands, spice',                  9,  'BKK · SIN · DPS', 'live',    false),
  ('08A', 'East Asia',                  'Tradition at the speed of now',            5,  'NRT · ICN · HKG', 'live',    false),
  ('09P', 'Oceania & The Pacific',      'The end of the map, the start of awe',     6,  'SYD · AKL · NAN', 'live',    false),
  ('10S', 'Latin America',              'Color, rhythm, wild horizons',             11, 'MEX · LIM · GIG', 'preview', false),
  ('11C', 'Caribbean & Atlantic',       'A thousand shades of blue',                13, 'NAS · PUJ · SJU', 'live',    false),
  ('12A', 'United States',              'Fifty ways to wander',                     1,  'JFK · LAX · ORD', 'live',    true),
  ('13A', 'Canada',                     'Vast, wild, and gracious',                 1,  'YYZ · YVR · YUL', 'live',    true)
on conflict (code) do update set
  name = excluded.name, line = excluded.line, countries = excluded.countries,
  gateways = excluded.gateways, status = excluded.status, has_sub = excluded.has_sub;
