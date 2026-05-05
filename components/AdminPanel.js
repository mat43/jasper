'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ShieldCheck, ShieldOff, KeyRound, Trash2, UserPlus, Check, AlertTriangle } from 'lucide-react'

export default function AdminPanel({ onClose }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal sub-states
  const [passwordModal, setPasswordModal] = useState(null) // { username, name }
  const [deleteModal, setDeleteModal]     = useState(null) // { username, name }
  const [createOpen, setCreateOpen]       = useState(false)
  const [toast, setToast]                 = useState(null) // { message, type: 'success'|'error' }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setUsers(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function toggleAdmin(username, currentIsAdmin) {
    const res = await fetch(`/api/admin/users/${username}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAdmin: !currentIsAdmin }),
    })
    if (!res.ok) { showToast('Failed to update role', 'error'); return }
    setUsers(u => u.map(x => x.username === username ? { ...x, isAdmin: !currentIsAdmin } : x))
    showToast(`${username} is ${!currentIsAdmin ? 'now an admin' : 'no longer an admin'}`)
  }

  async function toggleActive(username, currentIsActive) {
    const res = await fetch(`/api/admin/users/${username}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentIsActive }),
    })
    if (!res.ok) { showToast('Failed to update status', 'error'); return }
    setUsers(u => u.map(x => x.username === username ? { ...x, isActive: !currentIsActive } : x))
    showToast(`${username} ${!currentIsActive ? 'activated' : 'deactivated'}`)
  }

  async function deleteUser(username) {
    const res = await fetch(`/api/admin/users/${username}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      showToast(body.error || 'Failed to delete user', 'error')
      return
    }
    setUsers(u => u.filter(x => x.username !== username))
    setDeleteModal(null)
    showToast(`${username} deleted`)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
            <p className="text-xs text-gray-400 mt-0.5">Manage users and access</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add user
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading && <p className="text-sm text-gray-400">Loading users…</p>}
          {error   && <p className="text-sm text-red-500">{error}</p>}

          {!loading && !error && users.map(user => (
            <div
              key={user.username}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                user.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              {/* Avatar placeholder */}
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                {(user.name || user.username).charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.name || user.username}
                  </p>
                  {user.isAdmin && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      Admin
                    </span>
                  )}
                  {!user.isActive && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">@{user.username} {user.email ? `· ${user.email}` : ''}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Toggle admin */}
                <button
                  onClick={() => toggleAdmin(user.username, user.isAdmin)}
                  title={user.isAdmin ? 'Remove admin' : 'Make admin'}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-indigo-600"
                >
                  {user.isAdmin ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                </button>

                {/* Reset password */}
                <button
                  onClick={() => setPasswordModal({ username: user.username, name: user.name || user.username })}
                  title="Reset password"
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-amber-600"
                >
                  <KeyRound className="w-4 h-4" />
                </button>

                {/* Deactivate / Activate */}
                <button
                  onClick={() => toggleActive(user.username, user.isActive)}
                  title={user.isActive ? 'Deactivate' : 'Activate'}
                  className={`p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 ${
                    user.isActive ? 'hover:text-orange-500' : 'hover:text-emerald-600'
                  }`}
                >
                  {user.isActive ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>

                {/* Delete */}
                <button
                  onClick={() => setDeleteModal({ username: user.username, name: user.name || user.username })}
                  title="Delete user"
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white flex items-center gap-2 ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Password Reset Modal */}
      {passwordModal && (
        <PasswordResetModal
          user={passwordModal}
          onClose={() => setPasswordModal(null)}
          onSuccess={msg => { showToast(msg); setPasswordModal(null) }}
          onError={msg => showToast(msg, 'error')}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteModal && (
        <ConfirmDeleteModal
          user={deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={() => deleteUser(deleteModal.username)}
        />
      )}

      {/* Create User Modal */}
      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onSuccess={newUser => {
            setUsers(u => [...u, newUser].sort((a, b) => (a.name || '').localeCompare(b.name || '')))
            setCreateOpen(false)
            showToast(`${newUser.username} created`)
          }}
          onError={msg => showToast(msg, 'error')}
        />
      )}
    </>
  )
}

/* ─── Sub-modals ──────────────────────────────────────────────────────────── */

function PasswordResetModal({ user, onClose, onSuccess, onError }) {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (password.length < 8) { onError('Password must be at least 8 characters'); return }
    if (password !== confirm) { onError('Passwords do not match'); return }
    setSubmitting(true)
    const res = await fetch(`/api/admin/users/${user.username}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setSubmitting(false)
    if (!res.ok) { onError('Failed to update password'); return }
    onSuccess(`Password updated for ${user.name}`)
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h3 className="text-base font-bold text-gray-900 mb-1">Reset password</h3>
      <p className="text-sm text-gray-500 mb-4">Setting new password for <strong>{user.name}</strong></p>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
          autoFocus
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
        />
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Cancel</button>
          <button type="submit" disabled={submitting} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {submitting ? 'Saving…' : 'Update password'}
          </button>
        </div>
      </form>
    </ModalOverlay>
  )
}

function ConfirmDeleteModal({ user, onClose, onConfirm }) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <h3 className="text-base font-bold text-gray-900">Delete user</h3>
      </div>
      <p className="text-sm text-gray-600 mb-5">
        Permanently delete <strong>{user.name}</strong>? This cannot be undone.
        Their expenses and templates will remain in the database.
      </p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Cancel</button>
        <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors">Delete</button>
      </div>
    </ModalOverlay>
  )
}

function CreateUserModal({ onClose, onSuccess, onError }) {
  const [form, setForm] = useState({ username: '', name: '', email: '', password: '', isAdmin: false })
  const [submitting, setSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setFieldError('')
    if (!form.username || !form.name || !form.password) { setFieldError('Username, name, and password are required'); return }
    if (form.password.length < 8) { setFieldError('Password must be at least 8 characters'); return }
    if (!/^[a-z0-9_.-]+$/.test(form.username)) { setFieldError('Username: lowercase letters, numbers, _ . - only'); return }
    setSubmitting(true)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSubmitting(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setFieldError(body.error || 'Failed to create user')
      return
    }
    onSuccess(await res.json())
  }

  function field(key) {
    if (key === 'username') {
      return {
        value: form[key],
        onChange: e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '_') }))
      }
    }
    return { value: form[key], onChange: e => setForm(f => ({ ...f, [key]: e.target.value })) }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h3 className="text-base font-bold text-gray-900 mb-4">Add new user</h3>
      <form onSubmit={submit} className="space-y-3">
        {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
        <input type="text" placeholder="Username (lowercase, no spaces)" {...field('username')} className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50" autoFocus />
        <input type="text" placeholder="Display name" {...field('name')} className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
        <input type="email" placeholder="Email (optional)" {...field('email')} className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
        <input type="password" placeholder="Password (min 8 chars)" {...field('password')} className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
          <input type="checkbox" checked={form.isAdmin} onChange={e => setForm(f => ({ ...f, isAdmin: e.target.checked }))} className="rounded" />
          Grant admin access
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Cancel</button>
          <button type="submit" disabled={submitting} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {submitting ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </form>
    </ModalOverlay>
  )
}

function ModalOverlay({ children, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-[55] bg-black/20" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-full max-w-md pointer-events-auto">
          {children}
        </div>
      </div>
    </>
  )
}
