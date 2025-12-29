import { createBrowserClient } from "@supabase/ssr";

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // Singleton pattern for client-side to avoid multiple instances
  if (typeof window !== "undefined" && clientInstance) {
    return clientInstance;
  }

  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (typeof window !== "undefined") {
    clientInstance = client;
  }

  return client;
}
