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

export const clusterOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['cluster'],
      },
    },
    options: [
      {
        name: 'Get Buckets',
        value: 'getBuckets',
        description: 'Get cluster buckets',
        action: 'Get cluster buckets',
      },
      {
        name: 'Get Generation',
        value: 'getGeneration',
        description: 'Get cluster generation info',
        action: 'Get cluster generation',
      },
      {
        name: 'Get Master Info',
        value: 'getMasterInfo',
        description: 'Get cluster master info',
        action: 'Get cluster master info',
      },
      {
        name: 'Get Peers',
        value: 'getPeers',
        description: 'Get cluster peers',
        action: 'Get cluster peers',
      },
      {
        name: 'Get Search Heads',
        value: 'getSearchHeads',
        description: 'Get cluster search heads',
        action: 'Get cluster search heads',
      },
      {
        name: 'Maintenance Mode',
        value: 'maintenance',
        description: 'Enter or exit maintenance mode',
        action: 'Set maintenance mode',
      },
    ],
    default: 'getMasterInfo',
  },
];

export const clusterFields: INodeProperties[] = [
  // Peer name filter
  {
    displayName: 'Peer Name',
    name: 'peerName',
    type: 'string',
    default: '',
    description: 'Filter by specific peer name (leave empty for all peers)',
    displayOptions: {
      show: {
        resource: ['cluster'],
        operation: ['getPeers'],
      },
    },
  },

  // Bucket filters
  {
    displayName: 'Bucket Filters',
    name: 'bucketFilters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['cluster'],
        operation: ['getBuckets'],
      },
    },
    options: [
      {
        displayName: 'Bucket ID',
        name: 'bucket_id',
        type: 'string',
        default: '',
        description: 'Filter by bucket ID',
      },
      {
        displayName: 'Index',
        name: 'index',
        type: 'string',
        default: '',
        description: 'Filter by index name',
      },
      {
        displayName: 'Bucket Type',
        name: 'bucket_type',
        type: 'options',
        options: [
          { name: 'All', value: '' },
          { name: 'Hot', value: 'hot' },
          { name: 'Warm', value: 'warm' },
          { name: 'Cold', value: 'cold' },
          { name: 'Frozen', value: 'frozen' },
        ],
        default: '',
        description: 'Filter by bucket type',
      },
    ],
  },

  // Maintenance mode options
  {
    displayName: 'Mode',
    name: 'maintenanceMode',
    type: 'options',
    options: [
      { name: 'Enable', value: 'enable' },
      { name: 'Disable', value: 'disable' },
    ],
    default: 'enable',
    description: 'Enable or disable maintenance mode',
    displayOptions: {
      show: {
        resource: ['cluster'],
        operation: ['maintenance'],
      },
    },
  },
  {
    displayName: 'Confirm Maintenance',
    name: 'confirmMaintenance',
    type: 'boolean',
    default: false,
    required: true,
    description: 'Confirm that you want to change maintenance mode',
    displayOptions: {
      show: {
        resource: ['cluster'],
        operation: ['maintenance'],
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
        resource: ['cluster'],
        operation: ['getPeers', 'getSearchHeads', 'getBuckets'],
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
        resource: ['cluster'],
        operation: ['getPeers', 'getSearchHeads', 'getBuckets'],
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
        resource: ['cluster'],
        operation: ['getMasterInfo', 'getPeers', 'getSearchHeads', 'getGeneration', 'getBuckets'],
      },
    },
  },
];

