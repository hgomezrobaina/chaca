import { expect } from "vitest";
import { CaseRule } from "../core/case-rule";
import { FindRef } from "../core/find-ref";
import { SocialDataset } from "./types";

const MAX_COMMENT_DEPTH = 2;
const MAX_HASHTAGS_PER_POST = 5;

export const SOCIAL_RULES: CaseRule<SocialDataset>[] = [
  {
    id: "R1",
    text: "No one follows themselves",
    fields: ["Follow.follower_id", "Follow.followed_id"],
    check: ({ Follow }) => {
      for (const follow of Follow) {
        expect(follow.followed_id).not.toBe(follow.follower_id);
      }
    },
  },
  {
    id: "R2",
    text: "The (follower, followed) pair never repeats",
    fields: ["Follow.follower_id", "Follow.followed_id"],
    check: ({ Follow }) => {
      for (const follow of Follow) {
        const same = Follow.filter((candidate) => {
          return (
            candidate.follower_id === follow.follower_id &&
            candidate.followed_id === follow.followed_id
          );
        });

        expect(same).toHaveLength(1);
      }
    },
  },
  {
    id: "R3",
    text: "A comment's parent, when present, belongs to the same post",
    fields: ["Comment.parent_comment_id", "Comment.post_id"],
    check: ({ Comment }) => {
      for (const comment of Comment) {
        if (comment.parent_comment_id !== null) {
          const parent = FindRef.execute({
            documents: Comment,
            id: comment.parent_comment_id,
            from: "Comment.parent_comment_id",
          });

          expect(parent.post_id).toBe(comment.post_id);
        }
      }
    },
  },
  {
    id: "R4",
    text: "A comment's depth matches the real depth of its parent chain",
    fields: ["Comment.depth", "Comment.parent_comment_id"],
    check: ({ Comment }) => {
      for (const comment of Comment) {
        let depth = 0;
        let current = comment;

        while (current.parent_comment_id !== null) {
          current = FindRef.execute({
            documents: Comment,
            id: current.parent_comment_id,
            from: "Comment.parent_comment_id",
          });
          depth++;
        }

        expect(comment.depth).toBe(depth);
      }
    },
  },
  {
    id: "R5",
    text: "No comment's depth exceeds 2 (a 3-level tree)",
    fields: ["Comment.depth"],
    check: ({ Comment }) => {
      for (const comment of Comment) {
        expect(comment.depth).toBeLessThanOrEqual(MAX_COMMENT_DEPTH);
      }
    },
  },
  {
    id: "R6",
    text: "The comment tree has no cycles",
    fields: ["Comment.parent_comment_id"],
    check: ({ Comment }) => {
      for (const comment of Comment) {
        const visited = new Set<string>([comment.id]);
        let current = comment;

        while (current.parent_comment_id !== null) {
          expect(visited.has(current.parent_comment_id)).toBe(false);

          current = FindRef.execute({
            documents: Comment,
            id: current.parent_comment_id,
            from: "Comment.parent_comment_id",
          });
          visited.add(current.id);
        }
      }
    },
  },
  {
    id: "R7",
    text: "A user reacts to a post at most once",
    fields: ["Reaction.user_id", "Reaction.post_id"],
    check: ({ Reaction }) => {
      for (const reaction of Reaction) {
        const same = Reaction.filter((candidate) => {
          return (
            candidate.user_id === reaction.user_id &&
            candidate.post_id === reaction.post_id
          );
        });

        expect(same).toHaveLength(1);
      }
    },
  },
  {
    id: "R8",
    text: "A post has at most 5 hashtags, none repeated",
    fields: ["PostHashtag.post_id", "PostHashtag.hashtag_id"],
    check: ({ Post, PostHashtag }) => {
      for (const post of Post) {
        const tags = PostHashtag.filter((postHashtag) => {
          return postHashtag.post_id === post.id;
        });

        expect(tags.length).toBeLessThanOrEqual(MAX_HASHTAGS_PER_POST);

        const hashtagIds = tags.map((tag) => tag.hashtag_id);

        expect(new Set(hashtagIds).size).toBe(hashtagIds.length);
      }
    },
  },
  {
    id: "R9",
    text: "No direct message is sent to oneself",
    fields: ["DirectMessage.sender_id", "DirectMessage.recipient_id"],
    check: ({ DirectMessage }) => {
      for (const message of DirectMessage) {
        expect(message.recipient_id).not.toBe(message.sender_id);
      }
    },
  },
  {
    id: "R10",
    text: "A direct message's read_at, when present, is after sent_at",
    fields: ["DirectMessage.read_at", "DirectMessage.sent_at"],
    check: ({ DirectMessage }) => {
      for (const message of DirectMessage) {
        if (message.read_at !== null) {
          expect(message.read_at.getTime()).toBeGreaterThanOrEqual(
            message.sent_at.getTime(),
          );
        }
      }
    },
  },
  {
    id: "R11",
    text: "Every user's username and every hashtag's tag are unique",
    fields: ["User.username", "Hashtag.tag"],
    check: ({ User, Hashtag }) => {
      const usernames = User.map((user) => user.username);

      expect(new Set(usernames).size).toBe(usernames.length);

      const tags = Hashtag.map((hashtag) => hashtag.tag);

      expect(new Set(tags).size).toBe(tags.length);
    },
  },
  {
    id: "R12",
    text: "The date chain user -> post -> comment -> reaction is non-decreasing",
    fields: [
      "User.created_at",
      "Post.author_id",
      "Post.created_at",
      "Comment.post_id",
      "Comment.created_at",
      "Reaction.post_id",
      "Reaction.created_at",
    ],
    check: ({ User, Post, Comment, Reaction }) => {
      for (const post of Post) {
        const author = FindRef.execute({
          documents: User,
          id: post.author_id,
          from: "Post.author_id",
        });

        expect(post.created_at.getTime()).toBeGreaterThanOrEqual(
          author.created_at.getTime(),
        );
      }

      for (const comment of Comment) {
        const post = FindRef.execute({
          documents: Post,
          id: comment.post_id,
          from: "Comment.post_id",
        });

        expect(comment.created_at.getTime()).toBeGreaterThanOrEqual(
          post.created_at.getTime(),
        );
      }

      for (const reaction of Reaction) {
        const post = FindRef.execute({
          documents: Post,
          id: reaction.post_id,
          from: "Reaction.post_id",
        });

        expect(reaction.created_at.getTime()).toBeGreaterThanOrEqual(
          post.created_at.getTime(),
        );
      }
    },
  },
  {
    id: "R13",
    text: "A post's edited_at, when present, is after created_at",
    fields: ["Post.edited_at", "Post.created_at"],
    check: ({ Post }) => {
      for (const post of Post) {
        if (post.edited_at !== null) {
          expect(post.edited_at.getTime()).toBeGreaterThanOrEqual(
            post.created_at.getTime(),
          );
        }
      }
    },
  },
];
