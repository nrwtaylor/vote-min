export default function About() {
  return <>
    <h1>How voting works</h1>
    <p className="lede">A short explanation of what happens when you vote here.</p>

    <h2>Requesting a ballot</h2>
    <p>You'll be asked for a name or number — whatever the organiser chose to identify voters by. Type it in and click Request ballot. This isn't a login: there's no account and nothing to remember afterwards. Its only job is to make sure each person votes once. Once you've submitted it, that field greys out and locks — the same tab won't let you request a second one by accident.</p>

    <h2>Sometimes you'll wait for approval</h2>
    <p>Some votes are set up so the organiser accepts each request by hand, rather than issuing ballots automatically. If so, you'll see "Waiting for approval" after you ask — the page updates on its own once a decision is made, so there's nothing to refresh. If your request isn't accepted, that field reopens and you can simply try again.</p>

    <h2>Casting your vote</h2>
    <p>Once your ballot is ready, the question and answers appear. Pick one and you'll be asked to confirm — this step exists because voting is final. Once it's submitted, that's it.</p>

    <h2>Your identifier and your vote aren't linked</h2>
    <p>This is true, and it's built in rather than promised: the system remembers <i>whether</i> your identifier has voted, so it can stop a second vote and so the organiser can see turnout. It does not remember <i>what</i> you chose. Casting a vote only adds one to a running total for the answer you picked — your individual choice is never written down anywhere, against your identifier or otherwise. There's nothing to unlink later, because it was never linked in the first place.</p>

    <h2>Once you've voted, that's final</h2>
    <p>Each ballot works once. If you try to request another with the same identifier after voting, it's refused — and the organiser sees that someone tried, which is one of the ways attempts to vote twice get noticed.</p>

    <h2>If a ballot says it's no longer valid</h2>
    <p>Only the most recently requested ballot for a given identifier ever works. If the same identifier asks for another one — from this tab, another tab, another device, or a genuinely different person typing the same name — whichever ballot was issued before that stops working, live, even if you're already looking at it. You'll see a plain explanation of why rather than a confusing error at the moment you try to vote. If that wasn't you, it's worth mentioning to whoever's running the vote — it's exactly the kind of thing the roll is there to make visible.</p>

    <h2>If you lose your ballot</h2>
    <p>Closing the tab or refreshing the page loses your in-progress ballot, by design — nothing is saved in your browser. Reload the voting link and ask again with the same identifier — reloading is what resets that field, not anything you can do to it once it's locked. If you haven't voted yet, this replaces the old request with a new one (and, if approval is required, puts you back in the queue).</p>

    <p className="hint">This page is informational and doesn't collect anything.</p>
  </>
}
