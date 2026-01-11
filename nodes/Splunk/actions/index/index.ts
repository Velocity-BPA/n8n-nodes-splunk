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

export const indexOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['index'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a new index',
        action: 'Create an index',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete an index',
        action: 'Delete an index',
      },
      {
        name: 'Disable',
        value: 'disable',
        description: 'Disable an index',
        action: 'Disable an index',
      },
      {
        name: 'Enable',
        value: 'enable',
        description: 'Enable a disabled index',
        action: 'Enable an index',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get index details',
        action: 'Get an index',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        description: 'Get many indexes',
        action: 'Get many indexes',
      },
      {
        name: 'Roll Hot Buckets',
        value: 'roll',
        description: 'Roll hot buckets to warm',
        action: 'Roll hot buckets',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update index settings',
        action: 'Update an index',
      },
    ],
    default: 'getAll',
  },
];

export const indexFields: INodeProperties[] = [
  // Index name for most operations
  {
    displayName: 'Index Name',
    name: 'name',
    type: 'string',
    required: true,
    default: '',
    description: 'The name of the index',
    displayOptions: {
      show: {
        resource: ['index'],
        operation: ['get', 'update', 'delete', 'disable', 'enable', 'roll'],
      },
    },
  },

  // Create operation fields
  {
    displayName: 'Index Name',
    name: 'name',
    type: 'string',
    required: true,
    default: '',
    description: 'The name for the new index',
    displayOptions: {
      show: {
        resource: ['index'],
        operation: ['create'],
      },
    },
  },
  {
    displayName: 'Data Type',
    name: 'datatype',
    type: 'options',
    options: [
      { name: 'Event', value: 'event' },
      { name: 'Metric', value: 'metric' },
    ],
    default: 'event',
    description: 'The type of data the index will hold',
    displayOptions: {
      show: {
        resource: ['index'],
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
        resource: ['index'],
        operation: ['create'],
      },
    },
    options: [
      {
        displayName: 'Max Data Size',
        name: 'maxDataSize',
        type: 'options',
        options: [
          { name: 'Auto', value: 'auto' },
          { name: 'Auto High Volume', value: 'auto_high_volume' },
          { name: '1 GB', value: '1000' },
          { name: '10 GB', value: '10000' },
        ],
        default: 'auto',
        description: 'Maximum bucket size',
      },
      {
        displayName: 'Max Total Data Size (MB)',
        name: 'maxTotalDataSizeMB',
        type: 'number',
        default: 500000,
        description: 'Maximum total size of all buckets',
      },
      {
        displayName: 'Max Hot Buckets',
        name: 'maxHotBuckets',
        type: 'number',
        default: 3,
        description: 'Maximum number of hot buckets',
      },
      {
        displayName: 'Max Warm Buckets',
        name: 'maxWarmDBCount',
        type: 'number',
        default: 300,
        description: 'Maximum number of warm buckets',
      },
      {
        displayName: 'Frozen Time Period (Seconds)',
        name: 'frozenTimePeriodInSecs',
        type: 'number',
        default: 188697600,
        description: 'Time in seconds before data is frozen (default ~6 years)',
      },
      {
        displayName: 'Home Path',
        name: 'homePath',
        type: 'string',
        default: '',
        description: 'Path for hot/warm buckets (leave empty for default)',
      },
      {
        displayName: 'Cold Path',
        name: 'coldPath',
        type: 'string',
        default: '',
        description: 'Path for cold buckets (leave empty for default)',
      },
      {
        displayName: 'Thawed Path',
        name: 'thawedPath',
        type: 'string',
        default: '',
        description: 'Path for thawed buckets (leave empty for default)',
      },
      {
        displayName: 'Replication Factor',
        name: 'repFactor',
        type: 'string',
        default: '',
        description: 'Replication factor for clustering',
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
        resource: ['index'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Max Data Size',
        name: 'maxDataSize',
        type: 'string',
        default: '',
        description: 'Maximum bucket size (auto, auto_high_volume, or size in MB)',
      },
      {
        displayName: 'Max Total Data Size (MB)',
        name: 'maxTotalDataSizeMB',
        type: 'number',
        default: 0,
        description: 'Maximum total size of all buckets',
      },
      {
        displayName: 'Max Hot Buckets',
        name: 'maxHotBuckets',
        type: 'number',
        default: 0,
        description: 'Maximum number of hot buckets',
      },
      {
        displayName: 'Max Warm Buckets',
        name: 'maxWarmDBCount',
        type: 'number',
        default: 0,
        description: 'Maximum number of warm buckets',
      },
      {
        displayName: 'Frozen Time Period (Seconds)',
        name: 'frozenTimePeriodInSecs',
        type: 'number',
        default: 0,
        description: 'Time in seconds before data is frozen',
      },
      {
        displayName: 'Cold To Frozen Dir',
        name: 'coldToFrozenDir',
        type: 'string',
        default: '',
        description: 'Directory to move frozen buckets to',
      },
      {
        displayName: 'Min Raw File Sync Secs',
        name: 'minRawFileSyncSecs',
        type: 'string',
        default: '',
        description: 'Minimum time between raw data syncs',
      },
      {
        displayName: 'Disabled',
        name: 'disabled',
        type: 'boolean',
        default: false,
        description: 'Whether to disable the index',
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
        resource: ['index'],
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
        resource: ['index'],
        operation: ['getAll'],
        returnAll: [false],
      },
    },
  },
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['index'],
        operation: ['getAll'],
      },
    },
    options: [
      {
        displayName: 'Data Type',
        name: 'datatype',
        type: 'options',
        options: [
          { name: 'All', value: '' },
          { name: 'Event', value: 'event' },
          { name: 'Metric', value: 'metric' },
        ],
        default: '',
        description: 'Filter by data type',
      },
      {
        displayName: 'Search',
        name: 'search',
        type: 'string',
        default: '',
        description: 'Filter indexes by name pattern',
      },
    ],
  },
  {
    displayName: 'Simplify',
    name: 'simplify',
    type: 'boolean',
    default: true,
    description: 'Whether to return a simplified version of the response',
    displayOptions: {
      show: {
        resource: ['index'],
        operation: ['get', 'getAll'],
      },
    },
  },
];

