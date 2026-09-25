# vote-min API v1
Base path is `/v1` on the backend directly (e.g. `http://127.0.0.1:4000/v1`). Behind this deployment's nginx,
the public base is `https://stackr.ca/api/cyanibex/v1`. JSON in and out. Errors are `{"error": "..."}`.
CORS is open; there are no cookies. States run one way: draft, published, open, closed. Question and answers
lock when a vote opens.

## Meta
| Call | Result |
|---|---|
| `GET /version` | `{commit, branch, commitAt, repo}`. The git commit this backend process was started from — `null` fields if it wasn't deployed from a git checkout. Not a proof the process hasn't since been altered; see `/audit` in the frontend |

## Organiser
`:mid` accepts either the `manageId` or the same short `voterId` code used for the voter link. A password
is required before anything else works (see below), so this is safe: knowing a poll's public code only gets
you to the password prompt, not past it. Send `Authorization: Bearer <token>` once you have one.

| Call | Result |
|---|---|
| `POST /polls` | `{manageId, voterId}` |
| `GET /manage/:mid` | full state, roll, feed, results when closed. `401 {locked:true}` if a token is needed |
| `PUT /manage/:mid` `{question, idLabel, options[]}` | draft or published only |
| `POST /manage/:mid/state` `{to}` | `published`, then `open`, then `closed` |
| `POST /manage/:mid/password` `{password, agree}` | `{token}`; old tokens stop working. `agree:true` required the first time a password is set (400 without it) — confirms reading `/manage/about` and the Terms of Service |
| `POST /manage/:mid/unlock` `{password}` | `{token}`, valid 24h; wrong guesses back off 1s, 2s, 4s... per vote |
| `POST /manage/:mid/auto-accept` `{on}` | `{autoAccept}`. Off (default): requests wait for accept/reject. On: issued immediately |
| `POST /manage/:mid/ballots/accept` `{identifier}` | `{ok}`. 409 if that identifier has no pending request |
| `POST /manage/:mid/ballots/reject` `{identifier}` | `{ok}`. 409 if that identifier has no pending request |
| `DELETE /manage/:mid` | deletes the vote, every ballot and every count |

## Voter
| Call | Result |
|---|---|
| `GET /v/:vid` | `{state, idLabel}`, plus `question` and `results` once closed. 404 while draft or after delete |
| `POST /v/:vid/ballot` `{identifier}` | Auto-accept on: `{code, question, options:[{id,text}]}`. Off: `{pending:true}` — poll `/ballot/claim`. Asking again cancels the earlier request. 409 if that identifier already voted |
| `POST /v/:vid/ballot/claim` `{identifier}` | `{code, question, options}` once accepted (one-time; hand it off and it's gone), `{pending:true}` while waiting, `{rejected:true}` if turned down |
| `POST /v/:vid/vote` `{code, optionId}` | `{ok}`. Final. Ballot is single-use |
| `GET /events/:vid` | server-sent events. Each `data: 1` means something changed, so refetch |

## Notes
- Voter IDs are 4 consonants (`VOTER_ID_LENGTH` to change), case-insensitive: `/kqzb` and `/KQZB` are the same vote.
- Set a password first. `PUT`, `state`, `auto-accept`, and `ballots/*` return `403 {needsPassword:true}` until `POST /manage/:mid/password` (6+ characters).
- `PUT` also takes `expected`, an optional number of voters.
- `GET /manage/:mid` returns `flags: [{type, text, at?}]` and `autoAccept`. Roll rows include `status`: `pending`, `accepted`, or `rejected`.
- A ballot's code is generated only at accept time (or immediately, if auto-accept is on) and is discarded the moment `/ballot/claim` hands it back — it is never stored longer than that gap.
- Votes delete themselves `VOTE_TTL_DAYS` (default 7, 0 = never) after creation. `expiresAt` says when.
