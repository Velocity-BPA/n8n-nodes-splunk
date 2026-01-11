/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IPollFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IDataObject,
} from 'n8n-workflow';

import { splunkApiRequest, formatEntries, displayLicenseNotice } from './transport/api';
import { ENDPOINTS } from './constants/endpoints';
import type { SplunkResponse, SplunkEntry } from './types/SplunkTypes';

export class SplunkTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Splunk Trigger',
    name: 'splunkTrigger',
    icon: 'file:splunk.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["triggerType"]}}',
    description: 'Triggers when new alerts fire or searches complete in Splunk',
    defaults: {
      name: 'Splunk Trigger',
    },
    polling: true,
    inputs: [],
    outputs: ['main'],
    credentials: [
      {
        name: 'splunkApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Trigger Type',
        name: 'triggerType',
        type: 'options',
        options: [
          {
            name: 'Alert Fired',
            value: 'alertFired',
            description: 'Trigger when an alert fires',
          },
          {
            name: 'New Search Results',
            value: 'newSearchResults',
            description: 'Trigger when new results are found from a saved search',
          },
          {
            name: 'Saved Search Completed',
            value: 'savedSearchCompleted',
            description: 'Trigger when a scheduled saved search completes',
          },
        ],
        default: 'alertFired',
      },

      // Alert Fired options
      {
        displayName: 'Alert Name',
        name: 'alertName',
        type: 'string',
        default: '',
        required: true,
        description: 'Name of the alert to monitor. Leave empty to monitor all alerts.',
        displayOptions: {
          show: {
            triggerType: ['alertFired'],
          },
        },
      },

      // Saved Search options
      {
        displayName: 'Saved Search Name',
        name: 'savedSearchName',
        type: 'string',
        default: '',
        required: true,
        description: 'Name of the saved search to monitor',
        displayOptions: {
          show: {
            triggerType: ['newSearchResults', 'savedSearchCompleted'],
          },
        },
      },

      // Additional options
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Include Results',
            name: 'includeResults',
            type: 'boolean',
            default: true,
            description: 'Whether to include search results in the output',
          },
          {
            displayName: 'Max Results',
            name: 'maxResults',
            type: 'number',
            default: 100,
            description: 'Maximum number of results to return per trigger',
          },
          {
            displayName: 'Simplify Output',
            name: 'simplify',
            type: 'boolean',
            default: true,
            description: 'Whether to return a simplified version of the response',
          },
        ],
      },
    ],
  };

  async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
    // Display license notice once per node load
    displayLicenseNotice();

    const triggerType = this.getNodeParameter('triggerType') as string;
    const options = this.getNodeParameter('options', {}) as IDataObject;
    const webhookData = this.getWorkflowStaticData('node');

    // Initialize last poll time if not set
    if (!webhookData.lastPollTime) {
      webhookData.lastPollTime = new Date().toISOString();
      return null;
    }

    const lastPollTime = webhookData.lastPollTime as string;
    const returnData: INodeExecutionData[] = [];

    try {
      switch (triggerType) {
        case 'alertFired': {
          const alertName = this.getNodeParameter('alertName') as string;

          // Build endpoint
          let endpoint: string = ENDPOINTS.FIRED_ALERTS;
          if (alertName) {
            endpoint = `${ENDPOINTS.FIRED_ALERTS}/${encodeURIComponent(alertName)}`;
          }

          const result = (await splunkApiRequest.call(
            this,
            'GET',
            endpoint,
            undefined,
            {
              count: options.maxResults || 100,
              sort_key: 'trigger_time',
              sort_dir: 'desc',
            },
          )) as SplunkResponse;

          const entries = result.entry || [];

          // Filter entries that are newer than lastPollTime
          const newEntries = entries.filter((entry: SplunkEntry) => {
            const content = entry.content as IDataObject;
            const triggerTime = content?.trigger_time as number | undefined;
            if (triggerTime) {
              return new Date(triggerTime * 1000) > new Date(lastPollTime);
            }
            return false;
          });

          if (newEntries.length > 0) {
            const formattedEntries = options.simplify ? formatEntries(newEntries) : (newEntries as unknown as IDataObject[]);
            for (const entry of formattedEntries) {
              returnData.push({
                json: {
                  triggerType: 'alertFired',
                  ...entry,
                },
              });
            }
          }
          break;
        }

        case 'newSearchResults': {
          const savedSearchName = this.getNodeParameter('savedSearchName') as string;

          // Run the saved search
          const dispatchResult = (await splunkApiRequest.call(
            this,
            'POST',
            ENDPOINTS.SAVED_SEARCH_DISPATCH(savedSearchName),
            { 'dispatch.now': 'true', force_dispatch: 'true' },
          )) as IDataObject;

          const sid = dispatchResult.sid as string;

          if (sid && options.includeResults !== false) {
            // Wait for search to complete (poll for up to 60 seconds)
            let attempts = 0;
            let searchComplete = false;

            while (!searchComplete && attempts < 30) {
              await new Promise((resolve) => setTimeout(resolve, 2000));

              const statusResult = (await splunkApiRequest.call(
                this,
                'GET',
                ENDPOINTS.SEARCH_JOB(sid),
              )) as SplunkResponse;

              const content = statusResult.entry?.[0]?.content as IDataObject | undefined;
              const isDone = content?.isDone;
              if (isDone) {
                searchComplete = true;
              }
              attempts++;
            }

            if (searchComplete) {
              // Get results
              const resultsResponse = (await splunkApiRequest.call(
                this,
                'GET',
                ENDPOINTS.SEARCH_RESULTS(sid),
                undefined,
                { count: options.maxResults || 100 },
              )) as IDataObject;

              const results = (resultsResponse.results || []) as IDataObject[];

              if (results.length > 0) {
                for (const result of results) {
                  returnData.push({
                    json: {
                      triggerType: 'newSearchResults',
                      savedSearch: savedSearchName,
                      sid,
                      ...result,
                    },
                  });
                }
              }
            }
          }
          break;
        }

        case 'savedSearchCompleted': {
          const savedSearchName = this.getNodeParameter('savedSearchName') as string;

          // Get history of dispatched searches
          const historyResult = (await splunkApiRequest.call(
            this,
            'GET',
            ENDPOINTS.SAVED_SEARCH_HISTORY(savedSearchName),
            undefined,
            {
              count: options.maxResults || 100,
              sort_key: 'published',
              sort_dir: 'desc',
            },
          )) as SplunkResponse;

          const entries = historyResult.entry || [];

          // Filter for completed searches since last poll
          const newCompletedSearches = entries.filter((entry: SplunkEntry) => {
            const content = entry.content as IDataObject;
            const isDone = content?.isDone;
            const published = entry.updated;
            if (isDone && published) {
              return new Date(published) > new Date(lastPollTime);
            }
            return false;
          });

          for (const entry of newCompletedSearches) {
            const content = entry.content as IDataObject;
            const searchData: IDataObject = {
              triggerType: 'savedSearchCompleted',
              savedSearch: savedSearchName,
              sid: content?.sid as string | undefined,
              eventCount: content?.eventCount as number | undefined,
              resultCount: content?.resultCount as number | undefined,
              runDuration: content?.runDuration as number | undefined,
              published: entry.updated,
            };

            // Optionally include results
            if (options.includeResults !== false && content?.sid) {
              try {
                const resultsResponse = (await splunkApiRequest.call(
                  this,
                  'GET',
                  ENDPOINTS.SEARCH_RESULTS(content.sid as string),
                  undefined,
                  { count: options.maxResults || 100 },
                )) as IDataObject;

                searchData.results = resultsResponse.results || [];
              } catch {
                // Results may no longer be available
                searchData.results = [];
              }
            }

            returnData.push({ json: searchData });
          }
          break;
        }
      }

      // Update last poll time
      webhookData.lastPollTime = new Date().toISOString();

      if (returnData.length === 0) {
        return null;
      }

      return [returnData];
    } catch (error) {
      throw error;
    }
  }
}
