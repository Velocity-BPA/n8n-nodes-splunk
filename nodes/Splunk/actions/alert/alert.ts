/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import { splunkApiRequest, splunkApiRequestAllItems, formatEntries } from '../../transport/api';
import { ENDPOINTS } from '../../constants/endpoints';
import { toFormData } from '../../utils/helpers';
import type { SplunkResponse } from '../../types/SplunkTypes';

export const alertOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['alert'],
      },
    },
    options: [
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete a fired alert',
        action: 'Delete a fired alert',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get alert details',
        action: 'Get an alert',
      },
      {
        name: 'Get Actions',
        value: 'getActions',
        description: 'Get configured alert actions',
        action: 'Get alert actions',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        description: 'Get many fired alerts',
        action: 'Get many alerts',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update alert action',
        action: 'Update an alert',
      },
    ],
    default: 'getAll',
  },
];

export const alertFields: INodeProperties[] = [
  // Alert name
  {
    displayName: 'Alert Name',
    name: 'alertName',
    type: 'string',
    required: true,
    default: '',
    description: 'Name of the saved search/alert',
    displayOptions: {
      show: {
        resource: ['alert'],
        operation: ['get', 'getAll', 'delete', 'update'],
      },
    },
  },

  // Trigger ID
  {
    displayName: 'Trigger ID',
    name: 'triggerId',
    type: 'string',
    required: true,
    default: '',
    description: 'Specific trigger ID for the alert',
    displayOptions: {
      show: {
        resource: ['alert'],
        operation: ['get', 'delete', 'update'],
      },
    },
  },

  // Update fields
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['alert'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Severity',
        name: 'severity',
        type: 'options',
        options: [
          { name: 'Info', value: 'info' },
          { name: 'Low', value: 'low' },
          { name: 'Medium', value: 'medium' },
          { name: 'High', value: 'high' },
          { name: 'Critical', value: 'critical' },
        ],
        default: 'medium',
        description: 'Severity level for the alert',
      },
      {
        displayName: 'Comment',
        name: 'comment',
        type: 'string',
        default: '',
        description: 'Comment to add to the alert',
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
        resource: ['alert'],
        operation: ['getAll', 'getActions'],
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
        resource: ['alert'],
        operation: ['getAll', 'getActions'],
        returnAll: [false],
      },
    },
  },

  // Filters
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['alert'],
        operation: ['getAll'],
      },
    },
    options: [
      {
        displayName: 'App Context',
        name: 'ss_app',
        type: 'string',
        default: '',
        description: 'Filter by app context',
      },
      {
        displayName: 'Owner',
        name: 'ss_owner',
        type: 'string',
        default: '',
        description: 'Filter by owner of the saved search',
      },
    ],
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
        resource: ['alert'],
        operation: ['get', 'getAll', 'getActions'],
      },
    },
  },
];

export async function executeAlert(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  let response: IDataObject | IDataObject[];

  switch (operation) {
    case 'get': {
      const alertName = this.getNodeParameter('alertName', i) as string;
      const triggerId = this.getNodeParameter('triggerId', i) as string;
      const simplify = this.getNodeParameter('simplify', i) as boolean;

      const endpoint = `${ENDPOINTS.FIRED_ALERTS}/${encodeURIComponent(alertName)}/${triggerId}`;
      const result = (await splunkApiRequest.call(this, 'GET', endpoint)) as SplunkResponse;

      response = simplify ? formatEntries(result.entry || [])[0] : (result as IDataObject);
      break;
    }

    case 'getAll': {
      const alertName = this.getNodeParameter('alertName', i) as string;
      const returnAll = this.getNodeParameter('returnAll', i) as boolean;
      const simplify = this.getNodeParameter('simplify', i) as boolean;
      const filters = this.getNodeParameter('filters', i) as IDataObject;

      const qs: IDataObject = { ...filters };

      const endpoint = `${ENDPOINTS.FIRED_ALERTS}/${encodeURIComponent(alertName)}`;

      let entries;
      if (returnAll) {
        entries = await splunkApiRequestAllItems.call(this, 'GET', endpoint, undefined, qs);
      } else {
        const limit = this.getNodeParameter('limit', i) as number;
        qs.count = limit;
        const result = (await splunkApiRequest.call(this, 'GET', endpoint, undefined, qs)) as SplunkResponse;
        entries = result.entry || [];
      }

      response = simplify ? formatEntries(entries) : (entries as unknown as IDataObject[]);
      break;
    }

    case 'update': {
      const alertName = this.getNodeParameter('alertName', i) as string;
      const triggerId = this.getNodeParameter('triggerId', i) as string;
      const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

      const endpoint = `${ENDPOINTS.FIRED_ALERTS}/${encodeURIComponent(alertName)}/${triggerId}`;
      const result = (await splunkApiRequest.call(
        this,
        'POST',
        endpoint,
        toFormData(updateFields),
      )) as SplunkResponse;

      response = formatEntries(result.entry || [])[0] || { success: true, alertName, triggerId };
      break;
    }

    case 'delete': {
      const alertName = this.getNodeParameter('alertName', i) as string;
      const triggerId = this.getNodeParameter('triggerId', i) as string;

      const endpoint = `${ENDPOINTS.FIRED_ALERTS}/${encodeURIComponent(alertName)}/${triggerId}`;
      await splunkApiRequest.call(this, 'DELETE', endpoint);

      response = { success: true, alertName, triggerId, deleted: true };
      break;
    }

    case 'getActions': {
      const returnAll = this.getNodeParameter('returnAll', i) as boolean;
      const simplify = this.getNodeParameter('simplify', i) as boolean;

      let entries;
      if (returnAll) {
        entries = await splunkApiRequestAllItems.call(this, 'GET', ENDPOINTS.ALERT_ACTIONS);
      } else {
        const limit = this.getNodeParameter('limit', i) as number;
        const result = (await splunkApiRequest.call(
          this,
          'GET',
          ENDPOINTS.ALERT_ACTIONS,
          undefined,
          { count: limit },
        )) as SplunkResponse;
        entries = result.entry || [];
      }

      response = simplify ? formatEntries(entries) : (entries as unknown as IDataObject[]);
      break;
    }

    default:
      throw new Error(`Operation ${operation} not supported`);
  }

  return response;
}
