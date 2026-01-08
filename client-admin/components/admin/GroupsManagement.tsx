'use client';

import React, { useState } from 'react';
import { referenceDataService } from '@/lib/api';
import type { Group } from '@/types/schedule';

export default function GroupsManagement() {
  const [textInput, setTextInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // Salvează grupele încărcate pentru a ști care trebuie modificate/șterse
  const [loadedGroups, setLoadedGroups] = useState<Group[]>([]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleLoad = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const groups = await referenceDataService.getGroups();
      
      if (groups.length === 0) {
        setMessage({
          type: 'error',
          text: 'Nu există grupe în baza de date.',
        });
        setTimeout(() => setMessage(null), 3000);
        setLoading(false);
        return;
      }

      // Formatează grupele: câte una pe linie
      const groupsText = groups.map(g => g.code).join('\n');
      setTextInput(groupsText);
      // Salvează grupele încărcate pentru a ști care trebuie modificate/șterse
      setLoadedGroups(groups);

      setMessage({
        type: 'success',
        text: `${groups.length} grup${groups.length === 1 ? 'ă' : 'e'} încărcat${groups.length === 1 ? 'ă' : 'e'} din baza de date.`,
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || err.message || 'Eroare la încărcarea grupelor',
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const extractGroups = (text: string): string[] => {
    // Regex pentru a găsi toate grupele: litere, cifre și "-"
    const regex = /[A-Za-z0-9-]+/g;
    const matches = text.match(regex);
    
    if (!matches) {
      return [];
    }
    
    // Elimină duplicatele și returnează array-ul
    return [...new Set(matches)];
  };

  const handleSave = async () => {
    if (!textInput.trim()) {
      setMessage({
        type: 'error',
        text: 'Nu există text de procesat.',
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Extrage grupele din text folosind regex
      const groupsFromText = extractGroups(textInput);
      
      if (groupsFromText.length === 0) {
        setMessage({
          type: 'error',
          text: 'Nu s-au găsit grupe valide în text.',
        });
        setTimeout(() => setMessage(null), 3000);
        setLoading(false);
        return;
      }

      // Obține grupele actuale din baza de date
      const currentGroups = await referenceDataService.getGroups();
      const currentGroupsMap = new Map(currentGroups.map(g => [g.code.toUpperCase(), g]));

      // Creează mapare pentru grupele încărcate (pentru a ști care trebuie modificate/șterse)
      const loadedGroupsMap = new Map(loadedGroups.map(g => [g.code.toUpperCase(), g]));

      const groupsFromTextSet = new Set(groupsFromText.map(g => g.toUpperCase()));
      const createdGroups: string[] = [];
      const updatedGroups: string[] = [];
      const deletedGroups: Group[] = [];
      const errors: string[] = [];

      // Identifică grupele care trebuie șterse (sunt în baza de date dar nu în textarea)
      for (const loadedGroup of loadedGroups) {
        if (!groupsFromTextSet.has(loadedGroup.code.toUpperCase())) {
          deletedGroups.push(loadedGroup);
        }
      }

      // Identifică grupele care trebuie create sau modificate
      for (let i = 0; i < groupsFromText.length; i++) {
        const groupCode = groupsFromText[i];
        const groupCodeUpper = groupCode.toUpperCase();
        const existingGroup = currentGroupsMap.get(groupCodeUpper);
        const loadedGroup = i < loadedGroups.length ? loadedGroups[i] : null;

        if (!existingGroup) {
          // Grupă nouă - trebuie creată
          createdGroups.push(groupCode);
        } else if (loadedGroup && loadedGroup.code.toUpperCase() !== groupCodeUpper) {
          // Grupă modificată - trebuie actualizată
          // Verifică dacă noul cod nu există deja
          if (!currentGroupsMap.has(groupCodeUpper)) {
            updatedGroups.push(groupCode);
          } else {
            errors.push(`${loadedGroup.code} → ${groupCode}: Codul ${groupCode} există deja`);
          }
        }
      }

      // Șterge grupele
      for (const groupToDelete of deletedGroups) {
        try {
          await referenceDataService.deleteGroup(groupToDelete.id);
        } catch (err: any) {
          errors.push(`Ștergere ${groupToDelete.code}: ${err.response?.data?.detail || err.message || 'Eroare necunoscută'}`);
        }
      }

      // Actualizează grupele modificate
      for (let i = 0; i < groupsFromText.length; i++) {
        const groupCode = groupsFromText[i];
        const groupCodeUpper = groupCode.toUpperCase();
        const loadedGroup = i < loadedGroups.length ? loadedGroups[i] : null;
        const existingGroup = currentGroupsMap.get(groupCodeUpper);

        if (loadedGroup && loadedGroup.code.toUpperCase() !== groupCodeUpper && !existingGroup) {
          try {
            await referenceDataService.updateGroup(loadedGroup.id, {
              code: groupCode,
            });
            updatedGroups.push(groupCode);
          } catch (err: any) {
            errors.push(`Actualizare ${loadedGroup.code} → ${groupCode}: ${err.response?.data?.detail || err.message || 'Eroare necunoscută'}`);
          }
        }
      }

      // Creează grupele noi
      for (const groupCode of createdGroups) {
        try {
          await referenceDataService.createGroup({
            code: groupCode,
            year: null,
            faculty: null,
            specialization: null,
          });
        } catch (err: any) {
          errors.push(`Creare ${groupCode}: ${err.response?.data?.detail || err.message || 'Eroare necunoscută'}`);
        }
      }

      // Reîncarcă grupele pentru a actualiza maparea
      const updatedGroupsList = await referenceDataService.getGroups();
      setLoadedGroups(updatedGroupsList);

      // Afișează rezultatul
      const successCount = createdGroups.length + updatedGroups.length + deletedGroups.length;
      if (successCount > 0 || errors.length > 0) {
        const parts: string[] = [];
        if (createdGroups.length > 0) {
          parts.push(`${createdGroups.length} creat${createdGroups.length === 1 ? 'ă' : 'e'}`);
        }
        if (updatedGroups.length > 0) {
          parts.push(`${updatedGroups.length} actualizat${updatedGroups.length === 1 ? 'ă' : 'e'}`);
        }
        if (deletedGroups.length > 0) {
          parts.push(`${deletedGroups.length} șters${deletedGroups.length === 1 ? 'ă' : 'e'}`);
        }

        setMessage({
          type: errors.length === 0 ? 'success' : 'error',
          text: parts.join(', ') + '.',
        });
      } else {
        setMessage({
          type: 'error',
          text: 'Nu s-au făcut modificări.',
        });
      }

      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || err.message || 'Eroare la salvarea grupelor',
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        minWidth: '100%',
        boxSizing: 'border-box',
        display: 'inline-block',
      }}
    >
      {message && (
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: message.type === 'success' ? '#efe' : '#fee',
            color: message.type === 'success' ? '#3c3' : '#c33',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: `1px solid ${message.type === 'success' ? '#cfc' : '#fcc'}`,
            fontSize: '0.875rem',
          }}
        >
          {message.text}
        </div>
      )}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-start', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={handleLoad}
          disabled={loading}
          style={{
            padding: '0.5rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: loading ? '#9ca3af' : '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Se încarcă...' : 'Citire'}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !isEditing}
          style={{
            padding: '0.5rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: loading || !isEditing ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || !isEditing ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            opacity: loading || !isEditing ? 0.6 : 1,
          }}
        >
          {loading ? 'Se salvează...' : 'Salvare'}
        </button>
        <button
          type="button"
          onClick={handleEditToggle}
          style={{
            padding: '0.5rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: isEditing ? '#ef4444' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          {isEditing ? 'Oprește editarea' : 'Editare'}
        </button>
      </div>
      <textarea
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        readOnly={!isEditing}
        style={{
          width: '100%',
          minHeight: '500px',
          padding: '1rem',
          fontSize: '1rem',
          fontFamily: 'monospace',
          border: '1px solid #ccc',
          borderRadius: '4px',
          resize: 'vertical',
          boxSizing: 'border-box',
          cursor: isEditing ? 'text' : 'not-allowed',
        }}
      />
    </div>
  );
}

