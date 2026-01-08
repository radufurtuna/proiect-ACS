'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { referenceDataService } from '@/lib/api';
import type { Group } from '@/types/schedule';

interface GroupAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function GroupAutocomplete({ value, onChange, placeholder = 'Nume grupă' }: GroupAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Group[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Încarcă toate grupele la montarea componentei
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const groups = await referenceDataService.getGroups();
        setAllGroups(groups);
      } catch (err) {
        console.error('Eroare la încărcarea grupelor:', err);
      }
    };
    loadGroups();
  }, []);

  // Caută grupele care se potrivesc cu textul introdus
  const searchGroups = useCallback((searchText: string) => {
    if (!searchText.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchLower = searchText.toLowerCase().trim();
    const matched = allGroups.filter(group =>
      group.code.toLowerCase().includes(searchLower)
    ).slice(0, 10); // Limitează la 10 sugestii

    setSuggestions(matched);
    setShowSuggestions(matched.length > 0);
  }, [allGroups]);

  // Debounce pentru căutare
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Anulează timer-ul anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Setează un nou timer pentru căutare
    debounceTimerRef.current = setTimeout(() => {
      searchGroups(newValue);
    }, 300);
  };

  // Selectează o sugestie
  const handleSelectSuggestion = (group: Group) => {
    onChange(group.code);
    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.blur();
  };

  // Închide sugestiile când se face click în afara
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  // Highlight pentru textul căutat
  const highlightMatch = (text: string, searchText: string) => {
    if (!searchText.trim()) return text;
    
    const searchLower = searchText.toLowerCase();
    const textLower = text.toLowerCase();
    const index = textLower.indexOf(searchLower);
    
    if (index === -1) return text;
    
    const before = text.substring(0, index);
    const match = text.substring(index, index + searchText.length);
    const after = text.substring(index + searchText.length);
    
    return (
      <>
        {before}
        <strong style={{ backgroundColor: '#fef08a' }}>{match}</strong>
        {after}
      </>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (value.trim()) {
            searchGroups(value);
          }
        }}
        style={{
          width: '100%',
          padding: '0.25rem',
          border: '1px solid #ccc',
          borderRadius: '2px',
          fontSize: '0.875rem',
          color: '#000',
          backgroundColor: '#fff',
          textAlign: 'center',
        }}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.25rem',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {suggestions.map((group) => (
            <div
              key={group.id}
              onClick={() => handleSelectSuggestion(group)}
              style={{
                padding: '0.5rem',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
                fontSize: '0.875rem',
                color: '#000',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              {highlightMatch(group.code, value)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

