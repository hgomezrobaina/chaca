import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";

/**
 * `followed_id`'s `where` runs once per candidate user (200 of them) for
 * every one of the 700 `Follow` documents: 140,000 calls. The set of
 * already-followed pairs only changes between documents, not between
 * candidates of the same one, so it's cached per document count (same
 * lesson as the airline `FlightCrew` and banking `LoanInstallment` fixes).
 */
let cachedFollowCount = -1;
let cachedFollowedByFollower: Map<string, Set<string>> | null = null;

export const FOLLOW_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  follower_id: chaca.ref("User.id"),
  followed_id: chaca.ref("User.id", {
    where: ({ refFields, currentFields, store }) => {
      if (refFields.id === currentFields.follower_id) {
        return false;
      }

      const followsSoFar = store.currentDocuments();

      if (
        cachedFollowedByFollower === null ||
        cachedFollowCount !== followsSoFar.length
      ) {
        const map = new Map<string, Set<string>>();

        for (const follow of followsSoFar) {
          if (follow.followed_id === undefined) {
            continue;
          }

          const followed = map.get(follow.follower_id) ?? new Set<string>();

          followed.add(follow.followed_id);
          map.set(follow.follower_id, followed);
        }

        cachedFollowedByFollower = map;
        cachedFollowCount = followsSoFar.length;
      }

      const alreadyFollowed = cachedFollowedByFollower.get(
        currentFields.follower_id,
      );

      return !(alreadyFollowed?.has(refFields.id) ?? false);
    },
  }),
  created_at: async ({ currentFields, store }) => {
    const users = await store.get("User");
    const follower = FindRef.execute({
      documents: users,
      id: currentFields.follower_id,
      from: "Follow.follower_id",
    });
    const followed = FindRef.execute({
      documents: users,
      id: currentFields.followed_id,
      from: "Follow.followed_id",
    });

    const from = new Date(
      Math.max(follower.created_at.getTime(), followed.created_at.getTime()),
    );

    return modules.date.between({ from, to: new Date() });
  },
});
