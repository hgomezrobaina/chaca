import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";

const MAX_PARENT_DEPTH = 2;

export const COMMENT_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  post_id: chaca.ref("Post.id"),
  author_id: chaca.ref("User.id"),
  parent_comment_id: {
    type: chaca.ref("Comment.id", {
      nullOnEmpty: true,
      where: ({ refFields, currentFields }) => {
        return (
          refFields.post_id === currentFields.post_id &&
          refFields.depth < MAX_PARENT_DEPTH
        );
      },
    }),
    possibleNull: 0.5,
  },
  depth: ({ currentFields, store }) => {
    if (currentFields.parent_comment_id === null) {
      return 0;
    }

    const parent = FindRef.execute({
      documents: store.currentDocuments(),
      id: currentFields.parent_comment_id,
      from: "Comment.parent_comment_id",
    });

    return parent.depth + 1;
  },
  body: () => modules.lorem.sentence(),
  created_at: async ({ currentFields, store }) => {
    const posts = await store.get("Post");
    const post = FindRef.execute({
      documents: posts,
      id: currentFields.post_id,
      from: "Comment.post_id",
    });

    if (currentFields.parent_comment_id === null) {
      return modules.date.between({ from: post.created_at, to: new Date() });
    }

    const parent = FindRef.execute({
      documents: store.currentDocuments(),
      id: currentFields.parent_comment_id,
      from: "Comment.parent_comment_id",
    });

    return modules.date.between({ from: parent.created_at, to: new Date() });
  },
});
