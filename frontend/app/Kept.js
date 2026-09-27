const K = {
  voter: ['The name or number you typed, and whether you’ve voted.'],
  manager: ['The question and answers.', 'Each name or number that’s requested a ballot: whether it voted, and — if you approve requests one by one — whether it’s pending, accepted, or rejected.', 'A running count for each answer, never linked to who cast it.', 'Your password, stored as a hash, not as text.', 'A few activity flags: repeat requests, bursts of new names, failed password attempts.'],
}
export default function Kept({ who }) {
  return <section className="kept">
    <h2>What is kept</h2>
    <ul>{K[who].map(t => <li key={t}>{t}</li>)}</ul>
    {who === 'manager' && <p>An accepted ballot's code is held only until the voter's page picks it up, then deleted.</p>}
    <h2>What is never kept</h2>
<ul><li>
    How you specfically voted.
</li>
<li>
    Cookies, IP addresses, device fingerprints, access logs.
</li>
</ul>
    When the vote is deleted, or when it expires automatically, all of this goes with it — including every ballot.
  </section>
}
