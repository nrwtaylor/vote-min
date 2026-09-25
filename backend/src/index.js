// vote-min public API. No request logging, no IP handling, no cookies.
// One document per vote holds question, answers, counts and ballots, so every change is a single atomic
// update: no transactions, no replica set needed.
import express from 'express'
import { MongoClient } from 'mongodb'
import { randomBytes, randomInt, createHash, createHmac, scryptSync, timingSafeEqual } from 'node:crypto'

const polls = (await MongoClient.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017'))
  .db(process.env.MONGO_DB || 'vote-min').collection('polls')
await polls.createIndex({ voterId: 1 }, { unique: true })
const TTL = +(process.env.VOTE_TTL_DAYS ?? 7) // votes delete themselves this many days after creation (0 = never)
if (TTL) await polls.createIndex({ createdAt: 1 }, { expireAfterSeconds: TTL * 86400 })

const rid = n => randomBytes(n).toString('base64url')
const CONS = 'BCDFGHJKLMNPQRSTVWXYZ' // no vowels, so codes never spell words
const vid = () => Array.from({ length: +process.env.VOTER_ID_LENGTH || 4 }, () => CONS[randomInt(CONS.length)]).join('')
const sha = s => createHash('sha256').update(s).digest('hex')
const norm = s => String(s || '').toLowerCase().replace(/\s+/g, '').slice(0, 80)
const eq = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))
const hashPw = p => { const s = randomBytes(16); return s.toString('hex') + ':' + scryptSync(p, s, 32).toString('hex') }
const checkPw = (p, h) => { const [s, k] = h.split(':'); return eq(scryptSync(p, Buffer.from(s, 'hex'), 32).toString('hex'), k) }

// Manage tokens are signed, not stored. They stop working when the password changes or the vote is deleted.
const SECRET = process.env.VOTE_MIN_SECRET || (console.warn('VOTE_MIN_SECRET not set: tokens reset on restart'), randomBytes(32).toString('hex'))
const mac = s => createHmac('sha256', SECRET).update(s).digest('hex')
const mint = p => { const e = Date.now() + 864e5; return e + '.' + mac(`${p._id}.${e}.${p.pw}`) }
const valid = (p, t) => { const [e, m] = String(t).split('.'); return +e > Date.now() && !!m && eq(m, mac(`${p._id}.${e}.${p.pw}`)) }

const fails = new Map(), feed = new Map(), subs = new Map(), last = new Map(), bursts = new Map() // memory only, never stored
const ping = v => subs.get(v)?.forEach(r => r.write('data: 1\n\n'))
setInterval(() => subs.forEach(set => set.forEach(r => r.write(':\n\n'))), 25000)

const NB = { projection: { ballots: 0 } }
const byV = v => polls.findOne({ voterId: String(v).toUpperCase(), state: { $ne: 'draft' } }, NB)
const opts = p => p.options.map((text, id) => ({ id, text }))
const res = p => p.options.map((text, id) => ({ id, text, n: p.tally[id] }))
// Stricter sameness than the ballot key: ignores punctuation, email +tags and leading zeros
const strict = k => k.replace(/\+[^@]*(?=@)/, '').replace(/[^\p{L}\p{N}@]/gu, '').replace(/(?<![0-9])0+(?=[0-9])/g, '')
const flags = p => {
  const f = [], groups = {}
  p.ballots.forEach(b => {
    ;(groups[strict(b.k)] ||= []).push(b.k)
    if (b.a) f.push({ type: 'after-vote', text: `${b.k} asked for a ballot after voting (${b.a}x). Someone may be pretending to be them.` })
    if (b.n > 2) f.push({ type: 'repeat', text: `${b.k} requested a ballot ${b.n} times.` })
  })
  Object.values(groups).filter(g => g.length > 1).forEach(g => f.push({ type: 'lookalike', text: `${g.join(', ')} look like the same person.` }))
  if (p.expected && p.ballots.length > p.expected) f.push({ type: 'stuffing', text: `${p.ballots.length} identifiers asked for a ballot. You expected ${p.expected}.` })
  ;(p.alerts || []).forEach(a => f.push({ type: 'burst', at: a.at, text: '20 or more new identifiers in one minute. Normal if a room opened together, unusual otherwise.' }))
  if (p.wrongPw) f.push({ type: 'password', text: `${p.wrongPw} wrong password attempts on this page.` })
  return f
}
const view = p => ({ state: p.state, question: p.question, idLabel: p.idLabel, voterId: p.voterId, hasPassword: !!p.pw,
  autoAccept: !!p.autoAccept,
  flags: flags(p), expected: p.expected || 0, expiresAt: TTL && p.createdAt ? new Date(+p.createdAt + TTL * 864e5) : null,
  options: opts(p), feed: feed.get(p._id) || [], results: p.state === 'closed' ? res(p) : null,
  // status is missing on ballots from before this feature existed; they were all issued immediately, so 'accepted' is the right default.
  roll: p.ballots.map(b => ({ identifier: b.k, voted: b.done, requests: b.n, afterVote: b.a, status: b.status || 'accepted' })).sort((a, b) => a.identifier.localeCompare(b.identifier)) })

