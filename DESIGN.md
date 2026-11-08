---
name: Arrival Atelier
description: A local workbench for circular black-ink studies.
colors:
  ink: "#282a25"
  muted: "#606257"
  line: "#d7d8ce"
  accent: "#3d5138"
  paper: "#fff"
  canvas: "#f5f3ee"
  soft: "#e8e9df"
  field: "#fafbf7"
  field-border: "#bfc3b6"
  selected-study: "#edf0e7"
  danger: "#8c351d"
  error-background: "#f8e6db"
  error-text: "#702711"
typography:
  display:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: "clamp(32px, 3.2vw, 48px)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "15px"
    lineHeight: 1.5
  title:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    letterSpacing: "-0.025em"
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "12px"
    fontWeight: 600
  help:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "11px"
    lineHeight: 1.6
  measurement:
    fontFamily: "monospace"
    fontSize: "11px"
rounded:
  artwork: "3px"
  field: "4px"
  button: "5px"
spacing:
  compact: "8px"
  section: "24px"
  studio-section: "30px"
components:
  button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "9px 13px"
  button-hover:
    backgroundColor: "{colors.soft}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    rounded: "{rounded.button}"
    padding: "9px 13px"
  field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "9px 10px"
  view-tab:
    textColor: "{colors.muted}"
    padding: "8px 10px"
  study:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.artwork}"
    padding: "5px"
  study-selected:
    backgroundColor: "{colors.selected-study}"
  stage:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.artwork}"
    padding: "14px 12px 40px"
---

# Design System: Arrival Atelier

## Overview

**Creative North Star: "A name, in ink."**

The implemented workbench places procedural black ink on a warm, quiet page. Compact controls support a much larger artwork surface; restrained olive marks actions and selection. This documents the shipped implementation, not a user-selected visual identity.

**Key Characteristics:**
- Warm page, white artwork, dark text and restrained olive controls.
- Serif introduction paired with compact system sans-serif tools.
- Source and artist-study comparison with the honesty caveat beside the work.
- Local, offline operation with system-local fonts and generated vector artwork.

## Colors

### Primary

Olive (`accent`) identifies the primary export, links, selected borders, native input accents and keyboard focus. Selection remains legible through a border or underline as well as color.

### Neutral

Warm `canvas` surrounds white `paper` artwork. `ink` carries headings and controls; `muted` carries supporting text. `line` separates regions, `soft` marks quiet hover, and `field` with `field-border` distinguishes editable controls. `selected-study` softly fills the active thumbnail. Rust `danger` marks inspection issues; the error surface pairs `error-background` with `error-text`.

## Typography

Georgia supplies the introductory display; Arial/Helvetica supplies the tool interface. Both resolve locally with system fallbacks; no font asset is fetched. Monospace distinguishes encoded payloads and measurements. Numbers in seeds, range outputs and study indices use tabular figures.

The frontmatter defines the repeated hierarchy. Buttons use compact text (13px, line-height 1.4); export buttons use 12px. The wordmark uses 19px semibold text with a small secondary line. Supporting explanations use 12px text with generous line-height (1.7) and an 80ch measure; the adjacent caveat uses an approximately 90ch maximum.

## Layout

The desktop page is capped at 1560px with 4.5% side padding. A 260px left editing rail and flexible studio share a 40px gap. The rail has a right divider and 26px internal clearance. At widths from 1450px, the rail grows to 285px and the gap to 50px. At 900px and below, the rail is 225px with a 22px gap and the toolbar stacks.

At 650px and below, page padding becomes 5%, the introduction stacks, and controls precede the studio in two equal columns. The rail divider disappears, history spans both columns, and source/art comparison stacks vertically. The footer also stacks. The twelve-study grid uses six columns on desktop and four at 900px and below.

The default stage is at least 410px tall with 340px contained artwork; the wide layout uses 470px/400px, the intermediate layout 360px/290px, and mobile 345px/280px. Mobile comparison images use 235px each. Preserve the visible separation between controls, artwork, adjacent caveat, studies, inspection and exports.

## Elevation & Depth

No shadows are used. White artwork, warm canvas, faint dividers and selected olive strokes establish depth. Transparency is shown with a small CSS checkerboard rather than an image texture. Motion is limited to button background changes (0.12s) and study background/border changes (0.16s), enabled only when reduced motion is not requested.

## Shapes

Controls and artwork use small, quiet corner radii from the frontmatter. Thin borders define inputs, study selection and section divisions. The circular, irregular ink remains the dominant expressive shape; interface geometry stays rectangular and restrained.

## Components

- **Buttons:** transparent outlined defaults, soft hover and solid olive primary export. The primary remains olive on hover in the current cascade. Disabled buttons use 0.45 opacity and a not-allowed cursor. Text actions use an underlined olive treatment.
- **Inputs:** pale fields, visible border and olive caret. Textareas resize vertically; selects span their column. Native ranges and checkboxes retain platform behavior with the olive accent. Seed input uses tabular numbers.
- **Keyboard focus:** actionable controls receive a 2px olive outline offset by 3px. File-input labels expose the same treatment through focus-within.
- **View navigation:** flat segmented buttons use a muted default and dark selected text with a 2px olive bottom border. Selection is represented by `aria-pressed`.
- **Study cards:** square contained artwork, small tabular index, transparent default border; selected cards gain an olive border, pale olive fill and semibold olive index. These are selection controls, not decorative cards.
- **Artwork stage:** contained vector art with captions and a centered monospace physical-size annotation. Compare preserves distinct source and derivative captions. The adjacent caveat remains readable in every view.
- **Feedback:** inspection issues use rust text; operation failures use a pale rust alert surface. Export status occupies a small supporting-text region. Disclosure summaries expose technical detail without competing with the art.

## Do's and Don'ts

### Do:
- **Do** keep the artwork larger and visually stronger than the editing controls.
- **Do** use the established olive border, underline and outline treatments for selection and focus.
- **Do** keep source and derivative captions explicit and the honesty caveat adjacent to the preview.
- **Do** retain local system fonts and generated artwork for offline use.

### Don't:
- **Don't** replace the flat surfaces with decorative shadows or large rounded cards.
- **Don't** use the artwork's expressive ink shape as a control silhouette.
- **Don't** hide selection or keyboard focus behind color alone.
