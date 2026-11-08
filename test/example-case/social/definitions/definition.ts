import { DatasetSchema } from "../../../../src";
import { COMMENT_SCHEMA } from "./comment";
import { DIRECT_MESSAGE_SCHEMA } from "./direct-message";
import { FOLLOW_SCHEMA } from "./follow";
import { HASHTAG_SCHEMA } from "./hashtag";
import { POST_SCHEMA } from "./post";
import { POST_HASHTAG_SCHEMA } from "./post-hashtag";
import { REACTION_SCHEMA } from "./reaction";
import { USER_SCHEMA } from "./user";

export const SOCIAL_SCHEMAS: DatasetSchema[] = [
  { documents: 200, name: "User", schema: USER_SCHEMA },
  { documents: 700, name: "Follow", schema: FOLLOW_SCHEMA },
  { documents: 500, name: "Post", schema: POST_SCHEMA },
  { documents: 900, name: "Comment", schema: COMMENT_SCHEMA },
  { documents: 1200, name: "Reaction", schema: REACTION_SCHEMA },
  { documents: 60, name: "Hashtag", schema: HASHTAG_SCHEMA },
  { documents: 800, name: "PostHashtag", schema: POST_HASHTAG_SCHEMA },
  { documents: 600, name: "DirectMessage", schema: DIRECT_MESSAGE_SCHEMA },
];
