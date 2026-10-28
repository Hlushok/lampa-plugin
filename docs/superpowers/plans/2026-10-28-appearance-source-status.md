# Appearance source availability indicators

Restore the same source status presentation in Poster, Filmstrip, Credits and
Credits+ as in Nova. The appearance runtime currently empties source chips,
removing the confirmed-source dot; its all:unset rule also resets empty/checking
opacity. Keep the shared Nova availability classification and backend requests.

- Preserve the existing source dot when adapting a chip; leave other controls.
- Restore empty/checking opacity in the scoped appearance integration CSS.
- Exercise found/missing states, More and rerender across all five active skins.
- Regenerate Premium from the immutable upstream, run unit/browser checks,
  review, publish and compare actual public artifacts. No script URL versions.
