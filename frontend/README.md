# Pass The Beat — Prototype 1

A local, turn-based music game for 2–5 players. React + React Router + Vite + Tone.js. The interface is entirely in English.

## Run

From `frontend`:

```sh
npm install
npm run dev
```

Open the local address printed by Vite. Create a lobby, enter player names and start the session. Audio unlocks from the Start session click.

## Current flow

- `/`: home with Create / Join.
- `/lobby/:code`: editable names, 2–5 players, BPM, turn length (15 seconds to 5 minutes) and listening time (4–60 seconds).
- `/studio/:code`: music editor. Browser Back pauses the editing timer and stops audio; Resume session continues the composition. Leaving during listening restarts that listening period when resumed.
- `/result/:code`: final shared beat. Invalid routes return home. Reloading an editor without an in-memory session returns to its saved lobby.
- A six-character code opens the stored lobby in the same browser and origin only. Lobby data uses localStorage. This is not online multiplayer: the actual game runs on one shared screen. Game state and the composition are in memory and are lost on reload/exit.
- Editor: instrument, bass, kick, hi-hat, snare and clap tracks, plus Add sound (up to 16 tracks through the UI).
- Everyone edits one shared composition. During their turn, any player can change or delete any existing notes and tracks, switch sounds, adjust volume and change BPM. Listening and result phases remain read-only. A turn change keeps the same tracks. Undo covers edits made during the current turn.
- End turn (or timeout) stops editing and plays the accumulated pattern for the configured listening time, repeating it as needed. Only then does the next player's timer start. The footer shows the queue, minutes/seconds and progress across the whole listening period.
- After the last turn, Reveal plays the shared composition and credits all players as co-creators.

## Editor controls

- Click a track card to select it. Double-click or its options button opens sound settings.
- Right-click a track card to change its sound, open settings or remove the track.
- Drag the circular volume control vertically; arrow keys change it in 5% increments.
- Sound settings include volume, transposition and Cut itself.
- Steps and Piano roll show/edit the same notes; switching modes does not erase data. Steps has 32 sixteenth-note buttons in groups of four. A lit step represents all note starts inside that sixteenth; toggling it off removes those notes.
- Piano roll: click an empty cell to add; drag a note to move; drag its right edge to resize; right-click or double-click a note to remove it.
- Focus a note and use arrow keys to move it, Shift+Left/Right to resize, Delete/Backspace to remove.
- Snap: 1/8, 1/16, 1/32 or 1/64. Zoom: 100–300%. Creation, dragging and keyboard editing follow the selected snap.
- Choose Key and Mood / scale in the lobby (Major · Happy or Minor · Sad). Every piano roll highlights that scale; the root has a stronger marker. Notes outside the scale remain available. Mood labels are starting points, not strict musical rules.
- Draw or Select tools: Ctrl/Cmd + drag empty space selects a rectangle; Ctrl/Cmd + click toggles individual notes; Shift adds a rectangle to the selection. Drag a selected note to move the group. Select all, Duplicate and Delete selected buttons are available, with Ctrl/Cmd+A, Ctrl/Cmd+D and Delete shortcuts. A duplicate is placed immediately after the selection if it fits in the two-bar pattern.
- Quick fill: Every 1 / 2 / 4 / 8 steps replaces the current step pattern. It is useful for hats and available on all step tracks. Undo restores the previous pattern.
- Allow chords disables Cut itself for that track, so simultaneous notes can sound together.
- Ctrl/Cmd+C copies selected notes; Ctrl/Cmd+V pastes and selects fresh copies for group dragging. Copy/Paste buttons do the same. The internal note clipboard works across tracks while the studio page is open; it does not use the system text clipboard. Paste places the group after the current selection (or at its original position with nothing selected) and shifts it left if necessary to fit the two-bar pattern without shortening notes. Undo removes the paste in one step.
- Space plays/pauses while editor buttons or notes have focus, without activating the focused control. Pause retains the playhead position; Stop resets it. Text fields and open dialogs retain normal keyboard behavior. Ctrl/Cmd+Z or Undo restores edits from the current turn.
- Every player can change BPM during their editing turn.
- Hold the right mouse button and sweep across notes or step buttons to erase them. The browser context menu is suppressed in both editors.
- Ctrl/Cmd+D duplicates the selected piano notes even when focus is elsewhere in the studio, including with a non-English keyboard layout; browser bookmarking is suppressed.

