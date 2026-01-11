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

export const userOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['user'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a user',
        action: 'Create a user',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete a user',
        action: 'Delete a user',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get user details',
        action: 'Get a user',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        description: 'Get many users',
        action: 'Get many users',
      },
      {
        name: 'Get Roles',
        value: 'getRoles',
        description: 'Get user roles',
        action: 'Get user roles',
      },
      {
        name: 'Set Roles',
        value: 'setRoles',
        description: 'Set user roles',
        action: 'Set user roles',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update user',
        action: 'Update a user',
      },
    ],
    default: 'getAll',
  },
];

export const userFields: INodeProperties[] = [
  // Username
  {
    displayName: 'Username',
    name: 'username',
    type: 'string',
    required: true,
    default: '',
    description: 'The username',
    displayOptions: {
      show: {
        resource: ['user'],
        operation: ['get', 'update', 'delete', 'getRoles', 'setRoles'],
      },
    },
  },

  // Create fields
  {
    displayName: 'Username',
    name: 'username',
    type: 'string',
    required: true,
    default: '',
    description: 'Username for the new user',
    displayOptions: {
      show: {
        resource: ['user'],
        operation: ['create'],
      },
    },
  },
  {
    displayName: 'Password',
    name: 'password',
    type: 'string',
    typeOptions: {
      password: true,
    },
    required: true,
    default: '',
    description: 'Password for the new user',
    displayOptions: {
      show: {
        resource: ['user'],
        operation: ['create'],
      },
    },
  },
  {
    displayName: 'Roles',
    name: 'roles',
    type: 'string',
    required: true,
    default: 'user',
    description: 'Comma-separated list of roles to assign',
    displayOptions: {
      show: {
        resource: ['user'],
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
        resource: ['user'],
        operation: ['create'],
      },
    },
    options: [
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        default: '',
        placeholder: 'user@example.com',
        description: 'Email address',
      },
      {
        displayName: 'Real Name',
        name: 'realname',
        type: 'string',
        default: '',
        description: 'Display name',
      },
      {
        displayName: 'Default App',
        name: 'defaultApp',
        type: 'string',
        default: 'search',
        description: 'Default app for the user',
      },
      {
        displayName: 'Timezone',
        name: 'tz',
        type: 'string',
        default: '',
        placeholder: 'America/New_York',
        description: 'User timezone',
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
        resource: ['user'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Password',
        name: 'password',
        type: 'string',
        typeOptions: {
          password: true,
        },
        default: '',
        description: 'New password',
      },
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        default: '',
        description: 'Email address',
      },
      {
        displayName: 'Real Name',
        name: 'realname',
        type: 'string',
        default: '',
        description: 'Display name',
      },
      {
        displayName: 'Default App',
        name: 'defaultApp',
        type: 'string',
        default: '',
        description: 'Default app',
      },
      {
        displayName: 'Timezone',
        name: 'tz',
        type: 'string',
        default: '',
        description: 'User timezone',
      },
      {
        displayName: 'Roles',
        name: 'roles',
        type: 'string',
        default: '',
        description: 'Comma-separated list of roles',
      },
    ],
  },

  // Set Roles
  {
    displayName: 'Roles',
    name: 'roles',
    type: 'string',
    required: true,
    default: '',
    description: 'Comma-separated list of roles to assign',
    displayOptions: {
      show: {
        resource: ['user'],
        operation: ['setRoles'],
      },
    },
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
        resource: ['user'],
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
        resource: ['user'],
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
        resource: ['user'],
        operation: ['get', 'getAll', 'getRoles'],
      },
    },
  },
];

export async function executeUser(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  let response: IDataObject | IDataObject[];

  switch (operation) {
    case 'create': {
      const username = this.getNodeParameter('username', i) as string;
      const password = this.getNodeParameter('password', i) as string;
      const roles = this.getNodeParameter('roles', i) as string;
      const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

      const body: IDataObject = {
        name: username,
        password,
        roles: roles.split(',').map((r) => r.trim()),
        ...additionalFields,
      };

      const result = (await splunkApiRequest.call(
        this,
        'POST',
        ENDPOINTS.USERS,
        toFormData(body),
      )) as SplunkResponse;

      response = formatEntries(result.entry || [])[0] || { success: true, username };
      break;
    }

    case 'get': {
      const username = this.getNodeParameter('username', i) as string;
      const simplify = this.getNodeParameter('simplify', i) as boolean;

      const endpoint = ENDPOINTS.USER(username);
      const result = (await splunkApiRequest.call(this, 'GET', endpoint)) as SplunkResponse;

      response = simplify ? formatEntries(result.entry || [])[0] : (result as IDataObject);
      break;
    }

    case 'getAll': {
      const returnAll = this.getNodeParameter('returnAll', i) as boolean;
      const simplify = this.getNodeParameter('simplify', i) as boolean;

      let entries;
      if (returnAll) {
        entries = await splunkApiRequestAllItems.call(this, 'GET', ENDPOINTS.USERS);
      } else {
        const limit = this.getNodeParameter('limit', i) as number;
        const result = (await splunkApiRequest.call(
          this,
          'GET',
          ENDPOINTS.USERS,
          undefined,
          { count: limit },
        )) as SplunkResponse;
        entries = result.entry || [];
      }

      response = simplify ? formatEntries(entries) : (entries as unknown as IDataObject[]);
      break;
    }

    case 'update': {
      const username = this.getNodeParameter('username', i) as string;
      const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

      // Convert roles string to array if present
      if (updateFields.roles && typeof updateFields.roles === 'string') {
        updateFields.roles = (updateFields.roles as string).split(',').map((r) => r.trim());
      }

      const endpoint = ENDPOINTS.USER(username);
      const result = (await splunkApiRequest.call(
        this,
        'POST',
        endpoint,
        toFormData(updateFields),
      )) as SplunkResponse;

      response = formatEntries(result.entry || [])[0] || { success: true, username };
      break;
    }

    case 'delete': {
      const username = this.getNodeParameter('username', i) as string;

      const endpoint = ENDPOINTS.USER(username);
      await splunkApiRequest.call(this, 'DELETE', endpoint);

      response = { success: true, username, deleted: true };
      break;
    }

    case 'getRoles': {
      const username = this.getNodeParameter('username', i) as string;
      const simplify = this.getNodeParameter('simplify', i) as boolean;

      const endpoint = ENDPOINTS.USER(username);
      const result = (await splunkApiRequest.call(this, 'GET', endpoint)) as SplunkResponse;

      if (simplify && result.entry && result.entry[0]) {
        const content = (result.entry[0].content || {}) as IDataObject;
        response = {
          username,
          roles: content.roles || [],
          defaultApp: content.defaultApp,
        };
      } else {
        response = result as IDataObject;
      }
      break;
    }

    case 'setRoles': {
      const username = this.getNodeParameter('username', i) as string;
      const roles = this.getNodeParameter('roles', i) as string;

      const body = {
        roles: roles.split(',').map((r) => r.trim()),
      };

      const endpoint = ENDPOINTS.USER(username);
      const result = (await splunkApiRequest.call(
        this,
        'POST',
        endpoint,
        toFormData(body),
      )) as SplunkResponse;

      response = formatEntries(result.entry || [])[0] || { success: true, username, roles: body.roles };
      break;
    }

    default:
      throw new Error(`Operation ${operation} not supported`);
  }

  return response;
}
