'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { format, addDays, subDays, startOfWeek, eachDayOfInterval, endOfWeek } from 'date-fns'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, BarController, LineElement, LineController, PointElement, Tooltip, Legend)

// ─── helpers ──────────────────────────────────────────────────────────────────

function toDateStr(date) { return format(date, 'yyyy-MM-dd') }

function macrosFromLogs(logs) {
  return logs.reduce(
    (acc, l) => {
      const s = l.servings
      acc.calories += l.foodItem.calories * s
      acc.protein  += l.foodItem.protein  * s
      acc.carbs    += l.foodItem.carbs    * s
      acc.fat      += l.foodItem.fat      * s
      acc.fiber    += l.foodItem.fiber    * s
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  )
}

function r1(n) { return Math.round(n * 10) / 10 }

const MEAL_TYPES  = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' }
const MEAL_ICONS  = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

const MACRO_META = [
  { key: 'calories', label: 'Calories', unit: 'kcal', color: '#10b981', goalKey: 'dailyCalorieGoal' },
  { key: 'protein',  label: 'Protein',  unit: 'g',    color: '#3b82f6', goalKey: 'proteinGoal' },
  { key: 'carbs',    label: 'Carbs',    unit: 'g',    color: '#f59e0b', goalKey: 'carbGoal' },
  { key: 'fat',      label: 'Fat',      unit: 'g',    color: '#8b5cf6', goalKey: 'fatGoal' },
  { key: 'fiber',    label: 'Fiber',    unit: 'g',    color: '#14b8a6', goalKey: 'fiberGoal' },
]

const inputCls = 'block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition'
const selectCls = inputCls

// ─── shared modal shell ────────────────────────────────────────────────────────

function Modal({ onClose, children, maxW = 'max-w-md' }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxW} max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

// ─── calorie ring (SVG) ───────────────────────────────────────────────────────

function CalorieRing({ consumed, goal }) {
  const size   = 140
  const stroke = 10
  const r      = (size - stroke) / 2
  const circ   = 2 * Math.PI * r
  const pct    = goal > 0 ? Math.min(consumed / goal, 1) : 0
  const over   = consumed > goal && goal > 0
  const color  = over ? '#ef4444' : '#10b981'
  const dash   = pct * circ
  const remaining = Math.max(goal - consumed, 0)

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} style={{ transition: 'stroke-dasharray 0.4s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold leading-none ${over ? 'text-red-500' : 'text-gray-900'}`}>
            {Math.round(consumed)}
          </span>
          <span className="text-xs text-gray-400 mt-0.5">kcal</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-400">goal <span className="font-medium text-gray-600">{goal}</span></p>
        {!over && <p className="text-xs text-emerald-500 font-medium">{Math.round(remaining)} left</p>}
        {over  && <p className="text-xs text-red-400 font-medium">{Math.round(consumed - goal)} over</p>}
      </div>
    </div>
  )
}

// ─── macro progress bar ───────────────────────────────────────────────────────

function MacroBar({ label, consumed, goal, color }) {
  const pct  = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0
  const over = consumed > goal && goal > 0
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className={`text-xs font-semibold tabular-nums ${over ? 'text-red-500' : 'text-gray-500'}`}>
          {r1(consumed)} <span className="font-normal text-gray-400">/ {goal}g</span>
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: over ? '#ef4444' : color }} />
      </div>
    </div>
  )
}

// ─── modals ───────────────────────────────────────────────────────────────────

