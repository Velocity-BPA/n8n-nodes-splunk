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

export const dataInputOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['dataInput'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a data input',
        action: 'Create a data input',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete a data input',
        action: 'Delete a data input',
      },
      {
        name: 'Disable',
        value: 'disable',
        description: 'Disable a data input',
        action: 'Disable a data input',
      },
      {
        name: 'Enable',
        value: 'enable',
        description: 'Enable a data input',
        action: 'Enable a data input',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get data input details',
        action: 'Get a data input',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        description: 'Get many data inputs',
        action: 'Get many data inputs',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update data input configuration',
        action: 'Update a data input',
      },
    ],
    default: 'getAll',
  },
];

export const dataInputFields: INodeProperties[] = [
  // Input type selection
  {
    displayName: 'Input Type',
    name: 'inputType',
    type: 'options',
    options: [
      { name: 'Monitor (File/Directory)', value: 'monitor' },
      { name: 'TCP (Cooked)', value: 'tcp_cooked' },
      { name: 'TCP (Raw)', value: 'tcp_raw' },
      { name: 'UDP', value: 'udp' },
      { name: 'Scripted', value: 'script' },
    ],
    default: 'monitor',
    required: true,
    description: 'The type of data input',
    displayOptions: {
      show: {
        resource: ['dataInput'],
        operation: ['create', 'get', 'getAll', 'update', 'delete', 'disable', 'enable'],
      },
    },
  },

  // Input name/path
  {
    displayName: 'Input Name/Path',
    name: 'name',
    type: 'string',
    required: true,
    default: '',
    placeholder: '/var/log/app.log or 9514',
    description: 'The name or path of the input (file path for monitor, port for TCP/UDP)',
    displayOptions: {
      show: {
        resource: ['dataInput'],
        operation: ['get', 'update', 'delete', 'disable', 'enable'],
      },
    },
  },

  // Create operation fields
  {
    displayName: 'Input Name/Path',
    name: 'name',
    type: 'string',
    required: true,
    default: '',
    placeholder: '/var/log/app.log or 9514',
    description: 'The name or path for the new input',
    displayOptions: {
      show: {
        resource: ['dataInput'],
        operation: ['create'],
      },
    },
  },
  {
    displayName: 'Target Index',
    name: 'index',
    type: 'string',
    required: true,
    default: 'main',
    description: 'The index to send data to',
    displayOptions: {
      show: {
        resource: ['dataInput'],
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
        resource: ['dataInput'],
        operation: ['create'],
      },
    },
    options: [
      {
        displayName: 'Sourcetype',
        name: 'sourcetype',
        type: 'string',
        default: '',
        description: 'The sourcetype to assign to events',
      },
      {
        displayName: 'Host',
        name: 'host',
        type: 'string',
        default: '',
        description: 'The host value to assign to events',
      },
      {
        displayName: 'Source',
        name: 'source',
        type: 'string',
        default: '',
        description: 'The source value to assign to events',
      },
      {
        displayName: 'Disabled',
        name: 'disabled',
        type: 'boolean',
        default: false,
        description: 'Whether to create the input in disabled state',
      },
      {
        displayName: 'Recursive (Monitor Only)',
        name: 'recursive',
        type: 'boolean',
        default: false,
        description: 'Whether to monitor subdirectories recursively',
      },
      {
        displayName: 'Whitelist (Monitor Only)',
        name: 'whitelist',
        type: 'string',
        default: '',
        description: 'Regular expression for files to include',
      },
      {
        displayName: 'Blacklist (Monitor Only)',
        name: 'blacklist',
        type: 'string',
        default: '',
        description: 'Regular expression for files to exclude',
      },
      {
        displayName: 'Follow Tail (Monitor Only)',
        name: 'followTail',
        type: 'boolean',
        default: false,
        description: 'Whether to start reading from end of file',
      },
      {
        displayName: 'CRC Salt (Monitor Only)',
        name: 'crcSalt',
        type: 'string',
        default: '',
        description: 'String to add to CRC calculation',
      },
      {
        displayName: 'Connection Host (TCP/UDP)',
        name: 'connection_host',
        type: 'options',
        options: [
          { name: 'IP', value: 'ip' },
          { name: 'DNS', value: 'dns' },
          { name: 'None', value: 'none' },
        ],
        default: 'ip',
        description: 'Method to determine host value',
      },
      {
        displayName: 'Restrict To Host (TCP/UDP)',
        name: 'restrictToHost',
        type: 'string',
        default: '',
        description: 'Only accept connections from this host',
      },
      {
        displayName: 'Queue',
        name: 'queue',
        type: 'options',
        options: [
          { name: 'Parsing Queue', value: 'parsingQueue' },
          { name: 'Index Queue', value: 'indexQueue' },
        ],
        default: 'parsingQueue',
        description: 'Queue to send data to',
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
        resource: ['dataInput'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Index',
        name: 'index',
        type: 'string',
        default: '',
        description: 'Target index',
      },
      {
        displayName: 'Sourcetype',
        name: 'sourcetype',
        type: 'string',
        default: '',
        description: 'Sourcetype assignment',
      },
      {
        displayName: 'Host',
        name: 'host',
        type: 'string',
        default: '',
        description: 'Host value',
      },
      {
        displayName: 'Source',
        name: 'source',
        type: 'string',
        default: '',
        description: 'Source value',
      },
      {
        displayName: 'Disabled',
        name: 'disabled',
        type: 'boolean',
        default: false,
        description: 'Whether to disable the input',
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
        resource: ['dataInput'],
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
        resource: ['dataInput'],
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
    description: 'Whether to return a simplified version of the response',
    displayOptions: {
      show: {
        resource: ['dataInput'],
        operation: ['get', 'getAll'],
      },
    },
  },
];

function getEndpointForType(inputType: string, name?: string): string {
  switch (inputType) {
    case 'monitor':
      return name ? ENDPOINTS.INPUT_MONITOR(name) : ENDPOINTS.INPUTS_MONITOR;
    case 'tcp_cooked':
      return name ? ENDPOINTS.INPUT_TCP_COOKED(name) : ENDPOINTS.INPUTS_TCP_COOKED;
    case 'tcp_raw':
      return name ? ENDPOINTS.INPUT_TCP_RAW(name) : ENDPOINTS.INPUTS_TCP_RAW;
    case 'udp':
      return name ? ENDPOINTS.INPUT_UDP(name) : ENDPOINTS.INPUTS_UDP;
    case 'script':
      return name ? ENDPOINTS.INPUT_SCRIPT(name) : ENDPOINTS.INPUTS_SCRIPT;
    default:
      throw new Error(`Unknown input type: ${inputType}`);
  }
}

export async function executeDataInput(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  let response: IDataObject | IDataObject[];
  const inputType = this.getNodeParameter('inputType', i) as string;

  switch (operation) {
    case 'create': {
      const name = this.getNodeParameter('name', i) as string;
      const index = this.getNodeParameter('index', i) as string;
      const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

      const body: IDataObject = {
        name,
        index,
        ...additionalFields,
      };

      const endpoint = getEndpointForType(inputType);
      const result = (await splunkApiRequest.call(
        this,
        'POST',
        endpoint,
        toFormData(body),
      )) as SplunkResponse;

      response = formatEntries(result.entry || [])[0] || { success: true, name, type: inputType };
      break;
    }

    case 'get': {
      const name = this.getNodeParameter('name', i) as string;
      const simplify = this.getNodeParameter('simplify', i) as boolean;

      const endpoint = getEndpointForType(inputType, name);
      const result = (await splunkApiRequest.call(this, 'GET', endpoint)) as SplunkResponse;

      response = simplify ? formatEntries(result.entry || [])[0] : (result as IDataObject);
      break;
    }

    case 'getAll': {
      const returnAll = this.getNodeParameter('returnAll', i) as boolean;
      const simplify = this.getNodeParameter('simplify', i) as boolean;
      const limit = returnAll ? 0 : (this.getNodeParameter('limit', i) as number);

      const endpoint = getEndpointForType(inputType);
      const result = (await splunkApiRequest.call(this, 'GET', endpoint)) as SplunkResponse;

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

      const endpoint = getEndpointForType(inputType, name);
      const result = (await splunkApiRequest.call(
        this,
        'POST',
        endpoint,
        toFormData(updateFields),
      )) as SplunkResponse;

      response = formatEntries(result.entry || [])[0] || { success: true, name };
      break;
    }

    case 'delete': {
      const name = this.getNodeParameter('name', i) as string;

      const endpoint = getEndpointForType(inputType, name);
      await splunkApiRequest.call(this, 'DELETE', endpoint);

      response = { success: true, name, type: inputType, deleted: true };
      break;
    }

    case 'disable': {
      const name = this.getNodeParameter('name', i) as string;

      const endpoint = getEndpointForType(inputType, name);
      await splunkApiRequest.call(this, 'POST', endpoint, toFormData({ disabled: true }));

      response = { success: true, name, type: inputType, disabled: true };
      break;
    }

    case 'enable': {
      const name = this.getNodeParameter('name', i) as string;

      const endpoint = getEndpointForType(inputType, name);
      await splunkApiRequest.call(this, 'POST', endpoint, toFormData({ disabled: false }));

      response = { success: true, name, type: inputType, enabled: true };
      break;
    }

    default:
      throw new Error(`Operation ${operation} not supported`);
  }

  return response;
}
