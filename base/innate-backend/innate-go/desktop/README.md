# desktop/ — shared Tauri Cargo target helpers

Moved under **innate-go**. Prefer the unified CLI:

```bash
innate-go desktop-app config     # default Tauri shared-cargo config
eval "$(innate-go desktop-app env)"
innate-go desktop-app status
innate-go desktop-app clean --yes
```

Low-level scripts still work:

```bash
source desktop/env.sh
node desktop/with-desktop-cargo.mjs cargo check --manifest-path ...
```

Shared artifacts live in `desktop/target/` (gitignored).
