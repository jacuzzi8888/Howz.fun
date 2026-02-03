import { type Config } from "drizzle-kit";

// Supabase Pooler Connection (IPv4 compatible)
const DATABASE_URL = "postgresql://postgres.zogrywzfggwdoozenhta:goneycombA1*@aws-1-eu-west-1.pooler.supabase.com:5432/postgres";

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
  tablesFilter: ["house-fun-app_*"],
} satisfies Config;
