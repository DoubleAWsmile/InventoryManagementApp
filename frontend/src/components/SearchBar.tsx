import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import SearchPanel from "./SearchPanel";
import type { PageName } from "../types";

interface SearchBarProps {
  onNavigate?: (page: PageName, query?: string) => void;
}

export default function SearchBar({ onNavigate }: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  function handleFocus() {
    setOpen(true);
  }

  function handleClear() {
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: open ? "rgba(123,159,255,0.8)" : "rgba(255,255,255,0.35)" }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder="Search items, rooms, categories..."
          className="w-full h-9 pl-9 pr-8 rounded-lg text-sm transition-all duration-150 focus:outline-none"
          style={{
            background: open ? "rgba(255,255,255,0.11)" : "rgba(255,255,255,0.06)",
            border: open ? "1px solid rgba(123,159,255,0.45)" : "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.88)",
          }}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* Dropdown panel */}
      {open && (
        <SearchPanel
          query={query}
          onQueryChange={setQuery}
          onClose={() => {
            setOpen(false);
            inputRef.current?.blur();
          }}
          onViewAll={(q) => {
            setOpen(false);
            inputRef.current?.blur();
            onNavigate?.("searchResults", q);
          }}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}
