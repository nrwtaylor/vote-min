'use client'
import { useEffect, useRef } from 'react'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '' // Next adds this to page routes automatically; these two manual calls need it by hand

export async function api(path, { method = 'GET', body, token } = {}) {
  const r = await fetch(BASE + '/api/v1' + path, { method, cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) },
    body: body && JSON.stringify(body) })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error(d.error || 'Something went wrong'), { status: r.status })
  return d
}

// The server only says "something changed"; the page then refetches. Some browsers give up retrying an
// EventSource permanently after certain failures rather than backing off forever, so this closes and
// reopens it manually on error instead of trusting the built-in retry alone.
export function useLive(vid, fn) {
  const f = useRef(fn); f.current = fn
  useEffect(() => {
    if (!vid) return
    let es, closed = false, retry
    const connect = () => {
      es = new EventSource(BASE + '/api/v1/events/' + vid)
      es.onmessage = () => f.current()
      es.onerror = () => { es.close(); if (!closed) retry = setTimeout(connect, 3000) }
    }
    connect()
    return () => { closed = true; clearTimeout(retry); es?.close() }
  }, [vid])
}

export function Results({ rows }) {
  const t = rows.reduce((a, r) => a + r.n, 0) || 1
  return <ul className="res">{rows.map(r => <li key={r.id}><span>{r.text}</span><b>{r.n}</b><i style={{ width: r.n / t * 100 + '%' }} /></li>)}</ul>
}
