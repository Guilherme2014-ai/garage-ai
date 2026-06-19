/**
 * A saved customization session. `state` is the serialized client snapshot
 * (current state + history + caches); the server stores and returns it opaquely
 * — the shape is owned by the customize feature's `BuildSnapshot`.
 */
export interface BuildEntity {
  id: string;
  userId: string;
  carName: string;
  baseImageUrl: string;
  state: unknown;
  createdAt: Date;
  updatedAt: Date;
}
