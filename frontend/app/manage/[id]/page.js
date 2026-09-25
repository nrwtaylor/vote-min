'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api, useLive, Results } from '../../lib'
import Kept from '../../Kept'

const STEP = { draft: ['published', 'Publish vote'], published: ['open', 'Open voting'], open: ['closed', 'Close voting'] }

export default function Manage() {
  const { id } = useParams()
  const [d, setD] = useState(null), [locked, setLocked] = useState(false), [gone, setGone] = useState(false), [err, setErr] = useState('')
  const [q, setQ] = useState(''), [label, setLabel] = useState(''), [opts, setOpts] = useState(['', '']), [pw, setPw] = useState(''), [exp, setExp] = useState('')
  const key = 'vm:' + id
  const call = (p, o = {}) => api('/manage/' + id + p, { ...o, token: sessionStorage.getItem(key) || '' })
  const load = async init => {
    try {
      const x = await call(''); setD(x); setLocked(false)
      if (init) { setQ(x.question); setLabel(x.idLabel); setExp(x.expected || ''); setOpts(x.options.length ? x.options.map(o => o.text) : ['', '']) }
    } catch (e) { e.status === 401 ? setLocked(true) : e.status === 404 ? setGone(true) : setErr(e.message) }
  }
  useEffect(() => { load(true) }, [id]); useLive(d?.voterId, () => load(false))

  const act = f => async () => { setErr(''); try { await f() } catch (e) { setErr(e.message) } }
  const editable = () => ['draft', 'published'].includes(d.state)
  const save = () => call('', { method: 'PUT', body: { question: q, idLabel: label, options: opts, expected: exp } }).then(setD)
  const go = to => act(async () => {
    if (to === 'open' && !confirm('Open voting? The question and answers lock for good.')) return
    if (to === 'closed' && !confirm('Close voting and show results? This is final.')) return
    if (editable()) await save()
    setD(await call('/state', { method: 'POST', body: { to } }))
  })
  const token = r => { sessionStorage.setItem(key, r.token); setPw('') }
  const unlock = act(async () => { token(await api('/manage/' + id + '/unlock', { method: 'POST', body: { password: pw } })); load(true) })
  const lock = act(async () => { token(await call('/password', { method: 'POST', body: { password: pw } })); load(false) })
  const toggleAuto = act(async () => { await call('/auto-accept', { method: 'POST', body: { on: !d.autoAccept } }); load(false) })
  const decide = (identifier, action) => act(async () => { await call('/ballots/' + action, { method: 'POST', body: { identifier } }); load(false) })
  const del = act(async () => {
    if (!confirm('Delete this vote? Every ballot and vote is deleted immediately.')) return
    await call('', { method: 'DELETE' }); setGone(true)
  })

  if (gone) return <><h1>Vote deleted</h1><p>The question, every ballot and every vote have been deleted. Nothing is kept.</p><a href={(process.env.NEXT_PUBLIC_BASE_PATH || '') + '/'}>Create another vote</a></>
  if (locked) return <><h1>Password needed</h1>
    <form onSubmit={e => { e.preventDefault(); unlock() }}><input type="password" value={pw} onChange={e => setPw(e.target.value)} autoFocus aria-label="Password" />
      <button>Unlock</button></form><p className="err">{err}</p></>
  if (!d) return <p className="err">{err}</p>

  if (!d.hasPassword) return <>
    <h1>First, set a password</h1>
    <p>This page’s address is a key. A password stops anyone who sees the address from running or deleting your vote. You can’t set up the vote until this is done.</p>
    <form onSubmit={e => { e.preventDefault(); lock() }}>
      <input type="password" value={pw} minLength={6} autoFocus aria-label="Password" onChange={e => setPw(e.target.value)} />
      <button>Set password</button></form>
    <p className="hint">At least 6 characters. There is no reset, so keep it safe.</p>
    <p className="err">{err}</p>
    <Kept who="manager" />
  </>
  const ed = editable(), step = STEP[d.state]
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const link = location.origin + base + '/' + d.voterId
  const manageLink = location.origin + base + '/manage/' + d.voterId
  const voted = d.roll.filter(r => r.voted).length
  return <>
    <h1>Manage vote <span className="pill">{d.state}</span></h1>
    <p className="voteid">{d.voterId}</p>
    <div className="row"><input readOnly value={manageLink} onFocus={e => e.target.select()} aria-label="This page's address" />
      <button className="o" onClick={() => navigator.clipboard.writeText(manageLink)}>Copy</button></div>
    <div className="note"><b>Do not share this page’s address.</b> Anyone who has it can run or delete this vote. Share only the voter link below.</div>

    <h2>Question</h2>
    <fieldset disabled={!ed}>
      <input value={q} maxLength={300} placeholder="What are you asking?" aria-label="Question" onChange={e => setQ(e.target.value)} />
      {opts.map((o, n) => <div className="row" key={n}>
        <input value={o} maxLength={80} placeholder={'Answer ' + (n + 1)} aria-label={'Answer ' + (n + 1)} onChange={e => setOpts(opts.map((x, j) => j === n ? e.target.value : x))} />
        {opts.length > 2 && <button className="o" aria-label="Remove answer" onClick={() => setOpts(opts.filter((_, j) => j !== n))}>×</button>}
      </div>)}
      {opts.length < 10 && <button className="o" onClick={() => setOpts([...opts, ''])}>Add answer</button>}
      <h2>Voters are asked for</h2>
      <input value={label} maxLength={40} placeholder="Name or unit number" aria-label="What voters identify with" onChange={e => setLabel(e.target.value)} />
      <h2>Expected number of voters</h2>
      <input type="number" min="0" value={exp} placeholder="Optional" aria-label="Expected voters" onChange={e => setExp(e.target.value)} />
      <p className="hint">You’ll be warned if more identifiers ask for a ballot than you expect.</p>
    </fieldset>
    {ed ? <p><button className="o" onClick={act(save)}>Save</button></p> : <p className="hint">Locked: voting has opened.</p>}

    <h2>Voter link</h2>
    <div className="row"><input readOnly value={link} onFocus={e => e.target.select()} aria-label="Voter link" />
      <button className="o" onClick={() => navigator.clipboard.writeText(link)}>Copy</button></div>
    <p className="hint">{d.state === 'draft' ? 'Not live until you publish.' : d.state === 'published' ? 'Live. Voters see “not open yet”.' : ''}</p>

    {d.state !== 'closed' && <>
      <h2>Ballot requests</h2>
      <label className="toggle"><input type="checkbox" checked={d.autoAccept} onChange={toggleAuto} /> Auto-accept ballot requests</label>
      <p className="hint">{d.autoAccept ? 'A request gets a ballot the moment someone asks.' : 'Each request waits here for you to accept or reject it.'}</p>
    </>}

    {step && <p><button onClick={go(step[0])}>{step[1]}</button></p>}
    {d.state === 'published' && <p className="hint">Once voting is open there is no going back.</p>}

    {(d.state === 'open' || d.state === 'closed' || d.flags.length > 0) && <>
      <h2>Anything unusual</h2>
      {d.flags.length ? d.flags.map((f, n) => <p key={n} className="flag">{f.at && new Date(f.at).toLocaleTimeString() + ': '}{f.text}</p>) : <p className="hint">Nothing unusual so far.</p>}
    </>}
    {d.state === 'open' && <>
      <h2>{voted} voted, {d.roll.length} requested a ballot</h2>
      {d.feed.slice(0, 5).map((f, n) => <p key={n} className="feed">{f} has just voted</p>)}
    </>}
    {d.state === 'closed' && <><h2>Results</h2><Results rows={d.results} /><p className="hint">{voted} voted, {d.roll.length} requested a ballot.</p></>}
    {d.roll.length > 0 && d.state !== 'published' && <table><thead><tr><th>Who</th><th>Status</th><th>Flags</th><th></th></tr></thead><tbody>{d.roll.map(r => <tr key={r.identifier}>
      <td>{r.identifier}</td>
      <td>{r.voted ? 'voted' : r.status === 'pending' ? 'pending' : r.status === 'rejected' ? 'rejected' : 'waiting'}</td>
      <td className="flag">{[r.requests > 1 && `requested ${r.requests} times`, r.afterVote > 0 && `asked again after voting (${r.afterVote})`].filter(Boolean).join(', ')}</td>
      <td>{!r.voted && r.status === 'pending' && d.state === 'open' && <>
        <button className="o" onClick={decide(r.identifier, 'accept')}>Accept</button>{' '}
        <button className="o" onClick={decide(r.identifier, 'reject')}>Reject</button>
      </>}</td>
    </tr>)}</tbody></table>}

    <p className="hint">Locked with your password. Closing this tab locks it again.</p>

    <h2>Delete</h2>
    <p className="hint">Deletes the question, every ballot and every vote immediately.</p>
    {d.expiresAt && <p className="hint">If you do nothing, it deletes itself on {new Date(d.expiresAt).toLocaleDateString()}.</p>}
    <button className="x" onClick={del}>Delete vote</button>
    <p className="err">{err}</p>
    <Kept who="manager" />
  </>
}
