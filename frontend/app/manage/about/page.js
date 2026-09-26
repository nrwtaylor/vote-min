'use client'
import { useEffect, useState } from 'react'

export default function ManageAbout() {
  const [origin, setOrigin] = useState('') // empty during server render; filled in after mount so this page never guesses wrong
  useEffect(() => { setOrigin(location.origin) }, [])
  const example = (origin || 'https://your-domain') + (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/KQZT'

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
    <p>These three get run together often, including in real elections, so it's worth building up one position rather than listing three separate definitions.</p>
    <p>Start from what secrecy of the ballot actually has to mean: not that people agree not to look, but that a choice is <i>unknowable</i> to anyone — including whoever's running the vote. A policy of "we won't look" depends on trust, and trust is exactly what a secret ballot exists to make unnecessary. So secrecy has to be structural or it isn't really secrecy. This system meets that bar: casting a vote is a single increment to a running total for the chosen answer, and nothing else is ever written down. There's no field holding a choice against an identifier that anyone has to promise not to read, because it was never created.</p>
    <p>That's a deliberately narrower promise than anonymity. Anonymity would mean nobody knows who took part at all, and this system doesn't offer that: you see the roll, every identifier that requested a ballot and whether it voted. That isn't a compromise on secrecy — knowing who's entitled to vote and who actually did is a normal, often required part of running a legitimate election at all, not a limitation particular to this tool. It's also exactly what makes double-voting detectable, and exactly how a paper register at a polling station works. You can always see who took part; that visibility is part of what makes the result trustworthy, the same as a clerk's register. What you can never see, here or with a real secret ballot, is how they voted.</p>
    <p>Privacy is a third, separate axis again: how much is collected and kept about the process itself, regardless of secrecy or anonymity. This system is minimal there too — no cookies, no IP logging, no device fingerprinting, nothing outlasting the vote once you delete it. That's privacy from outside observers and from unnecessary technical exhaust; it was never meant to mean privacy from you.</p>
    <p>So, in one line: <b>this system is private. It does not provide anonymity. It does not provide authenticated privacy</b> — nobody's claimed identifier is ever verified, so whatever privacy exists belongs to whoever used that identifier, not to a confirmed individual.</p>

    <h2>Sharing the voter link</h2>
    <p>The voter link — the one with the four-letter code, shown on the manage page — is the one thing you're meant to hand out. On this system it looks like:</p>
    <div className="row"><input readOnly value={example} aria-label="Example voter link" /></div>
    <p>It's public in a specific sense: nobody needs a password to use it, so whoever has it can request a ballot. That's the point — it's meant to be shared — which is exactly why it should only go to people who are actually entitled to vote, the same way you wouldn't pin a paper ballot to a public noticeboard. Paste it into the meeting chat (Zoom, Teams, whatever you're using), send it by email, or put it up on screen during the meeting so people can type or scan it in themselves. That last one is worth doing deliberately if some voters are in the room and some aren't — it's the hybrid case this is built for: paper for the room, the same link for everyone else.</p>

    <h2>What you're responsible for</h2>
    <p>The password is yours to keep; there is no reset. The manage address (or the vote's own code, once you've set a password) is what lets anyone run or delete the vote — sharing it is sharing control, not just visibility. While voting is open, the roll and the flags are worth watching, the way a clerk would watch a register. Deleting a vote is immediate and irreversible, for the question, every ballot, and every vote.</p>
    <p>The result is public too, in a narrow but real sense: once a vote closes, anyone with its four-character code can see the tally, the same as anyone with the voter link could throughout. That code is short by design, so nothing stops it being reachable indefinitely after the fact. If you'd rather it not sit there once you've shared the outcome, consider deleting the vote as soon as it's been announced. Deleting also removes the roll and its flags, so if you want your own record of how the vote actually ran, screenshot this manage page — roll, flags and all — before you do.</p>

    <p className="hint">This page is informational and doesn't collect anything.</p>
  </>
}
