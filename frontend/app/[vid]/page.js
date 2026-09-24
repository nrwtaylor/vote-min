'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api, useLive, Results } from '../lib'
import Kept from '../Kept'

export default function Voter() {
  const { vid } = useParams()
  const [i, setI] = useState(null), [gone, setGone] = useState(false), [ident, setIdent] = useState('')
  const [b, setB] = useState(null), [pick, setPick] = useState(null), [done, setDone] = useState(false), [err, setErr] = useState('')
  const load = () => api('/v/' + vid).then(x => { setI(x); if (x.state !== 'open') setB(null) }).catch(() => setGone(true))
  useEffect(() => { load() }, [vid]); useLive(vid, load)

  const request = async e => {
    e.preventDefault(); setErr(''); setPick(null)
    try { setB(await api('/v/' + vid + '/ballot', { method: 'POST', body: { identifier: ident } })) } catch (x) { setB(null); setErr(x.message) }
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
      : <>
        <h1>Request your ballot</h1>
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
    <Kept who="voter" />
  </>
}
