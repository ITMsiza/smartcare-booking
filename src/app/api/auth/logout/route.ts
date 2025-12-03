
import { NextResponse } from 'next/server';

export async function POST() {
  // Invalidate the session cookie by setting its maxAge to -1
  const options = {
    name: "session",
    value: "",
    maxAge: -1,
  };

  const response = NextResponse.json({ status: "success" }, { status: 200 });
  response.cookies.set(options);

  return response;
}
