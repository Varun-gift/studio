
import { NextResponse } from 'next/server';
import { format, subDays } from 'date-fns';

async function getFleetopToken() {
  const tokenResponse = await fetch("http://43.204.86.252/ReportServices/config/usertoken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: 'no-store',
    body: JSON.stringify({
      username: "ashikmobilegenerators@gmail.com",
      password: "Amg@1234"
    }),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    console.error("Failed to fetch Fleetop token:", errorBody);
    throw new Error('Failed to fetch Fleetop token');
  }

  const tokenData = await tokenResponse.json();
  // According to the documentation, the key is 'usertoken'
  const token = tokenData.usertoken;
  
  if (!token) {
      console.error("Token not found in Fleetop response:", tokenData);
      throw new Error("Token not found in Fleetop response");
  }

  return token;
}

export async function POST(req: Request) {
  try {
    const { imei, start, end } = await req.json();

    if (!imei) {
      return NextResponse.json({ error: 'Missing required parameter: imei' }, { status: 400 });
    }
    
    const token = await getFleetopToken();
    
    // Fleetop expects "dd-MM-yyyy HH:mm:ss" format.
    const fleetopFormat = 'dd-MM-yyyy HH:mm:ss';

    // Default to the last 24 hours if start/end dates are not provided
    const startDate = start ? new Date(start) : subDays(new Date(), 1);
    const endDate = end ? new Date(end) : new Date();
    
    const start_date_time = format(startDate, fleetopFormat);
    const end_date_time = format(endDate, fleetopFormat);

    const response = await fetch("http://43.204.86.252/ReportServices/customapi/ignitionsummaryreport?user_api_config_id=370", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        start_date_time,
        end_date_time,
        imei_nos: String(imei) // Ensure imei is a string
      }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error("Engine hours fetch failed:", errorData);
        return NextResponse.json({ error: "Engine hours fetch failed", details: errorData }, { status: response.status });
    }

    const data = await response.json();

    // Check for success status and if data exists
    if (data.status === "success" && data.data && data.data.length > 0) {
        const summary = data.data[0];
        return NextResponse.json({ engineOnHours: summary.Engine_ON_hours });
    }
    
    // Handle cases where Fleetop returns success but no data for the period
    return NextResponse.json({ error: "No ignition data" }, { status: 404 });

  } catch (error: any) {
    console.error('Internal server error fetching engine hours:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
