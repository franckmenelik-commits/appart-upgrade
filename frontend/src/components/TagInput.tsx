"use client";

import { useState } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

export default function TagInput({ tags, onChange, placeholder, suggestions }: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = (tag: string) => {
    const normalized = tag.trim();
    if (normalized && !tags.includes(normalized)) {
      onChange([...tags, normalized]);
    }
    setInput("");
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, i) => (
          <span 
            key={i} 
            className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950 text-blue-600 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-100"
          >
            {tag}
            <button 
              type="button" 
              onClick={() => removeTag(i)}
              className="hover:text-blue-800 p-0.5"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(input);
            }
          }}
          placeholder={placeholder || "Ex: Piscine, Garage..."}
          className="flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-2.5 text-sm"
        />
        <button
          type="button"
          onClick={() => addTag(input)}
          className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold hover:bg-blue-700 transition-colors"
        >
          +
        </button>
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.filter(s => !tags.includes(s)).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="text-[10px] uppercase font-bold tracking-widest text-[var(--muted)] hover:text-blue-600"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
