const K = {
  voter: ['The name or number you type, and whether it has voted.', 'Your choice, counted with no link to you.'],
  manager: ['The question and answers.', 'Each name or number that requested a ballot, whether it voted, and, if you accept ballots one by one, whether it is pending, accepted or rejected.', 'A count for each answer. Nothing links a choice to a person.', 'A password, only as a salted hash.', 'Warnings about unusual activity: request counts, bursts of new names, wrong password attempts.'],
}
export default function Kept({ who }) {
  return <section className="kept">
    <h2>What is kept</h2>
    <ul>{K[who].map(t => <li key={t}>{t}</li>)}</ul>
    {who === 'manager' && <p>If you accept a request, its ballot code is held only until the voter’s page picks it up, then discarded.</p>}
    <h2>What is never kept</h2>
    <p>Cookies, IP addresses, browser or device fingerprints, access logs.</p>
    <p><b>When the vote manager deletes the vote, or it expires, everything above is deleted with it, including every ballot.</b></p>
  </section>
}
