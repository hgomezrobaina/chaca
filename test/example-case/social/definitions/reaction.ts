import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import { ReactionKind } from "../types";

/**
 * `post_id`'s `where` runs once per candidate post (500 of them) for every
 * one of the 1,200 `Reaction` documents: 600,000 calls. The set of
 * already-reacted-to posts only changes between documents, so it's cached
 * per document count (same lesson as the airline `FlightCrew`, banking
 * `LoanInstallment` and social `Follow` fixes).
 */
let cachedReactionCount = -1;
let cachedPostsByUser: Map<string, Set<string>> | null = null;

export const REACTION_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  user_id: chaca.ref("User.id"),
  post_id: chaca.ref("Post.id", {
    where: ({ refFields, currentFields, store }) => {
      const reactionsSoFar = store.currentDocuments();

      if (
        cachedPostsByUser === null ||
        cachedReactionCount !== reactionsSoFar.length
      ) {
        const map = new Map<string, Set<string>>();

        for (const reaction of reactionsSoFar) {
          if (reaction.post_id === undefined) {
            continue;
          }

          const posts = map.get(reaction.user_id) ?? new Set<string>();

          posts.add(reaction.post_id);
          map.set(reaction.user_id, posts);
        }

        cachedPostsByUser = map;
        cachedReactionCount = reactionsSoFar.length;
      }

      const alreadyReacted = cachedPostsByUser.get(currentFields.user_id);

      return !(alreadyReacted?.has(refFields.id) ?? false);
    },
  }),
  kind: chaca.probability([
    { value: ReactionKind.Like, chance: 0.7 },
    { value: ReactionKind.Love, chance: 0.15 },
    { value: ReactionKind.Laugh, chance: 0.1 },
    { value: ReactionKind.Angry, chance: 0.05 },
  ]),
  created_at: async ({ currentFields, store }) => {
    const posts = await store.get("Post");
    const post = FindRef.execute({
      documents: posts,
      id: currentFields.post_id,
      from: "Reaction.post_id",
    });

    return modules.date.between({ from: post.created_at, to: new Date() });
  },
});
