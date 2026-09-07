import type { Entity } from "@/types/polyguard";
export function normalize(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}
export function resolve(
  value: string,
  entities: Entity[],
  kind: Entity["kind"],
) {
  const key = normalize(value);
  return entities.find(
    (e) =>
      e.kind === kind &&
      [e.id, e.name, e.scientificName, ...e.aliases]
        .filter(Boolean)
        .some((n) => normalize(n!) === key),
  );
}
