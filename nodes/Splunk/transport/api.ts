/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  IPollFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
  IDataObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import type { SplunkResponse, SplunkEntry, HecEvent, HecResponse } from '../types/SplunkTypes';

/**
 * Display licensing notice once per node load
 */
let licenseNoticeDisplayed = false;

export function displayLicenseNotice(): void {
  if (!licenseNoticeDisplayed) {
    console.warn(`
[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
`);
    licenseNoticeDisplayed = true;
  }
}

/**
 * Get authentication headers based on credential type
 */
export async function getAuthHeaders(
  this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions,
): Promise<{ Authorization: string }> {
  const credentials = await this.getCredentials('splunkApi');
  const authType = credentials.authType as string;

  if (authType === 'token') {
    const token = credentials.authToken as string;
    return { Authorization: `Bearer ${token}` };
  }

  // For basic auth, we need to get a session token first
  const sessionKey = await getSessionKey.call(this);
  return { Authorization: `Bearer ${sessionKey}` };
}

/**
 * Get a session key using basic authentication
 */
async function getSessionKey(
  this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions,
): Promise<string> {
  const credentials = await this.getCredentials('splunkApi');
  const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
  const validateCerts = credentials.validateCerts !== false;

  const options: IHttpRequestOptions = {
    method: 'POST',
    url: `${baseUrl}/services/auth/login`,
    body: {
      username: credentials.username,
      password: credentials.password,
      output_mode: 'json',
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    skipSslCertificateValidation: !validateCerts,
    returnFullResponse: false,
  };

  try {
    const response = (await this.helpers.httpRequest(options)) as { sessionKey: string };
    return response.sessionKey;
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to authenticate with Splunk: ${(error as Error).message}`,
    );
  }
}

/**
 * Make an API request to Splunk
 */
export async function splunkApiRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body?: IDataObject,
  query?: IDataObject,
  uri?: string,
): Promise<SplunkResponse | IDataObject> {
  displayLicenseNotice();

  const credentials = await this.getCredentials('splunkApi');
  const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
  const validateCerts = credentials.validateCerts !== false;
  const authHeaders = await getAuthHeaders.call(this);

  const qs: IDataObject = {
    output_mode: 'json',
    ...query,
  };

  const options: IHttpRequestOptions = {
    method,
    url: uri || `${baseUrl}${endpoint}`,
    headers: {
      ...authHeaders,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    qs,
    skipSslCertificateValidation: !validateCerts,
    returnFullResponse: false,
  };

  if (body && Object.keys(body).length > 0) {
    // Splunk expects form-encoded data for POST/PUT
    options.body = body;
  }

  try {
    const response = await this.helpers.httpRequest(options);
    return response as SplunkResponse | IDataObject;
  } catch (error) {
    throw new NodeApiError(this.getNode(), {}, {
      message: `Splunk API request failed: ${(error as Error).message}`,
    });
  }
}

/**
 * Make a paginated API request to Splunk
 */
export async function splunkApiRequestAllItems<T = Record<string, unknown>>(
  this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body?: IDataObject,
  query?: IDataObject,
  limit?: number,
): Promise<SplunkEntry<T>[]> {
  const returnData: SplunkEntry<T>[] = [];
  let offset = 0;
  const count = 100;
  let hasMore = true;

  while (hasMore) {
    const qs: IDataObject = {
      ...query,
      count,
      offset,
    };

    const response = (await splunkApiRequest.call(
      this,
      method,
      endpoint,
      body,
      qs,
    )) as SplunkResponse<T>;
    const entries = response.entry || [];

    returnData.push(...entries);
    offset += count;

    // Check if we should continue
    hasMore = entries.length === count;

    // Respect limit if set
    if (limit && returnData.length >= limit) {
      return returnData.slice(0, limit);
    }
  }

  return returnData;
}

/**
 * Send events via HTTP Event Collector (HEC)
 */
export async function splunkHecRequest(
  this: IExecuteFunctions,
  hecEndpoint: string,
  hecToken: string,
  events: HecEvent | HecEvent[],
): Promise<HecResponse> {
  displayLicenseNotice();

  const credentials = await this.getCredentials('splunkApi');
  const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
  const validateCerts = credentials.validateCerts !== false;

  // HEC typically runs on port 8088
  const hecUrl = hecEndpoint || baseUrl.replace(':8089', ':8088');

  const options: IHttpRequestOptions = {
    method: 'POST',
    url: `${hecUrl}/services/collector/event`,
    headers: {
      Authorization: `Splunk ${hecToken}`,
      'Content-Type': 'application/json',
    },
    skipSslCertificateValidation: !validateCerts,
    returnFullResponse: false,
  };

  // Format events for HEC
  if (Array.isArray(events)) {
    // Send as batch (newline-delimited JSON)
    options.body = events.map((e) => JSON.stringify(e)).join('\n');
    options.headers!['Content-Type'] = 'application/json';
  } else {
    options.body = events;
    options.json = true;
  }

  try {
    const response = await this.helpers.httpRequest(options);
    return response as HecResponse;
  } catch (error) {
    throw new NodeApiError(this.getNode(), {}, {
      message: `HEC request failed: ${(error as Error).message}`,
    });
  }
}

/**
 * Poll a search job until completion
 */
export async function pollSearchJob(
  this: IExecuteFunctions | IPollFunctions,
  sid: string,
  timeout = 300,
  interval = 2,
): Promise<SplunkEntry> {
  const startTime = Date.now();
  const timeoutMs = timeout * 1000;

  while (Date.now() - startTime < timeoutMs) {
    const response = (await splunkApiRequest.call(
      this,
      'GET',
      `/services/search/jobs/${sid}`,
    )) as SplunkResponse;

    const entry = response.entry?.[0];
    if (!entry) {
      throw new NodeOperationError(this.getNode(), `Search job ${sid} not found`);
    }

    const content = entry.content as { isDone?: boolean; isFailed?: boolean; messages?: Array<{ type: string; text: string }> };

    if (content.isFailed) {
      const messages = content.messages || [];
      const errorMsg = messages
        .filter((m) => m.type === 'ERROR' || m.type === 'FATAL')
        .map((m) => m.text)
        .join('; ');
      throw new NodeOperationError(
        this.getNode(),
        `Search job failed: ${errorMsg || 'Unknown error'}`,
      );
    }

    if (content.isDone) {
      return entry;
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, interval * 1000));
  }

  throw new NodeOperationError(this.getNode(), `Search job ${sid} timed out after ${timeout}s`);
}

/**
 * Format Splunk response entries for output
 */
export function formatEntries<T = Record<string, unknown>>(
  entries: SplunkEntry<T>[],
  simplify = true,
): IDataObject[] {
  if (simplify) {
    return entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      updated: entry.updated,
      ...entry.content,
    }));
  }

  return entries as unknown as IDataObject[];
}

/**
 * Format search results for output
 */
export function formatSearchResults(results: IDataObject[], simplify = true): IDataObject[] {
  if (simplify) {
    return results.map((result) => {
      // Remove internal fields if simplifying
      const { _bkt, _cd, _indextime, _serial, _si, ...rest } = result;
      return rest;
    });
  }
  return results;
}

/**
 * Build time range parameters
 */
export function buildTimeRange(
  earliestTime?: string,
  latestTime?: string,
): { earliest_time?: string; latest_time?: string } {
  const params: { earliest_time?: string; latest_time?: string } = {};

  if (earliestTime) {
    params.earliest_time = earliestTime;
  }
  if (latestTime) {
    params.latest_time = latestTime;
  }

  return params;
}

/**
 * Validate SPL search query
 */
export function validateSplQuery(query: string): void {
  if (!query || query.trim() === '') {
    throw new NodeOperationError({ name: 'Splunk' } as any, 'Search query cannot be empty');
  }

  // Basic validation - check for common SPL issues
  const trimmed = query.trim();

  // Warn about missing search command (but don't error - Splunk auto-adds it)
  if (!trimmed.toLowerCase().startsWith('search ') && !trimmed.startsWith('|')) {
    console.warn('SPL query does not start with "search" command - Splunk will auto-prepend it');
  }
}

/**
 * Parse Splunk error response
 */
export function parseSplunkError(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  const err = error as Record<string, unknown>;

  if (err.messages && Array.isArray(err.messages)) {
    return (err.messages as Array<Record<string, unknown>>)
      .map((m) => (m.text || m.message || JSON.stringify(m)) as string)
      .join('; ');
  }

  if (err.message) {
    return err.message as string;
  }

  return JSON.stringify(error);
}
