# Decision Log

Architectural and design decisions with context, alternatives considered, and outcomes.

## 2026-07-15

**Decision:** Built-in lists are immutable.

**Reason:** Historical sessions should never depend on mutable built-in content; immutable defaults simplify support and documentation.

**Notes:** Editing a built-in list must create a new custom list (new id).
