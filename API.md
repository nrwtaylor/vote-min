# vote-min API v1
Base path is `/v1` on the backend directly (e.g. `http://127.0.0.1:4000/v1`). Behind this deployment's nginx,
the public base is `https://stackr.ca/api/cyanibex/v1`. JSON in and out. Errors are `{"error": "..."}`.
CORS is open; there are no cookies. States run one way: draft, published, open, closed. Question and answers
lock when a vote opens.

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
| `POST /manage/:mid/password` `{password}` | `{token}`; old tokens stop working |
| `POST /manage/:mid/unlock` `{password}` | `{token}`, valid 24h; wrong guesses back off 1s, 2s, 4s... per vote |
| `DELETE /manage/:mid` | deletes the vote, every ballot and every count |

## Voter
| Call | Result |
|---|---|
| `GET /v/:vid` | `{state, idLabel}`, plus `question` and `results` once closed. 404 while draft or after delete |
| `POST /v/:vid/ballot` `{identifier}` | `{code, question, options:[{id,text}]}`. Asking again cancels the earlier unused ballot. 409 if that identifier already voted |
| `POST /v/:vid/vote` `{code, optionId}` | `{ok}`. Final. Ballot is single-use |
| `GET /events/:vid` | server-sent events. Each `data: 1` means something changed, so refetch |

## Notes
- Voter IDs are 4 consonants (`VOTER_ID_LENGTH` to change), case-insensitive: `/kqzb` and `/KQZB` are the same vote.
- Set a password first. `PUT` and `state` return `403 {needsPassword:true}` until `POST /manage/:mid/password` (6+ characters).
- `PUT` also takes `expected`, an optional number of voters.
- `GET /manage/:mid` returns `flags: [{type, text, at?}]`. Types: `after-vote`, `repeat`, `lookalike`, `stuffing`, `burst`, `password`.
- Votes delete themselves `VOTE_TTL_DAYS` (default 7, 0 = never) after creation. `expiresAt` says when.
