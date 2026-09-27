const K = {
  voter: ['The name or number you typed, and whether you’ve voted.'],
  manager: ['The question and answers.', 'Each name or number that’s requested a ballot: whether it voted, and — if you approve requests one by one — whether it’s pending, accepted, or rejected.', 'A running count for each answer, never linked to who cast it.', 'Your password, stored as a hash, not as text.', 'A few activity flags: repeat requests, bursts of new names, failed password attempts.'],
}
export default function Kept({ who, expiresAt }) {
  // Voters have no Delete button anywhere on their page, so the date belongs here — it's the only place
  // it could go. Managers see the concrete date next to the Delete button itself, where the decision
  // actually gets made, so this stays general for them rather than repeating it.
  const deletion = !expiresAt
    ? 'When the vote is deleted, all of this goes with it — including every ballot.'
    : who === 'voter'
      ? `When the vote is deleted, or expires automatically on ${new Date(expiresAt).toLocaleDateString()}, all of this goes with it — including every ballot.`
      : 'When the vote is deleted, or expires automatically, all of this goes with it — including every ballot.'
  return <section className="kept">
    <h2>What is kept</h2>
    <ul>{K[who].map(t => <li key={t}>{t}</li>)}</ul>
    {who === 'manager' && <p>An accepted ballot's code is held only until the voter's page picks it up, then deleted.</p>}
    <h2>What is never kept</h2>
    <ul>
      <li>How you specifically voted.</li>
      <li>Cookies, IP addresses, device fingerprints, access logs.</li>
    </ul>
    <p>{deletion}</p>
  </section>
}
