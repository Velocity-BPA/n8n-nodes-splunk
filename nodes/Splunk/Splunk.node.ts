/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IDataObject,
} from 'n8n-workflow';

import { displayLicenseNotice } from './transport/api';

// Import operations and fields
import { searchJobOperations, searchJobFields, executeSearchJob } from './actions/searchJob/searchJob';
import { savedSearchOperations, savedSearchFields, executeSavedSearch } from './actions/savedSearch/savedSearch';
import { indexOperations, indexFields, executeIndex } from './actions/index/index';
import { dataInputOperations, dataInputFields, executeDataInput } from './actions/dataInput/dataInput';
import { hecOperations, hecFields, executeHec } from './actions/hec/hec';
import { alertOperations, alertFields, executeAlert } from './actions/alert/alert';
import { userOperations, userFields, executeUser } from './actions/user/user';
import { roleOperations, roleFields, executeRole } from './actions/role/role';
import { appOperations, appFields, executeApp } from './actions/app/app';
import { kvStoreOperations, kvStoreFields, executeKvStore } from './actions/kvStore/kvStore';
import { serverOperations, serverFields, executeServer } from './actions/server/server';
import { clusterOperations, clusterFields, executeCluster } from './actions/cluster/cluster';

export class Splunk implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Splunk',
    name: 'splunk',
    icon: 'file:splunk.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with Splunk Enterprise API for search, index management, alerts, and data ingestion',
    defaults: {
      name: 'Splunk',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'splunkApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Alert',
            value: 'alert',
            description: 'Manage fired alerts and alert actions',
          },
          {
            name: 'App',
            value: 'app',
            description: 'Manage installed apps',
          },
          {
            name: 'Cluster',
            value: 'cluster',
            description: 'Manage cluster configuration and peers',
          },
          {
            name: 'Data Input',
            value: 'dataInput',
            description: 'Manage data inputs (monitor, TCP, UDP, script)',
          },
          {
            name: 'HEC (HTTP Event Collector)',
            value: 'hec',
            description: 'Manage HEC tokens and send events',
          },
          {
            name: 'Index',
            value: 'index',
            description: 'Manage indexes',
          },
          {
            name: 'KV Store',
            value: 'kvStore',
            description: 'Manage KV Store collections and records',
          },
          {
            name: 'Role',
            value: 'role',
            description: 'Manage roles and capabilities',
          },
          {
            name: 'Saved Search',
            value: 'savedSearch',
            description: 'Manage saved searches and alerts',
          },
          {
            name: 'Search Job',
            value: 'searchJob',
            description: 'Create and manage search jobs',
          },
          {
            name: 'Server',
            value: 'server',
            description: 'Get server info, status, and health',
          },
          {
            name: 'User',
            value: 'user',
            description: 'Manage users and roles',
          },
        ],
        default: 'searchJob',
      },
      // Search Job
      ...searchJobOperations,
      ...searchJobFields,
      // Saved Search
      ...savedSearchOperations,
      ...savedSearchFields,
      // Index
      ...indexOperations,
      ...indexFields,
      // Data Input
      ...dataInputOperations,
      ...dataInputFields,
      // HEC
      ...hecOperations,
      ...hecFields,
      // Alert
      ...alertOperations,
      ...alertFields,
      // User
      ...userOperations,
      ...userFields,
      // Role
      ...roleOperations,
      ...roleFields,
      // App
      ...appOperations,
      ...appFields,
      // KV Store
      ...kvStoreOperations,
      ...kvStoreFields,
      // Server
      ...serverOperations,
      ...serverFields,
      // Cluster
      ...clusterOperations,
      ...clusterFields,
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Display license notice once per node load
    displayLicenseNotice();

    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let responseData: IDataObject | IDataObject[];

        switch (resource) {
          case 'searchJob':
            responseData = await executeSearchJob.call(this, operation, i);
            break;
          case 'savedSearch':
            responseData = await executeSavedSearch.call(this, operation, i);
            break;
          case 'index':
            responseData = await executeIndex.call(this, operation, i);
            break;
          case 'dataInput':
            responseData = await executeDataInput.call(this, operation, i);
            break;
          case 'hec':
            responseData = await executeHec.call(this, operation, i);
            break;
          case 'alert':
            responseData = await executeAlert.call(this, operation, i);
            break;
          case 'user':
            responseData = await executeUser.call(this, operation, i);
            break;
          case 'role':
            responseData = await executeRole.call(this, operation, i);
            break;
          case 'app':
            responseData = await executeApp.call(this, operation, i);
            break;
          case 'kvStore':
            responseData = await executeKvStore.call(this, operation, i);
            break;
          case 'server':
            responseData = await executeServer.call(this, operation, i);
            break;
          case 'cluster':
            responseData = await executeCluster.call(this, operation, i);
            break;
          default:
            throw new Error(`Resource ${resource} not supported`);
        }

        // Handle array vs single object response
        const executionData = this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(responseData),
          { itemData: { item: i } },
        );
        returnData.push(...executionData);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: (error as Error).message,
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
