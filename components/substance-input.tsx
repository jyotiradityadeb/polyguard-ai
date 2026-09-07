"use client";
import { useId, useState } from "react";
import { Search, Plus, X } from "lucide-react";
import type { Entity } from "@/types/polyguard";
import { normalize } from "@/lib/normalization";
export function SubstanceInput({
  title,
  kind,
  entities,
  values,
  onChange,
}: {
  title: string;
  kind: Entity["kind"];
  entities: Entity[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const id = useId();
  const filtered = entities
    .filter(
      (e) =>
        e.kind === kind &&
        [e.name, e.scientificName, ...e.aliases].some(
          (n) => n && normalize(n).includes(normalize(query)),
        ),
    )
    .slice(0, 6);
  function add(value: string) {
    if (!values.some((v) => normalize(v) === normalize(value)))
      onChange([...values, value]);
    setQuery("");
    setFocused(false);
    setActive(0);
  }
  return (
    <div className="substance-input">
      <label htmlFor={id}>{title}</label>
      <div className="search-wrap">
        <Search size={18} />
        <input
          id={id}
          value={query}
          placeholder={`Search ${kind === "drug" ? "medicine" : kind === "herb" ? "herb or ingredient" : "demo formulation"}…`}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={focused}
          aria-controls={`${id}-list`}
          aria-activedescendant={
            focused && filtered[active] ? `${id}-${active}` : undefined
          }
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            setQuery(e.target.value);
            setFocused(true);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setFocused(false);
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setFocused(true);
              setActive((a) => Math.min(a + 1, filtered.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            }
            if (e.key === "Enter") {
              e.preventDefault();
              if (focused && filtered[active]) add(filtered[active].name);
              else if (query.trim()) add(query.trim());
            }
          }}
        />
        {query && (
          <button
            type="button"
            aria-label={`Add ${query} as entered`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => add(query.trim())}
          >
            <Plus size={18} />
          </button>
        )}
        {focused && (
          <div className="suggestions" id={`${id}-list`} role="listbox">
            {filtered.map((e, i) => (
              <button
                type="button"
                role="option"
                aria-selected={active === i}
                id={`${id}-${i}`}
                key={e.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => add(e.name)}
              >
                <span>{e.name}</span>
                <small>{e.scientificName ?? e.category}</small>
              </button>
            ))}
            {!filtered.length && (
              <button
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => query.trim() && add(query.trim())}
              >
                Add “{query}” for an availability check
              </button>
            )}
          </div>
        )}
      </div>
      <div className="chips">
        {values.map((value) => (
          <span className={`chip ${kind}`} key={value}>
            {value}
            <button
              type="button"
              aria-label={`Remove ${value}`}
              onClick={() => onChange(values.filter((v) => v !== value))}
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
