/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import { splunkApiRequest, formatEntries } from '../../transport/api';
import { ENDPOINTS } from '../../constants/endpoints';
import { toFormData } from '../../utils/helpers';
import type { SplunkResponse } from '../../types/SplunkTypes';

export const savedSearchOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['savedSearch'],
      },
    },
    options: [
      {
        name: 'Acknowledge',
        value: 'acknowledge',
        description: 'Acknowledge suppressed alerts',
        action: 'Acknowledge suppressed alerts',
      },
      {
        name: 'Create',
        value: 'create',
        description: 'Create a saved search',
        action: 'Create a saved search',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete a saved search',
        action: 'Delete a saved search',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get a saved search',
        action: 'Get a saved search',
      },
      {
        name: 'Get History',
        value: 'getHistory',
        description: 'Get dispatch history for a saved search',
        action: 'Get history for a saved search',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        description: 'Get many saved searches',
        action: 'Get many saved searches',
      },
      {
        name: 'Run',
        value: 'run',
        description: 'Run/dispatch a saved search',
        action: 'Run a saved search',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update a saved search',
        action: 'Update a saved search',
      },
    ],
    default: 'getAll',
  },
];

export const savedSearchFields: INodeProperties[] = [
  // Name for most operations
  {
    displayName: 'Saved Search Name',
    name: 'name',
    type: 'string',
    required: true,
    default: '',
    description: 'The name of the saved search',
    displayOptions: {
      show: {
        resource: ['savedSearch'],
        operation: ['get', 'update', 'delete', 'run', 'getHistory', 'acknowledge'],
      },
    },
  },

  // Create operation fields
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    required: true,
    default: '',
    description: 'The name for the new saved search',
    displayOptions: {
      show: {
        resource: ['savedSearch'],
        operation: ['create'],
      },
    },
  },
  {
    displayName: 'Search Query (SPL)',
    name: 'search',
    type: 'string',
    typeOptions: {
      rows: 4,
    },
    required: true,
    default: '',
    placeholder: 'index=main | stats count by sourcetype',
    description: 'The SPL search query for the saved search',
    displayOptions: {
      show: {
        resource: ['savedSearch'],
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
        resource: ['savedSearch'],
        operation: ['create'],
      },
    },
    options: [
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: '',
        description: 'Description of the saved search',
      },
      {
        displayName: 'Is Scheduled',
        name: 'is_scheduled',
        type: 'boolean',
        default: false,
        description: 'Whether to enable scheduling for this search',
      },
      {
        displayName: 'Cron Schedule',
        name: 'cron_schedule',
        type: 'string',
        default: '*/5 * * * *',
        placeholder: '*/5 * * * *',
        description: 'Cron expression for scheduling (e.g., "0 * * * *" for hourly)',
      },
      {
        displayName: 'Is Visible',
        name: 'is_visible',
        type: 'boolean',
        default: true,
        description: 'Whether to show this search in the Splunk UI',
      },
      {
        displayName: 'Earliest Time',
        name: 'dispatch.earliest_time',
        type: 'string',
        default: '-24h',
        description: 'Default earliest time for the search',
      },
      {
        displayName: 'Latest Time',
        name: 'dispatch.latest_time',
        type: 'string',
        default: 'now',
        description: 'Default latest time for the search',
      },
      {
        displayName: 'Alert Type',
        name: 'alert_type',
        type: 'options',
        options: [
          { name: 'Always', value: 'always' },
          { name: 'Custom', value: 'custom' },
          { name: 'Number of Events', value: 'number of events' },
          { name: 'Number of Results', value: 'number of results' },
          { name: 'Number of Hosts', value: 'number of hosts' },
          { name: 'Number of Sources', value: 'number of sources' },
        ],
        default: 'number of events',
        description: 'Type of alert trigger',
      },
      {
        displayName: 'Alert Comparator',
        name: 'alert_comparator',
        type: 'options',
        options: [
          { name: 'Greater Than', value: 'greater than' },
          { name: 'Less Than', value: 'less than' },
          { name: 'Equal To', value: 'equal to' },
          { name: 'Not Equal To', value: 'not equal to' },
          { name: 'Rises By', value: 'rises by' },
          { name: 'Drops By', value: 'drops by' },
        ],
        default: 'greater than',
        description: 'Comparison operator for alert threshold',
      },
      {
        displayName: 'Alert Threshold',
        name: 'alert_threshold',
        type: 'string',
        default: '0',
        description: 'Threshold value for alert',
      },
      {
        displayName: 'Actions',
        name: 'actions',
        type: 'string',
        default: '',
        placeholder: 'email, webhook',
        description: 'Comma-separated list of alert actions to execute',
      },
      {
        displayName: 'Email To',
        name: 'action.email.to',
        type: 'string',
        default: '',
        description: 'Email addresses for email action (comma-separated)',
      },
    ],
  },

  // Update operation fields
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['savedSearch'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Search Query (SPL)',
        name: 'search',
        type: 'string',
        typeOptions: {
          rows: 4,
        },
        default: '',
        description: 'Updated SPL search query',
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: '',
        description: 'Updated description',
      },
      {
        displayName: 'Is Scheduled',
        name: 'is_scheduled',
        type: 'boolean',
        default: false,
        description: 'Whether to enable scheduling',
      },
      {
        displayName: 'Cron Schedule',
        name: 'cron_schedule',
        type: 'string',
        default: '',
        description: 'Updated cron schedule',
      },
      {
        displayName: 'Is Visible',
        name: 'is_visible',
        type: 'boolean',
        default: true,
        description: 'Whether to show in Splunk UI',
      },
      {
        displayName: 'Disabled',
        name: 'disabled',
        type: 'boolean',
        default: false,
        description: 'Whether to disable the saved search',
      },
      {
        displayName: 'Earliest Time',
        name: 'dispatch.earliest_time',
        type: 'string',
        default: '',
        description: 'Default earliest time',
      },
      {
        displayName: 'Latest Time',
        name: 'dispatch.latest_time',
        type: 'string',
        default: '',
        description: 'Default latest time',
      },
    ],
  },

  // Run operation options
  {
    displayName: 'Run Options',
    name: 'runOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['savedSearch'],
        operation: ['run'],
      },
    },
    options: [
      {
        displayName: 'Earliest Time',
        name: 'dispatch.earliest_time',
        type: 'string',
        default: '',
        description: 'Override the earliest time for this dispatch',
      },
      {
        displayName: 'Latest Time',
        name: 'dispatch.latest_time',
        type: 'string',
        default: '',
        description: 'Override the latest time for this dispatch',
      },
      {
        displayName: 'Dispatch Now',
        name: 'dispatch.now',
        type: 'string',
        default: '',
        description: 'Set the "now" time for the search',
      },
      {
        displayName: 'Force Dispatch',
        name: 'force_dispatch',
        type: 'boolean',
        default: false,
        description: 'Whether to force dispatch even if search is disabled',
      },
      {
        displayName: 'Trigger Actions',
        name: 'trigger_actions',
        type: 'boolean',
        default: true,
        description: 'Whether to trigger alert actions',
      },
    ],
  },

  // Common options
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: {
      show: {
        resource: ['savedSearch'],
        operation: ['getAll', 'getHistory'],
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
        resource: ['savedSearch'],
        operation: ['getAll', 'getHistory'],
        returnAll: [false],
      },
    },
  },
  {
    displayName: 'Simplify',
    name: 'simplify',
    type: 'boolean',
    default: true,
    description: 'Whether to return a simplified version of the response',
    displayOptions: {
      show: {
        resource: ['savedSearch'],
        operation: ['get', 'getAll', 'getHistory'],
      },
    },
  },
];

