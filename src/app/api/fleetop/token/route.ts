import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch("http://43.204.86.252/ReportServices/config/usertoken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "ashikmobilegenerators@gmail.com",
        password: "Amg@1234"
      }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Token fetch failed with status: ' + response.status }));
        console.error("Token fetch failed:", errorData);
        return NextResponse.json({ error: "Token fetch failed" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Internal server error fetching token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