export async function executeCluster(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  let response: IDataObject | IDataObject[];

  switch (operation) {
    case 'getMasterInfo': {
      const simplify = this.getNodeParameter('simplify', i) as boolean;

      const result = (await splunkApiRequest.call(this, 'GET', ENDPOINTS.CLUSTER_MASTER)) as SplunkResponse;

      if (simplify && result.entry && result.entry[0]) {
        const content = (result.entry[0].content || {}) as IDataObject;
        response = {
          label: content.label,
          mode: content.mode,
          rollingRestart: content.rolling_restart_flag,
          serviceReady: content.service_ready_flag,
          activeBundle: content.active_bundle,
          latestBundle: content.latest_bundle,
          replicationFactor: content.replication_factor,
          searchFactor: content.search_factor,
          indexerCount: content.indexer_count,
          searchableCount: content.searchable_count,
          generation: content.generation,
          maintenanceMode: content.maintenance_mode,
          multisite: content.multisite,
          forwarderSiteFailover: content.forwarder_site_failover,
        };
      } else {
        response = result as IDataObject;
      }
      break;
    }

    case 'getPeers': {
      const returnAll = this.getNodeParameter('returnAll', i) as boolean;
      const simplify = this.getNodeParameter('simplify', i) as boolean;
      const peerName = this.getNodeParameter('peerName', i) as string;

      let endpoint: string = ENDPOINTS.CLUSTER_PEERS;
      if (peerName) {
        endpoint = `${ENDPOINTS.CLUSTER_PEERS}/${encodeURIComponent(peerName)}`;
        const result = (await splunkApiRequest.call(this, 'GET', endpoint)) as SplunkResponse;
        response = simplify ? formatEntries(result.entry || [])[0] : (result as IDataObject);
      } else {
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
      }
      break;
    }

    case 'getSearchHeads': {
      const returnAll = this.getNodeParameter('returnAll', i) as boolean;
      const simplify = this.getNodeParameter('simplify', i) as boolean;

      let entries;
      if (returnAll) {
        entries = await splunkApiRequestAllItems.call(this, 'GET', ENDPOINTS.CLUSTER_SEARCHHEADS);
      } else {
        const limit = this.getNodeParameter('limit', i) as number;
        const result = (await splunkApiRequest.call(
          this,
          'GET',
          ENDPOINTS.CLUSTER_SEARCHHEADS,
          undefined,
          { count: limit },
        )) as SplunkResponse;
        entries = result.entry || [];
      }

      response = simplify ? formatEntries(entries) : (entries as unknown as IDataObject[]);
      break;
    }

    case 'getGeneration': {
      const simplify = this.getNodeParameter('simplify', i) as boolean;

      const result = (await splunkApiRequest.call(
        this,
        'GET',
        ENDPOINTS.CLUSTER_GENERATION,
      )) as SplunkResponse;

      if (simplify && result.entry && result.entry[0]) {
        const content = (result.entry[0].content || {}) as IDataObject;
        response = {
          generation: content.generation,
          generationPeers: content.generation_peers,
          lastComplete: content.last_complete_generation,
          pending: content.pending_generation,
          restartingGeneration: content.restarting_generation,
          wasForced: content.was_forced,
        };
      } else {
        response = result as IDataObject;
      }
      break;
    }

    case 'getBuckets': {
      const returnAll = this.getNodeParameter('returnAll', i) as boolean;
      const simplify = this.getNodeParameter('simplify', i) as boolean;
      const bucketFilters = this.getNodeParameter('bucketFilters', i) as IDataObject;

      const qs: IDataObject = {};

      // Build search filter if needed
      const filters: string[] = [];
      if (bucketFilters.bucket_id) {
        filters.push(`bucket_id="${bucketFilters.bucket_id}"`);
      }
      if (bucketFilters.index) {
        filters.push(`index="${bucketFilters.index}"`);
      }
      if (bucketFilters.bucket_type) {
        filters.push(`bucket_type="${bucketFilters.bucket_type}"`);
      }
      if (filters.length > 0) {
        qs.search = filters.join(' AND ');
      }

      let entries;
      if (returnAll) {
        entries = await splunkApiRequestAllItems.call(this, 'GET', ENDPOINTS.CLUSTER_BUCKETS, undefined, qs);
      } else {
        const limit = this.getNodeParameter('limit', i) as number;
        qs.count = limit;
        const result = (await splunkApiRequest.call(
          this,
          'GET',
          ENDPOINTS.CLUSTER_BUCKETS,
          undefined,
          qs,
        )) as SplunkResponse;
        entries = result.entry || [];
      }

      response = simplify ? formatEntries(entries) : (entries as unknown as IDataObject[]);
      break;
    }

    case 'maintenance': {
      const maintenanceMode = this.getNodeParameter('maintenanceMode', i) as string;
      const confirmMaintenance = this.getNodeParameter('confirmMaintenance', i) as boolean;

      if (!confirmMaintenance) {
        throw new Error('You must confirm the maintenance mode change');
      }

      const body = {
        mode: maintenanceMode === 'enable',
      };

      await splunkApiRequest.call(
        this,
        'POST',
        `${ENDPOINTS.CLUSTER_MASTER}/control/default/maintenance`,
        toFormData(body),
      );

      response = {
        success: true,
        maintenanceMode: maintenanceMode === 'enable',
        message: maintenanceMode === 'enable' 
          ? 'Cluster maintenance mode enabled' 
          : 'Cluster maintenance mode disabled',
        timestamp: new Date().toISOString(),
      };
      break;
    }

    default:
      throw new Error(`Operation ${operation} not supported`);
  }

  return response;
}