## Musical timing and sounds

The pattern is two bars in 4/4: 32 sixteenth-note steps, or 128 cells at the finest 1/64 snap. Internally it spans 16 eighth-note units with fractional positions. At 120 BPM it lasts 4 seconds. Changing BPM preserves two bars; listening duration is configured independently in seconds.

All 19 samples are local in `public/sounds`: 12 drum sounds, 3 bass sounds and 4 melodic sounds. The sample picker lists them by category. Current provenance information is in `public/sounds/CREDITS.txt`.

- Playback uses resampling: no BPM stretching or embedded sample loops.
- The piano-roll labels use FL-style reference keys with C5 as the unshifted recording. They do not confirm the recording's measured musical pitch; the supplied files are not all tuned to the same acoustic root.
- Scale highlighting uses score/grid pitches. They do not analyze audio, detect a sample's actual key or retune samples. Highlighted notes guide composition but do not guarantee that differently tuned samples will harmonize.
- Single-note previews retain the short 0.25-second instrument cap; sequenced notes follow their drawn length, bounded by the source recording's natural end. There is no artificial sustain looping.
- Cut itself defaults on for bass/instruments and is scoped to each track. Disable it in settings for overlapping notes/chords. Different tracks do not cut each other.
- Audio scheduling uses the audio clock with a small lookahead. UI animation is separate from note timing.

## Code map

- `src/main.jsx`: BrowserRouter entry point.
- `src/App.jsx`: route guards, shared session state, local lobby actions and turn coordination.
- `src/pages/`: separate HomePage, LobbyPage, StudioPage and ResultPage route views.
- `src/hooks/usePlayback.js`: audio lifecycle, playback and listening progress; audio engine loads in a separate bundle.
- `src/components/PianoRoll.jsx`: note creation, dragging, resizing and keyboard editing.
- `src/components/StepSequencer.jsx`: shared 32-step sequencer for arrangement rows and the active editor.
- `src/components/Queue.jsx`: player timers and listening connectors.
- `src/components/SoundDialogs.jsx`: sample picker and track settings.
- `src/game/model.js`: notes, shared-track updates and turn transitions.
- `src/game/rooms.js`: room validation, settings and time formatting.
- `src/game/harmony.js`: scale membership and note names.
- `src/game/editing.js`: bounded group editing, duplication and quick fills.
- `src/audio/audioEngine.js`: buffers, per-track voices, gain and cut behaviour.
- `src/audio/sequencer.js`: timed loop playback.
- `src/styles/`: shared interface, studio, page and editor styles; neutral surfaces with muted channel colors.

Production hosting must serve `index.html` for unmatched application routes so direct links and reloads work with BrowserRouter. Vite handles this during local development.

## Validation

```sh
npm run build
npm run lint
npm test
```

Tests cover audio lifecycle, short previews, voice isolation, fractional note timing, configured listening at multiple BPM values, shared edits between players, turn progression, room limits and harmony suggestions. `scripts/check-ui.mjs` uses jsdom and a simulated audio engine to exercise routes, persisted settings, note creation/drag/resize, hints, mode switching, pause/resume, listening and results. These checks do not replace visual browser review or listening to the real audio output.

Manual check: create 3 players, add/drag/resize a few notes, add a drum pattern, change a sample, adjust volume, finish the turn, listen to the previous work, add a second contribution and reach Reveal. Also check automatic timeout, right-click menus and a narrow window.

## Next prototype

A shared backend is needed for real room codes and separate-device play. Current sound sources must be checked before public distribution. No accounts, audio export or permanent composition storage are implemented.
