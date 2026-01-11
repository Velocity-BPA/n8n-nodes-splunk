/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { toFormData, chunkArray, epochToIso, isoToEpoch, parseTimeString, buildQueryString, parseCronSchedule } from '../../nodes/Splunk/utils/helpers';
import { buildTimeRange, validateSplQuery, parseSplunkError } from '../../nodes/Splunk/transport/api';
import { ENDPOINTS, DEFAULTS, EXEC_MODES } from '../../nodes/Splunk/constants/endpoints';

describe('Splunk Node Helpers', () => {
  describe('toFormData', () => {
    it('should convert simple objects to form data', () => {
      const data = { name: 'test', value: 123 };
      const result = toFormData(data);
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should convert arrays to comma-separated strings', () => {
      const data = { roles: ['admin', 'user', 'power'] };
      const result = toFormData(data);
      expect(result).toEqual({ roles: 'admin,user,power' });
    });

    it('should stringify objects', () => {
      const data = { config: { key: 'value' } };
      const result = toFormData(data);
      expect(result).toEqual({ config: '{"key":"value"}' });
    });

    it('should exclude null, undefined, and empty values', () => {
      const data = { name: 'test', empty: '', nullVal: null, undefinedVal: undefined };
      const result = toFormData(data);
      expect(result).toEqual({ name: 'test' });
    });
  });

  describe('chunkArray', () => {
    it('should chunk an array into smaller arrays', () => {
      const array = [1, 2, 3, 4, 5, 6, 7];
      const result = chunkArray(array, 3);
      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });

    it('should handle empty arrays', () => {
      const result = chunkArray([], 3);
      expect(result).toEqual([]);
    });

    it('should handle arrays smaller than chunk size', () => {
      const array = [1, 2];
      const result = chunkArray(array, 5);
      expect(result).toEqual([[1, 2]]);
    });
  });

  describe('epochToIso', () => {
    it('should convert epoch timestamp to ISO string', () => {
      const epoch = 1704067200; // 2024-01-01T00:00:00Z
      const result = epochToIso(epoch);
      expect(result).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should handle string input', () => {
      const epoch = '1704067200';
      const result = epochToIso(epoch);
      expect(result).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('isoToEpoch', () => {
    it('should convert ISO string to epoch timestamp', () => {
      const iso = '2024-01-01T00:00:00.000Z';
      const result = isoToEpoch(iso);
      expect(result).toBe(1704067200);
    });
  });

  describe('parseTimeString', () => {
    it('should handle "now" keyword', () => {
      expect(parseTimeString('now')).toBe('Now');
    });

    it('should parse relative time strings', () => {
      expect(parseTimeString('-24h')).toBe('24 hours ago');
      expect(parseTimeString('-7d')).toBe('7 days ago');
      expect(parseTimeString('-1m')).toBe('1 minute ago');
    });

    it('should handle ISO date strings', () => {
      const result = parseTimeString('2024-01-01T00:00:00.000Z');
      expect(result).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('buildQueryString', () => {
    it('should convert boolean values to strings', () => {
      const options = { enabled: true, disabled: false };
      const result = buildQueryString(options);
      expect(result).toEqual({ enabled: 'true', disabled: 'false' });
    });

    it('should convert arrays to comma-separated strings', () => {
      const options = { fields: ['field1', 'field2'] };
      const result = buildQueryString(options);
      expect(result).toEqual({ fields: 'field1,field2' });
    });
  });

  describe('parseCronSchedule', () => {
    it('should parse common cron patterns', () => {
      expect(parseCronSchedule('* * * * *')).toBe('Every minute');
      expect(parseCronSchedule('0 * * * *')).toBe('Every hour');
      expect(parseCronSchedule('0 0 * * *')).toBe('Daily at midnight');
      expect(parseCronSchedule('0 0 * * 0')).toBe('Weekly on Sunday');
      expect(parseCronSchedule('0 0 1 * *')).toBe('Monthly on the 1st');
    });

    it('should parse daily schedules', () => {
      expect(parseCronSchedule('30 8 * * *')).toBe('Daily at 08:30');
    });
  });
});

describe('Splunk API Transport', () => {
  describe('buildTimeRange', () => {
    it('should build time range object with both times', () => {
      const result = buildTimeRange('-24h', 'now');
      expect(result).toEqual({ earliest_time: '-24h', latest_time: 'now' });
    });

    it('should handle only earliest time', () => {
      const result = buildTimeRange('-24h');
      expect(result).toEqual({ earliest_time: '-24h' });
    });

    it('should handle only latest time', () => {
      const result = buildTimeRange(undefined, 'now');
      expect(result).toEqual({ latest_time: 'now' });
    });

    it('should return empty object when no times provided', () => {
      const result = buildTimeRange();
      expect(result).toEqual({});
    });
  });

  describe('validateSplQuery', () => {
    it('should throw error for empty query', () => {
      expect(() => validateSplQuery('')).toThrow('Search query cannot be empty');
    });

    it('should throw error for whitespace-only query', () => {
      expect(() => validateSplQuery('   ')).toThrow('Search query cannot be empty');
    });

    it('should not throw for valid SPL query', () => {
      expect(() => validateSplQuery('search index=main')).not.toThrow();
    });

    it('should not throw for pipe-starting queries', () => {
      expect(() => validateSplQuery('| stats count by host')).not.toThrow();
    });
  });

  describe('parseSplunkError', () => {
    it('should return string errors as-is', () => {
      expect(parseSplunkError('Error message')).toBe('Error message');
    });

    it('should parse Splunk error messages array', () => {
      const error = {
        messages: [
          { type: 'ERROR', text: 'First error' },
          { type: 'ERROR', text: 'Second error' },
        ],
      };
      const result = parseSplunkError(error);
      expect(result).toBe('First error; Second error');
    });

    it('should handle error with message property', () => {
      const error = { message: 'Simple error' };
      expect(parseSplunkError(error)).toBe('Simple error');
    });
  });
});

describe('Splunk Constants', () => {
  describe('ENDPOINTS', () => {
    it('should have correct search jobs endpoint', () => {
      expect(ENDPOINTS.SEARCH_JOBS).toBe('/services/search/jobs');
    });

    it('should generate correct search job endpoint', () => {
      expect(ENDPOINTS.SEARCH_JOB('test-sid')).toBe('/services/search/jobs/test-sid');
    });

    it('should encode special characters in endpoints', () => {
      const result = ENDPOINTS.SAVED_SEARCH('My Search/Name');
      expect(result).toBe('/servicesNS/-/-/saved/searches/My%20Search%2FName');
    });
  });

  describe('DEFAULTS', () => {
    it('should have correct pagination count', () => {
      expect(DEFAULTS.PAGINATION_COUNT).toBe(100);
    });

    it('should have correct search timeout', () => {
      expect(DEFAULTS.SEARCH_TIMEOUT).toBe(300);
    });
  });

  describe('EXEC_MODES', () => {
    it('should have correct execution modes', () => {
      expect(EXEC_MODES.NORMAL).toBe('normal');
      expect(EXEC_MODES.BLOCKING).toBe('blocking');
      expect(EXEC_MODES.ONESHOT).toBe('oneshot');
    });
  });
});
