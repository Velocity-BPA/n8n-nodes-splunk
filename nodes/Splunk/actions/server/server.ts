/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import { splunkApiRequest, formatEntries } from '../../transport/api';
import { ENDPOINTS } from '../../constants/endpoints';
import type { SplunkResponse } from '../../types/SplunkTypes';

export const serverOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['server'],
      },
    },
    options: [
      {
        name: 'Get Config',
        value: 'getConfig',
        description: 'Get server configuration',
        action: 'Get server configuration',
      },
      {
        name: 'Get Health',
        value: 'getHealth',
        description: 'Get health report',
        action: 'Get server health',
      },
      {
        name: 'Get Info',
        value: 'getInfo',
        description: 'Get server info',
        action: 'Get server info',
      },
      {
        name: 'Get Messages',
        value: 'getMessages',
        description: 'Get server messages',
        action: 'Get server messages',
      },
      {
        name: 'Get Status',
        value: 'getStatus',
        description: 'Get server status',
        action: 'Get server status',
      },
      {
        name: 'Restart',
        value: 'restart',
        description: 'Restart Splunk server',
        action: 'Restart server',
      },
    ],
    default: 'getInfo',
  },
];

export const serverFields: INodeProperties[] = [
  // Config file selection
  {
    displayName: 'Config Section',
    name: 'configSection',
    type: 'options',
    options: [
      { name: 'Server', value: 'server' },
      { name: 'Settings', value: 'settings' },
      { name: 'Introspection', value: 'introspection' },
      { name: 'License', value: 'license' },
    ],
    default: 'settings',
    description: 'Configuration section to retrieve',
    displayOptions: {
      show: {
        resource: ['server'],
        operation: ['getConfig'],
      },
    },
  },

  // Status component
  {
    displayName: 'Status Component',
    name: 'statusComponent',
    type: 'options',
    options: [
      { name: 'Dispatch', value: 'dispatch' },
      { name: 'Introspection', value: 'introspection' },
      { name: 'Partitions', value: 'partitions' },
      { name: 'Resource Usage', value: 'resource-usage' },
      { name: 'All', value: 'all' },
    ],
    default: 'all',
    description: 'Status component to retrieve',
    displayOptions: {
      show: {
        resource: ['server'],
        operation: ['getStatus'],
      },
    },
  },

  // Health options
  {
    displayName: 'Health Options',
    name: 'healthOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['server'],
        operation: ['getHealth'],
      },
    },
    options: [
      {
        displayName: 'Component',
        name: 'component',
        type: 'string',
        default: '',
        description: 'Specific component to check health for',
      },
      {
        displayName: 'Include Details',
        name: 'includeDetails',
        type: 'boolean',
        default: true,
        description: 'Whether to include detailed health information',
      },
    ],
  },

  // Restart confirmation
  {
    displayName: 'Confirm Restart',
    name: 'confirmRestart',
    type: 'boolean',
    default: false,
    required: true,
    description: 'Confirm that you want to restart the Splunk server',
    displayOptions: {
      show: {
        resource: ['server'],
        operation: ['restart'],
      },
    },
  },

  // Message filters
  {
    displayName: 'Message Filters',
    name: 'messageFilters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['server'],
        operation: ['getMessages'],
      },
    },
    options: [
      {
        displayName: 'Severity',
        name: 'severity',
        type: 'options',
        options: [
          { name: 'All', value: '' },
          { name: 'Info', value: 'info' },
          { name: 'Warn', value: 'warn' },
          { name: 'Error', value: 'error' },
        ],
        default: '',
        description: 'Filter by message severity',
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
        resource: ['server'],
        operation: ['getInfo', 'getStatus', 'getConfig', 'getMessages', 'getHealth'],
      },
    },
  },
];

