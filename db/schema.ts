// Schema is idempotent. No participant data is included in the exported project.
export const schema = [
 `CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, data TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS invitations (hash TEXT PRIMARY KEY, created_at TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS responses (
   id TEXT PRIMARY KEY, invite_hash TEXT NOT NULL REFERENCES invitations(hash),
   municipality TEXT NOT NULL, votes_in_varzea_da_palma INTEGER CHECK(votes_in_varzea_da_palma IN (0,1)), choices TEXT NOT NULL, created_at TEXT NOT NULL,
   consent_version TEXT NOT NULL)`,
 `CREATE UNIQUE INDEX IF NOT EXISTS responses_invitation_unique ON responses(invite_hash)`,
 `CREATE TABLE IF NOT EXISTS auth_attempts (id TEXT PRIMARY KEY, window_start INTEGER NOT NULL, attempts INTEGER NOT NULL)`
];
