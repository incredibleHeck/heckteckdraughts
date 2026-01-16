# Track Specification: Implement Opening Book

## Goal
To enable the AI to utilize professional International Draughts opening theory from the `openings.json` data file, reducing search time in the early game.

## Scope
- **Port Logic:** Convert `legacy/src/utils/opening-book.js` to `src/utils/opening-book.ts`.
- **Data Integration:** Statically import `src/data/openings.json` for type safety and faster loading.
- **Move Translation:** Implement notation-to-coordinate translation (e.g., "32-28" to `{from, to}`) specific to our horizontally flipped board.
- **Engine Connection:** Hook the `OpeningBook` into the `SearchEngine` so it checks for known theoretical moves before initiating a deep search.

## Success Criteria
- [ ] `OpeningBook` correctly parses the `openings.json` data.
- [ ] AI identifies and plays a book move for the starting position (e.g., 32-28).
- [ ] Move translation correctly accounts for the Ghanaian/flipped board coordinate system.
- [ ] Unit tests verify move retrieval logic.