const app = express(), r = express.Router()
app.disable('x-powered-by'); app.use(express.json({ limit: '4kb' }))
app.use((q, s, n) => { // open CORS is safe: no cookies, manage calls carry a Bearer token
  s.set({ 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' })
  q.body ??= {}; q.method === 'OPTIONS' ? s.sendStatus(204) : n()
})
app.use('/v1', r) // no /api prefix here: that's nginx's job at the public boundary (see API.md)

// The URL's :mid can be the long manage id, or the same short code used for the voter link.
const findManaged = mid => polls.findOne({ $or: [{ _id: mid }, { voterId: String(mid).toUpperCase() }] })

const mgr = async (q, s, n) => {
  const p = await findManaged(q.params.mid)
  if (!p) return s.status(404).json({ error: 'Not found' })
  if (p.pw && !valid(p, (q.headers.authorization || '').slice(7))) return s.status(401).json({ locked: true })
  q.poll = p; n()
}

const needPw = (q, s, n) => q.poll.pw ? n() : s.status(403).json({ error: 'Set a password first', needsPassword: true })

r.post('/polls', async (q, s) => {
  for (let i = 0; i < 20; i++) { // retry if the short code is taken
    const p = { _id: rid(9), voterId: vid(), createdAt: new Date(), question: '', idLabel: 'Name or unit number', state: 'draft', pw: null, autoAccept: false,
      options: [], tally: [], ballots: [], alerts: [], wrongPw: 0, expected: 0 }
    try { await polls.insertOne(p); return s.json({ manageId: p._id, voterId: p.voterId }) } catch (e) { if (e.code !== 11000) throw e }
  }
  s.status(503).json({ error: 'No free vote codes right now. Try again shortly.' })
})

r.post('/manage/:mid/unlock', async (q, s) => {
  const p = await findManaged(q.params.mid); if (!p) return s.sendStatus(404)
  const f = fails.get(p._id) || { n: 0, until: 0 }, now = Date.now()
  if (now < f.until) return s.status(429).json({ error: `Wait ${Math.ceil((f.until - now) / 1000)}s and try again` })
  if (!p.pw || !checkPw(String(q.body.password || ''), p.pw)) {
    f.n++; f.until = now + Math.min(2 ** (f.n - 1) * 1000, 60000); fails.set(p._id, f)
    if (p.pw) await polls.updateOne({ _id: p._id }, { $inc: { wrongPw: 1 } })
    return s.status(403).json({ error: 'Wrong password' })
  }
  fails.delete(p._id); s.json({ token: mint(p) })
})

r.get('/manage/:mid', mgr, (q, s) => s.json(view(q.poll)))

r.put('/manage/:mid', mgr, needPw, async (q, s) => {
  const options = (Array.isArray(q.body.options) ? q.body.options : []).map(o => String(o).trim().slice(0, 80)).filter(Boolean).slice(0, 10)
  const u = await polls.findOneAndUpdate({ _id: q.poll._id, state: { $in: ['draft', 'published'] } },
    { $set: { question: String(q.body.question || '').trim().slice(0, 300), idLabel: String(q.body.idLabel || '').trim().slice(0, 40) || 'Name or unit number', options, tally: options.map(() => 0), expected: Math.max(0, Math.min(100000, parseInt(q.body.expected) || 0)) } },
    { returnDocument: 'after' })
  if (!u) return s.status(409).json({ error: 'Locked: voting has opened' })
  ping(u.voterId); s.json(view(u))
})

const NEXT = { draft: 'published', published: 'open', open: 'closed' }
r.post('/manage/:mid/state', mgr, needPw, async (q, s) => {
  const p = q.poll, to = q.body.to
  if (NEXT[p.state] !== to) return s.status(409).json({ error: 'Not allowed' })
  if (to === 'published' && (!p.question || p.options.length < 2)) return s.status(400).json({ error: 'Add a question and at least two answers first' })
  const u = await polls.findOneAndUpdate({ _id: p._id, state: p.state },
    { $set: { state: to, ...(to === 'closed' && { 'ballots.$[].h': null, 'ballots.$[].code': null }) } }, { returnDocument: 'after' }) // closing kills unused ballots
  if (!u) return s.status(409).json({ error: 'Not allowed' })
  ping(u.voterId); s.json(view(u))
})

// Stored on the poll itself, so this survives a page refresh or a second organiser opening the same vote.
r.post('/manage/:mid/auto-accept', mgr, needPw, async (q, s) => {
  const on = !!q.body.on
  await polls.updateOne({ _id: q.poll._id }, { $set: { autoAccept: on } })
  ping(q.poll.voterId); s.json({ autoAccept: on })
})

r.post('/manage/:mid/ballots/accept', mgr, needPw, async (q, s) => {
  const k = norm(q.body.identifier)
  const code = rid(24), h = sha(code) // generated now, not at request time, so nothing is votable until this moment
  const u = await polls.updateOne({ _id: q.poll._id, ballots: { $elemMatch: { k, status: 'pending', done: false } } },
    { $set: { 'ballots.$.status': 'accepted', 'ballots.$.code': code, 'ballots.$.h': h } })
  if (!u.modifiedCount) return s.status(409).json({ error: 'No pending request for that identifier' })
  ping(q.poll.voterId); s.json({ ok: true })
})

r.post('/manage/:mid/ballots/reject', mgr, needPw, async (q, s) => {
  const k = norm(q.body.identifier)
  const u = await polls.updateOne({ _id: q.poll._id, ballots: { $elemMatch: { k, status: 'pending', done: false } } },
    { $set: { 'ballots.$.status': 'rejected', 'ballots.$.code': null, 'ballots.$.h': null } })
  if (!u.modifiedCount) return s.status(409).json({ error: 'No pending request for that identifier' })
  ping(q.poll.voterId); s.json({ ok: true })
})

r.post('/manage/:mid/password', mgr, async (q, s) => {
  const pw = String(q.body.password || ''); if (pw.length < 6) return s.status(400).json({ error: 'Use at least 6 characters' })
  if (!q.poll.pw && !q.body.agree) return s.status(400).json({ error: 'You need to confirm you have read the guide and agree to the terms.' })
  const p = { ...q.poll, pw: hashPw(pw) }
  await polls.updateOne({ _id: p._id }, { $set: { pw: p.pw, ...(!q.poll.pw && { termsAgreedAt: new Date() }) } }); s.json({ token: mint(p) })
})

r.delete('/manage/:mid', mgr, async (q, s) => {
  const p = q.poll
  await polls.deleteOne({ _id: p._id }) // the one document holds everything: options, counts, ballots
  feed.delete(p._id); ping(p.voterId); subs.delete(p.voterId); s.json({ ok: true })
})

r.get('/v/:vid', async (q, s) => {
  const p = await byV(q.params.vid); if (!p) return s.sendStatus(404)
  s.json({ state: p.state, idLabel: p.idLabel, ...(p.state === 'closed' && { question: p.question, results: res(p) }) })
})

r.get('/events/:vid', async (q, s) => {
  const v = q.params.vid.toUpperCase(); if (!await polls.countDocuments({ voterId: v })) return s.sendStatus(404)
  s.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' })
  s.flushHeaders(); s.write('retry: 3000\n\n')
  if (!subs.has(v)) subs.set(v, new Set())
  subs.get(v).add(s); q.on('close', () => subs.get(v)?.delete(s))
})

r.post('/v/:vid/ballot', async (q, s) => {
  const p = await byV(q.params.vid); if (!p) return s.sendStatus(404)
  if (p.state !== 'open') return s.status(409).json({ error: 'Voting is not open' })
  const k = norm(q.body.identifier); if (!k) return s.status(400).json({ error: 'Enter your ' + p.idLabel.toLowerCase() })
  const lk = p._id + ':' + k, now = Date.now()
  if (now - (last.get(lk) || 0) < 2000) return s.status(429).json({ error: 'One moment, then try again' })
  last.set(lk, now)
  const F = { _id: p._id, state: 'open' }
  // Auto-accept: issue the ballot straight away, same as before. Manual (default): parks it pending
  // until the organiser accepts or rejects it on the manage page — no code exists until then.
  const auto = !!p.autoAccept
  const code = auto ? rid(24) : null, h = auto ? sha(code) : null
  const set = auto ? { status: 'accepted', code: null, h } : { status: 'pending', code: null, h: null }
  const reply = auto ? { code, question: p.question, options: opts(p) } : { pending: true }
  for (let i = 0; i < 2; i++) {
    const again = await polls.updateOne({ ...F, ballots: { $elemMatch: { k, done: false } } }, { $set: set, $inc: { 'ballots.$.n': 1 } }) // old ballot dies, even if it was already accepted or rejected
    const fresh = !again.modifiedCount && await polls.updateOne({ ...F, 'ballots.k': { $ne: k }, 'ballots.4999': { $exists: false } }, { $push: { ballots: { k, ...set, done: false, n: 1, a: 0 } } })
    if (fresh.modifiedCount) { // a new identifier: watch for bursts (timestamps kept in memory only)
      const t = (bursts.get(p._id) || []).filter(x => now - x < 6e4).concat(now); bursts.set(p._id, t)
      if (t.length === 20) await polls.updateOne({ _id: p._id }, { $push: { alerts: { $each: [{ at: new Date() }], $slice: -20 } } })
    }
    if (again.modifiedCount || fresh.modifiedCount) { ping(p.voterId); return s.json(reply) }
    if ((await polls.updateOne({ ...F, ballots: { $elemMatch: { k, done: true } } }, { $inc: { 'ballots.$.a': 1 } })).modifiedCount) {
      ping(p.voterId); return s.status(409).json({ error: 'That has already voted' })
    }
  }
  s.status(409).json({ error: 'This vote is full or busy. Try again.' })
})

// The voter's page calls this after a "pending" reply, each time it hears something changed, to see
// whether the organiser has decided yet. Once accepted, the code is handed over here and immediately
// cleared server-side — it only ever exists in the database for the gap between accept and this call.
r.post('/v/:vid/ballot/claim', async (q, s) => {
  const p = await byV(q.params.vid); if (!p) return s.sendStatus(404)
  if (p.state !== 'open') return s.status(409).json({ error: 'Voting is closed' })
  const k = norm(q.body.identifier); if (!k) return s.status(400).json({ error: 'Enter your ' + p.idLabel.toLowerCase() })
  const claimed = await polls.findOneAndUpdate(
    { _id: p._id, ballots: { $elemMatch: { k, status: 'accepted', done: false, code: { $ne: null } } } },
    { $set: { 'ballots.$.code': null } }, { returnDocument: 'before', projection: { 'ballots.$': 1 } })
  if (claimed) return s.json({ code: claimed.ballots[0].code, question: p.question, options: opts(p) })
  const found = await polls.findOne({ _id: p._id, 'ballots.k': k }, { projection: { 'ballots.$': 1 } })
  const b = found?.ballots?.[0]
  if (!b) return s.status(404).json({ error: 'No request found. Ask for a ballot first.' })
  if (b.done) return s.status(409).json({ error: 'That has already voted' })
  if (b.status === 'rejected') return s.json({ rejected: true })
  if (b.status === 'accepted') return s.status(409).json({ error: 'This ballot was already opened elsewhere. Request a new one.' })
  s.json({ pending: true })
})

r.post('/v/:vid/vote', async (q, s) => {
  const p = await byV(q.params.vid); if (!p) return s.sendStatus(404)
  if (p.state !== 'open') return s.status(409).json({ error: 'Voting is closed' })
  const { code, optionId: o } = q.body
  if (typeof code !== 'string' || !Number.isInteger(o) || !p.options[o]) return s.status(400).json({ error: 'Invalid vote' })
  const h = sha(code) // one atomic update: consume the ballot and add to the count. The choice is never stored with the ballot.
  const b = await polls.findOneAndUpdate({ _id: p._id, state: 'open', ballots: { $elemMatch: { h, done: false } } },
    { $set: { 'ballots.$.done': true, 'ballots.$.h': null }, $inc: { ['tally.' + o]: 1 } }, { returnDocument: 'before', projection: { ballots: 1 } })
  if (!b) return s.status(409).json({ error: 'This ballot was replaced or already used. Request a new one.' })
  feed.set(p._id, [b.ballots.find(x => x.h === h).k, ...(feed.get(p._id) || [])].slice(0, 50)); ping(p.voterId); s.json({ ok: true })
})

app.listen(process.env.PORT || 4000, process.env.HOST || '127.0.0.1', () => console.log('vote-min API on /v1'))
