/**
 * GAP API Client for Tomorrow Now's Global Access Platform
 *
 * This module provides a TypeScript client for interacting with the GAP API,
 * which offers weather forecast and historical data for agricultural planning.
 *
 * Key Features:
 * - Handles ensemble forecast arrays (50 values per attribute)
 * - Aggregates multiple data points by date
 * - Converts raw API responses to farmer-friendly format
 * - Supports both historical and forecast data
 *
 * @module gap-client
 */

import fetch from 'node-fetch';

/**
 * Parameters for GAP API measurement requests
 * These match the GAP API specification exactly
 */
export interface GAPMeasurementParams {
  /** Latitude coordinate (-90 to 90) */
  lat: number;

  /** Longitude coordinate (-180 to 180) */
  lon: number;

  /** Start date in YYYY-MM-DD format */
  start_date: string;

  /** End date in YYYY-MM-DD format */
  end_date: string;

  /** Data product type from GAP */
  product: 'cbam_historical_analysis' | 'salient_seasonal_forecast';

  /** Comma-separated list of weather attributes to fetch */
  attributes: string;

  /** Output format (only JSON is supported) */
  output_type: 'json';
}

/**
 * A single data point from GAP API
 * GAP returns ensemble forecasts (50 values) as arrays for each attribute
 */
export interface GAPDataPoint {
  /** ISO 8601 datetime string */
  datetime: string;

  /**
   * Dynamic weather attributes (e.g., max_temperature, precipitation)
   * Values can be:
   * - number: Single value for historical data
   * - number[]: Ensemble forecast array (50 values) for forecasts
   */
  [key: string]: number | number[] | string;
}

/**
 * Raw response structure from GAP API
 * This is the exact format returned by the GAP API before transformation
 */
export interface GAPRawResponse {
  /** Metadata about the request */
  metadata: any;

  /** Array of results (usually contains one result per location) */
  results: Array<{
    /** GeoJSON geometry containing coordinates */
    geometry: {
      type: string;
      coordinates: number[]; // [longitude, latitude]
    };
    /** Array of weather data points (multiple per day for ensemble forecasts) */
    data: GAPDataPoint[];
  }>;
}

/**
 * Processed measurement result (one per day)
 * This is our cleaned-up format after aggregating ensemble forecasts
 */
export interface GAPMeasurementResult {
  /** Date in YYYY-MM-DD format */
  date: string;

  /** Latitude coordinate */
  lat: number;

  /** Longitude coordinate */
  lon: number;

  /**
   * Weather attributes with averaged values
   * All ensemble forecast arrays have been averaged to single numbers
   * Examples: max_temperature, min_temperature, precipitation, etc.
   */
  [key: string]: number | string;
}

/**
 * Final response structure returned to MCP tools
 * Mimics pagination structure for future expansion
 */
export interface GAPResponse {
  /** Array of daily weather data points */
  results: GAPMeasurementResult[];

  /** Total number of results */
  count: number;

  /** URL for next page (currently always null) */
  next: string | null;

  /** URL for previous page (currently always null) */
  previous: string | null;
}

/**
 * Client for interacting with the GAP (Global Access Platform) API
 *
 * This class handles:
 * 1. API authentication via token
 * 2. HTTP requests to GAP endpoints
 * 3. Response transformation (ensemble forecast aggregation)
 * 4. Error handling
 *
 * @example
 * ```typescript
 * const client = new GAPClient('your-api-token');
 * const forecast = await client.getForecast(1.2921, 36.8219, 7);
 * console.log(forecast.results); // 7 days of weather data
 * ```
 */
export class GAPClient {
  /** GAP API authentication token */
  private apiToken: string;

  /** Base URL for GAP API */
  private baseUrl: string;

  /**
   * Creates a new GAP API client
   *
   * @param apiToken - Your GAP API authentication token
   * @param baseUrl - Base URL for GAP API (default: https://gap.tomorrownow.org/api/v1)
   */
  constructor(apiToken: string, baseUrl: string = 'https://gap.tomorrownow.org/api/v1') {
    this.apiToken = apiToken;
    this.baseUrl = baseUrl;
  }

