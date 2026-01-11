/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import { splunkApiRequest, pollSearchJob, formatEntries } from '../../transport/api';
import { ENDPOINTS, EXEC_MODES, DEFAULTS } from '../../constants/endpoints';
import { toFormData } from '../../utils/helpers';
import { validateSplQuery } from '../../transport/api';
import type { SplunkResponse, SearchResultsResponse } from '../../types/SplunkTypes';

export const searchJobOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['searchJob'],
      },
    },
    options: [
      {
        name: 'Cancel',
        value: 'cancel',
        description: 'Cancel a running search job',
        action: 'Cancel a search job',
      },
      {
        name: 'Create',
        value: 'create',
        description: 'Create and run a new search job',
        action: 'Create a search job',
      },
      {
        name: 'Finalize',
        value: 'finalize',
        description: 'Finalize a search job (stop searching, keep results)',
        action: 'Finalize a search job',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get search job status and metadata',
        action: 'Get a search job',
      },
      {
        name: 'Get Events',
        value: 'getEvents',
        description: 'Get raw events from search',
        action: 'Get events from a search job',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        description: 'Get many search jobs',
        action: 'Get many search jobs',
      },
      {
        name: 'Get Results',
        value: 'getResults',
        description: 'Get search job results',
        action: 'Get results from a search job',
      },
      {
        name: 'Get Summary',
        value: 'getSummary',
        description: 'Get search job summary statistics',
        action: 'Get summary from a search job',
      },
      {
        name: 'Pause',
        value: 'pause',
        description: 'Pause a search job',
        action: 'Pause a search job',
      },
      {
        name: 'Set TTL',
        value: 'setTTL',
        description: 'Set time-to-live for search results',
        action: 'Set TTL for a search job',
      },
      {
        name: 'Unpause',
        value: 'unpause',
        description: 'Resume a paused search job',
        action: 'Unpause a search job',
      },
    ],
    default: 'create',
  },
];

