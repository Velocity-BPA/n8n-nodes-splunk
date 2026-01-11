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

export const appOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['app'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Install an app',
        action: 'Install an app',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Uninstall an app',
        action: 'Uninstall an app',
      },
      {
        name: 'Disable',
        value: 'disable',
        description: 'Disable an app',
        action: 'Disable an app',
      },
      {
        name: 'Enable',
        value: 'enable',
        description: 'Enable an app',
        action: 'Enable an app',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get app details',
        action: 'Get an app',
      },
      {
        name: 'Get Config',
        value: 'getConfig',
        description: 'Get app configuration',
        action: 'Get app configuration',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        description: 'Get many installed apps',
        action: 'Get many apps',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update app settings',
        action: 'Update an app',
      },
    ],
    default: 'getAll',
  },
];

export const appFields: INodeProperties[] = [
  // App name
  {
    displayName: 'App Name',
    name: 'appName',
    type: 'string',
    required: true,
    default: '',
    description: 'Name of the app',
    displayOptions: {
      show: {
        resource: ['app'],
        operation: ['get', 'update', 'delete', 'enable', 'disable', 'getConfig'],
      },
    },
  },

  // Create fields
  {
    displayName: 'App Name',
    name: 'appName',
    type: 'string',
    required: true,
    default: '',
    description: 'Name for the new app',
    displayOptions: {
      show: {
        resource: ['app'],
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
        resource: ['app'],
        operation: ['create'],
      },
    },
    options: [
      {
        displayName: 'Label',
        name: 'label',
        type: 'string',
        default: '',
        description: 'App display name',
      },
      {
        displayName: 'Author',
        name: 'author',
        type: 'string',
        default: '',
        description: 'App author',
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: '',
        description: 'App description',
      },
      {
        displayName: 'Version',
        name: 'version',
        type: 'string',
        default: '1.0.0',
        description: 'App version',
      },
      {
        displayName: 'Visible',
        name: 'visible',
        type: 'boolean',
        default: true,
        description: 'Whether the app is visible in the UI',
      },
      {
        displayName: 'Template',
        name: 'template',
        type: 'options',
        options: [
          { name: 'Barebones', value: 'barebones' },
          { name: 'Sample App', value: 'sample_app' },
        ],
        default: 'barebones',
        description: 'App template to use',
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
        resource: ['app'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Label',
        name: 'label',
        type: 'string',
        default: '',
        description: 'App display name',
      },
      {
        displayName: 'Author',
        name: 'author',
        type: 'string',
        default: '',
        description: 'App author',
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: '',
        description: 'App description',
      },
      {
        displayName: 'Version',
        name: 'version',
        type: 'string',
        default: '',
        description: 'App version',
      },
      {
        displayName: 'Visible',
        name: 'visible',
        type: 'boolean',
        default: true,
        description: 'Whether the app is visible in the UI',
      },
      {
        displayName: 'Configured',
        name: 'configured',
        type: 'boolean',
        default: false,
        description: 'Whether the app is configured',
      },
      {
        displayName: 'Check For Updates',
        name: 'check_for_updates',
        type: 'boolean',
        default: true,
        description: 'Whether to check for updates',
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
        resource: ['app'],
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
        resource: ['app'],
        operation: ['getAll'],
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
        resource: ['app'],
        operation: ['getAll'],
      },
    },
    options: [
      {
        displayName: 'Search',
        name: 'search',
        type: 'string',
        default: '',
        description: 'Filter apps by search string',
      },
    ],
  },

  // Config file
  {
    displayName: 'Config File',
    name: 'configFile',
    type: 'string',
    default: 'app.conf',
    description: 'Name of the configuration file to retrieve',
    displayOptions: {
      show: {
        resource: ['app'],
        operation: ['getConfig'],
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
        resource: ['app'],
        operation: ['get', 'getAll', 'getConfig'],
      },
    },
  },
];

export async function executeApp(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  let response: IDataObject | IDataObject[];

  switch (operation) {
    case 'create': {
      const appName = this.getNodeParameter('appName', i) as string;
      const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

      const body: IDataObject = {
        name: appName,
        ...additionalFields,
      };

      const result = (await splunkApiRequest.call(
        this,
        'POST',
        ENDPOINTS.APPS_LOCAL,
        toFormData(body),
      )) as SplunkResponse;

      response = formatEntries(result.entry || [])[0] || { success: true, appName };
      break;
    }

    case 'get': {
      const appName = this.getNodeParameter('appName', i) as string;
      const simplify = this.getNodeParameter('simplify', i) as boolean;

      const endpoint = ENDPOINTS.APP(appName);
      const result = (await splunkApiRequest.call(this, 'GET', endpoint)) as SplunkResponse;

      response = simplify ? formatEntries(result.entry || [])[0] : (result as IDataObject);
      break;
    }

    case 'getAll': {
      const returnAll = this.getNodeParameter('returnAll', i) as boolean;
      const simplify = this.getNodeParameter('simplify', i) as boolean;
      const filters = this.getNodeParameter('filters', i) as IDataObject;

      const qs: IDataObject = { ...filters };

      let entries;
      if (returnAll) {
        entries = await splunkApiRequestAllItems.call(this, 'GET', ENDPOINTS.APPS_LOCAL, undefined, qs);
      } else {
        const limit = this.getNodeParameter('limit', i) as number;
        qs.count = limit;
        const result = (await splunkApiRequest.call(
          this,
          'GET',
          ENDPOINTS.APPS_LOCAL,
          undefined,
          qs,
        )) as SplunkResponse;
        entries = result.entry || [];
      }

      response = simplify ? formatEntries(entries) : (entries as unknown as IDataObject[]);
      break;
    }

    case 'update': {
      const appName = this.getNodeParameter('appName', i) as string;
      const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

      const endpoint = ENDPOINTS.APP(appName);
      const result = (await splunkApiRequest.call(
        this,
        'POST',
        endpoint,
        toFormData(updateFields),
      )) as SplunkResponse;

      response = formatEntries(result.entry || [])[0] || { success: true, appName };
      break;
    }

    case 'delete': {
      const appName = this.getNodeParameter('appName', i) as string;

      const endpoint = ENDPOINTS.APP(appName);
      await splunkApiRequest.call(this, 'DELETE', endpoint);

      response = { success: true, appName, deleted: true };
      break;
    }

    case 'enable': {
      const appName = this.getNodeParameter('appName', i) as string;

      const endpoint = ENDPOINTS.APP(appName);
      await splunkApiRequest.call(this, 'POST', endpoint, toFormData({ disabled: false }));

      response = { success: true, appName, enabled: true };
      break;
    }

    case 'disable': {
      const appName = this.getNodeParameter('appName', i) as string;

      const endpoint = ENDPOINTS.APP(appName);
      await splunkApiRequest.call(this, 'POST', endpoint, toFormData({ disabled: true }));

      response = { success: true, appName, disabled: true };
      break;
    }

    case 'getConfig': {
      const appName = this.getNodeParameter('appName', i) as string;
      const configFile = this.getNodeParameter('configFile', i) as string;
      const simplify = this.getNodeParameter('simplify', i) as boolean;

      // Remove .conf extension if provided
      const configName = configFile.replace(/\.conf$/, '');
      const endpoint = `/servicesNS/nobody/${encodeURIComponent(appName)}/configs/conf-${configName}`;

      const result = (await splunkApiRequest.call(this, 'GET', endpoint)) as SplunkResponse;

      response = simplify ? formatEntries(result.entry || []) : (result as unknown as IDataObject[]);
      break;
    }

    default:
      throw new Error(`Operation ${operation} not supported`);
  }

  return response;
}
