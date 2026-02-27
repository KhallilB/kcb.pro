# ComboCV

ComboCV is a React + PixiJS portfolio runtime with fighting-game style encounters.

## Intro Flow (Interactive Foundation)

Before the start screen, ComboCV runs a 3-stage interactive intro sequence:

1. `Signal Link Established` (`hold`)
2. `Combat Briefing` (`swipe`)
3. `Entry Protocol` (`combo tap`)

Each stage has a playable input objective, then advances using the `glitch_gate` transition preset.
Reduced motion mode applies faster thresholds and shorter transitions.

## Keyboard Controls (V1)

### Start Screen and Hub (`intro` / `hub`)

| Keys | Action |
| --- | --- |
| `ArrowLeft`, `A` | Move fighter focus left |
| `ArrowRight`, `D` | Move fighter focus right |
| `J` | Start encounter for focused fighter |

### Encounter (`encounter`)

| Keys | Action |
| --- | --- |
| `J`, `Space`, `Enter` | Attack (`tap`) |
| `ArrowLeft` | Submit `swipe_left` gesture |
| `ArrowRight` | Submit `swipe_right` gesture |
| `ArrowUp` | Submit `swipe_up` gesture |
| `Shift` | Submit `hold` gesture |
| `A`, `D` | Movement nudge only (no gesture submission) |

### Compatibility Note

Arrow keys intentionally differ by phase:

- In `intro` / `hub`, arrows navigate fighter focus.
- In `encounter`, arrows remain swipe gestures for existing action-sequence compatibility.

## Interaction Lab

Open `/interaction-lab` (or use **Open Interaction Lab** from the start screen) to run keyboard scenarios:

1. `KEYBOARD_FOCUS_NAV`
2. `KEYBOARD_ATTACK_START`
3. `KEYBOARD_ATTACK_ENCOUNTER`

The lab logs timestamped keyboard intents/outcomes and supports JSON export.
