# Social case

A social network: users follow each other, post, comment in threads,
react, tag posts, and message each other directly.

This is the case that proves two things no other case does: a
self-referential M:N relationship (`Follow`, a user following other
users) and a recursive tree (`Comment`, a comment replying to another
comment of the same post), plus a second join table with a unique pair
(`PostHashtag`).

## Entities

| Entity          | Documents            | Description                                                            |
| --------------- | --------------------- | ------------------------------------------------------------------------ |
| `User`          | 200                   | `username` is a unique sequence; `private` is a plain probability field (25% private). |
| `Follow`        | 700                   | A user following another; never the same user on both ends, never repeated. |
| `Post`          | 500                   | Belongs to a `User`; `created_at` on or after the author's.            |
| `Comment`       | 900                   | Belongs to a `Post`; optionally replies to another `Comment` of the **same** post, up to 3 levels deep. |
| `Reaction`      | 1200                  | A (user, post) pair reacts at most once.                                |
| `Hashtag`       | 60                    | `tag` is one of 60 literal hashtags, each exactly once.                 |
| `PostHashtag`   | 800                   | A (post, hashtag) pair, at most 5 hashtags per post.                    |
| `DirectMessage` | 600                   | Between two different users; `read_at` only after `sent_at`.            |

## Schema

See [schema.md](./schema.md) for the full ER diagram, a field-by-field table per entity and the rule table — generated from the schema definitions, never hand-written. It's also the proof that the diagram generator draws a self-reference correctly: `Comment |o--o{ Comment : parent_comment_id` and the two separate `User → Follow` lines (`follower_id`, `followed_id`).

## Business rules

Every rule below has its own assertion in [rules.ts](rules.ts) (the full, field-level list is the generated "Rules" table in [schema.md](./schema.md)).

1. **Follow has no self-loops or duplicate edges** (`Follow.follower_id`, `.followed_id`): rejects the follower itself and any (follower, followed) pair already recorded; the already-followed set is cached per document for performance — the same lesson the airline `FlightCrew` and banking `LoanInstallment` fixes apply, needed here because the ref's `where` runs once per candidate user (200) for every one of the 700 documents.
2. **Comment is a self-referencing, cycle-free, depth-capped tree** (`Comment.parent_comment_id`, `.post_id`, `.depth`): `parent_comment_id` is a self-referencing `chaca.ref("Comment.id", ...)` (chaca's `refItSelf` case); its `where` only accepts a **same-post** candidate whose own `depth` is less than 2, so a child's `depth` (`parent.depth + 1`) never exceeds 2 — a 3-level tree (0, 1, 2) by construction; `nullOnEmpty: true` covers a post's first comment, which has no eligible parent yet. The parent chain never cycles back on itself (walked all the way to the root).
3. **Reaction is unique per (user, post)** (`Reaction.user_id`, `.post_id`): `post_id`'s `where` rejects a post the same user already reacted to (same per-document cache pattern as `Follow`).
4. **PostHashtag caps and deduplicates** (`PostHashtag.post_id`, `.hashtag_id`): `post_id`'s `where` caps a post at 5 hashtags; `hashtag_id`'s `where` rejects a hashtag already attached to that post.
5. **DirectMessage has no self-messages** (`DirectMessage.sender_id`, `.recipient_id`, `.read_at`, `.sent_at`): `recipient_id`'s `where` rejects the sender itself; `read_at`, when present, is after `sent_at`.
6. **Natural keys are unique** (`User.username`, `Hashtag.tag`): each is globally unique.
7. **The date chain is non-decreasing** (`User.created_at`, `Post.created_at`, `.edited_at`, `Comment.created_at`, `Reaction.created_at`): user → post → comment/reaction never goes backwards in time, and a post's `edited_at`, when present, is after its own `created_at`.
