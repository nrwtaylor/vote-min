export default function ManageAbout() {
  return <>
    <h1>How this vote is run</h1>
    <p className="lede">The mechanics behind vote-min, and what kind of vote it's suited for.</p>

    <h2>No accounts, by design</h2>
    <p>There's no login for you and no login for voters. This isn't an oversight — it matches a model of running an election that has been sufficient for a long time. For most of its history, voting at a UK polling station meant giving your name, having it found and ticked off the register, and being handed a ballot. No photo ID was checked. Requiring ID at the polling station is a recent policy change, not a precondition for the vote before it to have counted. The older model relied on the roll and on people noticing if an entry had already been used — not on verifying identity in advance.</p>
    <p>vote-min follows that older, longer-standing model. Anyone who types an identifier is trusted to be who they say, the same way anyone who gave a name at a polling station was.</p>

    <h2>The roll is built as people vote</h2>
    <p>You don't supply a list of voters beforehand. The first person to request a ballot under a given name or number creates that entry; it's ticked off the moment they vote. This is the electoral roll for this vote, assembled live rather than handed to you in advance.</p>

    <h2>Detection, not prevention</h2>
    <p>A polling clerk doesn't stop someone impersonating a registered voter with cryptography — they notice when a name comes up twice and someone has to explain themselves. This system works the same way. It can't verify that "Unit 12" is really Unit 12, but it watches for the signs a human clerk would watch for, and shows them to you: the same identifier asking for a ballot more than once, an identifier asking again <i>after</i> it has already voted, a burst of new names arriving together. None of this stops a determined impersonator by itself. It's what lets you notice — the same way the clerk noticed.</p>

    <h2>What this is proportionate for</h2>
    <p>This model suits small organisations, and organisations that understand what they're opting into: a vote where the people involved are known to each other or to you, where the worst case is a disagreement you can resolve by looking at the roll, and where nobody stands to gain enough from cheating undetected to bother trying. It is not suited to a vote where a stranger has a real incentive to impersonate someone else, or where the result needs to stand up as independently verified — a shareholder vote with legal force, a public election, anything where "we're confident nothing looked wrong" isn't a strong enough guarantee.</p>

    <h2>Once opened, the question is fixed</h2>
    <p>You can edit the question and answers freely before opening. The moment you open voting, that stops — permanently, not just until you unlock something. There's no administrative override. This is deliberate: a question that could still change after people start answering it isn't a fair one.</p>

    <h2>Once cast, a vote is final</h2>
    <p>A ballot paper, once it's in the box, cannot be pulled back out — not by the voter, not by the returning officer. The same is true here. A cast vote cannot be withdrawn, changed, or identified for removal, by you or by anyone else, because of how the next section works.</p>

    <h2>Secrecy, privacy, and anonymity are not the same thing</h2>
    <p>These three get run together often, including in real elections, so it's worth being precise about which ones apply here.</p>
    <p><b>Anonymity</b> would mean nobody knows who took part. This system doesn't offer that, and doesn't claim to. You see the roll: every identifier that requested a ballot, and whether it voted. That's what makes double-voting detectable at all, and it's exactly how a paper register works.</p>
    <p><b>Secrecy of the ballot</b> means nobody, including you, can find out what a specific person chose. This system does provide that — not as a policy, but structurally. Casting a vote only adds one to a running total for the chosen answer. Nothing anywhere records which option a given identifier picked. There's no field to look up and no query that could reveal it, because the information was never written down in the first place.</p>
    <p><b>Privacy</b> is broader: minimal collection, nothing tracked, nothing kept beyond what the vote needs, everything gone when you delete it. This system has that too — no cookies, no IP logging, no device fingerprinting. But this is privacy from outside observers and from unnecessary technical exhaust, not privacy from you. You are always able to see who took part.</p>
    <p>So, plainly: <b>this system is private. It does not provide anonymity. It does not provide authenticated privacy</b> — nobody's claimed identifier is ever verified, so "privacy" here can't mean privacy for a confirmed individual, only for whoever used that identifier.</p>

    <h2>What you're responsible for</h2>
    <p>The password is yours to keep; there is no reset. The manage address (or the vote's own code, once you've set a password) is what lets anyone run or delete the vote — sharing it is sharing control, not just visibility. While voting is open, the roll and the flags are worth watching, the way a clerk would watch a register. Deleting a vote is immediate and irreversible, for the question, every ballot, and every vote.</p>

    <p className="hint">This page is informational and doesn't collect anything.</p>
  </>
}
