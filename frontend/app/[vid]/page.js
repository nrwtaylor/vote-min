'use client'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { api, useLive, Results } from '../lib'
import Kept from '../Kept'

const REASON = {
  closed: 'Voting closed while this ballot was still open.',
  voted: 'This identifier has already voted, with a different ballot than this tab was holding.',
  superseded: 'A newer ballot was requested for this identifier — maybe from another tab, maybe from another device. This one no longer works.',
  gone: 'This ballot could no longer be found.',
}

export default function Voter() {
  const { vid } = useParams()
  const [i, setI] = useState(null), [gone, setGone] = useState(false), [ident, setIdent] = useState('')
  const [submitted, setSubmitted] = useState('') // the identifier actually sent, so a later edit to the input doesn't affect polling
  const [phase, setPhase] = useState('unrequested') // unrequested | pending | ready | rejected | superseded
  const [reason, setReason] = useState('')
  const [b, setB] = useState(null), [pick, setPick] = useState(null), [done, setDone] = useState(false), [err, setErr] = useState('')

  const load = () => api('/v/' + vid).then(x => { setI(x); if (x.state !== 'open') { setB(null); setPhase('unrequested') } }).catch(() => setGone(true))
  // Every "something changed" ping either checks whether a pending request has been decided, or —
  // once a ballot is actually held — whether it's still the live one for this identifier.
  const check = async () => {
    if (!submitted) return
    if (phase === 'pending') {
      try {
        const r = await api('/v/' + vid + '/ballot/claim', { method: 'POST', body: { identifier: submitted } })
        if (r.code) { setB(r); setPhase('ready') }
        else if (r.rejected) setPhase('rejected')
        else if (r.superseded) { setReason(r.reason); setPhase('superseded') }
      } catch (x) { setErr(x.message) }
    } else if (phase === 'ready' && b) {
      try {
        const r = await api('/v/' + vid + '/ballot/check', { method: 'POST', body: { identifier: submitted, code: b.code } })
        if (!r.valid) { setB(null); setPick(null); setReason(r.reason); setPhase('superseded') }
      } catch (x) { setErr(x.message) }
    }
  }
  useEffect(() => { load() }, [vid])
  useLive(vid, () => { load(); check() })
  // A backstop independent of the SSE connection above: while a request's outcome actually matters
  // (waiting for approval, or holding a ballot that could be invalidated), check periodically even if
  // the live connection has silently dropped and not reconnected.
  const checkRef = useRef(check); checkRef.current = check
  useEffect(() => {
    if (phase !== 'pending' && phase !== 'ready') return
    const t = setInterval(() => checkRef.current(), 15000)
    return () => clearInterval(t)
  }, [phase])

  const [sending, setSending] = useState(false) // locks the field the instant you click, not after the round trip
  const request = async e => {
    e.preventDefault(); setErr(''); setPick(null); setB(null); setSending(true)
    try {
      const r = await api('/v/' + vid + '/ballot', { method: 'POST', body: { identifier: ident } })
      setSubmitted(ident)
      if (r.pending) setPhase('pending')
      else { setB(r); setPhase('ready') }
    } catch (x) { setErr(x.message) } // failed attempt: field reopens, nothing locked in
    finally { setSending(false) }
  }
  const cast = async () => {
    try { await api('/v/' + vid + '/vote', { method: 'POST', body: { code: b.code, optionId: pick.id } }); setDone(true); setB(null) }
    catch (x) { setErr(x.message); setB(null); setPick(null) }
  }

  if (gone) return <><h1>Vote not found</h1><p>This vote never existed or its manager deleted it. Deleting removes all ballots and votes.</p></>
  if (!i) return null
  if (i.state === 'closed') return <><h1>Results</h1><p className="lede">{i.question}</p><Results rows={i.results} /></>

  const locked = sending || (phase !== 'unrequested' && phase !== 'rejected') // clicked, or already submitted — rejection is the one case that reopens it
  return <>
    {i.state === 'published' && <><h1>This vote is not open yet.</h1><p>This page updates by itself when voting opens.</p></>}
    {i.state === 'open' && (done
      ? <><h1>Vote recorded</h1><p>Thank you. Results appear here when voting closes.</p></>
      : <>
        <h1>{locked ? 'Ballot' : 'Request your ballot'}</h1>
        {phase === 'rejected' && <p className="err">Your request for {submitted} wasn’t accepted. You can try again.</p>}
        <fieldset disabled={locked}>
          <form onSubmit={request}>
            <label htmlFor="id">{i.idLabel}</label>
            <div className="row"><input id="id" value={ident} maxLength={80} onChange={e => setIdent(e.target.value)} autoComplete="off" />
              <button>{sending ? 'Requesting…' : locked ? 'Ballot requested' : 'Request ballot'}</button></div>
          </form>
        </fieldset>
        <p className="hint">If this identifier requests another ballot — from this tab, another tab, or another device — this one stops working. To start over in this tab, reload the page.</p>

        {phase === 'pending' && <p>Your request for <b>{submitted}</b> is waiting for the vote manager to accept it. This page updates on its own.</p>}
        {phase === 'superseded' && <p className="err">{REASON[reason] || 'This ballot is no longer valid.'}</p>}
        {phase === 'ready' && b && <>
          <h2>{b.question}</h2>
          {b.options.map(o => <button key={o.id} className={'ans' + (pick?.id === o.id ? ' on' : '')} onClick={() => setPick(o)}>{o.text}</button>)}
          {pick && <div className="row confirm"><span>Vote for “{pick.text}”? This is final.</span>
            <button onClick={cast}>Confirm vote</button><button className="o" onClick={() => setPick(null)}>Back</button></div>}
        </>}
      </>)}
    <p className="err">{err}</p>
    <p className="hint"><a href={(process.env.NEXT_PUBLIC_BASE_PATH || '') + '/about'}>How does this work?</a></p>
    <Kept who="voter" />
  </>
}
