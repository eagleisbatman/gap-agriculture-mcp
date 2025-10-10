import fetch from 'node-fetch';

export interface GAPMeasurementParams {
  lat: number;
  lon: number;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  product: 'cbam_historical_analysis' | 'salient_seasonal_forecast';
  attributes: string; // comma-separated
  output_type: 'json';
}

export interface GAPDataPoint {
  datetime: string;
  [key: string]: number | string; // dynamic attributes like max_temperature, min_temperature, etc.
}

export interface GAPRawResponse {
  metadata: any;
  results: Array<{
    geometry: {
      type: string;
      coordinates: number[];
    };
    data: GAPDataPoint[];
  }>;
}

export interface GAPMeasurementResult {
  date: string;
  lat: number;
  lon: number;
  [key: string]: number | string; // dynamic attributes
}

export interface GAPResponse {
  results: GAPMeasurementResult[];
  count: number;
  next: string | null;
  previous: string | null;
}

export class GAPClient {
  private apiToken: string;
  private baseUrl: string;

  constructor(apiToken: string, baseUrl: string = 'https://gap.tomorrownow.org/api/v1') {
    this.apiToken = apiToken;
    this.baseUrl = baseUrl;
  }

  async getMeasurement(params: GAPMeasurementParams): Promise<GAPResponse> {
    const url = new URL(`${this.baseUrl}/measurement/`);

    // Add all params to URL
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });

    console.log(`[GAP API] Fetching: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Token ${this.apiToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GAP API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const rawData = await response.json() as GAPRawResponse;

    // Transform the response to our expected format
    const transformedResults: GAPMeasurementResult[] = [];

    if (rawData.results && rawData.results.length > 0) {
      const result = rawData.results[0]; // Get first result
      const [lon, lat] = result.geometry.coordinates;

      // Group data points by date
      const groupedByDate = new Map<string, GAPDataPoint[]>();
      result.data.forEach(dataPoint => {
        const date = dataPoint.datetime.split('T')[0];
        if (!groupedByDate.has(date)) {
          groupedByDate.set(date, []);
        }
        groupedByDate.get(date)!.push(dataPoint);
      });

      // Aggregate values for each date
      groupedByDate.forEach((dataPoints, date) => {
        const transformed: GAPMeasurementResult = {
          date,
          lat,
          lon
        };

        // Get all attribute keys (excluding datetime)
        const attributes = new Set<string>();
        dataPoints.forEach(dp => {
          Object.keys(dp).forEach(key => {
            if (key !== 'datetime') attributes.add(key);
          });
        });

        // Average all numeric attributes
        attributes.forEach(attr => {
          // Handle both array values (ensemble forecasts) and single values
          const allValues: number[] = [];

          dataPoints.forEach(dp => {
            const value = dp[attr];
            if (Array.isArray(value)) {
              // If it's an array (ensemble forecast), collect all array values
              allValues.push(...value.filter(v => typeof v === 'number'));
            } else if (typeof value === 'number') {
              // If it's a single number, add it
              allValues.push(value);
            }
          });

          if (allValues.length > 0) {
            // Average all collected values
            transformed[attr] = allValues.reduce((sum, v) => sum + v, 0) / allValues.length;
          }
        });

        transformedResults.push(transformed);
      });

      // Sort by date
      transformedResults.sort((a, b) => a.date.localeCompare(b.date));
    }

    console.log(`[GAP API] Received ${transformedResults.length} daily data points`);

    return {
      results: transformedResults,
      count: transformedResults.length,
      next: null,
      previous: null
    };
  }

  /**
   * Get weather forecast for agriculture planning
   */
  async getForecast(lat: number, lon: number, days: number = 7): Promise<GAPResponse> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.getMeasurement({
      lat,
      lon,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      product: 'salient_seasonal_forecast',
      attributes: [
        'max_temperature',
        'min_temperature',
        'precipitation',
        'relative_humidity',
        'wind_speed'
      ].join(','),
      output_type: 'json'
    });
  }

  /**
   * Get historical weather data
   */
  async getHistorical(lat: number, lon: number, daysBack: number = 30): Promise<GAPResponse> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    return this.getMeasurement({
      lat,
      lon,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      product: 'cbam_historical_analysis',
      attributes: [
        'max_temperature',
        'min_temperature',
        'precipitation'
      ].join(','),
      output_type: 'json'
    });
  }

  /**
   * Get comprehensive forecast with anomalies for farming decisions
   */
  async getFarmingForecast(lat: number, lon: number, days: number = 14): Promise<GAPResponse> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.getMeasurement({
      lat,
      lon,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      product: 'salient_seasonal_forecast',
      attributes: [
        'max_temperature',
        'max_temperature_anom',
        'min_temperature',
        'min_temperature_anom',
        'precipitation',
        'precipitation_anom',
        'relative_humidity',
        'relative_humidity_anom',
        'solar_radiation',
        'wind_speed'
      ].join(','),
      output_type: 'json'
    });
  }
}
