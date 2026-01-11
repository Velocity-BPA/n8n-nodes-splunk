/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import { splunkApiRequest, splunkApiRequestAllItems, formatEntries } from '../../transport/api';
import { toFormData } from '../../utils/helpers';
import type { SplunkResponse } from '../../types/SplunkTypes';

export const kvStoreOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['kvStore'],
      },
    },
    options: [
      {
        name: 'Create Collection',
        value: 'createCollection',
        description: 'Create a KV Store collection',
        action: 'Create a KV Store collection',
      },
      {
        name: 'Delete Collection',
        value: 'deleteCollection',
        description: 'Delete a KV Store collection',
        action: 'Delete a KV Store collection',
      },
      {
        name: 'Delete Record',
        value: 'deleteRecord',
        description: 'Delete a record from a collection',
        action: 'Delete a KV Store record',
      },
      {
        name: 'Get Collection',
        value: 'getCollection',
        description: 'Get collection info',
        action: 'Get a KV Store collection',
      },
      {
        name: 'Get Many Collections',
        value: 'getAllCollections',
        description: 'Get many collections',
        action: 'Get many KV Store collections',
      },
      {
        name: 'Get Record',
        value: 'getRecord',
        description: 'Get a single record',
        action: 'Get a KV Store record',
      },
      {
        name: 'Get Records',
        value: 'getRecords',
        description: 'Get all records from a collection',
        action: 'Get KV Store records',
      },
      {
        name: 'Insert Record',
        value: 'insertRecord',
        description: 'Insert a record into a collection',
        action: 'Insert a KV Store record',
      },
      {
        name: 'Query Records',
        value: 'queryRecords',
        description: 'Query records with filter',
        action: 'Query KV Store records',
      },
      {
        name: 'Update Record',
        value: 'updateRecord',
        description: 'Update a record in a collection',
        action: 'Update a KV Store record',
      },
    ],
    default: 'getAllCollections',
  },
];

export const kvStoreFields: INodeProperties[] = [
  // App context
  {
    displayName: 'App',
    name: 'app',
    type: 'string',
    required: true,
    default: 'search',
    description: 'App context for the KV Store',
    displayOptions: {
      show: {
        resource: ['kvStore'],
      },
    },
  },

  // Collection name
  {
    displayName: 'Collection Name',
    name: 'collection',
    type: 'string',
    required: true,
    default: '',
    description: 'Name of the collection',
    displayOptions: {
      show: {
        resource: ['kvStore'],
        operation: [
          'getCollection',
          'deleteCollection',
          'insertRecord',
          'getRecords',
          'getRecord',
          'updateRecord',
          'deleteRecord',
          'queryRecords',
        ],
      },
    },
  },

  // Create collection
  {
    displayName: 'Collection Name',
    name: 'collection',
    type: 'string',
    required: true,
    default: '',
    description: 'Name for the new collection',
    displayOptions: {
      show: {
        resource: ['kvStore'],
        operation: ['createCollection'],
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
        resource: ['kvStore'],
        operation: ['createCollection'],
      },
    },
    options: [
      {
        displayName: 'Enforced Types (JSON)',
        name: 'enforcedTypes',
        type: 'json',
        default: '{}',
        description: 'JSON object mapping field names to types (string, number, bool, time, array)',
      },
      {
        displayName: 'Accelerations (JSON)',
        name: 'accelerations',
        type: 'json',
        default: '[]',
        description: 'JSON array of acceleration configurations',
      },
    ],
  },

  // Record key
  {
    displayName: 'Record Key',
    name: 'recordKey',
    type: 'string',
    required: true,
    default: '',
    description: 'The _key value of the record',
    displayOptions: {
      show: {
        resource: ['kvStore'],
        operation: ['getRecord', 'updateRecord', 'deleteRecord'],
      },
    },
  },

  // Record data
  {
    displayName: 'Record Data (JSON)',
    name: 'recordData',
    type: 'json',
    required: true,
    default: '{}',
    description: 'JSON object with the record data',
    displayOptions: {
      show: {
        resource: ['kvStore'],
        operation: ['insertRecord', 'updateRecord'],
      },
    },
  },

  // Query filter
  {
    displayName: 'Query Filter (JSON)',
    name: 'queryFilter',
    type: 'json',
    default: '{}',
    description: 'MongoDB-style query filter as JSON (e.g., {"status": "active"})',
    displayOptions: {
      show: {
        resource: ['kvStore'],
        operation: ['queryRecords'],
      },
    },
  },

  // Query options
  {
    displayName: 'Query Options',
    name: 'queryOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['kvStore'],
        operation: ['queryRecords', 'getRecords'],
      },
    },
    options: [
      {
        displayName: 'Sort',
        name: 'sort',
        type: 'string',
        default: '',
        placeholder: 'field:1 or field:-1',
        description: 'Sort field and direction (1 for ascending, -1 for descending)',
      },
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 100,
        description: 'Maximum number of records to return',
      },
      {
        displayName: 'Skip',
        name: 'skip',
        type: 'number',
        default: 0,
        description: 'Number of records to skip',
      },
      {
        displayName: 'Fields',
        name: 'fields',
        type: 'string',
        default: '',
        description: 'Comma-separated list of fields to return',
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
        resource: ['kvStore'],
        operation: ['getAllCollections'],
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
        resource: ['kvStore'],
        operation: ['getAllCollections'],
        returnAll: [false],
      },
    },
  },

  // Simplify
  {
    displayName: 'Simplify',
    name: 'simplify',
    type: 'boolean',
    default: true,
    description: 'Whether to return a simplified version of the response',
    displayOptions: {
      show: {
        resource: ['kvStore'],
        operation: ['getCollection', 'getAllCollections'],
      },
    },
  },
];

