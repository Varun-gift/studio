import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const TOKEN_URL = 'http://43.204.86.252/ReportServices/config/usertoken';
const DATA_URL = 'http://43.204.86.252/ReportServices/customapi/ignitionsummaryreport?user_api_config_id=370';
const USERNAME = 'ashikmobilegenerators@gmail.com'; // **REPLACE WITH YOUR ACTUAL USERNAME**
const PASSWORD = 'Amg@1234'; // **REPLACE WITH YOUR ACTUAL PASSWORD**

interface IgnitionSummaryData {
  no_of_times_on: number;
  Current_Status: string;
  DG_Name: string;
  Engine_ON_hours: string;
}

interface FleetopResponse {
  data: IgnitionSummaryData[];
  message: string;
  status: string;
}

const useFleetopApi = () => {
  const [token, setToken] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null);
  const [data, setData] = useState<IgnitionSummaryData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateToken = useCallback(async () => {
 setToken(null); // Clear token while generating
 setTokenExpiry(null);
    try {
      const response = await axios.post(TOKEN_URL, {
        username: USERNAME,
        password: PASSWORD,
      });
      const newToken = response.data.auth_token;
      setToken(newToken);
      setTokenExpiry(Date.now() + 30 * 60 * 1000); // Set expiry to 30 minutes from now
    } catch (err) {
      console.error('Error generating token:', err);
      setError('Failed to generate API token.');
      setToken(null);
      setTokenExpiry(null);
    }
  }, []);

  useEffect(() => {
    // Generate token immediately on mount
    generateToken();

    // Set interval to regenerate token before expiry
    const tokenRefreshInterval = setInterval(() => {
      if (tokenExpiry && Date.now() >= tokenExpiry - 5 * 60 * 1000) { // Refresh 5 minutes before expiry
        generateToken();
      }
    }, 60 * 1000); // Check every minute
    return () => clearInterval(tokenRefreshInterval);
  }, [generateToken]); // Dependency on generateToken to avoid re-creating interval
  const fetchIgnitionSummary = useCallback(async (startDate: string, endDate: string, imei: string) => {
    if (!token) {
      // Token is missing or expired, generate a new one and wait
      await generateToken(); // Try generating token before fetching
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.post<FleetopResponse>(DATA_URL, { // Changed to POST as per API docs
        start_date_time: startDate,
        end_date_time: endDate,
        imei_nos: imei,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.status === 'success') {
        setData(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch ignition summary.');
        setData(null);
      }
    } catch (err) {
      console.error('Error fetching ignition summary:', err);
      setError('Failed to fetch ignition summary data.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, generateToken]); // Include generateToken in dependencies

  return {
    data,
    loading,
    error,
    fetchIgnitionSummary,
  };
};

export default useFleetopApi;