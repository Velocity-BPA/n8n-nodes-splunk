/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, INodePropertyOptions } from 'n8n-workflow';

/**
 * Convert object to form-encoded body for Splunk API
 */
export function toFormData(data: IDataObject): IDataObject {
  const formData: IDataObject = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        formData[key] = value.join(',');
      } else if (typeof value === 'object') {
        formData[key] = JSON.stringify(value);
      } else {
        formData[key] = value;
      }
    }
  }

  return formData;
}

/**
 * Parse additional fields from UI to object
 */
export function parseAdditionalFields(fields: IDataObject): IDataObject {
  const result: IDataObject = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null && value !== '') {
      // Handle nested objects (like dispatch.earliest_time)
      if (key.includes('.')) {
        result[key] = value;
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * Build query string from options
 */
export function buildQueryString(options: IDataObject): IDataObject {
  const query: IDataObject = {};

  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'boolean') {
        query[key] = value ? 'true' : 'false';
      } else if (Array.isArray(value)) {
        query[key] = value.join(',');
      } else {
        query[key] = value;
      }
    }
  }

  return query;
}

/**
 * Format epoch timestamp to ISO string
 */
export function epochToIso(epoch: number | string): string {
  const timestamp = typeof epoch === 'string' ? parseFloat(epoch) : epoch;
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Format ISO string to epoch timestamp
 */
export function isoToEpoch(isoString: string): number {
  return Math.floor(new Date(isoString).getTime() / 1000);
}

/**
 * Parse Splunk time string to human readable format
 */
export function parseTimeString(timeString: string): string {
  // Handle relative time strings like -24h, -7d, now
  if (timeString === 'now') {
    return 'Now';
  }

  if (timeString.startsWith('-') || timeString.startsWith('+')) {
    const match = timeString.match(/^([+-])(\d+)(\w+)$/);
    if (match) {
      const [, sign, amount, unit] = match;
      const direction = sign === '-' ? 'ago' : 'from now';
      const unitMap: Record<string, string> = {
        s: 'second',
        m: 'minute',
        h: 'hour',
        d: 'day',
        w: 'week',
        mon: 'month',
        y: 'year',
      };
      const unitName = unitMap[unit] || unit;
      const plural = parseInt(amount) !== 1 ? 's' : '';
      return `${amount} ${unitName}${plural} ${direction}`;
    }
  }

  // Try to parse as ISO date
  try {
    const date = new Date(timeString);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch {
    // Not a valid date
  }

  return timeString;
}

/**
 * Generate search job poll options
 */
export function getPollOptions(): INodePropertyOptions[] {
  return [
    {
      name: 'Blocking (Wait for Results)',
      value: 'blocking',
      description: 'Wait for search to complete before returning',
    },
    {
      name: 'Normal (Return Immediately)',
      value: 'normal',
      description: 'Return search ID immediately, poll for results separately',
    },
    {
      name: 'Oneshot (Synchronous)',
      value: 'oneshot',
      description: 'Run search synchronously and return results directly',
    },
  ];
}

/**
 * Get severity options
 */
export function getSeverityOptions(): INodePropertyOptions[] {
  return [
    { name: 'Info', value: 'info' },
    { name: 'Low', value: 'low' },
    { name: 'Medium', value: 'medium' },
    { name: 'High', value: 'high' },
    { name: 'Critical', value: 'critical' },
  ];
}

/**
 * Get data input type options
 */
export function getDataInputTypeOptions(): INodePropertyOptions[] {
  return [
    { name: 'Monitor (File/Directory)', value: 'monitor' },
    { name: 'TCP', value: 'tcp' },
    { name: 'UDP', value: 'udp' },
    { name: 'HTTP Event Collector', value: 'http' },
    { name: 'Scripted Input', value: 'script' },
  ];
}

/**
 * Get index datatype options
 */
export function getIndexDatatypeOptions(): INodePropertyOptions[] {
  return [
    { name: 'Event', value: 'event' },
    { name: 'Metric', value: 'metric' },
  ];
}

/**
 * Clean up search results by removing internal Splunk fields
 */
export function cleanSearchResults(results: IDataObject[]): IDataObject[] {
  const internalFields = [
    '_bkt',
    '_cd',
    '_indextime',
    '_kv',
    '_raw',
    '_serial',
    '_si',
    '_sourcetype',
    '_subsecond',
    '_time',
    'splunk_server',
    'splunk_server_group',
  ];

  return results.map((result) => {
    const cleaned: IDataObject = {};
    for (const [key, value] of Object.entries(result)) {
      if (!internalFields.includes(key) || ['_time', '_raw'].includes(key)) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  });
}

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        const delayMs = baseDelay * Math.pow(2, attempt);
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Extract error message from Splunk response
 */
export function extractErrorMessage(response: IDataObject): string {
  if (response.messages && Array.isArray(response.messages)) {
    const errors = (response.messages as IDataObject[])
      .filter((m) => m.type === 'ERROR' || m.type === 'FATAL')
      .map((m) => m.text as string);

    if (errors.length > 0) {
      return errors.join('; ');
    }
  }

  if (response.error) {
    return typeof response.error === 'string' ? response.error : JSON.stringify(response.error);
  }

  return 'Unknown Splunk error';
}

/**
 * Build alert condition string
 */
export function buildAlertCondition(
  type: string,
  comparator: string,
  threshold: string,
): string {
  if (type === 'always') {
    return '';
  }

  if (type === 'custom') {
    return threshold;
  }

  // Number of events/results
  return `search ${comparator} ${threshold}`;
}

/**
 * Parse cron schedule to human readable
 */
export function parseCronSchedule(cron: string): string {
  const parts = cron.split(' ');
  if (parts.length !== 5) {
    return cron;
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Common patterns
  if (cron === '* * * * *') return 'Every minute';
  if (cron === '0 * * * *') return 'Every hour';
  if (cron === '0 0 * * *') return 'Daily at midnight';
  if (cron === '0 0 * * 0') return 'Weekly on Sunday';
  if (cron === '0 0 1 * *') return 'Monthly on the 1st';

  if (minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Daily at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }

  return cron;
}
