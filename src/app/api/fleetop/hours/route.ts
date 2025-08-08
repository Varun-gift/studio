
import { NextResponse } from 'next/server';
import { format, subDays } from 'date-fns';

async function getFleetopToken(baseUrl: string) {
  const tokenResponse = await fetch(`${baseUrl}/api/fleetop/token`, {
    cache: 'no-store', 
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to fetch Fleetop token');
  }
  const tokenData = await tokenResponse.json();
  return tokenData.usertoken;
}

export async function POST(req: Request) {
  try {
    const { imei, start, end } = await req.json();

    if (!imei) {
      return NextResponse.json({ error: 'Missing required parameter: imei' }, { status: 400 });
    }

    const absoluteUrl = new URL(req.url);
    const baseUrl = absoluteUrl.origin;
    
    const token = await getFleetopToken(baseUrl);
    
    // Default to yesterday and today if start/end dates are not provided
    const startDate = start ? new Date(start) : subDays(new Date(), 1);
    const endDate = end ? new Date(end) : new Date();
    
    const start_date_time = format(startDate, 'dd-MM-yyyy 00:00:00');
    const end_date_time = format(endDate, 'dd-MM-yyyy 23:59:59');

    const response = await fetch("http://43.204.86.252/ReportServices/customapi/ignitionsummaryreport?user_api_config_id=370", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        start_date_time,
        end_date_time,
        imei_nos: imei
      }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Engine hours fetch failed with status: ' + response.status }));
        console.error("Engine hours fetch failed:", errorData);
        return NextResponse.json({ error: "Engine hours fetch failed" }, { status: response.status });
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
        // Assuming the first record is the one we want
        const summary = data.data[0];
        return NextResponse.json({ engineOnHours: summary.Engine_ON_hours });
    }
    
    return NextResponse.json({ engineOnHours: "N/A" });

  } catch (error) {
    console.error('Internal server error fetching engine hours:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
