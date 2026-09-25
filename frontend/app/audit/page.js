'use client'
import { useEffect, useState } from 'react'
import { api } from '../lib'

const REPO = 'https://github.com/nrwtaylor/vote-min'
const short = c => c ? c.slice(0, 12) : null

export default function Audit() {
  const [v, setV] = useState(null), [err, setErr] = useState('')
  useEffect(() => { api('/version').then(setV).catch(x => setErr(x.message)) }, [])
  const feCommit = process.env.NEXT_PUBLIC_GIT_COMMIT || null

  return <>
    <h1>Verify this deployment</h1>
    <p className="lede">vote-min is open source. Here's how to check that what's running matches what's published.</p>

    <h2>What this page proves — and what it doesn't</h2>
    <p>It reports the exact commit each half of this app was started from, so you can look at that exact
      code yourself on GitHub. It does not prove nothing was changed in the running process afterward, and it
      does not prove this commit was actually pushed to that repository — both are worth checking yourself,
      which is why the link goes straight there rather than asking you to trust a summary.</p>

    <h2>Backend</h2>
    {err && <p className="err">Couldn't reach the backend to check: {err}</p>}
    {!err && !v && <p className="hint">Checking…</p>}
    {v && (v.commit
      ? <>
        <p className="hint">Running from commit</p>
        <div className="row"><input readOnly value={v.commit} onFocus={e => e.target.select()} aria-label="Backend commit" /></div>
        <p><a href={`${v.repo}/commit/${v.commit}`} target="_blank" rel="noreferrer">View this exact commit on GitHub</a></p>
        {v.branch && <p className="hint">Branch: {v.branch}{v.commitAt && <> · committed {new Date(v.commitAt).toLocaleString()}</>}</p>}
      </>
      : <p className="hint">This backend wasn't deployed from a git checkout (or git isn't available to it), so it can't report a commit.</p>)}

    <h2>Frontend</h2>
    {feCommit
      ? <>
        <p className="hint">Built from commit</p>
        <div className="row"><input readOnly value={feCommit} onFocus={e => e.target.select()} aria-label="Frontend commit" /></div>
        <p><a href={`${REPO}/commit/${feCommit}`} target="_blank" rel="noreferrer">View this exact commit on GitHub</a></p>
      </>
      : <p className="hint">This frontend wasn't built from a git checkout, so it can't report a commit.</p>}

    {v?.commit && feCommit && (v.commit === feCommit
      ? <p className="hint">Backend and frontend are built from the same commit.</p>
      : <p className="hint">Backend and frontend are built from different commits ({short(v.commit)} vs {short(feCommit)}) — not necessarily a problem, just worth knowing if you deploy them separately.</p>)}

    <h2>Read the source</h2>
    <p>The whole thing is small enough to actually read: one backend file, a handful of pages. <a href={REPO} target="_blank" rel="noreferrer">{REPO}</a></p>

    <p className="hint">This page is informational and doesn't collect anything.</p>
  </>
}
