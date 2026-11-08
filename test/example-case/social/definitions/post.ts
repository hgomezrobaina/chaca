import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import { PostVisibility } from "../types";

export const POST_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  author_id: chaca.ref("User.id"),
  body: () => modules.lorem.paragraph(),
  visibility: chaca.probability([
    { value: PostVisibility.Public, chance: 0.7 },
    { value: PostVisibility.Followers, chance: 0.25 },
    { value: PostVisibility.Private, chance: 0.05 },
  ]),
  created_at: async ({ currentFields, store }) => {
    const users = await store.get("User");
    const author = FindRef.execute({
      documents: users,
      id: currentFields.author_id,
      from: "Post.author_id",
    });

    return modules.date.between({ from: author.created_at, to: new Date() });
  },
  edited_at: {
    type: ({ currentFields }) => {
      return modules.date.between({
        from: currentFields.created_at,
        to: new Date(),
      });
    },
    possibleNull: 0.6,
  },
});
