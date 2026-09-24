# vote-min
One question, one ballot each. No accounts, no cookies, no device data. Public API: see API.md.

    cd backend  && npm install && MONGO_URL=mongodb://... VOTE_MIN_SECRET=$(openssl rand -hex 32) npm start
    cd frontend && npm install && npm run dev        # set API=http://host:4000 if the backend is elsewhere

Backend env: MONGO_URL, MONGO_DB (vote-min), VOTE_MIN_SECRET (signs manage tokens), PORT (4000),
HOST (127.0.0.1; put TLS and a reverse proxy in front for public use), CORS_ORIGIN (*).

Stored, in one MongoDB document per vote: question, answers, a count per answer, each identifier that
requested a ballot (voted or not, request counts), a hash of its live ballot code, and a password hash if set.
No choice is stored against a ballot. Not stored: cookies, IPs, fingerprints, access logs.
Deleting a vote deletes that document immediately. MongoDB does not overwrite deleted data on disk, and
server backups or a replica-set oplog may still hold it, so those are outside this app's control.

More env: VOTER_ID_LENGTH (4), VOTE_TTL_DAYS (7; 0 disables auto-delete).
Also stored: counts of unusual activity (wrong password attempts, bursts of new names).
