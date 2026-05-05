/**
 * Security tests for Jasper API routes.
 *
 * Goals tested:
 *  1. Unauthenticated requests → 401 on every private route
 *  2. Authorization — only the creator can DELETE their own records (→ 403 otherwise)
 *  3. Malformed / invalid payloads → 400
 *  4. x-middleware-subrequest bypass header does NOT grant access (CVE-2025-29927)
 *
 * All external dependencies (Prisma, NextAuth) are mocked so the suite runs
 * offline with no database and without needing NEXTAUTH_SECRET in the env.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock declarations (hoisted by Vitest before any imports) ──────────────────

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}))

// Prevent the NEXTAUTH_SECRET check in authOptions from throwing during tests
vi.mock('@/lib/authOptions', () => ({
  authOptions: {},
}))

vi.mock('@/lib/prisma', () => ({
  default: {
    expense: {
      findMany:   vi.fn().mockResolvedValue([]),
      create:     vi.fn(),
      delete:     vi.fn(),
      update:     vi.fn(),
      findUnique: vi.fn(),
    },
    expenseTemplate: {
      findMany:   vi.fn().mockResolvedValue([]),
      create:     vi.fn(),
      delete:     vi.fn(),
      update:     vi.fn(),
      findUnique: vi.fn(),
    },
    list: {
      findMany: vi.fn().mockResolvedValue([]),
      create:   vi.fn(),
      update:   vi.fn(),
      delete:   vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update:     vi.fn(),
    },
  },
}))

// ── Import route handlers after mocks are in place ───────────────────────────

import { getServerSession }                                  from 'next-auth/next'
import prisma                                                from '@/lib/prisma'
import { GET  as expensesGET,  POST as expensesPOST  }      from '@/app/api/expenses/route'
import { DELETE as expensesDEL, PATCH as expensesPATCH }    from '@/app/api/expenses/[id]/route'
import { GET  as groceriesGET, POST as groceriesPOST }      from '@/app/api/groceries/route'
import { GET  as templatesGET, POST as templatesPOST }      from '@/app/api/templates/route'
import { DELETE as templatesDEL }                            from '@/app/api/templates/[id]/route'
import { GET  as eventsGET }                                 from '@/app/api/events/route'
import { GET  as weatherGET }                                from '@/app/api/weather/route'
import { GET  as userGET }                                   from '@/app/api/users/[username]/route'
import { PATCH as profilePATCH }                             from '@/app/api/user/profile/route'

// ── Helpers ───────────────────────────────────────────────────────────────────

const SESSION = { user: { id: 'uid_mat', username: 'mat', name: 'Mat' } }

function req(url, init = {}) {
  return new Request(url, init)
}

function jsonReq(url, body, method = 'POST', extraHeaders = {}) {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  })
}

// Route context helper (Next.js 15 App Router passes params as Promise)
function ctx(paramObj) {
  return { params: Promise.resolve(paramObj) }
}

// ── 1. Unauthenticated → 401 ─────────────────────────────────────────────────

describe('Unauthenticated requests return 401', () => {
  beforeEach(() => vi.mocked(getServerSession).mockResolvedValue(null))

  it('GET  /api/expenses',          () => expensesGET(req('http://localhost/api/expenses'))
    .then(r => expect(r.status).toBe(401)))

  it('POST /api/expenses',          () => expensesPOST(jsonReq('http://localhost/api/expenses', { description: 'x', amount: 1, category: 'other' }))
    .then(r => expect(r.status).toBe(401)))

  it('DELETE /api/expenses/1',      () => expensesDEL(req('http://localhost/api/expenses/1', { method: 'DELETE' }), ctx({ id: '1' }))
    .then(r => expect(r.status).toBe(401)))

  it('PATCH  /api/expenses/1',      () => expensesPATCH(jsonReq('http://localhost/api/expenses/1', { paid: true }, 'PATCH'), ctx({ id: '1' }))
    .then(r => expect(r.status).toBe(401)))

  it('GET  /api/groceries',         () => groceriesGET(req('http://localhost/api/groceries'))
    .then(r => expect(r.status).toBe(401)))

  it('POST /api/groceries',         () => groceriesPOST(jsonReq('http://localhost/api/groceries', { label: 'milk' }))
    .then(r => expect(r.status).toBe(401)))

  it('GET  /api/templates',         () => templatesGET(req('http://localhost/api/templates'))
    .then(r => expect(r.status).toBe(401)))

  it('POST /api/templates',         () => templatesPOST(jsonReq('http://localhost/api/templates', { description: 'Netflix', amount: 15, category: 'subscriptions', frequency: 'monthly' }))
    .then(r => expect(r.status).toBe(401)))

  it('DELETE /api/templates/1',     () => templatesDEL(req('http://localhost/api/templates/1', { method: 'DELETE' }), ctx({ id: '1' }))
    .then(r => expect(r.status).toBe(401)))

  it('GET  /api/events',            () => eventsGET(req('http://localhost/api/events'))
    .then(r => expect(r.status).toBe(401)))

  it('GET  /api/weather',           () => weatherGET(req('http://localhost/api/weather'))
    .then(r => expect(r.status).toBe(401)))

  it('GET  /api/users/mat',         () => userGET(req('http://localhost/api/users/mat'), ctx({ username: 'mat' }))
    .then(r => expect(r.status).toBe(401)))

  it('PATCH /api/user/profile',     () => profilePATCH(jsonReq('http://localhost/api/user/profile', {}, 'PATCH'))
    .then(r => expect(r.status).toBe(401)))
})

// ── 2. Authorization: only creator may DELETE ─────────────────────────────────

describe('DELETE by non-creator → 403', () => {
  beforeEach(() => vi.mocked(getServerSession).mockResolvedValue(SESSION))

  it('DELETE /api/expenses/[id] owned by someone else', async () => {
    vi.mocked(prisma.expense.findUnique).mockResolvedValue({ id: 1, createdBy: 'alice' })
    const r = await expensesDEL(
      req('http://localhost/api/expenses/1', { method: 'DELETE' }),
      ctx({ id: '1' })
    )
    expect(r.status).toBe(403)
    // Prisma delete must NOT have been called
    expect(prisma.expense.delete).not.toHaveBeenCalled()
  })

  it('DELETE /api/templates/[id] owned by someone else', async () => {
    vi.mocked(prisma.expenseTemplate.findUnique).mockResolvedValue({ id: 1, createdBy: 'alice' })
    const r = await templatesDEL(
      req('http://localhost/api/templates/1', { method: 'DELETE' }),
      ctx({ id: '1' })
    )
    expect(r.status).toBe(403)
    expect(prisma.expenseTemplate.delete).not.toHaveBeenCalled()
  })

  it('DELETE /api/expenses/[id] owned by self → 204', async () => {
    vi.mocked(prisma.expense.findUnique).mockResolvedValue({ id: 2, createdBy: 'mat' })
    vi.mocked(prisma.expense.delete).mockResolvedValue({})
    const r = await expensesDEL(
      req('http://localhost/api/expenses/2', { method: 'DELETE' }),
      ctx({ id: '2' })
    )
    expect(r.status).toBe(204)
  })
})

// ── 3. Malformed payloads → 400 ───────────────────────────────────────────────

describe('Invalid payloads return 400', () => {
  beforeEach(() => vi.mocked(getServerSession).mockResolvedValue(SESSION))

  it('POST /api/expenses — missing description', async () => {
    const r = await expensesPOST(jsonReq('http://localhost/api/expenses', { amount: 10, category: 'other' }))
    expect(r.status).toBe(400)
  })

  it('POST /api/expenses — negative amount', async () => {
    const r = await expensesPOST(jsonReq('http://localhost/api/expenses', { description: 'test', amount: -5, category: 'other' }))
    expect(r.status).toBe(400)
  })

  it('POST /api/expenses — non-JSON body', async () => {
    const r = await expensesPOST(new Request('http://localhost/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'not-json',
    }))
    expect(r.status).toBe(400)
  })

  it('PATCH /api/expenses/[id] — paid is a string, not boolean', async () => {
    const r = await expensesPATCH(
      jsonReq('http://localhost/api/expenses/1', { paid: 'yes' }, 'PATCH'),
      ctx({ id: '1' })
    )
    expect(r.status).toBe(400)
  })

  it('PATCH /api/expenses/[id] — non-integer id', async () => {
    const r = await expensesPATCH(
      jsonReq('http://localhost/api/expenses/abc', { paid: true }, 'PATCH'),
      ctx({ id: 'abc' })
    )
    expect(r.status).toBe(400)
  })

  it('DELETE /api/expenses/[id] — non-integer id', async () => {
    const r = await expensesDEL(
      req('http://localhost/api/expenses/0', { method: 'DELETE' }),
      ctx({ id: '0' })   // 0 is not a valid positive int
    )
    expect(r.status).toBe(400)
  })

  it('POST /api/groceries — missing label', async () => {
    const r = await groceriesPOST(jsonReq('http://localhost/api/groceries', {}))
    expect(r.status).toBe(400)
  })

  it('POST /api/groceries — empty label string', async () => {
    const r = await groceriesPOST(jsonReq('http://localhost/api/groceries', { label: '' }))
    expect(r.status).toBe(400)
  })

  it('POST /api/templates — invalid frequency value', async () => {
    const r = await templatesPOST(jsonReq('http://localhost/api/templates', {
      description: 'Netflix',
      amount: 15,
      category: 'subscriptions',
      frequency: 'biweekly',  // not in enum
    }))
    expect(r.status).toBe(400)
  })

  it('POST /api/templates — amount exceeds maximum', async () => {
    const r = await templatesPOST(jsonReq('http://localhost/api/templates', {
      description: 'Rent',
      amount: 999999,
      category: 'rent',
      frequency: 'monthly',
    }))
    expect(r.status).toBe(400)
  })
})

// ── 4. CVE-2025-29927 middleware bypass header does NOT grant access ───────────

describe('x-middleware-subrequest bypass → still 401', () => {
  beforeEach(() => vi.mocked(getServerSession).mockResolvedValue(null))

  const BYPASS_HEADERS = {
    'x-middleware-subrequest': 'middleware:middleware:middleware:middleware:middleware',
  }

  it('GET /api/expenses with bypass header → 401', async () => {
    const r = await expensesGET(req('http://localhost/api/expenses', { headers: BYPASS_HEADERS }))
    expect(r.status).toBe(401)
  })

  it('GET /api/groceries with bypass header → 401', async () => {
    const r = await groceriesGET(req('http://localhost/api/groceries', { headers: BYPASS_HEADERS }))
    expect(r.status).toBe(401)
  })

  it('GET /api/templates with bypass header → 401', async () => {
    const r = await templatesGET(req('http://localhost/api/templates', { headers: BYPASS_HEADERS }))
    expect(r.status).toBe(401)
  })

  it('GET /api/events with bypass header → 401', async () => {
    const r = await eventsGET(req('http://localhost/api/events', { headers: BYPASS_HEADERS }))
    expect(r.status).toBe(401)
  })

  it('GET /api/weather with bypass header → 401', async () => {
    const r = await weatherGET(req('http://localhost/api/weather', { headers: BYPASS_HEADERS }))
    expect(r.status).toBe(401)
  })
})
