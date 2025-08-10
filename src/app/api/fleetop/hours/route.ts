import { NextResponse } from 'next/server';
import { format, subMinutes } from 'date-fns';

async function getFleetopToken() {
  const tokenResponse = await fetch(
    "http://43.204.86.252/ReportServices/config/usertoken",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: 'no-store',
      body: JSON.stringify({
        username: "ashikmobilegenerators@gmail.com",
        password: "Amg@1234",
      }),
    }
  );

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    console.error("Failed to fetch Fleetop token:", errorBody);
    throw new Error('Failed to fetch Fleetop token');
  }

  const tokenData = await tokenResponse.json();
  const token = tokenData.auth_token || tokenData.token || tokenData.usertoken;

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
      return NextResponse.json(
        { error: 'Missing required parameter: imei' },
        { status: 400 }
      );
    }

    const token = await getFleetopToken();

    const fleetopFormat = 'dd-MM-yyyy HH:mm:ss';

    // Default to last 5 minutes if no start/end provided
    const endDate = end ? new Date(end) : new Date();
    const startDate = start
      ? new Date(start)
      : subMinutes(endDate, 5);

    const start_date_time = format(startDate, fleetopFormat);
    const end_date_time = format(endDate, fleetopFormat);

    console.log(`Fetching Fleetop data for IMEI ${imei} from ${start_date_time} to ${end_date_time}`);

    const response = await fetch(
      "http://43.204.86.252/ReportServices/customapi/ignitionsummaryreport?user_api_config_id=370",
      {
        method: "POST",
        cache: 'no-store',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          start_date_time,
          end_date_time,
          imei_nos: String(imei),
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Engine hours fetch failed:", errorData);
      return NextResponse.json(
        { error: "Engine hours fetch failed", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status === "success" && data.data?.length > 0) {
      const summary = data.data[0];
      return NextResponse.json({
        engineOnHours: summary.Engine_ON_hours,
        currentStatus: summary.Current_Status,
        dgName: summary.DG_Name,
        noOfTimesOn: summary.no_of_times_on,
      });
    }

    return NextResponse.json(
      { error: "No ignition data" },
      { status: 404 }
    );

  } catch (error: any) {
    console.error('Internal server error fetching engine hours:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
