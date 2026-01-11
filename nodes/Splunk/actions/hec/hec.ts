/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import { splunkApiRequest, splunkHecRequest, formatEntries } from '../../transport/api';
import { ENDPOINTS } from '../../constants/endpoints';
import { toFormData, chunkArray } from '../../utils/helpers';
import type { SplunkResponse, HecEvent } from '../../types/SplunkTypes';

export const hecOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['hec'],
      },
    },
    options: [
      {
        name: 'Create Token',
        value: 'create',
        description: 'Create a HEC token',
        action: 'Create a HEC token',
      },
      {
        name: 'Delete Token',
        value: 'delete',
        description: 'Delete a HEC token',
        action: 'Delete a HEC token',
      },
      {
        name: 'Disable Token',
        value: 'disable',
        description: 'Disable a HEC token',
        action: 'Disable a HEC token',
      },
      {
        name: 'Enable Token',
        value: 'enable',
        description: 'Enable a HEC token',
        action: 'Enable a HEC token',
      },
      {
        name: 'Get Token',
        value: 'get',
        description: 'Get HEC token details',
        action: 'Get a HEC token',
      },
      {
        name: 'Get Many Tokens',
        value: 'getAll',
        description: 'Get many HEC tokens',
        action: 'Get many HEC tokens',
      },
      {
        name: 'Send Batch',
        value: 'sendBatch',
        description: 'Send multiple events via HEC',
        action: 'Send batch events via HEC',
      },
      {
        name: 'Send Event',
        value: 'sendEvent',
        description: 'Send an event via HEC',
        action: 'Send an event via HEC',
      },
      {
        name: 'Update Token',
        value: 'update',
        description: 'Update a HEC token',
        action: 'Update a HEC token',
      },
    ],
    default: 'sendEvent',
  },
];

