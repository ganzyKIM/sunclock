---
name: pictogram-drawing
description: Draw pictograms, icons, and illustration sets as vector paths that will be rendered in the app (Skia, SVG, or Canvas). Use this whenever the task involves drawing an animal, object, symbol, mascot, icon set, or any figurative artwork in code — including zodiac animals, UI icons, empty-state illustrations, splash art, and anything where a shape has to be recognizable. Also use it when an existing drawing needs to be made clearer or more beautiful. Drawing blind and shipping the first attempt is the failure this skill exists to prevent.
---

# Drawing pictograms that actually read

Code-drawn figures fail in a specific, predictable way: you compose a few
primitives, the geometry is defensible, and the result is an unrecognizable
blob. It happens because writing path data feels like the work, so the work
stops before anyone looks at the picture.

The work is not done until you have looked at the render.

## The loop

1. **Name the read.** Before any coordinate, write down the one or two
   features that make this thing unmistakable. A rabbit is two long ears. A
   rooster is a comb and a tail fan. A snake is a coil. If you cannot name
   the read, you will draw a generic animal body and it will look like every
   other generic animal body.
2. **Build around that feature**, not around a body. The body is a support
   for the read, and it is usually smaller and plainer than instinct says.
3. **Render a contact sheet** with `scripts/pictogram.py` and look at it.
4. **Judge at the size it will be used**, not at full size. The sheet includes
   a small row for exactly this. Most failures are invisible at 300px and
   obvious at 32px.
5. **Fix the worst one, re-render, look again.** Two or three rounds is
   normal. One round is a sign you did not really look.

## What to look for when you look

Ask these in order. The first failure is the one to fix.

- **Silhouette test.** Cover the label. Can you name it? If the shape needs a
  caption to be understood it is decoration, not a pictogram.
- **Merged shapes.** Fills that touch become one lump. Two circles on a
  circle read as ears on *any* animal, so the whole set collapses into
  variations of the same mouse. Separate the masses, or let a gap of
  background carry the form.
- **The blob trap.** If several figures in the set share one round body with
  small appendages, the set has no variety. Change the body axis (long,
  upright, coiled), the posture, and the proportions between figures.
- **Weight consistency.** Across a set, stroke thickness and optical density
  should match. One figure heavier than its neighbours looks like a mistake
  even when each is fine alone.
- **Optical size, not bounding box.** A coiled snake and a standing rooster
  with the same bounding box look wildly different in size. Match how big
  they *feel*, which usually means letting tall figures exceed the box the
  wide ones fill.
- **Stance.** Pick one direction for the set and keep it. Mixed facing reads
  as carelessness.

## Two styles, and when each wins

**Solid silhouette** is stronger at small sizes and for animals with a
distinctive outline. It fails when interior detail carries the read, because
interior detail disappears.

**Stroked line art** keeps interior information (a horse's mane, stripes, a
comb) and lets shapes overlap without merging, because the background shows
through. It needs a minimum stroke weight to survive scaling — thin hairlines
vanish first.

Mixing the two inside one set almost never works. Choose once.

When a figure refuses to read as a silhouette after two attempts, that is
usually the signal to switch the whole set to strokes rather than to keep
pushing that one shape.

## Drawing in code

`scripts/pictogram.py` has the primitives worth having: `ellipse`, `circle`,
`poly`, `ribbon` (a curve with tapering thickness, for tails, horns and
whiskers), `blob` (smoothed through points, for organic masses), `arc_stroke`,
and `path` for raw data. Compose a figure as a list of these and join them.

Two habits that pay off:

- **Work in a fixed box** (100 × 100 is convenient) and keep every figure
  inside it, so the consumer can scale one number.
- **Keep the source in the generator, not in the output.** Emit the path
  strings into a data file and treat that file as build output. Hand-editing
  generated path data means the next regeneration silently throws the fix
  away, so say so in a comment at the top of the generated file.

## Getting fresh eyes

Authoring bias is real: you know what you meant, so you see it. When a set
matters, hand the contact sheet to the `art-critic` agent, which is told only
what the figures are supposed to be and reports which ones fail and why. It
catches the "this reads as a bear" problems that are invisible from inside.

## When the subject is cultural

Animals, symbols and motifs carry specific forms in the tradition they come
from. A Korean twelve-branch rat is not a cartoon mouse, and a dragon in this
context is long and serpentine with no wings, not a western winged lizard.
Look up the tradition's own form before drawing, and let it drive the
silhouette. Getting this right is most of what makes a set feel considered
rather than generic.
