import { TextChannel, Client, User, Message, Collection } from "discord.js";

export default {
  async fetchAllMessagesSince(c: TextChannel, since: string) {
    const limit = 100;
    const allMsgArr: Collection<string, Message>[] = []
    let count = 0;

    do {
      const fetchedMsg = await c.messages.fetch({
        after: since,
        limit: limit
      });

      allMsgArr.push(fetchedMsg);

      count = fetchedMsg.size;
      since = fetchedMsg.firstKey() ?? '';
    } while (count >= limit);

    const allMsg = new Collection<string, Message>();

    return allMsg.concat(...allMsgArr);
  },
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
  getIdsFromMessageMentionText(msg: string): { s: string, c: string, m: string } | null {
    if (!msg) {
      console.error('getMessageIdFromText: invalid value for mgs');
      return null;
    }

    // https://discord.com/channels/673071773700587521/673071774438522907/674901990794330113
    const matches = msg.match(/https:\/\/discord.com\/channels\/([\d]+)\/([\d]+)\/([\d]+)/);

    if (!matches) return null;
    
    return {
      s: matches[1],
      c: matches[2],
      m: matches[3]
    };
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