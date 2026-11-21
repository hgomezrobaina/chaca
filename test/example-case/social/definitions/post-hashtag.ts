import { chaca, modules } from "../../../../src";

const MAX_HASHTAGS_PER_POST = 5;

/**
 * `post_id` runs once per candidate post (500) and `hashtag_id` once per
 * candidate hashtag (60) for every one of the 800 `PostHashtag` documents.
 * The per-post count and the already-used hashtags only change between
 * documents, so both are cached per document count (same lesson as the
 * airline `FlightCrew`, banking `LoanInstallment` and this case's own
 * `Follow`/`Reaction` fixes).
 */
let cachedPostHashtagCount = -1;
let cachedCountByPost: Map<string, number> | null = null;
let cachedHashtagsByPost: Map<string, Set<string>> | null = null;

const refreshCaches = (
  postHashtagsSoFar: { post_id?: string; hashtag_id?: string }[],
) => {
  const countByPost = new Map<string, number>();
  const hashtagsByPost = new Map<string, Set<string>>();

  for (const postHashtag of postHashtagsSoFar) {
    if (postHashtag.post_id === undefined) {
      continue;
    }

    countByPost.set(
      postHashtag.post_id,
      (countByPost.get(postHashtag.post_id) ?? 0) + 1,
    );

    if (postHashtag.hashtag_id !== undefined) {
      const hashtags =
        hashtagsByPost.get(postHashtag.post_id) ?? new Set<string>();

      hashtags.add(postHashtag.hashtag_id);
      hashtagsByPost.set(postHashtag.post_id, hashtags);
    }
  }

  cachedCountByPost = countByPost;
  cachedHashtagsByPost = hashtagsByPost;
  cachedPostHashtagCount = postHashtagsSoFar.length;
};

export const POST_HASHTAG_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  post_id: chaca.ref("Post.id", {
    where: ({ refFields, store }) => {
      const postHashtagsSoFar = store.currentDocuments();

      if (
        cachedCountByPost === null ||
        cachedPostHashtagCount !== postHashtagsSoFar.length
      ) {
        refreshCaches(postHashtagsSoFar);
      }

      const assigned = cachedCountByPost?.get(refFields.id) ?? 0;

      return assigned < MAX_HASHTAGS_PER_POST;
    },
  }),
  hashtag_id: chaca.ref("Hashtag.id", {
    where: ({ refFields, currentFields, store }) => {
      const postHashtagsSoFar = store.currentDocuments();

      if (
        cachedHashtagsByPost === null ||
        cachedPostHashtagCount !== postHashtagsSoFar.length
      ) {
        refreshCaches(postHashtagsSoFar);
      }

      const used = cachedHashtagsByPost?.get(currentFields.post_id);

      return !(used?.has(refFields.id) ?? false);
    },
  }),
});