export async function executeSavedSearch(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  let response: IDataObject | IDataObject[];

  switch (operation) {
    case 'create': {
      const name = this.getNodeParameter('name', i) as string;
      const search = this.getNodeParameter('search', i) as string;
      const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

      const body: IDataObject = {
        name,
        search,
        ...additionalFields,
      };

      const result = (await splunkApiRequest.call(
        this,
        'POST',
        ENDPOINTS.SAVED_SEARCHES,
        toFormData(body),
      )) as SplunkResponse;

      response = formatEntries(result.entry || [])[0] || { success: true, name };
      break;
    }

    case 'get': {
      const name = this.getNodeParameter('name', i) as string;
      const simplify = this.getNodeParameter('simplify', i) as boolean;

      const result = (await splunkApiRequest.call(
        this,
        'GET',
        ENDPOINTS.SAVED_SEARCH(name),
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
        ENDPOINTS.SAVED_SEARCHES,
      )) as SplunkResponse;

      let entries = result.entry || [];
      if (!returnAll && limit > 0) {
        entries = entries.slice(0, limit);
      }

      response = simplify ? formatEntries(entries) : (entries as unknown as IDataObject[]);
      break;
    }

    case 'update': {
      const name = this.getNodeParameter('name', i) as string;
      const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

      const result = (await splunkApiRequest.call(
        this,
        'POST',
        ENDPOINTS.SAVED_SEARCH(name),
        toFormData(updateFields),
      )) as SplunkResponse;

      response = formatEntries(result.entry || [])[0] || { success: true, name };
      break;
    }

    case 'delete': {
      const name = this.getNodeParameter('name', i) as string;

      await splunkApiRequest.call(this, 'DELETE', ENDPOINTS.SAVED_SEARCH(name));

      response = { success: true, name, deleted: true };
      break;
    }

    case 'run': {
      const name = this.getNodeParameter('name', i) as string;
      const runOptions = this.getNodeParameter('runOptions', i) as IDataObject;

      const result = (await splunkApiRequest.call(
        this,
        'POST',
        ENDPOINTS.SAVED_SEARCH_DISPATCH(name),
        toFormData(runOptions),
      )) as SplunkResponse;

      const sid = (result as IDataObject).sid || (result.entry?.[0]?.content as IDataObject)?.sid;
      response = { success: true, name, sid };
      break;
    }

    case 'getHistory': {
      const name = this.getNodeParameter('name', i) as string;
      const returnAll = this.getNodeParameter('returnAll', i) as boolean;
      const simplify = this.getNodeParameter('simplify', i) as boolean;
      const limit = returnAll ? 0 : (this.getNodeParameter('limit', i) as number);

      const result = (await splunkApiRequest.call(
        this,
        'GET',
        ENDPOINTS.SAVED_SEARCH_HISTORY(name),
      )) as SplunkResponse;

      let entries = result.entry || [];
      if (!returnAll && limit > 0) {
        entries = entries.slice(0, limit);
      }

      response = simplify ? formatEntries(entries) : (entries as unknown as IDataObject[]);
      break;
    }

    case 'acknowledge': {
      const name = this.getNodeParameter('name', i) as string;

      await splunkApiRequest.call(this, 'POST', ENDPOINTS.SAVED_SEARCH_ACK(name));

      response = { success: true, name, acknowledged: true };
      break;
    }

    default:
      throw new Error(`Operation ${operation} not supported`);
  }

  return response;
}
