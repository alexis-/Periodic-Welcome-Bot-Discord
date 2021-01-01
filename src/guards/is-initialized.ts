import { GuardFunction } from "@typeit/discord";

const isInitialized: GuardFunction<"message"> = async (
  [message],
  client,
  next
) => {
  if (global.botInitialized) {
    await next();
  }
}

export default isInitialized;