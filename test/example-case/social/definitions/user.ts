import { chaca, modules } from "../../../../src";

export const USER_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  username: ({ store }) => {
    return `user_${store.currentDocuments().length + 1}`;
  },
  email: () => modules.internet.email(),
  display_name: () => modules.person.fullName(),
  bio: { type: () => modules.lorem.sentence(), possibleNull: 0.4 },
  private: chaca.probability([
    { value: true, chance: 0.25 },
    { value: false, chance: 0.75 },
  ]),
  created_at: () => modules.date.past({ years: 5 }),
});
