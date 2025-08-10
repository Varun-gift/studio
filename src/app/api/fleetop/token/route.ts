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
      cache: 'no-store',
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error("Token fetch failed:", errorData);
        return NextResponse.json({ error: "Token fetch failed", details: errorData }, { status: response.status });
    }

    const data = await response.json();
    
    if (!data.usertoken) {
      console.error("'usertoken' not found in response", data);
      return NextResponse.json({ error: "'usertoken' field not found in Fleetop response" }, { status: 500 });
    }
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Internal server error fetching token:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
