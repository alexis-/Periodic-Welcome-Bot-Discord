import { TextChannel, Client, User } from "discord.js";

export default {
  splitMessageWithinLimit(msg: string): string[] {
    const msgArr: string[] = [];

    while (msg.length > 2000) {
      const lIdx = msg.lastIndexOf(' ', 1999);

      msgArr.push(msg.substring(0, lIdx).trim());
      msg = msg.substring(lIdx + 1);
    }

    msgArr.push(msg.trim());

    return msgArr;
  },
  getUserFromText(msg: string, client: Client): User | null {
    if (!msg || !client) {
      console.error('getUserFromText: invalid value for mgs or client');
      return null;
    }

    // The id is the first and only match found by the RegEx.
    const matches = msg.match(/^<@!?(\d+)>$/);
  
    // If supplied variable was not a mention, matches will be null instead of an array.
    if (!matches) return null;
  
    const id = matches[1];
  
    return client.users.cache.get(id) ?? null;
  },  
  findChannelFromText(msg: string, client: Client): TextChannel | null {
    if (!msg || !client) {
      console.error('findChannelFromText: invalid value for mgs or client');
      return null;
    }

    // The id is the first and only match found by the RegEx.
    const matches = msg.match(/^<#(\d+)>$/);
  
    // If supplied variable was not a mention, matches will be null instead of an array.
    if (!matches) return null;
  
    const id = matches[1];

    return client.channels.cache.get(id) as TextChannel ?? null;
  }
}