export const searchJobFields: INodeProperties[] = [
  // Create operation fields
  {
    displayName: 'Search Query (SPL)',
    name: 'search',
    type: 'string',
    typeOptions: {
      rows: 4,
    },
    required: true,
    default: '',
    placeholder: 'search index=main | stats count by sourcetype',
    description: 'The Splunk Processing Language (SPL) search query',
    displayOptions: {
      show: {
        resource: ['searchJob'],
        operation: ['create'],
      },
    },
  },
  {
    displayName: 'Execution Mode',
    name: 'execMode',
    type: 'options',
    options: [
      {
        name: 'Normal (Async)',
        value: 'normal',
        description: 'Return search ID immediately, poll for results separately',
      },
      {
        name: 'Blocking (Wait)',
        value: 'blocking',
        description: 'Wait for search to complete before returning',
      },
      {
        name: 'Oneshot (Sync)',
        value: 'oneshot',
        description: 'Run search synchronously and return results directly',
      },
    ],
    default: 'blocking',
    description: 'How to execute the search',
    displayOptions: {
      show: {
        resource: ['searchJob'],
        operation: ['create'],
      },
    },
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['searchJob'],
        operation: ['create'],
      },
    },
    options: [
      {
        displayName: 'Earliest Time',
        name: 'earliest_time',
        type: 'string',
        default: '-24h',
        description: 'Start time for the search (e.g., -24h, 2024-01-01T00:00:00)',
      },
      {
        displayName: 'Latest Time',
        name: 'latest_time',
        type: 'string',
        default: 'now',
        description: 'End time for the search (e.g., now, 2024-01-02T00:00:00)',
      },
      {
        displayName: 'Max Count',
        name: 'max_count',
        type: 'number',
        default: 50000,
        description: 'Maximum number of results to return',
      },
      {
        displayName: 'Status Buckets',
        name: 'status_buckets',
        type: 'number',
        default: 0,
        description: 'Number of status buckets to generate for progress tracking',
      },
      {
        displayName: 'Required Fields',
        name: 'rf',
        type: 'string',
        default: '',
        description: 'Comma-separated list of required fields',
      },
      {
        displayName: 'Enable Preview',
        name: 'preview',
        type: 'boolean',
        default: false,
        description: 'Whether to enable preview results for running searches',
      },
      {
        displayName: 'Timeout (Seconds)',
        name: 'timeout',
        type: 'number',
        default: 300,
        description: 'Search timeout in seconds',
      },
      {
        displayName: 'Auto Cancel (Seconds)',
        name: 'auto_cancel',
        type: 'number',
        default: 0,
        description: 'Auto-cancel search after N seconds of inactivity (0 = disabled)',
      },
      {
        displayName: 'Search Level',
        name: 'adhoc_search_level',
        type: 'options',
        options: [
          { name: 'Fast', value: 'fast' },
          { name: 'Smart', value: 'smart' },
          { name: 'Verbose', value: 'verbose' },
        ],
        default: 'smart',
        description: 'Search execution level',
      },
    ],
  },

  // SID for operations that require it
  {
    displayName: 'Search Job ID (SID)',
    name: 'sid',
    type: 'string',
    required: true,
    default: '',
    description: 'The search job ID',
    displayOptions: {
      show: {
        resource: ['searchJob'],
        operation: ['get', 'getResults', 'getEvents', 'getSummary', 'cancel', 'pause', 'unpause', 'finalize', 'setTTL'],
      },
    },
  },

  // TTL for setTTL operation
  {
    displayName: 'TTL (Seconds)',
    name: 'ttl',
    type: 'number',
    required: true,
    default: 600,
    description: 'Time-to-live in seconds',
    displayOptions: {
      show: {
        resource: ['searchJob'],
        operation: ['setTTL'],
      },
    },
  },

  // Results options
  {
    displayName: 'Options',
    name: 'resultsOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['searchJob'],
        operation: ['getResults', 'getEvents'],
      },
    },
    options: [
      {
        displayName: 'Count',
        name: 'count',
        type: 'number',
        default: 100,
        description: 'Maximum number of results to return',
      },
      {
        displayName: 'Offset',
        name: 'offset',
        type: 'number',
        default: 0,
        description: 'Number of results to skip',
      },
      {
        displayName: 'Fields',
        name: 'field_list',
        type: 'string',
        default: '',
        description: 'Comma-separated list of fields to include',
      },
      {
        displayName: 'Search Filter',
        name: 'search',
        type: 'string',
        default: '',
        description: 'Post-processing search filter',
      },
    ],
  },

  // Get All options
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: {
      show: {
        resource: ['searchJob'],
        operation: ['getAll'],
      },
    },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    description: 'Max number of results to return',
    typeOptions: {
      minValue: 1,
    },
    displayOptions: {
      show: {
        resource: ['searchJob'],
        operation: ['getAll'],
        returnAll: [false],
      },
    },
  },
  {
    displayName: 'Simplify',
    name: 'simplify',
    type: 'boolean',
    default: true,
    description: 'Whether to return a simplified version of the response instead of the raw data',
    displayOptions: {
      show: {
        resource: ['searchJob'],
        operation: ['get', 'getAll', 'getResults', 'getEvents'],
      },
    },
  },
];

