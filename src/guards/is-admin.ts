import { GuardFunction } from "@typeit/discord";

const isAdmin: GuardFunction<"message"> = async (
  [message],
  client,
  next
) => {
  if (message.member?.hasPermission('ADMINISTRATOR', { checkAdmin: true, checkOwner: true })) {
    await next();
  }
}

export default isAdmin;