export const hecFields: INodeProperties[] = [
  // Token name for token operations
  {
    displayName: 'Token Name',
    name: 'name',
    type: 'string',
    required: true,
    default: '',
    description: 'The name of the HEC token',
    displayOptions: {
      show: {
        resource: ['hec'],
        operation: ['get', 'update', 'delete', 'disable', 'enable'],
      },
    },
  },

  // Create token fields
  {
    displayName: 'Token Name',
    name: 'name',
    type: 'string',
    required: true,
    default: '',
    description: 'The name for the new HEC token',
    displayOptions: {
      show: {
        resource: ['hec'],
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
        resource: ['hec'],
        operation: ['create'],
      },
    },
    options: [
      {
        displayName: 'Default Index',
        name: 'index',
        type: 'string',
        default: 'main',
        description: 'Default index for events sent with this token',
      },
      {
        displayName: 'Allowed Indexes',
        name: 'indexes',
        type: 'string',
        default: '',
        description: 'Comma-separated list of allowed indexes',
      },
      {
        displayName: 'Default Sourcetype',
        name: 'sourcetype',
        type: 'string',
        default: '',
        description: 'Default sourcetype for events',
      },
      {
        displayName: 'Default Source',
        name: 'source',
        type: 'string',
        default: '',
        description: 'Default source for events',
      },
      {
        displayName: 'Default Host',
        name: 'host',
        type: 'string',
        default: '',
        description: 'Default host for events',
      },
      {
        displayName: 'Use Indexer Acknowledgment',
        name: 'useACK',
        type: 'boolean',
        default: false,
        description: 'Whether to enable indexer acknowledgment',
      },
      {
        displayName: 'Disabled',
        name: 'disabled',
        type: 'boolean',
        default: false,
        description: 'Whether to create the token in disabled state',
      },
    ],
  },

  // Update token fields
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['hec'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Default Index',
        name: 'index',
        type: 'string',
        default: '',
        description: 'Default index for events',
      },
      {
        displayName: 'Allowed Indexes',
        name: 'indexes',
        type: 'string',
        default: '',
        description: 'Comma-separated list of allowed indexes',
      },
      {
        displayName: 'Default Sourcetype',
        name: 'sourcetype',
        type: 'string',
        default: '',
        description: 'Default sourcetype',
      },
      {
        displayName: 'Default Source',
        name: 'source',
        type: 'string',
        default: '',
        description: 'Default source',
      },
      {
        displayName: 'Default Host',
        name: 'host',
        type: 'string',
        default: '',
        description: 'Default host',
      },
      {
        displayName: 'Disabled',
        name: 'disabled',
        type: 'boolean',
        default: false,
        description: 'Whether to disable the token',
      },
    ],
  },

  // Send event fields
  {
    displayName: 'HEC Token',
    name: 'hecToken',
    type: 'string',
    typeOptions: { password: true },
    required: true,
    default: '',
    description: 'The HEC token to use for sending events',
    displayOptions: {
      show: {
        resource: ['hec'],
        operation: ['sendEvent', 'sendBatch'],
      },
    },
  },
  {
    displayName: 'HEC Endpoint',
    name: 'hecEndpoint',
    type: 'string',
    default: '',
    placeholder: 'https://splunk.company.com:8088',
    description: 'HEC endpoint URL (leave empty to use base URL with port 8088)',
    displayOptions: {
      show: {
        resource: ['hec'],
        operation: ['sendEvent', 'sendBatch'],
      },
    },
  },
  {
    displayName: 'Event Data',
    name: 'eventData',
    type: 'json',
    required: true,
    default: '{}',
    description: 'The event data to send (JSON object)',
    displayOptions: {
      show: {
        resource: ['hec'],
        operation: ['sendEvent'],
      },
    },
  },
  {
    displayName: 'Event Options',
    name: 'eventOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['hec'],
        operation: ['sendEvent'],
      },
    },
    options: [
      {
        displayName: 'Index',
        name: 'index',
        type: 'string',
        default: '',
        description: 'Target index (overrides token default)',
      },
      {
        displayName: 'Sourcetype',
        name: 'sourcetype',
        type: 'string',
        default: '',
        description: 'Sourcetype (overrides token default)',
      },
      {
        displayName: 'Source',
        name: 'source',
        type: 'string',
        default: '',
        description: 'Source (overrides token default)',
      },
      {
        displayName: 'Host',
        name: 'host',
        type: 'string',
        default: '',
        description: 'Host (overrides token default)',
      },
      {
        displayName: 'Timestamp',
        name: 'time',
        type: 'number',
        default: 0,
        description: 'Event timestamp (epoch seconds, 0 for current time)',
      },
      {
        displayName: 'Additional Fields',
        name: 'fields',
        type: 'json',
        default: '{}',
        description: 'Additional indexed fields (JSON object)',
      },
    ],
  },

  // Send batch fields
  {
    displayName: 'Events',
    name: 'events',
    type: 'json',
    required: true,
    default: '[]',
    description: 'Array of event objects to send',
    displayOptions: {
      show: {
        resource: ['hec'],
        operation: ['sendBatch'],
      },
    },
  },
  {
    displayName: 'Batch Options',
    name: 'batchOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['hec'],
        operation: ['sendBatch'],
      },
    },
    options: [
      {
        displayName: 'Batch Size',
        name: 'batchSize',
        type: 'number',
        default: 100,
        description: 'Number of events per batch request',
      },
      {
        displayName: 'Default Index',
        name: 'index',
        type: 'string',
        default: '',
        description: 'Default index for all events',
      },
      {
        displayName: 'Default Sourcetype',
        name: 'sourcetype',
        type: 'string',
        default: '',
        description: 'Default sourcetype for all events',
      },
      {
        displayName: 'Default Source',
        name: 'source',
        type: 'string',
        default: '',
        description: 'Default source for all events',
      },
      {
        displayName: 'Default Host',
        name: 'host',
        type: 'string',
        default: '',
        description: 'Default host for all events',
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
        resource: ['hec'],
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
        resource: ['hec'],
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
        resource: ['hec'],
        operation: ['get', 'getAll'],
      },
    },
  },
];

