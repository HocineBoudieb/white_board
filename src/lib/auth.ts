import { jwtVerify, createRemoteJWKSet } from 'jose';
import { cookies } from 'next/headers';

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Initialize the JWK Set (Public Keys) from Google
// This handles caching and refreshing of keys automatically
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

export async function verifyIdToken(token: string) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
      algorithms: ['RS256'],
    });
    return payload;
  } catch (error) {
    // console.error('Token verification failed:', error);
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  
  if (!session) return null;
  
  const payload = await verifyIdToken(session);
  return payload;
}

export async function getUid() {
  const session = await getSession();
  return session ? (session.sub as string) : null;
}
