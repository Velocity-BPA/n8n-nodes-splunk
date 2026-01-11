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

export const roleOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['role'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a role',
        action: 'Create a role',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete a role',
        action: 'Delete a role',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get role details',
        action: 'Get a role',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        description: 'Get many roles',
        action: 'Get many roles',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update role capabilities',
        action: 'Update a role',
      },
    ],
    default: 'getAll',
  },
];

export const roleFields: INodeProperties[] = [
  // Role name
  {
    displayName: 'Role Name',
    name: 'roleName',
    type: 'string',
    required: true,
    default: '',
    description: 'Name of the role',
    displayOptions: {
      show: {
        resource: ['role'],
        operation: ['get', 'update', 'delete'],
      },
    },
  },

  // Create fields
  {
    displayName: 'Role Name',
    name: 'roleName',
    type: 'string',
    required: true,
    default: '',
    description: 'Name for the new role',
    displayOptions: {
      show: {
        resource: ['role'],
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
        resource: ['role'],
        operation: ['create'],
      },
    },
    options: [
      {
        displayName: 'Imported Roles',
        name: 'imported_roles',
        type: 'string',
        default: '',
        description: 'Comma-separated list of roles to inherit from',
      },
      {
        displayName: 'Capabilities',
        name: 'capabilities',
        type: 'string',
        default: '',
        description: 'Comma-separated list of capabilities',
      },
      {
        displayName: 'Search Filter',
        name: 'srchFilter',
        type: 'string',
        default: '',
        description: 'Search filter restriction',
      },
      {
        displayName: 'Allowed Indexes',
        name: 'srchIndexesAllowed',
        type: 'string',
        default: '',
        description: 'Comma-separated list of allowed indexes',
      },
      {
        displayName: 'Default Indexes',
        name: 'srchIndexesDefault',
        type: 'string',
        default: '',
        description: 'Comma-separated list of default search indexes',
      },
      {
        displayName: 'Search Job Quota',
        name: 'srchJobsQuota',
        type: 'number',
        default: 3,
        description: 'Maximum concurrent search jobs',
      },
      {
        displayName: 'Real-Time Search Quota',
        name: 'rtSrchJobsQuota',
        type: 'number',
        default: 6,
        description: 'Maximum concurrent real-time search jobs',
      },
      {
        displayName: 'Search Disk Quota',
        name: 'srchDiskQuota',
        type: 'number',
        default: 100,
        description: 'Disk space quota in MB for search jobs',
      },
      {
        displayName: 'Search Time Window',
        name: 'srchTimeWin',
        type: 'number',
        default: -1,
        description: 'Maximum time window in seconds for searches (-1 for unlimited)',
      },
    ],
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
        resource: ['role'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Imported Roles',
        name: 'imported_roles',
        type: 'string',
        default: '',
        description: 'Comma-separated list of roles to inherit from',
      },
      {
        displayName: 'Capabilities',
        name: 'capabilities',
        type: 'string',
        default: '',
        description: 'Comma-separated list of capabilities',
      },
      {
        displayName: 'Search Filter',
        name: 'srchFilter',
        type: 'string',
        default: '',
        description: 'Search filter restriction',
      },
      {
        displayName: 'Allowed Indexes',
        name: 'srchIndexesAllowed',
        type: 'string',
        default: '',
        description: 'Comma-separated list of allowed indexes',
      },
      {
        displayName: 'Default Indexes',
        name: 'srchIndexesDefault',
        type: 'string',
        default: '',
        description: 'Comma-separated list of default search indexes',
      },
      {
        displayName: 'Search Job Quota',
        name: 'srchJobsQuota',
        type: 'number',
        default: 3,
        description: 'Maximum concurrent search jobs',
      },
      {
        displayName: 'Real-Time Search Quota',
        name: 'rtSrchJobsQuota',
        type: 'number',
        default: 6,
        description: 'Maximum concurrent real-time search jobs',
      },
      {
        displayName: 'Search Disk Quota',
        name: 'srchDiskQuota',
        type: 'number',
        default: 100,
        description: 'Disk space quota in MB',
      },
      {
        displayName: 'Search Time Window',
        name: 'srchTimeWin',
        type: 'number',
        default: -1,
        description: 'Maximum time window in seconds (-1 for unlimited)',
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
        resource: ['role'],
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
        resource: ['role'],
        operation: ['getAll'],
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
        resource: ['role'],
        operation: ['get', 'getAll'],
      },
    },
  },
];

function processRoleFields(fields: IDataObject): IDataObject {
  const processed: IDataObject = { ...fields };

  // Convert comma-separated strings to arrays for specific fields
  const arrayFields = ['imported_roles', 'capabilities', 'srchIndexesAllowed', 'srchIndexesDefault'];

  for (const field of arrayFields) {
    if (processed[field] && typeof processed[field] === 'string') {
      const value = processed[field] as string;
      if (value.trim()) {
        processed[field] = value.split(',').map((v) => v.trim());
      } else {
        delete processed[field];
      }
    }
  }

  return processed;
}

export async function executeRole(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  let response: IDataObject | IDataObject[];

  switch (operation) {
    case 'create': {
      const roleName = this.getNodeParameter('roleName', i) as string;
      const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

      const body = processRoleFields({
        name: roleName,
        ...additionalFields,
      });

      const result = (await splunkApiRequest.call(
        this,
        'POST',
        ENDPOINTS.ROLES,
        toFormData(body),
      )) as SplunkResponse;

      response = formatEntries(result.entry || [])[0] || { success: true, roleName };
      break;
    }

    case 'get': {
      const roleName = this.getNodeParameter('roleName', i) as string;
      const simplify = this.getNodeParameter('simplify', i) as boolean;

      const endpoint = ENDPOINTS.ROLE(roleName);
      const result = (await splunkApiRequest.call(this, 'GET', endpoint)) as SplunkResponse;

      response = simplify ? formatEntries(result.entry || [])[0] : (result as IDataObject);
      break;
    }

    case 'getAll': {
      const returnAll = this.getNodeParameter('returnAll', i) as boolean;
      const simplify = this.getNodeParameter('simplify', i) as boolean;

      let entries;
      if (returnAll) {
        entries = await splunkApiRequestAllItems.call(this, 'GET', ENDPOINTS.ROLES);
      } else {
        const limit = this.getNodeParameter('limit', i) as number;
        const result = (await splunkApiRequest.call(
          this,
          'GET',
          ENDPOINTS.ROLES,
          undefined,
          { count: limit },
        )) as SplunkResponse;
        entries = result.entry || [];
      }

      response = simplify ? formatEntries(entries) : (entries as unknown as IDataObject[]);
      break;
    }

    case 'update': {
      const roleName = this.getNodeParameter('roleName', i) as string;
      const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

      const body = processRoleFields(updateFields);

      const endpoint = ENDPOINTS.ROLE(roleName);
      const result = (await splunkApiRequest.call(
        this,
        'POST',
        endpoint,
        toFormData(body),
      )) as SplunkResponse;

      response = formatEntries(result.entry || [])[0] || { success: true, roleName };
      break;
    }

    case 'delete': {
      const roleName = this.getNodeParameter('roleName', i) as string;

      const endpoint = ENDPOINTS.ROLE(roleName);
      await splunkApiRequest.call(this, 'DELETE', endpoint);

      response = { success: true, roleName, deleted: true };
      break;
    }

    default:
      throw new Error(`Operation ${operation} not supported`);
  }

  return response;
}