export async function executeServer(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  let response: IDataObject | IDataObject[];

  switch (operation) {
    case 'getInfo': {
      const simplify = this.getNodeParameter('simplify', i) as boolean;

      const result = (await splunkApiRequest.call(this, 'GET', ENDPOINTS.SERVER_INFO)) as SplunkResponse;

      if (simplify && result.entry && result.entry[0]) {
        const content = (result.entry[0].content || {}) as IDataObject;
        response = {
          serverName: content.serverName,
          version: content.version,
          build: content.build,
          cpu_arch: content.cpu_arch,
          os_name: content.os_name,
          os_version: content.os_version,
          os_build: content.os_build,
          guid: content.guid,
          master_guid: content.master_guid,
          mode: content.mode,
          product_type: content.product_type,
          licenseState: content.licenseState,
          isFree: content.isFree,
          isTrial: content.isTrial,
          numberOfCores: content.numberOfCores,
          numberOfVirtualCores: content.numberOfVirtualCores,
          physicalMemoryMB: content.physicalMemoryMB,
          staticAssetId: content.staticAssetId,
          startup_time: content.startup_time,
        };
      } else {
        response = result as IDataObject;
      }
      break;
    }

    case 'getStatus': {
      const simplify = this.getNodeParameter('simplify', i) as boolean;
      const statusComponent = this.getNodeParameter('statusComponent', i) as string;

      let endpoint: string = ENDPOINTS.SERVER_STATUS;
      if (statusComponent && statusComponent !== 'all') {
        endpoint = `${ENDPOINTS.SERVER_STATUS}/${statusComponent}`;
      }

      const result = (await splunkApiRequest.call(this, 'GET', endpoint)) as SplunkResponse;

      response = simplify ? formatEntries(result.entry || []) : (result as unknown as IDataObject[]);
      break;
    }

    case 'getConfig': {
      const simplify = this.getNodeParameter('simplify', i) as boolean;
      const configSection = this.getNodeParameter('configSection', i) as string;

      let endpoint: string;
      switch (configSection) {
        case 'server':
          endpoint = ENDPOINTS.SERVER_SETTINGS;
          break;
        case 'settings':
          endpoint = ENDPOINTS.SERVER_SETTINGS;
          break;
        case 'introspection':
          endpoint = `${ENDPOINTS.SERVER_INTROSPECTION}/kvstore`;
          break;
        case 'license':
          endpoint = ENDPOINTS.LICENSES;
          break;
        default:
          endpoint = ENDPOINTS.SERVER_SETTINGS;
      }

      const result = (await splunkApiRequest.call(this, 'GET', endpoint)) as SplunkResponse;

      response = simplify ? formatEntries(result.entry || []) : (result as unknown as IDataObject[]);
      break;
    }

    case 'getMessages': {
      const simplify = this.getNodeParameter('simplify', i) as boolean;
      const messageFilters = this.getNodeParameter('messageFilters', i) as IDataObject;

      const qs: IDataObject = {};
      if (messageFilters.severity) {
        qs.severity = messageFilters.severity;
      }

      const result = (await splunkApiRequest.call(
        this,
        'GET',
        ENDPOINTS.MESSAGES,
        undefined,
        qs,
      )) as SplunkResponse;

      response = simplify ? formatEntries(result.entry || []) : (result as unknown as IDataObject[]);
      break;
    }

    case 'getHealth': {
      const simplify = this.getNodeParameter('simplify', i) as boolean;
      const healthOptions = this.getNodeParameter('healthOptions', i) as IDataObject;

      const qs: IDataObject = {};
      if (healthOptions.includeDetails !== undefined) {
        qs.include_details = healthOptions.includeDetails;
      }

      let endpoint: string = ENDPOINTS.HEALTH;
      if (healthOptions.component) {
        endpoint = `${ENDPOINTS.HEALTH}/${healthOptions.component}`;
      }

      const result = (await splunkApiRequest.call(this, 'GET', endpoint, undefined, qs)) as SplunkResponse;

      if (simplify && result.entry && result.entry[0]) {
        const content = (result.entry[0].content || {}) as IDataObject;
        response = {
          health: content.health,
          features: content.features,
          disabled: content.disabled,
        };
      } else {
        response = result as IDataObject;
      }
      break;
    }

    case 'restart': {
      const confirmRestart = this.getNodeParameter('confirmRestart', i) as boolean;

      if (!confirmRestart) {
        throw new Error('You must confirm the restart operation');
      }

      await splunkApiRequest.call(this, 'POST', ENDPOINTS.SERVER_RESTART);

      response = {
        success: true,
        message: 'Server restart initiated. The server may be temporarily unavailable.',
        timestamp: new Date().toISOString(),
      };
      break;
    }

    default:
      throw new Error(`Operation ${operation} not supported`);
  }

  return response;
}
