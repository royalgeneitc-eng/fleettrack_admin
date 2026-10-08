import 'server-only';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from './session';
import type { SessionUser } from './types';

/** Sets the web cookie AND returns the token in the body for the Android app. */
export async function sessionResponse(user: SessionUser) {
  const token = await signSession(user.id);
  const res = NextResponse.json({ token, user });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
