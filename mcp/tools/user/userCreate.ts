import db from "./../../../src/lib/server/prisma";
import { log } from "./../../utils/log";

export const userCreate = async function (args = {}) {
  log("info", "try to create the user!");

  const user = await db.user.create({
    data: {
      email: args.email.toLowerCase().trim(),
      name: args.name?.trim() || null,
    },
  });

  return {
    content: [
      {
        type: "text",
        text: `Created user: ${user.name || user.email}, Email: ${
          user.email
        }, ID: ${user.id}`,
      },
    ],
  };
};