export async function executeSearchJob(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  let response: IDataObject | IDataObject[];

  switch (operation) {
    case 'create': {
      const search = this.getNodeParameter('search', i) as string;
      const execMode = this.getNodeParameter('execMode', i) as string;
      const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

      validateSplQuery(search);

      const body: IDataObject = {
        search: search.startsWith('search ') || search.startsWith('|') ? search : `search ${search}`,
        exec_mode: execMode,
        ...additionalFields,
      };

      if (execMode === EXEC_MODES.ONESHOT) {
        // Oneshot returns results directly
        const result = (await splunkApiRequest.call(
          this,
          'POST',
          ENDPOINTS.SEARCH_JOBS,
          toFormData(body),
        )) as SearchResultsResponse;

        response = (result.results || []) as unknown as IDataObject[];
      } else {
        // Normal/Blocking modes return job info
        const result = (await splunkApiRequest.call(
          this,
          'POST',
          ENDPOINTS.SEARCH_JOBS,
          toFormData(body),
        )) as SplunkResponse;

        const sid = (result as IDataObject).sid || (result.entry?.[0]?.content as IDataObject)?.sid;

        if (execMode === EXEC_MODES.BLOCKING && sid) {
          // Wait for job to complete
          const timeout = (additionalFields.timeout as number) || DEFAULTS.SEARCH_TIMEOUT;
          const jobEntry = await pollSearchJob.call(this, sid as string, timeout);
          response = {
            sid,
            ...(jobEntry.content as IDataObject),
          };
        } else {
          response = { sid: sid as string };
        }
      }
      break;
    }

    case 'get': {
      const sid = this.getNodeParameter('sid', i) as string;
      const simplify = this.getNodeParameter('simplify', i) as boolean;

      const result = (await splunkApiRequest.call(
        this,
        'GET',
        ENDPOINTS.SEARCH_JOB(sid),
      )) as SplunkResponse;

      response = simplify ? formatEntries(result.entry || [])[0] : (result as IDataObject);
      break;
    }

    case 'getAll': {
      const returnAll = this.getNodeParameter('returnAll', i) as boolean;
      const simplify = this.getNodeParameter('simplify', i) as boolean;
      const limit = returnAll ? 0 : (this.getNodeParameter('limit', i) as number);

      const result = (await splunkApiRequest.call(
        this,
        'GET',
        ENDPOINTS.SEARCH_JOBS,
      )) as SplunkResponse;

      let entries = result.entry || [];
      if (!returnAll && limit > 0) {
        entries = entries.slice(0, limit);
      }

      response = simplify ? formatEntries(entries) : (entries as unknown as IDataObject[]);
      break;
    }

    case 'getResults': {
      const sid = this.getNodeParameter('sid', i) as string;
      const simplify = this.getNodeParameter('simplify', i) as boolean;
      const options = this.getNodeParameter('resultsOptions', i) as IDataObject;

      const result = (await splunkApiRequest.call(
        this,
        'GET',
        ENDPOINTS.SEARCH_RESULTS(sid),
        undefined,
        options,
      )) as SearchResultsResponse;

      response = simplify ? ((result.results || []) as unknown as IDataObject[]) : (result as unknown as IDataObject);
      break;
    }

    case 'getEvents': {
      const sid = this.getNodeParameter('sid', i) as string;
      const simplify = this.getNodeParameter('simplify', i) as boolean;
      const options = this.getNodeParameter('resultsOptions', i) as IDataObject;

      const result = (await splunkApiRequest.call(
        this,
        'GET',
        ENDPOINTS.SEARCH_EVENTS(sid),
        undefined,
        options,
      )) as SearchResultsResponse;

      response = simplify ? ((result.results || []) as unknown as IDataObject[]) : (result as unknown as IDataObject);
      break;
    }

    case 'getSummary': {
      const sid = this.getNodeParameter('sid', i) as string;

      response = (await splunkApiRequest.call(
        this,
        'GET',
        ENDPOINTS.SEARCH_SUMMARY(sid),
      )) as IDataObject;
      break;
    }

    case 'cancel': {
      const sid = this.getNodeParameter('sid', i) as string;

      await splunkApiRequest.call(
        this,
        'POST',
        ENDPOINTS.SEARCH_CONTROL(sid),
        toFormData({ action: 'cancel' }),
      );

      response = { success: true, sid, action: 'cancelled' };
      break;
    }

    case 'pause': {
      const sid = this.getNodeParameter('sid', i) as string;

      await splunkApiRequest.call(
        this,
        'POST',
        ENDPOINTS.SEARCH_CONTROL(sid),
        toFormData({ action: 'pause' }),
      );

      response = { success: true, sid, action: 'paused' };
      break;
    }

    case 'unpause': {
      const sid = this.getNodeParameter('sid', i) as string;

      await splunkApiRequest.call(
        this,
        'POST',
        ENDPOINTS.SEARCH_CONTROL(sid),
        toFormData({ action: 'unpause' }),
      );

      response = { success: true, sid, action: 'unpaused' };
      break;
    }

    case 'finalize': {
      const sid = this.getNodeParameter('sid', i) as string;

      await splunkApiRequest.call(
        this,
        'POST',
        ENDPOINTS.SEARCH_CONTROL(sid),
        toFormData({ action: 'finalize' }),
      );

      response = { success: true, sid, action: 'finalized' };
      break;
    }

    case 'setTTL': {
      const sid = this.getNodeParameter('sid', i) as string;
      const ttl = this.getNodeParameter('ttl', i) as number;

      await splunkApiRequest.call(
        this,
        'POST',
        ENDPOINTS.SEARCH_CONTROL(sid),
        toFormData({ action: 'setttl', ttl }),
      );

      response = { success: true, sid, ttl };
      break;
    }

    default:
      throw new Error(`Operation ${operation} not supported`);
  }

  return response;
}