  /**
   * Core method for fetching weather measurements from GAP API
   *
   * This method handles the complex task of:
   * 1. Making authenticated requests to GAP
   * 2. Processing ensemble forecasts (50 values per attribute)
   * 3. Grouping data points by date
   * 4. Averaging ensemble members to single daily values
   *
   * @param params - Request parameters (location, dates, attributes)
   * @returns Processed weather data grouped by date
   * @throws Error if API request fails or returns invalid data
   */
  async getMeasurement(params: GAPMeasurementParams): Promise<GAPResponse> {
    // Build the API request URL
    const url = new URL(`${this.baseUrl}/measurement/`);

    // Add all parameters as query strings
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });

    console.log(`[GAP API] Fetching: ${url.toString()}`);

    // Make authenticated request to GAP API
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Token ${this.apiToken}` // GAP uses Token-based auth
      }
    });

    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GAP API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const rawData = await response.json() as GAPRawResponse;

    //  =================================================================
    //  DATA TRANSFORMATION SECTION
    //  =================================================================
    //  GAP returns ensemble forecasts as arrays (50 values per attribute)
    //  We need to aggregate these to single daily values for farmers
    //  =================================================================

    const transformedResults: GAPMeasurementResult[] = [];

    if (rawData.results && rawData.results.length > 0) {
      // Extract the first result (one per location)
      const result = rawData.results[0];
      const [lon, lat] = result.geometry.coordinates; // GeoJSON format: [lon, lat]

      // Step 1: Group multiple data points by date
      // (Ensemble forecasts have multiple entries per date)
      const groupedByDate = new Map<string, GAPDataPoint[]>();
      result.data.forEach(dataPoint => {
        const date = dataPoint.datetime.split('T')[0]; // Extract YYYY-MM-DD
        if (!groupedByDate.has(date)) {
          groupedByDate.set(date, []);
        }
        groupedByDate.get(date)!.push(dataPoint);
      });

      // Step 2: Aggregate all data points for each date
      groupedByDate.forEach((dataPoints, date) => {
        const transformed: GAPMeasurementResult = {
          date,
          lat,
          lon
        };

        // Collect all unique attribute names across data points
        const attributes = new Set<string>();
        dataPoints.forEach(dp => {
          Object.keys(dp).forEach(key => {
            if (key !== 'datetime') attributes.add(key);
          });
        });

        // Step 3: Average ensemble forecast arrays
        attributes.forEach(attr => {
          const allValues: number[] = [];

          dataPoints.forEach(dp => {
            const value = dp[attr];

            // Handle ensemble forecasts (arrays of 50 values)
            if (Array.isArray(value)) {
              // Flatten array and filter to only numbers
              allValues.push(...value.filter(v => typeof v === 'number'));
            }
            // Handle single values (historical data)
            else if (typeof value === 'number') {
              allValues.push(value);
            }
            // Skip non-numeric values (strings, etc.)
          });

          // Calculate mean of all collected values
          if (allValues.length > 0) {
            transformed[attr] = allValues.reduce((sum, v) => sum + v, 0) / allValues.length;
          }
        });

        transformedResults.push(transformed);
      });

      // Sort results chronologically
      transformedResults.sort((a, b) => a.date.localeCompare(b.date));
    }

    console.log(`[GAP API] Processed ${transformedResults.length} days of data`);

    // Return in pagination-ready format
    return {
      results: transformedResults,
      count: transformedResults.length,
      next: null, // Pagination not implemented yet
      previous: null
    };
  }

  /**
   * Get weather forecast for agricultural planning
   *
   * Fetches basic weather forecast data for the next N days.
   * Suitable for general weather checks and short-term planning.
   *
   * @param lat - Latitude coordinate (-90 to 90)
   * @param lon - Longitude coordinate (-180 to 180)
   * @param days - Number of forecast days (1-14, default: 7)
   * @returns Promise with daily weather forecast
   *
   * @example
   * ```typescript
   * const forecast = await client.getForecast(1.2921, 36.8219, 7);
   * forecast.results.forEach(day => {
   *   console.log(`${day.date}: ${day.max_temperature}°C`);
   * });
   * ```
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
      product: 'salient_seasonal_forecast', // Ensemble forecast product
      attributes: [
        'max_temperature',    // Daily maximum temperature (°C)
        'min_temperature',    // Daily minimum temperature (°C)
        'precipitation',      // Total precipitation (mm)
        'relative_humidity',  // Relative humidity (0-1, displayed as %)
        'wind_speed'          // Wind speed (m/s)
      ].join(','),
      output_type: 'json'
    });
  }

  /**
   * Get historical weather data
   *
   * Fetches past weather observations for analysis and validation.
   * Useful for comparing forecasts with actual outcomes.
   *
   * @param lat - Latitude coordinate
   * @param lon - Longitude coordinate
   * @param daysBack - Number of past days to fetch (default: 30)
   * @returns Promise with historical weather data
   *
   * @example
   * ```typescript
   * const history = await client.getHistorical(1.2921, 36.8219, 30);
   * console.log(`Last 30 days had ${history.count} records`);
   * ```
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
      product: 'cbam_historical_analysis', // Historical analysis product
      attributes: [
        'max_temperature',  // Observed max temperature
        'min_temperature',  // Observed min temperature
        'precipitation'     // Observed precipitation
      ].join(','),
      output_type: 'json'
    });
  }

  /**
   * Get comprehensive forecast with anomalies for farming decisions
   *
   * Fetches extended forecast with anomaly data (deviation from normal).
   * Includes additional attributes like solar radiation for detailed analysis.
   * Used by farming advisory and planting recommendation tools.
   *
   * @param lat - Latitude coordinate
   * @param lon - Longitude coordinate
   * @param days - Number of forecast days (7-14, default: 14)
   * @returns Promise with comprehensive weather forecast
   *
   * @example
   * ```typescript
   * const forecast = await client.getFarmingForecast(1.2921, 36.8219, 14);
   * forecast.results.forEach(day => {
   *   console.log(`${day.date}: ${day.max_temperature}°C (anomaly: ${day.max_temperature_anom}°C)`);
   * });
   * ```
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
        'max_temperature',           // Daily maximum temperature (°C)
        'max_temperature_anom',      // Temperature anomaly (deviation from normal)
        'min_temperature',           // Daily minimum temperature (°C)
        'min_temperature_anom',      // Min temperature anomaly
        'precipitation',             // Total precipitation (mm)
        'precipitation_anom',        // Precipitation anomaly
        'relative_humidity',         // Relative humidity (0-1)
        'relative_humidity_anom',    // Humidity anomaly
        'solar_radiation',           // Solar radiation (W/m²) - important for crops
        'wind_speed'                 // Wind speed (m/s)
      ].join(','),
      output_type: 'json'
    });
  }
}
