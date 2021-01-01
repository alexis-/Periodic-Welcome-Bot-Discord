import { Client } from "@typeit/discord";

export {};

declare global {
  interface WBConfigDb {
    engine: string;
    storage: string;
    user: string;
    password: string;
    host: string;
    database: string;
  }

  interface WBConfig {
    discordToken: string;
    db: WBConfigDb;
  }

  namespace NodeJS {
    interface Global {
       cfg: WBConfig;
       botInitialized: boolean | undefined;
       client: Client;
    }
  }

  interface WBDbServer {
    id: number;
    lastReadMessage: number;
    hourlyPeriod: number;
    message: string;
  }

  class WBDb {
    servers: WBDbServer[];
  }
}
