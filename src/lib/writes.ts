/**
 * Did the write actually change anything?
 *
 * PostgREST does not treat "no rows matched" as an error, and under row-level
 * security that is the ordinary shape of a refusal: the policy filters the row
 * out, the statement affects nothing, and the response is a perfectly happy
 * empty list. A client that only checks `error` reports success, navigates
 * away, and leaves the user believing something happened that did not.
 *
 * This has now been the cause of three separate bugs in this app — a username
 * that silently failed to save (0002's set_username), a shared habit that
 * silently failed to delete, and a group rename available to anyone who typed
 * the URL — so it gets a name and a test rather than a fourth rediscovery.
 *
 * The rule for using it: call it wherever a no-op means the user's intent was
 * NOT achieved. Do not call it where a no-op and a success reach the same end
 * state — deleting a check-in, a reaction or a task completion that is already
 * gone is not a failure, it is the thing the person asked for, and raising
 * there would turn a double tap into an error message.
 */
export function assertChanged<T>(rows: T[] | null, message: string): T[] {
  if (!rows || rows.length === 0) throw new Error(message);
  return rows;
}
