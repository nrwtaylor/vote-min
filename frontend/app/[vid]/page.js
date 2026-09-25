'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api, useLive, Results } from '../lib'
import Kept from '../Kept'

export default function Voter() {
  const { vid } = useParams()
  const [i, setI] = useState(null), [gone, setGone] = useState(false), [ident, setIdent] = useState('')
  const [submitted, setSubmitted] = useState('') // the identifier actually sent, so a later edit to the input doesn't affect polling
  const [phase, setPhase] = useState('idle') // idle | pending | rejected
  const [b, setB] = useState(null), [pick, setPick] = useState(null), [done, setDone] = useState(false), [err, setErr] = useState('')

  const load = () => api('/v/' + vid).then(x => { setI(x); if (x.state !== 'open') { setB(null); setPhase('idle') } }).catch(() => setGone(true))
  // While a request is pending, each "something changed" ping also asks whether it's been decided yet.
  const check = async () => {
    if (phase !== 'pending' || !submitted) return
    try {
      const r = await api('/v/' + vid + '/ballot/claim', { method: 'POST', body: { identifier: submitted } })
      if (r.code) { setB(r); setPhase('idle') }
      else if (r.rejected) setPhase('rejected')
    } catch (x) { setPhase('idle'); setErr(x.message) }
  }
  useEffect(() => { load() }, [vid])
  useLive(vid, () => { load(); check() })

  const request = async e => {
    e.preventDefault(); setErr(''); setPick(null); setB(null)
    try {
      const r = await api('/v/' + vid + '/ballot', { method: 'POST', body: { identifier: ident } })
      setSubmitted(ident)
      if (r.pending) setPhase('pending')
      else { setB(r); setPhase('idle') }
    } catch (x) { setPhase('idle'); setErr(x.message) }
  }
  const cast = async () => {
    try { await api('/v/' + vid + '/vote', { method: 'POST', body: { code: b.code, optionId: pick.id } }); setDone(true); setB(null) }
    catch (x) { setErr(x.message); setB(null); setPick(null) }
  }

  if (gone) return <><h1>Vote not found</h1><p>This vote never existed or its manager deleted it. Deleting removes all ballots and votes.</p></>
  if (!i) return null
  if (i.state === 'closed') return <><h1>Results</h1><p className="lede">{i.question}</p><Results rows={i.results} /></>
  return <>
    {i.state === 'published' && <><h1>This vote is not open yet.</h1><p>This page updates by itself when voting opens.</p></>}
    {i.state === 'open' && (done
      ? <><h1>Vote recorded</h1><p>Thank you. Results appear here when voting closes.</p></>
      : phase === 'pending'
        ? <><h1>Waiting for approval</h1><p>Your request for <b>{submitted}</b> is waiting for the vote manager to accept it. This page updates on its own.</p></>
        : <>
          <h1>Request your ballot</h1>
          {phase === 'rejected' && <p className="err">Your request for {submitted} wasn’t accepted. You can try again.</p>}
          <form onSubmit={request}>
            <label htmlFor="id">{i.idLabel}</label>
            <div className="row"><input id="id" value={ident} maxLength={80} onChange={e => setIdent(e.target.value)} autoComplete="off" />
              <button>Request ballot</button></div>
          </form>
          <p className="hint">Requesting again cancels your earlier unused ballot. Refreshing this page loses it, so request again.</p>
          {b && <>
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
