import { GuardFunction } from "@typeit/discord";

const isSuperAdmin: GuardFunction<"message"> = async (
  [message],
  client,
  next
) => {
  if (global.cfg.superAdmins.includes(message.author.id)) {
    await next();
  }
}

export default isSuperAdmin;