export async function executeIndex(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  let response: IDataObject | IDataObject[];

  switch (operation) {
    case 'create': {
      const name = this.getNodeParameter('name', i) as string;
      const datatype = this.getNodeParameter('datatype', i) as string;
      const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

      const body: IDataObject = {
        name,
        datatype,
        ...additionalFields,
      };

      const result = (await splunkApiRequest.call(
        this,
        'POST',
        ENDPOINTS.INDEXES,
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
        ENDPOINTS.INDEX(name),
      )) as SplunkResponse;

      response = simplify ? formatEntries(result.entry || [])[0] : (result as IDataObject);
      break;
    }

    case 'getAll': {
      const returnAll = this.getNodeParameter('returnAll', i) as boolean;
      const simplify = this.getNodeParameter('simplify', i) as boolean;
      const limit = returnAll ? 0 : (this.getNodeParameter('limit', i) as number);
      const filters = this.getNodeParameter('filters', i) as IDataObject;

      const qs: IDataObject = {};
      if (filters.datatype) {
        qs.datatype = filters.datatype;
      }
      if (filters.search) {
        qs.search = filters.search;
      }

      const result = (await splunkApiRequest.call(
        this,
        'GET',
        ENDPOINTS.INDEXES,
        undefined,
        qs,
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

      // Filter out empty/zero values
      const filteredFields: IDataObject = {};
      for (const [key, value] of Object.entries(updateFields)) {
        if (value !== '' && value !== 0 && value !== undefined) {
          filteredFields[key] = value;
        }
      }

      const result = (await splunkApiRequest.call(
        this,
        'POST',
        ENDPOINTS.INDEX(name),
        toFormData(filteredFields),
      )) as SplunkResponse;

      response = formatEntries(result.entry || [])[0] || { success: true, name };
      break;
    }

    case 'delete': {
      const name = this.getNodeParameter('name', i) as string;

      await splunkApiRequest.call(this, 'DELETE', ENDPOINTS.INDEX(name));

      response = { success: true, name, deleted: true };
      break;
    }

    case 'disable': {
      const name = this.getNodeParameter('name', i) as string;

      await splunkApiRequest.call(this, 'POST', ENDPOINTS.INDEX_DISABLE(name));

      response = { success: true, name, disabled: true };
      break;
    }

    case 'enable': {
      const name = this.getNodeParameter('name', i) as string;

      await splunkApiRequest.call(this, 'POST', ENDPOINTS.INDEX_ENABLE(name));

      response = { success: true, name, enabled: true };
      break;
    }

    case 'roll': {
      const name = this.getNodeParameter('name', i) as string;

      await splunkApiRequest.call(this, 'POST', ENDPOINTS.INDEX_ROLL_HOT_BUCKETS(name));

      response = { success: true, name, action: 'hot_buckets_rolled' };
      break;
    }

    default:
      throw new Error(`Operation ${operation} not supported`);
  }

  return response;
}
