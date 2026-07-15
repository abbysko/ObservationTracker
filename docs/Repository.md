# Repository

All persistence must go through repository interfaces. UI code MUST NOT access storage APIs directly.

## Repository API (examples)

- `repository.loadLists(): Promise<List[]>`
- `repository.saveList(list: List): Promise<void>`
- `repository.deleteList(listId: string): Promise<void>`
- `repository.loadSession(sessionId: string): Promise<Session>`
- `repository.saveSession(session: Session): Promise<void>`
- `repository.deleteSession(sessionId: string): Promise<void>`
- `repository.loadHistory(): Promise<Session[]>`

## Implementations

- Browser implementation: IndexedDB (wrapped behind the repository interface)
- Native implementation: SwiftData (or similar), exposed via a small bridge

## Principles

- Keep repository methods small and testable
- The UI layer should be agnostic to the underlying storage implementation
- Handle migrations and schema changes inside repository implementations