function GoalsModal({ profile, onSave, onClose }) {
  const [form, setForm] = useState({
    dailyCalorieGoal: profile.dailyCalorieGoal,
    proteinGoal:      profile.proteinGoal,
    carbGoal:         profile.carbGoal,
    fatGoal:          profile.fatGoal,
    fiberGoal:        profile.fiberGoal,
    waterGoal:        profile.waterGoal,
  })
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/health/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, Number(v)])
      )),
    })
    if (res.ok) onSave(await res.json())
    setSaving(false)
  }

  const rows = [
    ['dailyCalorieGoal', 'Daily Calories', 'kcal'],
    ['proteinGoal',      'Protein',        'g'],
    ['carbGoal',         'Carbs',          'g'],
    ['fatGoal',          'Fat',            'g'],
    ['fiberGoal',        'Fiber',          'g'],
    ['waterGoal',        'Water',          'oz'],
  ]

  return (
    <Modal onClose={onClose} maxW="max-w-sm">
      <form onSubmit={handleSave} className="p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Daily Goals</h2>
        {rows.map(([key, label, unit]) => (
          <label key={key} className="block">
            <span className="text-sm font-medium text-gray-700">{label} <span className="text-gray-400 font-normal">({unit})</span></span>
            <input type="number" value={form[key]} min={0}
              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              className={inputCls + ' mt-1'} />
          </label>
        ))}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition">
            {saving ? 'Saving…' : 'Save Goals'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function AddFoodModal({ date, defaultMeal, onAdded, onClose }) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [selected, setSelected] = useState(null)
  const [servings, setServings] = useState(1)
  const [mealType, setMealType] = useState(defaultMeal || 'breakfast')
  const [creating, setCreating] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [newFood, setNewFood]   = useState({ name:'', brand:'', calories:'', protein:'', carbs:'', fat:'', fiber:'0', servingSize:'1', servingUnit:'serving' })
  const [createErr, setCreateErr] = useState('')
  const debounceRef = useRef(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/health/foods?q=${encodeURIComponent(query)}`)
      if (res.ok) setResults(await res.json())
    }, 250)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  async function handleLog(e) {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    const res = await fetch('/api/health/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodItemId: selected.id, mealType, servings: Number(servings), logDate: date }),
    })
    if (res.ok) onAdded(await res.json())
    setSaving(false)
  }

  async function handleCreateFood(e) {
    e.preventDefault()
    setCreateErr('')
    const res = await fetch('/api/health/foods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newFood.name, brand: newFood.brand || undefined,
        calories: Number(newFood.calories), protein: Number(newFood.protein),
        carbs: Number(newFood.carbs), fat: Number(newFood.fat),
        fiber: Number(newFood.fiber) || 0,
        servingSize: Number(newFood.servingSize) || 1,
        servingUnit: newFood.servingUnit || 'serving',
      }),
    })
    if (res.ok) { setSelected(await res.json()); setCreating(false) }
    else { const e = await res.json(); setCreateErr(e.error || 'Failed to create') }
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{creating ? 'New Food Item' : 'Add Food'}</h2>
          {creating && (
            <button onClick={() => setCreating(false)} className="text-sm text-gray-400 hover:text-gray-600 transition">← Back</button>
          )}
        </div>

        {creating ? (
          <form onSubmit={handleCreateFood} className="space-y-3">
            {createErr && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{createErr}</p>}
            <input placeholder="Food name *" value={newFood.name} onChange={e => setNewFood(p=>({...p,name:e.target.value}))} className={inputCls} required />
            <input placeholder="Brand (optional)" value={newFood.brand} onChange={e => setNewFood(p=>({...p,brand:e.target.value}))} className={inputCls} />
            <div className="grid grid-cols-2 gap-2">
              {[['calories','Calories'],['protein','Protein (g)'],['carbs','Carbs (g)'],['fat','Fat (g)'],['fiber','Fiber (g)']].map(([k,lbl]) => (
                <input key={k} type="number" min="0" placeholder={lbl} value={newFood[k]}
                  onChange={e => setNewFood(p=>({...p,[k]:e.target.value}))} className={inputCls} required={k!=='fiber'} />
              ))}
              <input type="number" min="0.1" step="0.1" placeholder="Serving size" value={newFood.servingSize}
                onChange={e => setNewFood(p=>({...p,servingSize:e.target.value}))} className={inputCls} />
            </div>
            <input placeholder="Unit (e.g. cup, oz, g)" value={newFood.servingUnit}
              onChange={e => setNewFood(p=>({...p,servingUnit:e.target.value}))} className={inputCls} />
            <button type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition">
              Create & Select
            </button>
          </form>
        ) : (
          <>
            <div className="relative mb-3">
              <input autoFocus type="text" placeholder="Search food library…"
                value={query} onChange={e => { setQuery(e.target.value); setSelected(null) }}
                className={inputCls} />
            </div>

            {results.length > 0 && !selected && (
              <ul className="mb-4 border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50 max-h-52 overflow-y-auto shadow-sm">
                {results.map(f => (
                  <li key={f.id}>
                    <button type="button" onClick={() => { setSelected(f); setQuery(f.name) }}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition">
                      <p className="text-sm font-medium text-gray-800">
                        {f.name}
                        {f.brand && <span className="text-gray-400 font-normal text-xs ml-1">· {f.brand}</span>}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{f.calories} kcal · P {f.protein}g · C {f.carbs}g · F {f.fat}g <span className="text-gray-300">per {f.servingSize} {f.servingUnit}</span></p>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {query.length >= 2 && results.length === 0 && (
              <p className="text-sm text-gray-400 mb-4">
                No results — <button className="text-emerald-600 font-medium" onClick={() => setCreating(true)}>create it</button>
              </p>
            )}

            {query.length < 2 && !selected && (
              <button onClick={() => setCreating(true)} className="text-sm text-emerald-600 font-medium mb-4 block hover:underline">
                + Create new food item
              </button>
            )}

            {selected && (
              <div className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-sm font-semibold text-gray-800">{selected.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{selected.calories} kcal · P {selected.protein}g · C {selected.carbs}g · F {selected.fat}g <span className="text-gray-400">per {selected.servingSize} {selected.servingUnit}</span></p>
              </div>
            )}

            <form onSubmit={handleLog} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-gray-500 mb-1 block">Meal</span>
                  <select value={mealType} onChange={e => setMealType(e.target.value)} className={selectCls}>
                    {MEAL_TYPES.map(m => <option key={m} value={m}>{MEAL_LABELS[m]}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-500 mb-1 block">Servings</span>
                  <input type="number" min="0.1" step="0.1" value={servings}
                    onChange={e => setServings(e.target.value)} className={inputCls} />
                </label>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={!selected || saving}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-40 transition">
                  {saving ? 'Adding…' : 'Add to Log'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  )
}

function PhotoAnalyzeModal({ date, onAdded, onClose }) {
  const [mode, setMode]             = useState('photo') // 'photo' | 'text'
  const [preview, setPreview]       = useState(null)
  const [imageData, setImageData]   = useState(null)
  const [description, setDescription] = useState('')
  const [context, setContext]       = useState('')
  const [analyzing, setAnalyzing]   = useState(false)
  const [result, setResult]         = useState(null)
  const [editResult, setEditResult] = useState(null)
  const [mealType, setMealType]     = useState('lunch')
  const [servings, setServings]     = useState(1)
  const [saving, setSaving]         = useState(false) // false | 'log'
  const [error, setError]           = useState('')
  const [dragging, setDragging]     = useState(false)
  const inputRef = useRef(null)

  function switchMode(m) {
    setMode(m)
    setResult(null); setEditResult(null); setError('')
    setPreview(null); setImageData(null); setDescription(''); setContext('')
  }

  // Load an image from a file picker, drag-drop, or clipboard paste.
  function loadImageFile(file) {
    if (!file || !file.type?.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = ev => {
      setMode('photo')
      setPreview(ev.target.result)
      setImageData(ev.target.result)
      setResult(null)
      setEditResult(null)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  function handleFile(e) {
    loadImageFile(e.target.files[0])
    e.target.value = '' // let the same file be re-picked later
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    loadImageFile(e.dataTransfer.files?.[0])
  }

  // Accept a pasted image (Cmd/Ctrl-V) anywhere while the modal is open.
  useEffect(() => {
    function onPaste(e) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const it of items) {
        if (it.type?.startsWith('image/')) {
          const file = it.getAsFile()
          if (file) { loadImageFile(file); e.preventDefault() }
          break
        }
      }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [])

  async function handleAnalyze() {
    if (mode === 'photo' && !imageData) return
    if (mode === 'text' && !description.trim()) return
    setAnalyzing(true)
    setError('')
    const body = mode === 'photo'
      ? { imageData, context: context.trim() || undefined }
      : { description: description.trim(), context: context.trim() || undefined }
    const res = await fetch('/api/health/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Analysis failed'); setAnalyzing(false); return }
    setResult(data)
    setEditResult({ ...data })
    setAnalyzing(false)
  }

  async function buildFoodPayload() {
    return {
      name: editResult.foodName,
      calories: Math.round(Number(editResult.calories)),
      protein:  Number(editResult.protein),
      carbs:    Number(editResult.carbs),
      fat:      Number(editResult.fat),
      fiber:    Number(editResult.fiber) || 0,
      servingSize: 1,
      servingUnit: editResult.servingDescription,
    }
  }

  async function handleLog() {
    if (!editResult) return
    setSaving('log')
    const foodRes = await fetch('/api/health/foods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(await buildFoodPayload()),
      }),
    })
    if (!foodRes.ok) { setError('Failed to save food'); setSaving(false); return }
    const food = await foodRes.json()
    const logRes = await fetch('/api/health/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodItemId: food.id, mealType, servings: Number(servings), logDate: date, aiGenerated: true }),
    })
    if (logRes.ok) onAdded(await logRes.json())
    setSaving(false)
  }

  const confidenceBadge = { low: 'bg-red-50 text-red-500', medium: 'bg-amber-50 text-amber-600', high: 'bg-emerald-50 text-emerald-600' }
  const numField = (key, label) => (
    <label key={key} className="block">
      <span className="text-xs font-medium text-gray-500 block mb-1">{label}</span>
      <input type="number" min="0" step="0.1" value={editResult?.[key] ?? ''}
        onChange={e => setEditResult(p => ({ ...p, [key]: e.target.value }))}
        className={inputCls} />
    </label>
  )

  return (
    <Modal onClose={onClose} maxW="max-w-sm">
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Analyze Food</h2>

        {/* Mode toggle */}
        {!result && (
          <div className="flex rounded-xl border border-gray-200 p-0.5 gap-0.5">
            {[['photo', '📷 Photo'], ['text', '✏️ Describe']].map(([m, label]) => (
              <button key={m} type="button" onClick={() => switchMode(m)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition ${
                  mode === m ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:text-gray-700'
                }`}>{label}</button>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

        {mode === 'photo' && (
          <div
            onClick={() => !result && inputRef.current?.click()}
            onDragOver={e => { if (!result) { e.preventDefault(); setDragging(true) } }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl overflow-hidden transition ${!result ? 'cursor-pointer hover:border-emerald-400' : ''} ${dragging ? 'border-emerald-400 bg-emerald-50/40' : 'border-gray-200'}`}
            style={{ minHeight: preview ? undefined : '110px' }}>
            {preview
              ? <>
                  <img src={preview} alt="food" className="w-full object-cover max-h-44" />
                  {!result && (
                    <span className="absolute bottom-2 right-2 text-xs bg-black/55 text-white px-2 py-0.5 rounded-md">Tap to change</span>
                  )}
                </>
              : <div className="flex flex-col items-center justify-center h-28 text-gray-400 gap-1.5 px-3 text-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm">Tap to choose, take, or drop a photo</p>
                  <p className="text-xs text-gray-300">From your camera roll, camera, or paste (⌘V)</p>
                </div>
            }
            <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </div>
        )}

        {mode === 'text' && !result && (
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Food description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. pb&j sandwich 200g, large bowl of oatmeal with banana, chicken breast 150g with rice…"
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
          </div>
        )}

        {!result && (mode === 'photo' ? preview : description.trim()) && (
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Extra context <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input type="text" value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="e.g. large restaurant portion, homemade, 2 pieces…"
              className={inputCls} />
          </div>
        )}

        {!result && (mode === 'photo' ? preview : description.trim()) && (
          <button onClick={handleAnalyze} disabled={analyzing}
            className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition flex items-center justify-center gap-2">
            {analyzing
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Analyzing…</>
              : '✨ Analyze Macros'}
          </button>
        )}

        {editResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{editResult.foodName}</p>
                <p className="text-xs text-gray-400">{editResult.servingDescription}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-lg ${confidenceBadge[result.confidence] || 'bg-gray-50 text-gray-400'}`}>
                {result.confidence} confidence
              </span>
            </div>

            <p className="text-xs text-gray-400">Review and adjust estimates before logging:</p>

            <div className="grid grid-cols-2 gap-2">
              {numField('calories', 'Calories (kcal)')}
              {numField('protein',  'Protein (g)')}
              {numField('carbs',    'Carbs (g)')}
              {numField('fat',      'Fat (g)')}
              {numField('fiber',    'Fiber (g)')}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-500 block mb-1">Meal</span>
                <select value={mealType} onChange={e => setMealType(e.target.value)} className={selectCls}>
                  {MEAL_TYPES.map(m => <option key={m} value={m}>{MEAL_LABELS[m]}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-500 block mb-1">Servings</span>
                <input type="number" min="0.1" step="0.1" value={servings}
                  onChange={e => setServings(e.target.value)} className={inputCls} />
              </label>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleLog} disabled={!!saving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition">
                {saving === 'log' ? 'Saving…' : 'Log This'}
              </button>
            </div>
            <p className="text-center text-xs text-gray-300">Logged foods are saved to your library automatically.</p>
          </div>
        )}

        {!result && !(mode === 'photo' ? preview : description.trim()) && (
          <button type="button" onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
        )}
      </div>
    </Modal>
  )
}

function SaveMealModal({ logs, onSaved, onClose }) {
  const [name, setName]     = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch('/api/health/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), items: logs.map(l => ({ foodItemId: l.foodItemId, servings: l.servings, mealType: l.mealType })) }),
    })
    if (res.ok) onSaved(await res.json())
    else { setError('Failed to save'); setSaving(false) }
  }

  return (
    <Modal onClose={onClose} maxW="max-w-sm">
      <form onSubmit={handleSave} className="p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Save as Preset</h2>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <input autoFocus type="text" placeholder="Meal name (e.g. Morning Stack)"
          value={name} onChange={e => setName(e.target.value)} className={inputCls} />
        <p className="text-xs text-gray-400">{logs.length} item{logs.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" disabled={saving || !name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-40 transition">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function WeightModal({ onSaved, onClose }) {
  const [weight, setWeight] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    if (!weight) return
    setSaving(true)
    const res = await fetch('/api/health/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight: Number(weight) }),
    })
    if (res.ok) onSaved(await res.json())
    setSaving(false)
  }

  return (
    <Modal onClose={onClose} maxW="max-w-xs">
      <form onSubmit={handleSave} className="p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Log Weight</h2>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Weight (lbs)</span>
          <input autoFocus type="number" min="50" max="1000" step="0.1" value={weight}
            onChange={e => setWeight(e.target.value)} className={inputCls + ' mt-1'} />
        </label>
        <div className="flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" disabled={saving || !weight}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-40 transition">
            {saving ? 'Logging…' : 'Log'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function LibraryModal({ onClose, onChanged }) {
  const [items, setItems]         = useState(null) // null = loading
  const [query, setQuery]         = useState('')
  const [error, setError]         = useState('')
  const [busyId, setBusyId]       = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    let active = true
    fetch('/api/health/foods?mine=1')
      .then(r => (r.ok ? r.json() : []))
      .then(d => { if (active) setItems(Array.isArray(d) ? d : []) })
      .catch(() => { if (active) setItems([]) })
    return () => { active = false }
  }, [])

  async function doDelete(item) {
    setBusyId(item.id); setError('')
    const res = await fetch(`/api/health/foods/${item.id}`, { method: 'DELETE' })
    if (res.ok) {
      const { removedLogs } = await res.json().catch(() => ({ removedLogs: 0 }))
      setItems(prev => prev.filter(i => i.id !== item.id))
      setConfirmId(null)
      if (removedLogs > 0) onChanged?.()
    } else {
      const e = await res.json().catch(() => ({}))
      setError(e.error || 'Failed to delete')
      setConfirmId(null)
    }
    setBusyId(null)
  }

  const q = query.trim().toLowerCase()
  const filtered = (items || []).filter(i => !q || i.name.toLowerCase().includes(q))

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">My Food Library</h2>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 transition">Close</button>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-3">{error}</p>}

        <input type="text" placeholder="Search your items…" value={query}
          onChange={e => setQuery(e.target.value)} className={inputCls + ' mb-3'} />

        {items === null ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">
            {items.length === 0
              ? 'Your library is empty. Foods you create or log appear here.'
              : 'No matches.'}
          </p>
        ) : (
          <ul className="divide-y divide-gray-50 max-h-[55vh] overflow-y-auto -mx-1 px-1">
            {filtered.map(f => (
              <li key={f.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {f.name}
                    {f.brand && <span className="text-gray-400 font-normal text-xs ml-1">· {f.brand}</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {f.calories} kcal · P {r1(f.protein)}g · C {r1(f.carbs)}g · F {r1(f.fat)}g · Fiber {r1(f.fiber)}g
                  </p>
                  {f._count?.logs > 0 && (
                    <p className="text-xs text-gray-300 mt-0.5">logged {f._count.logs}×</p>
                  )}
                </div>
                {confirmId === f.id ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => doDelete(f)} disabled={busyId === f.id}
                      className="px-2.5 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-50 transition">
                      {busyId === f.id
                        ? '…'
                        : f._count?.logs > 0
                          ? `Delete + ${f._count.logs} log${f._count.logs !== 1 ? 's' : ''}`
                          : 'Delete'}
                    </button>
                    <button onClick={() => setConfirmId(null)} disabled={busyId === f.id}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { setConfirmId(f.id); setError('') }}
                    className="p-2 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition flex-shrink-0" title="Delete">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function HealthPage() {
  const { status } = useSession()
  const router = useRouter()

  const [tab, setTab]                 = useState('daily')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [logs, setLogs]               = useState([])
  const [weekLogs, setWeekLogs]       = useState([])
  const [allLogs, setAllLogs]         = useState([])
  const [allLoaded, setAllLoaded]     = useState(false)
  const [profile, setProfile]         = useState(null)
  const [meals, setMeals]             = useState([])
  const [weights, setWeights]         = useState([])
  const [water, setWater]             = useState(0)
  const [loading, setLoading]         = useState(true)

  const [showGoals, setShowGoals]         = useState(false)
  const [addFoodMeal, setAddFoodMeal]     = useState(null)
  const [showPhoto, setShowPhoto]         = useState(false)
  const [showSaveMeal, setShowSaveMeal]   = useState(false)
  const [showWeight, setShowWeight]       = useState(false)
  const [showLibrary, setShowLibrary]     = useState(false)

  const dateStr  = toDateStr(currentDate)
  const isToday  = dateStr === toDateStr(new Date())
  const isFuture = currentDate > new Date()

  // ── fetchers ────────────────────────────────────────────────────────────────

  const fetchDayLogs = useCallback(async (d) => {
    const res = await fetch(`/api/health/log?date=${d}`)
    if (res.ok) setLogs(await res.json())
  }, [])

  const fetchWeekLogs = useCallback(async (d) => {
    const res = await fetch(`/api/health/log?range=week&date=${d}`)
    if (res.ok) setWeekLogs(await res.json())
  }, [])

  const fetchAllLogs = useCallback(async () => {
    const res = await fetch('/api/health/log?range=all')
    if (res.ok) { setAllLogs(await res.json()); setAllLoaded(true) }
  }, [])

  const fetchWater = useCallback(async (d) => {
    const res = await fetch(`/api/health/water?date=${d}`)
    if (res.ok) { const data = await res.json(); setWater(data.amount || 0) }
  }, [])

  // Initial load
  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status !== 'authenticated') return
    async function init() {
      const today = toDateStr(new Date())
      const [profileRes, mealsRes, weightsRes] = await Promise.all([
        fetch('/api/health/profile'),
        fetch('/api/health/meals'),
        fetch('/api/health/weight'),
      ])
      if (profileRes.ok) setProfile(await profileRes.json())
      if (mealsRes.ok)   setMeals(await mealsRes.json())
      if (weightsRes.ok) setWeights(await weightsRes.json())
      await Promise.all([fetchDayLogs(today), fetchWeekLogs(today), fetchWater(today)])
      setLoading(false)
    }
    init()
  }, [status, router, fetchDayLogs, fetchWeekLogs, fetchWater])

  // Lazy-load all-time when tab first opened
  useEffect(() => {
    if (tab === 'alltime' && !allLoaded && status === 'authenticated') fetchAllLogs()
  }, [tab, allLoaded, status, fetchAllLogs])

  // Re-fetch day + week when date changes
  useEffect(() => {
    if (status !== 'authenticated' || loading) return
    fetchDayLogs(dateStr)
    fetchWeekLogs(dateStr)
    fetchWater(dateStr)
  }, [dateStr, status, loading, fetchDayLogs, fetchWeekLogs, fetchWater])

  async function addWater(delta) {
    setWater(w => Math.max(0, w + delta)) // optimistic
    const res = await fetch('/api/health/water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: delta, logDate: dateStr }),
    })
    if (res.ok) { const data = await res.json(); setWater(data.amount) }
    else { fetchWater(dateStr) } // revert to server truth on failure
  }

  // ── mutations (local state only) ────────────────────────────────────────────

  function handleEntryAdded(entry) {
    setLogs(prev => [...prev, entry])
    setWeekLogs(prev => [...prev, entry])
    if (allLoaded) setAllLogs(prev => [...prev, entry])
    setAddFoodMeal(null)
    setShowPhoto(false)
  }

  async function handleDeleteEntry(id) {
    await fetch(`/api/health/log/${id}`, { method: 'DELETE' })
    setLogs(prev => prev.filter(l => l.id !== id))
    setWeekLogs(prev => prev.filter(l => l.id !== id))
    if (allLoaded) setAllLogs(prev => prev.filter(l => l.id !== id))
  }

  async function handleLogPresetMeal(meal) {
    const results = await Promise.all(
      meal.items.map(item =>
        fetch('/api/health/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foodItemId: item.foodItemId, mealType: item.mealType || 'snack', servings: item.servings, logDate: dateStr }),
        }).then(r => r.ok ? r.json() : null)
      )
    )
    const added = results.filter(Boolean)
    setLogs(prev => [...prev, ...added])
    setWeekLogs(prev => [...prev, ...added])
    if (allLoaded) setAllLogs(prev => [...prev, ...added])
  }

  async function handleDeleteMeal(id) {
    await fetch(`/api/health/meals/${id}`, { method: 'DELETE' })
    setMeals(prev => prev.filter(m => m.id !== id))
  }

  // ── derived ──────────────────────────────────────────────────────────────────

  const dailyMacros = macrosFromLogs(logs)

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end:   endOfWeek(currentDate,   { weekStartsOn: 1 }),
  })
  const weekByDay = weekDays.map(day => {
    const ds    = toDateStr(day)
    const dLogs = weekLogs.filter(l => l.logDate === ds)
    return { day, ds, ...macrosFromLogs(dLogs), hasData: dLogs.length > 0 }
  })
  const loggedDays = weekByDay.filter(d => d.hasData)
  const weekAvg = loggedDays.length > 0 ? {
    calories: loggedDays.reduce((s,d)=>s+d.calories,0) / loggedDays.length,
    protein:  loggedDays.reduce((s,d)=>s+d.protein,0)  / loggedDays.length,
    carbs:    loggedDays.reduce((s,d)=>s+d.carbs,0)    / loggedDays.length,
    fat:      loggedDays.reduce((s,d)=>s+d.fat,0)      / loggedDays.length,
    fiber:    loggedDays.reduce((s,d)=>s+d.fiber,0)    / loggedDays.length,
  } : null

  const allByDay     = allLogs.reduce((acc, l) => { (acc[l.logDate] ??= []).push(l); return acc }, {})
  const allDayTotals = Object.values(allByDay).map(dl => macrosFromLogs(dl))
  const allTimeAvg   = allDayTotals.length > 0 ? {
    calories: allDayTotals.reduce((s,d)=>s+d.calories,0) / allDayTotals.length,
    protein:  allDayTotals.reduce((s,d)=>s+d.protein,0)  / allDayTotals.length,
    carbs:    allDayTotals.reduce((s,d)=>s+d.carbs,0)    / allDayTotals.length,
    fat:      allDayTotals.reduce((s,d)=>s+d.fat,0)      / allDayTotals.length,
    fiber:    allDayTotals.reduce((s,d)=>s+d.fiber,0)    / allDayTotals.length,
  } : null

  const weekDateSet     = new Set(weekDays.map(d => format(d, 'yyyy-MM-dd')))
  const weekWeightLogs  = weights.filter(w => weekDateSet.has(w.loggedAt.slice(0, 10)))
  const weekWeightAvg   = weekWeightLogs.length > 0
    ? r1(weekWeightLogs.reduce((s,w) => s + w.weight, 0) / weekWeightLogs.length)
    : null
  const allTimeWeightAvg = weights.length > 0
    ? r1(weights.reduce((s,w) => s + w.weight, 0) / weights.length)
    : null

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading metrics…</p>
        </div>
      </div>
    )
  }

  if (!profile) return null

  // ── chart data ───────────────────────────────────────────────────────────────

  const weekBarData = {
    labels: weekByDay.map(d => format(d.day, 'EEE')),
    datasets: [
      {
        label: 'Calories',
        data: weekByDay.map(d => Math.round(d.calories)),
        backgroundColor: weekByDay.map(d => d.ds === dateStr ? '#059669' : d.hasData ? '#10b981' : '#e5e7eb'),
        borderRadius: 8,
      },
      {
        label: 'Goal',
        data: weekByDay.map(() => profile.dailyCalorieGoal),
        type: 'line',
        borderColor: '#f59e0b',
        borderDash: [5, 4],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
  }

  const chartOpts = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f9fafb' }, ticks: { color: '#9ca3af', font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } } },
    },
  }

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full py-8 bg-gray-50/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')}
              className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Metrics</h1>
              <p className="text-xs text-gray-400">Nutrition & health</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowWeight(true)}
              className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition" title="Log weight">
              ⚖️
            </button>
            <button onClick={() => setShowLibrary(true)}
              className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition" title="My food library">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.247m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.247" />
              </svg>
            </button>
            <button onClick={() => setShowGoals(true)}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              Goals
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-200/70 rounded-xl p-1 mb-5">
          {[['daily','Daily'],['weekly','Weekly'],['alltime','All Time']].map(([key,label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 px-2 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ══ DAILY TAB ══ */}
        {tab === 'daily' && (
          <div className="space-y-4">

            {/* Date nav */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-4 py-3">
              <button onClick={() => setCurrentDate(d => subDays(d, 1))}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">
                  {isToday ? 'Today' : format(currentDate, 'EEEE, MMMM d')}
                </p>
                {!isToday && <p className="text-xs text-gray-400">{format(currentDate, 'yyyy')}</p>}
              </div>
              <button onClick={() => setCurrentDate(d => addDays(d, 1))} disabled={isToday}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500 disabled:opacity-25">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Summary card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Today's Summary</p>
              <div className="flex gap-6 items-start">
                <CalorieRing consumed={dailyMacros.calories} goal={profile.dailyCalorieGoal} />
                <div className="flex-1 space-y-3 pt-1">
                  <MacroBar label="Protein" consumed={dailyMacros.protein} goal={profile.proteinGoal} color="#3b82f6" />
                  <MacroBar label="Carbs"   consumed={dailyMacros.carbs}   goal={profile.carbGoal}    color="#f59e0b" />
                  <MacroBar label="Fat"     consumed={dailyMacros.fat}     goal={profile.fatGoal}     color="#8b5cf6" />
                  <MacroBar label="Fiber"   consumed={dailyMacros.fiber}   goal={profile.fiberGoal}   color="#14b8a6" />
                </div>
              </div>
            </div>

            {/* Water */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">💧 Water</p>
                <p className="text-sm font-semibold text-gray-700 tabular-nums">
                  {water}<span className="text-gray-400 font-normal"> / {profile.waterGoal} oz</span>
                </p>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full bg-sky-400 transition-all duration-500"
                  style={{ width: `${profile.waterGoal > 0 ? Math.min((water / profile.waterGoal) * 100, 100) : 0}%` }} />
              </div>
              {!isFuture && (
                <div className="flex items-center gap-2">
                  <button onClick={() => addWater(8)}
                    className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 text-xs font-semibold hover:bg-sky-100 transition">
                    + 8 oz
                  </button>
                  <button onClick={() => addWater(16)}
                    className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 text-xs font-semibold hover:bg-sky-100 transition">
                    + 16 oz
                  </button>
                  <button onClick={() => addWater(-8)} disabled={water <= 0}
                    className="ml-auto px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition">
                    − 8 oz
                  </button>
                </div>
              )}
            </div>

            {/* AI photo */}
            {!isFuture && (
              <button onClick={() => setShowPhoto(true)}
                className="w-full py-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 text-emerald-600 text-sm font-medium hover:bg-emerald-50 hover:border-emerald-300 transition flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Analyze Food Photo with AI
              </button>
            )}

            {/* Meal sections */}
            {MEAL_TYPES.map(meal => {
              const mealLogs   = logs.filter(l => l.mealType === meal)
              const mealMacros = macrosFromLogs(mealLogs)
              return (
                <div key={meal} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                      <span className="text-base">{MEAL_ICONS[meal]}</span>
                      <p className="font-semibold text-gray-800 text-sm">{MEAL_LABELS[meal]}</p>
                      {mealLogs.length > 0 && (
                        <span className="text-xs text-gray-400 font-normal">
                          {Math.round(mealMacros.calories)} kcal · P {r1(mealMacros.protein)}g · C {r1(mealMacros.carbs)}g · F {r1(mealMacros.fat)}g
                        </span>
                      )}
                    </div>
                    {!isFuture && (
                      <button onClick={() => setAddFoodMeal(meal)}
                        className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition px-2 py-1 rounded-lg hover:bg-emerald-50">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                      </button>
                    )}
                  </div>

                  {mealLogs.length === 0
                    ? <p className="px-5 py-4 text-sm text-gray-300">Nothing logged</p>
                    : <ul className="divide-y divide-gray-50">
                        {mealLogs.map(entry => {
                          const cal = Math.round(entry.foodItem.calories * entry.servings)
                          return (
                            <li key={entry.id} className="flex items-center justify-between gap-3 px-5 py-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-sm font-medium text-gray-800 truncate">{entry.foodItem.name}</p>
                                  {entry.aiGenerated && (
                                    <span className="shrink-0 text-xs bg-purple-50 text-purple-400 px-1.5 py-0.5 rounded font-medium">AI</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {entry.servings}× · {cal} kcal · P {r1(entry.foodItem.protein * entry.servings)}g · C {r1(entry.foodItem.carbs * entry.servings)}g · F {r1(entry.foodItem.fat * entry.servings)}g
                                </p>
                              </div>
                              <button onClick={() => handleDeleteEntry(entry.id)}
                                className="p-1.5 rounded-lg text-gray-200 hover:text-red-400 hover:bg-red-50 transition flex-shrink-0">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                  }
                </div>
              )
            })}

            {/* Save as preset */}
            {logs.length > 0 && !isFuture && (
              <button onClick={() => setShowSaveMeal(true)}
                className="w-full py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-500 hover:bg-gray-50 transition">
                💾 Save today's log as a preset meal
              </button>
            )}

            {/* Preset meals */}
            {meals.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Preset Meals</p>
                <div className="space-y-2">
                  {meals.map(meal => (
                    <div key={meal.id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{meal.name}</p>
                        <p className="text-xs text-gray-400">{meal.items.length} item{meal.items.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isFuture && (
                          <button onClick={() => handleLogPresetMeal(meal)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold hover:bg-emerald-100 transition">
                            Log
                          </button>
                        )}
                        <button onClick={() => handleDeleteMeal(meal.id)}
                          className="p-1.5 rounded-lg text-gray-200 hover:text-red-400 hover:bg-red-50 transition">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weight */}
            {weights.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Weight</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-gray-900">{weights[0].weight}<span className="text-sm font-normal text-gray-400 ml-1">lbs</span></p>
                    {weights.length > 1 && (() => {
                      const d = r1(weights[0].weight - weights[1].weight)
                      return <p className={`text-sm font-medium ${d < 0 ? 'text-emerald-500' : d > 0 ? 'text-red-400' : 'text-gray-400'}`}>{d > 0 ? '+' : ''}{d}</p>
                    })()}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{format(new Date(weights[0].loggedAt), 'MMM d')}</p>
                </div>
                <button onClick={() => setShowWeight(true)}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition">
                  + Update
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ WEEKLY TAB ══ */}
        {tab === 'weekly' && (
          <div className="space-y-4">

            {/* Week nav */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-4 py-3">
              <button onClick={() => setCurrentDate(d => subDays(d, 7))}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <p className="text-sm font-semibold text-gray-900">
                {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} – {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}
              </p>
              <button onClick={() => setCurrentDate(d => addDays(d, 7))}
                disabled={toDateStr(endOfWeek(currentDate, { weekStartsOn: 1 })) >= toDateStr(new Date())}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500 disabled:opacity-25">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {weekAvg ? (
              <>
                {/* All 4 macro avg cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {MACRO_META.map(({ key, label, unit, color, goalKey }) => {
                    const avg  = r1(weekAvg[key])
                    const goal = profile[goalKey]
                    const pct  = goal > 0 ? Math.min((weekAvg[key] / goal) * 100, 100) : 0
                    const over = weekAvg[key] > goal
                    return (
                      <div key={key} className="bg-white rounded-2xl border border-gray-200 p-4">
                        <p className="text-xs text-gray-400 mb-2">{label} avg</p>
                        <p className={`text-xl font-bold leading-none ${over ? 'text-red-500' : 'text-gray-900'}`}>
                          {key === 'calories' ? Math.round(weekAvg[key]) : avg}
                          <span className="text-xs font-normal text-gray-400 ml-1">{unit}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1 mb-2">goal {goal}{unit}</p>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: over ? '#ef4444' : color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {weekWeightAvg !== null && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Weight this week</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {weekWeightAvg} <span className="text-sm font-normal text-gray-400">lbs avg</span>
                      </p>
                      {weekWeightLogs.length > 1 && (
                        <p className="text-xs text-gray-400 mt-0.5">{weekWeightLogs.length} measurements</p>
                      )}
                    </div>
                    {weekWeightLogs.length > 1 && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Range</p>
                        <p className="text-sm font-medium text-gray-700">
                          {r1(Math.min(...weekWeightLogs.map(w => w.weight)))} – {r1(Math.max(...weekWeightLogs.map(w => w.weight)))} lbs
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Calorie bar chart */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                    Calories · <span className="normal-case font-normal">{loggedDays.length} of 7 days logged</span>
                  </p>
                  <Bar data={weekBarData} options={chartOpts} />
                </div>

                {/* Per-day breakdown */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Daily Breakdown</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 border-b border-gray-100">
                          <th className="text-left px-5 py-2.5 font-medium">Day</th>
                          <th className="text-right px-3 py-2.5 font-medium">Cal</th>
                          <th className="text-right px-3 py-2.5 font-medium">Protein</th>
                          <th className="text-right px-3 py-2.5 font-medium">Carbs</th>
                          <th className="text-right px-3 py-2.5 font-medium">Fat</th>
                          <th className="text-right px-5 py-2.5 font-medium">Fiber</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {weekByDay.map(d => (
                          <tr key={d.ds} className={d.ds === dateStr ? 'bg-emerald-50/50' : ''}>
                            <td className="px-5 py-3 font-medium text-gray-700">
                              {format(d.day, 'EEE d')}
                              {d.ds === toDateStr(new Date()) && <span className="ml-1.5 text-xs text-emerald-500">today</span>}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-gray-700">{d.hasData ? Math.round(d.calories) : <span className="text-gray-200">—</span>}</td>
                            <td className="px-3 py-3 text-right tabular-nums text-gray-500">{d.hasData ? r1(d.protein)+'g' : <span className="text-gray-200">—</span>}</td>
                            <td className="px-3 py-3 text-right tabular-nums text-gray-500">{d.hasData ? r1(d.carbs)+'g'   : <span className="text-gray-200">—</span>}</td>
                            <td className="px-3 py-3 text-right tabular-nums text-gray-500">{d.hasData ? r1(d.fat)+'g'     : <span className="text-gray-200">—</span>}</td>
                            <td className="px-5 py-3 text-right tabular-nums text-gray-500">{d.hasData ? r1(d.fiber)+'g'   : <span className="text-gray-200">—</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <p className="text-3xl mb-3">📊</p>
                <p className="font-medium text-gray-600">No data this week</p>
                <p className="text-sm text-gray-400 mt-1">Log meals in the Daily tab to see weekly stats</p>
              </div>
            )}
          </div>
        )}

        {/* ══ ALL TIME TAB ══ */}
        {tab === 'alltime' && (
          <div className="space-y-4">
            {!allLoaded ? (
              <div className="flex justify-center py-16">
                <div className="w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : allTimeAvg ? (
              <>
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">All-Time Averages</p>
                  <p className="text-xs text-gray-400 mb-4">{allDayTotals.length} day{allDayTotals.length !== 1 ? 's' : ''} logged</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {MACRO_META.map(({ key, label, unit, color, goalKey }) => {
                      const avg  = key === 'calories' ? Math.round(allTimeAvg[key]) : r1(allTimeAvg[key])
                      const goal = profile[goalKey]
                      const over = allTimeAvg[key] > goal
                      return (
                        <div key={key} className="bg-gray-50 rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-400 mb-1">{label}</p>
                          <p className={`text-xl font-bold ${over ? 'text-red-500' : 'text-gray-900'}`}>
                            {avg}<span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">goal {goal}</p>
                        </div>
                      )
                    })}
                  </div>
                  {allTimeWeightAvg !== null && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <p className="text-xs text-gray-500">Avg weight <span className="text-gray-400">({weights.length} measurement{weights.length !== 1 ? 's' : ''})</span></p>
                      <p className="text-sm font-bold text-gray-900">{allTimeWeightAvg} <span className="text-xs font-normal text-gray-400">lbs</span></p>
                    </div>
                  )}
                </div>

                {weights.length > 1 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Weight History</p>
                    <Bar
                      data={{
                        labels: [...weights].reverse().map(w => format(new Date(w.loggedAt), 'MMM d')),
                        datasets: [{ label: 'lbs', data: [...weights].reverse().map(w => w.weight), backgroundColor: '#10b981', borderRadius: 6 }],
                      }}
                      options={{ ...chartOpts, scales: { ...chartOpts.scales, y: { ...chartOpts.scales.y, beginAtZero: false } } }}
                    />
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Log History</p>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                    {Object.entries(allByDay).sort((a, b) => b[0].localeCompare(a[0])).map(([day, dayLogs]) => {
                      const m = macrosFromLogs(dayLogs)
                      return (
                        <button key={day}
                          onClick={() => { setCurrentDate(new Date(day + 'T12:00:00')); setTab('daily') }}
                          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition text-left">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{format(new Date(day + 'T12:00:00'), 'EEE, MMM d yyyy')}</p>
                            <p className="text-xs text-gray-400">{dayLogs.length} item{dayLogs.length !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-800">{Math.round(m.calories)} kcal</p>
                            <p className="text-xs text-gray-400">P {r1(m.protein)}g · C {r1(m.carbs)}g · F {r1(m.fat)}g</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <p className="text-4xl mb-4">🥗</p>
                <p className="font-medium text-gray-600 mb-1">Nothing logged yet</p>
                <p className="text-sm text-gray-400">Start tracking in the Daily tab</p>
              </div>
            )}
          </div>
        )}

      </div>

      {showGoals    && <GoalsModal profile={profile} onSave={p => { setProfile(p); setShowGoals(false) }} onClose={() => setShowGoals(false)} />}
      {addFoodMeal  && <AddFoodModal date={dateStr} defaultMeal={addFoodMeal} onAdded={handleEntryAdded} onClose={() => setAddFoodMeal(null)} />}
      {showPhoto    && <PhotoAnalyzeModal date={dateStr} onAdded={handleEntryAdded} onClose={() => setShowPhoto(false)} />}
      {showSaveMeal && <SaveMealModal logs={logs} onSaved={m => { setMeals(prev => [m, ...prev]); setShowSaveMeal(false) }} onClose={() => setShowSaveMeal(false)} />}
      {showWeight   && <WeightModal onSaved={w => { setWeights(prev => [w, ...prev]); setShowWeight(false) }} onClose={() => setShowWeight(false)} />}
      {showLibrary  && <LibraryModal onClose={() => setShowLibrary(false)} onChanged={() => {
        fetchDayLogs(dateStr)
        fetchWeekLogs(dateStr)
        setAllLogs([]); setAllLoaded(false)
      }} />}
    </div>
  )
}