export async function executeHec(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  let response: IDataObject | IDataObject[];

  switch (operation) {
    case 'create': {
      const name = this.getNodeParameter('name', i) as string;
      const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

      const body: IDataObject = {
        name,
        ...additionalFields,
      };

      const result = (await splunkApiRequest.call(
        this,
        'POST',
        ENDPOINTS.HEC_TOKENS,
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
        ENDPOINTS.HEC_TOKEN(name),
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
        ENDPOINTS.HEC_TOKENS,
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
        ENDPOINTS.HEC_TOKEN(name),
        toFormData(updateFields),
      )) as SplunkResponse;

      response = formatEntries(result.entry || [])[0] || { success: true, name };
      break;
    }

    case 'delete': {
      const name = this.getNodeParameter('name', i) as string;

      await splunkApiRequest.call(this, 'DELETE', ENDPOINTS.HEC_TOKEN(name));

      response = { success: true, name, deleted: true };
      break;
    }

    case 'disable': {
      const name = this.getNodeParameter('name', i) as string;

      await splunkApiRequest.call(
        this,
        'POST',
        ENDPOINTS.HEC_TOKEN(name),
        toFormData({ disabled: true }),
      );

      response = { success: true, name, disabled: true };
      break;
    }

    case 'enable': {
      const name = this.getNodeParameter('name', i) as string;

      await splunkApiRequest.call(
        this,
        'POST',
        ENDPOINTS.HEC_TOKEN(name),
        toFormData({ disabled: false }),
      );

      response = { success: true, name, enabled: true };
      break;
    }

    case 'sendEvent': {
      const hecToken = this.getNodeParameter('hecToken', i) as string;
      const hecEndpoint = this.getNodeParameter('hecEndpoint', i, '') as string;
      const eventData = this.getNodeParameter('eventData', i) as string;
      const eventOptions = this.getNodeParameter('eventOptions', i) as IDataObject;

      let event: IDataObject;
      try {
        event = JSON.parse(eventData);
      } catch {
        throw new Error('Invalid JSON in event data');
      }

      const hecEvent: HecEvent = {
        event,
      };

      // Add optional fields
      if (eventOptions.index) hecEvent.index = eventOptions.index as string;
      if (eventOptions.sourcetype) hecEvent.sourcetype = eventOptions.sourcetype as string;
      if (eventOptions.source) hecEvent.source = eventOptions.source as string;
      if (eventOptions.host) hecEvent.host = eventOptions.host as string;
      if (eventOptions.time && (eventOptions.time as number) > 0) {
        hecEvent.time = eventOptions.time as number;
      }
      if (eventOptions.fields) {
        try {
          hecEvent.fields = JSON.parse(eventOptions.fields as string);
        } catch {
          // Ignore invalid JSON
        }
      }

      const result = await splunkHecRequest.call(this, hecEndpoint, hecToken, hecEvent);

      response = {
        success: result.code === 0,
        message: result.text,
        code: result.code,
        ackId: result.ackId,
      };
      break;
    }

    case 'sendBatch': {
      const hecToken = this.getNodeParameter('hecToken', i) as string;
      const hecEndpoint = this.getNodeParameter('hecEndpoint', i, '') as string;
      const eventsJson = this.getNodeParameter('events', i) as string;
      const batchOptions = this.getNodeParameter('batchOptions', i) as IDataObject;

      let events: IDataObject[];
      try {
        events = JSON.parse(eventsJson);
        if (!Array.isArray(events)) {
          throw new Error('Events must be an array');
        }
      } catch (err) {
        throw new Error(`Invalid JSON in events: ${(err as Error).message}`);
      }

      const batchSize = (batchOptions.batchSize as number) || 100;

      // Format events for HEC
      const hecEvents: HecEvent[] = events.map((e) => {
        const hecEvent: HecEvent = {
          event: e.event || e,
        };

        // Apply defaults from batch options, then event-specific overrides
        if (batchOptions.index || e.index) hecEvent.index = (e.index || batchOptions.index) as string;
        if (batchOptions.sourcetype || e.sourcetype) hecEvent.sourcetype = (e.sourcetype || batchOptions.sourcetype) as string;
        if (batchOptions.source || e.source) hecEvent.source = (e.source || batchOptions.source) as string;
        if (batchOptions.host || e.host) hecEvent.host = (e.host || batchOptions.host) as string;
        if (e.time) hecEvent.time = e.time as number;
        if (e.fields) hecEvent.fields = e.fields as Record<string, unknown>;

        return hecEvent;
      });

      // Send in batches
      const batches = chunkArray(hecEvents, batchSize);
      const results: IDataObject[] = [];

      for (const batch of batches) {
        const result = await splunkHecRequest.call(this, hecEndpoint, hecToken, batch);
        results.push({
          success: result.code === 0,
          message: result.text,
          code: result.code,
          eventsCount: batch.length,
        });
      }

      response = {
        success: results.every((r) => r.success),
        totalEvents: events.length,
        batches: results.length,
        results,
      };
      break;
    }

    default:
      throw new Error(`Operation ${operation} not supported`);
  }

  return response;
}
