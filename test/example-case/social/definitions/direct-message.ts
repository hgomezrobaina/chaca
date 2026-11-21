import { chaca, modules } from "../../../../src";

export const DIRECT_MESSAGE_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  sender_id: chaca.ref("User.id"),
  recipient_id: chaca.ref("User.id", {
    where: ({ refFields, currentFields }) => {
      return refFields.id !== currentFields.sender_id;
    },
  }),
  body: () => modules.lorem.sentence(),
  sent_at: () => modules.date.past({ years: 2 }),
  read_at: {
    type: ({ currentFields }) => {
      return modules.date.between({
        from: currentFields.sent_at,
        to: new Date(),
      });
    },
    possibleNull: 0.3,
  },
});
