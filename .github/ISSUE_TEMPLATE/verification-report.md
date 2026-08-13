---
name: Verification report
about: A claim-by-claim check of a document against the files. Posted by whoever ran it.
title: "Verification: "
labels: verification
---

<!--
POST THIS INSTEAD OF PASTING IT INTO A CHAT.

A verification report that lives in an email or a chat window has to be
hand-carried by a person to everyone who needs it, which is slow and drops
things. Posted here it has a URL, it stays attached to the repo it describes, and
anyone can find it later.

If you have `gh` authenticated, this needs no copy-paste at all:

    gh issue create --repo sanaafzal-create/travelwell-world \
      --title "Verification: <what was checked>" \
      --label verification --body-file <report>.md

Rules for the report itself:
  · Every verdict names a file and a line. No line, no verdict.
  · A claim you cannot check from the files gets "not checkable", not a guess.
    An unchecked claim listed among checked ones reads as verified, which is
    worse than leaving it out.
  · Say what you read and when — the commit hash of the tree you read.
-->

**Checked against:** <!-- repo + commit hash, and the date -->
**Document under review:** <!-- what was verified, and its date -->

**Scoreboard:** <!-- e.g. 58 confirmed · 11 stale · 8 wrong · N not checkable -->

## Wrong — would cause damage if built on

<!-- One block per finding:
     Claim: (quoted verbatim)
     Verdict: WRONG
     The file: what it actually says, with path:line -->

## Stale — was true when written, is not true now

<!-- Same shape. Include what changed it, if known. -->

## Confirmed

<!-- Grouped and terse. Cite the file for each group. -->

## Not checkable from the files

<!-- Name them explicitly and issue no verdict. This section existing is what
makes the other sections trustworthy. -->

## What needs a decision

<!-- Anything the check surfaced that a person has to choose. Say who you think
owns it. -->
