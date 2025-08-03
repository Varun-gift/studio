import { NextResponse } from 'next/server';

async function getFleetopToken(baseUrl: string) {
  const tokenResponse = await fetch(`${baseUrl}/api/fleetop/token`, {
    cache: 'no-store', // Ensure we always get a fresh token if needed
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to fetch Fleetop token');
  }
  const tokenData = await tokenResponse.json();
  return tokenData.usertoken;
}

export async function POST(req: Request) {
  try {
    const { start_date_time, end_date_time, imei_nos } = await req.json();

    if (!start_date_time || !end_date_time || !imei_nos) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const absoluteUrl = new URL(req.url);
    const baseUrl = absoluteUrl.origin;
    
    const token = await getFleetopToken(baseUrl);
    
    const response = await fetch("http://43.204.86.252/ReportServices/customreports/getIgnitionSummary", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        start_date_time,
        end_date_time,
        imei_nos
      }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Ignition summary fetch failed with status: ' + response.status }));
        console.error("Ignition summary fetch failed:", errorData);
        return NextResponse.json({ error: "Ignition summary fetch failed" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Internal server error fetching ignition summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