export async function executeKvStore(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  let response: IDataObject | IDataObject[];
  const app = this.getNodeParameter('app', i) as string;

  // Build base endpoint for KV Store operations
  const kvStoreBase = `/servicesNS/nobody/${encodeURIComponent(app)}/storage/collections`;

  switch (operation) {
    case 'createCollection': {
      const collection = this.getNodeParameter('collection', i) as string;
      const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

      const body: IDataObject = {
        name: collection,
      };

      // Handle enforced types
      if (additionalFields.enforcedTypes) {
        try {
          const types = JSON.parse(additionalFields.enforcedTypes as string) as Record<string, string>;
          for (const [field, type] of Object.entries(types)) {
            body[`field.${field}`] = type;
          }
        } catch {
          // Ignore parse errors
        }
      }

      // Handle accelerations
      if (additionalFields.accelerations) {
        try {
          const accel = JSON.parse(additionalFields.accelerations as string);
          for (let j = 0; j < accel.length; j++) {
            body[`accelerated_fields.accel_${j}`] = JSON.stringify(accel[j]);
          }
        } catch {
          // Ignore parse errors
        }
      }

      const endpoint = `${kvStoreBase}/config`;
      const result = (await splunkApiRequest.call(
        this,
        'POST',
        endpoint,
        toFormData(body),
      )) as SplunkResponse;

      response = formatEntries(result.entry || [])[0] || { success: true, collection, app };
      break;
    }

    case 'getCollection': {
      const collection = this.getNodeParameter('collection', i) as string;
      const simplify = this.getNodeParameter('simplify', i) as boolean;

      const endpoint = `${kvStoreBase}/config/${encodeURIComponent(collection)}`;
      const result = (await splunkApiRequest.call(this, 'GET', endpoint)) as SplunkResponse;

      response = simplify ? formatEntries(result.entry || [])[0] : (result as IDataObject);
      break;
    }

    case 'getAllCollections': {
      const returnAll = this.getNodeParameter('returnAll', i) as boolean;
      const simplify = this.getNodeParameter('simplify', i) as boolean;

      const endpoint = `${kvStoreBase}/config`;

      let entries;
      if (returnAll) {
        entries = await splunkApiRequestAllItems.call(this, 'GET', endpoint);
      } else {
        const limit = this.getNodeParameter('limit', i) as number;
        const result = (await splunkApiRequest.call(
          this,
          'GET',
          endpoint,
          undefined,
          { count: limit },
        )) as SplunkResponse;
        entries = result.entry || [];
      }

      response = simplify ? formatEntries(entries) : (entries as unknown as IDataObject[]);
      break;
    }

    case 'deleteCollection': {
      const collection = this.getNodeParameter('collection', i) as string;

      const endpoint = `${kvStoreBase}/config/${encodeURIComponent(collection)}`;
      await splunkApiRequest.call(this, 'DELETE', endpoint);

      response = { success: true, collection, app, deleted: true };
      break;
    }

    case 'insertRecord': {
      const collection = this.getNodeParameter('collection', i) as string;
      const recordData = this.getNodeParameter('recordData', i) as string;

      let data: IDataObject;
      try {
        data = JSON.parse(recordData);
      } catch {
        throw new Error('Invalid JSON in Record Data');
      }

      const endpoint = `${kvStoreBase}/data/${encodeURIComponent(collection)}`;

      // KV Store data endpoint expects JSON, not form data
      const result = (await splunkApiRequest.call(
        this,
        'POST',
        endpoint,
        JSON.stringify(data),
        undefined,
        { 'Content-Type': 'application/json' },
      )) as IDataObject;

      response = result as IDataObject;
      break;
    }

    case 'getRecords': {
      const collection = this.getNodeParameter('collection', i) as string;
      const queryOptions = this.getNodeParameter('queryOptions', i) as IDataObject;

      const qs: IDataObject = {};
      if (queryOptions.sort) qs.sort = queryOptions.sort;
      if (queryOptions.limit) qs.limit = queryOptions.limit;
      if (queryOptions.skip) qs.skip = queryOptions.skip;
      if (queryOptions.fields) qs.fields = queryOptions.fields;

      const endpoint = `${kvStoreBase}/data/${encodeURIComponent(collection)}`;
      response = (await splunkApiRequest.call(this, 'GET', endpoint, undefined, qs)) as IDataObject[];
      break;
    }

    case 'getRecord': {
      const collection = this.getNodeParameter('collection', i) as string;
      const recordKey = this.getNodeParameter('recordKey', i) as string;

      const endpoint = `${kvStoreBase}/data/${encodeURIComponent(collection)}/${encodeURIComponent(recordKey)}`;
      response = (await splunkApiRequest.call(this, 'GET', endpoint)) as IDataObject;
      break;
    }

    case 'updateRecord': {
      const collection = this.getNodeParameter('collection', i) as string;
      const recordKey = this.getNodeParameter('recordKey', i) as string;
      const recordData = this.getNodeParameter('recordData', i) as string;

      let data: IDataObject;
      try {
        data = JSON.parse(recordData);
      } catch {
        throw new Error('Invalid JSON in Record Data');
      }

      const endpoint = `${kvStoreBase}/data/${encodeURIComponent(collection)}/${encodeURIComponent(recordKey)}`;
      response = (await splunkApiRequest.call(
        this,
        'POST',
        endpoint,
        JSON.stringify(data),
        undefined,
        { 'Content-Type': 'application/json' },
      )) as IDataObject;
      break;
    }

    case 'deleteRecord': {
      const collection = this.getNodeParameter('collection', i) as string;
      const recordKey = this.getNodeParameter('recordKey', i) as string;

      const endpoint = `${kvStoreBase}/data/${encodeURIComponent(collection)}/${encodeURIComponent(recordKey)}`;
      await splunkApiRequest.call(this, 'DELETE', endpoint);

      response = { success: true, collection, recordKey, deleted: true };
      break;
    }

    case 'queryRecords': {
      const collection = this.getNodeParameter('collection', i) as string;
      const queryFilter = this.getNodeParameter('queryFilter', i) as string;
      const queryOptions = this.getNodeParameter('queryOptions', i) as IDataObject;

      const qs: IDataObject = {};

      // Parse and add query filter
      try {
        const filter = JSON.parse(queryFilter);
        if (Object.keys(filter).length > 0) {
          qs.query = JSON.stringify(filter);
        }
      } catch {
        // Ignore parse errors, use empty query
      }

      if (queryOptions.sort) qs.sort = queryOptions.sort;
      if (queryOptions.limit) qs.limit = queryOptions.limit;
      if (queryOptions.skip) qs.skip = queryOptions.skip;
      if (queryOptions.fields) qs.fields = queryOptions.fields;

      const endpoint = `${kvStoreBase}/data/${encodeURIComponent(collection)}`;
      response = (await splunkApiRequest.call(this, 'GET', endpoint, undefined, qs)) as IDataObject[];
      break;
    }

    default:
      throw new Error(`Operation ${operation} not supported`);
  }

  return response;
}
