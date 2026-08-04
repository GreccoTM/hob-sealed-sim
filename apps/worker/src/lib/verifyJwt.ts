import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

let cachedJwks: { url: string; keySet: JWTVerifyGetKey } | null = null;

function getJwks(supabaseUrl: string): JWTVerifyGetKey {
  if (cachedJwks?.url !== supabaseUrl) {
    cachedJwks = {
      url: supabaseUrl,
      keySet: createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)),
    };
  }
  return cachedJwks.keySet;
}

export interface AuthUser {
  id: string;
  email?: string;
}

/** Verifica o JWT localmente contra o JWKS público do Supabase (ES256) — sem segredo compartilhado. */
export async function verifyAuth(request: Request, supabaseUrl: string): Promise<AuthUser | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);

  try {
    const { payload } = await jwtVerify(token, getJwks(supabaseUrl), {
      issuer: `${supabaseUrl}/auth/v1`,
    });
    if (typeof payload.sub !== "string") return null;
    return { id: payload.sub, email: typeof payload.email === "string" ? payload.email : undefined };
  } catch {
    return null;
  }
}
