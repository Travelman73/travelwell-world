---
name: Change request (start here)
about: Ask for something to be built, fixed or changed. No technical knowledge needed.
title: ""
labels: change-request
---

<!--
HOW TO USE THIS.

Describe what should be TRUE. Do not describe how to build it, and do not look
up field names, counts, file paths or section numbers — leave every one of those
blank. Whoever picks this up can read the files; you cannot be expected to hold
them in your head, and a remembered field name is the single most expensive thing
that can enter a spec.

If you already believe some technical facts, there is a box for them at the
bottom, clearly marked as unverified. Put them there. They get checked before
anything is built on them, and nothing is lost by being wrong in that box.

Half-filled is fine. Sections you skip get asked about; sections you guess at get
built.
-->

## What should be true

<!-- One paragraph, plain language, from the traveller's side. "A traveller
looking at a Level 3 destination should see three alternatives at Level 1 in the
same breath as the warning." Not "add an alternatives array to the safety
block." -->

## Where you noticed it

<!-- A page, a URL, a screenshot, "the safari shelf", "the email Nick sent".
Anything that lets someone stand where you were standing. -->

## Who it's for, and when it matters

<!-- Which traveller, at what moment. "Someone planning a honeymoon nine months
out." If it's tied to a date — a filing, a demo, an investor meeting — say the
date. -->

## How we'll know it's done

<!-- What would you click, read or check to be satisfied? This becomes the test.
If you can't name it, say so — that's a useful answer, and it means "done"
should be agreed before anything is built. -->

## What you are NOT asking for

<!-- Optional, and more valuable than it looks. Naming the thing next door that
should stay untouched prevents most scope arguments. -->

## Already decided (do not re-litigate)

<!-- Decisions that are locked, with the date if you have it. "Wells stay English
in all markets — locked 2026-08." These are treated as constraints, not
suggestions. -->

---

## Things I BELIEVE are true but have not checked

<!-- OPTIONAL AND SAFE. Field names, counts, section numbers, how you think
something works today.

Everything in this box is treated as unverified and gets checked against the
files before it is used. Being wrong here costs nothing. Being wrong ABOVE this
line costs a rebuild — which is the entire reason the two are separated.

Facts about the codebase are one command away: `npm run gen:ground-truth`
regenerates `docs/ground-truth.md`, which carries every count, field path and
vocabulary with the file and line it came from. -->
