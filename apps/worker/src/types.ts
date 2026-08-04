export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  MATCH_ROOM: DurableObjectNamespace;
  CARD_IMAGES: R2Bucket;
}
