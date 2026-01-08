'use client';

import { useState, useEffect } from 'react';
import { userService, referenceDataService } from '@/lib/api';
import type { User, UserCreateInput, UserUpdateInput } from '@/types/auth';
import type { Group } from '@/types/schedule';
import { initialUserForm, type UserFormState } from './types';
import GroupAutocomplete from './GroupAutocomplete';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [userForm, setUserForm] = useState<UserFormState>({ ...initialUserForm });
  const [groupCode, setGroupCode] = useState<string>(''); // Codul grupei pentru autocomplete
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
    loadGroups();
  }, []);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Eroare la încărcarea utilizatorilor');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await referenceDataService.getGroups();
      setGroups(data);
    } catch (err: any) {
      console.error('Eroare la încărcarea grupelor:', err);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username.trim()) {
      setError('Introduce poșta corporativă.');
      return;
    }

    // Găsește ID-ul grupei pe baza codului introdus
    let groupId: number | null = null;
    if (userForm.role === 'student' && groupCode.trim()) {
      const foundGroup = groups.find(g => g.code.toLowerCase() === groupCode.trim().toLowerCase());
      if (foundGroup) {
        groupId = foundGroup.id;
      } else {
        setError(`Grupă "${groupCode}" nu a fost găsită în baza de date.`);
        return;
      }
    }

    try {
      setError('');
      setSuccess('');
      if (userForm.id) {
        const payload: UserUpdateInput = {
          username: userForm.username.trim(),
          role: userForm.role,
          group_id: groupId,
        };
        await userService.updateUser(userForm.id, payload);
        setSuccess('Utilizator actualizat.');
      } else {
        // Pentru utilizatori noi, generăm o parolă automată
        // Parola va fi generată pe backend
        const payload: UserCreateInput = {
          username: userForm.username.trim(),
          password: '', // Backend-ul va genera parola automat
          role: userForm.role,
          group_id: groupId,
        };
        await userService.createUser(payload);
        setSuccess('Utilizator creat cu parolă generată automat.');
      }
      setUserForm({ ...initialUserForm });
      setGroupCode('');
      await loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Eroare la salvarea utilizatorului.');
    }
  };

  const handleUserEdit = (user: User) => {
    setUserForm({
      id: user.id,
      username: user.username,
      password: '',
      role: user.role,
      group_id: user.group_id || null,
    });
    // Setează codul grupei pentru autocomplete
    if (user.group_id) {
      const userGroup = groups.find(g => g.id === user.group_id);
      setGroupCode(userGroup?.code || '');
    } else {
      setGroupCode('');
    }
    setError('');
    setSuccess('');
  };

  const handleUserDelete = async (userId: number) => {
    try {
      setError('');
      setSuccess('');
      setDeleteConfirm(null); // Închide dialogul de confirmare
      await userService.deleteUser(userId);
      await loadUsers();
      setSuccess('Utilizator șters cu succes.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Eroare la ștergerea utilizatorului:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Eroare la ștergerea utilizatorului.';
      setError(errorMessage);
      console.error('Detalii eroare:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
    }
  };

  const handleAddNew = () => {
    setUserForm({ ...initialUserForm });
    setGroupCode('');
    setError('');
    setSuccess('');
  };

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ marginBottom: '2rem' }}>
       

        {error && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '4px',
              marginBottom: '1rem',
              border: '1px solid #fcc',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#efe',
              color: '#3c3',
              borderRadius: '4px',
              marginBottom: '1rem',
              border: '1px solid #cfc',
            }}
          >
            {success}
          </div>
        )}


        {/* Formular pentru creare/editare */}
        <div
          style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            border: '1px solid #e9ecef',
          }}
        >
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#0f172a' }}>
            {userForm.id ? 'Editează Utilizator' : 'Utilizator Nou'}
          </h3>
          <form
            onSubmit={handleUserSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Posta corporativă *
                </label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    color: '#000000',
                    backgroundColor: '#ffffff',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Rol *
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => {
                    const newRole = e.target.value as 'admin' | 'student' | 'professor';
                    setUserForm({ 
                      ...userForm, 
                      role: newRole,
                      group_id: newRole === 'student' ? userForm.group_id : null // Resetează grupă dacă nu e student
                    });
                    if (newRole !== 'student') {
                      setGroupCode(''); // Resetează codul grupei dacă nu e student
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    backgroundColor: 'white',
                    color: '#000000',
                  }}
                  required
                >
                  <option value="admin" style={{ color: '#000000' }}>Admin</option>
                  <option value="student" style={{ color: '#000000' }}>Student</option>
                  <option value="professor" style={{ color: '#000000' }}>Profesor</option>
                </select>
              </div>

              <div style={{ display: userForm.role === 'student' ? 'block' : 'none' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Grupa
                </label>
                <GroupAutocomplete
                  value={groupCode}
                  onChange={(value) => setGroupCode(value)}
                  placeholder="Caută grupă..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="submit"
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                }}
              >
                {userForm.id ? 'Actualizează' : 'Creează'}
              </button>
              {userForm.id && (
                <button
                  type="button"
                  onClick={() => {
                    setUserForm({ ...initialUserForm });
                    setGroupCode('');
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                  }}
                >
                  Anulează
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista utilizatorilor */}
        <div>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#0f172a' }}>
            Lista Utilizatori ({users.length})
          </h3>
          {usersLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Se încarcă...</div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              Nu există utilizatori în sistem.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: 'white',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Posta corporativă</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Rol</th>
                    {users.some(u => u.role === 'student') && (
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Grupa</th>
                    )}
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: '1px solid #e9ecef',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <td style={{ padding: '1rem', color: '#374151', fontWeight: '500' }}>{user.username}</td>
                      <td style={{ padding: '1rem', color: '#374151' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            backgroundColor:
                              user.role === 'admin'
                                ? '#fee2e2'
                                : user.role === 'professor'
                                ? '#dbeafe'
                                : '#dcfce7',
                            color:
                              user.role === 'admin'
                                ? '#991b1b'
                                : user.role === 'professor'
                                ? '#1e40af'
                                : '#166534',
                          }}
                        >
                          {user.role === 'admin' ? 'Admin' : user.role === 'professor' ? 'Profesor' : 'Student'}
                        </span>
                      </td>
                      {users.some(u => u.role === 'student') && (
                        <td style={{ padding: '1rem', color: '#374151' }}>
                          {user.role === 'student' && (user.group_code || '—')}
                        </td>
                      )}
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleUserEdit(user)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#616161ff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                            }}
                          >
                            Editează
                          </button>
                          {deleteConfirm === user.id ? (
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button
                                onClick={() => handleUserDelete(user.id)}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                }}
                              >
                                Confirmă
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  backgroundColor: '#6c757d',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                }}
                              >
                                Anulează
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#7c2c34ff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                              }}
                            >
                              Șterge
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

