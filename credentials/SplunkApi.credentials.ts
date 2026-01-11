/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class SplunkApi implements ICredentialType {
  name = 'splunkApi';
  displayName = 'Splunk API';
  documentationUrl = 'https://docs.splunk.com/Documentation/Splunk/latest/RESTREF/RESTprolog';

  properties: INodeProperties[] = [
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: '',
      placeholder: 'https://splunk.company.com:8089',
      description: 'The base URL of your Splunk instance (include port, typically 8089)',
      required: true,
    },
    {
      displayName: 'Authentication Type',
      name: 'authType',
      type: 'options',
      options: [
        {
          name: 'Basic Auth',
          value: 'basicAuth',
          description: 'Authenticate using username and password',
        },
        {
          name: 'Auth Token',
          value: 'token',
          description: 'Authenticate using a pre-generated authentication token',
        },
      ],
      default: 'basicAuth',
      description: 'The authentication method to use',
    },
    {
      displayName: 'Username',
      name: 'username',
      type: 'string',
      default: '',
      description: 'Splunk username',
      displayOptions: {
        show: {
          authType: ['basicAuth'],
        },
      },
    },
    {
      displayName: 'Password',
      name: 'password',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Splunk password',
      displayOptions: {
        show: {
          authType: ['basicAuth'],
        },
      },
    },
    {
      displayName: 'Auth Token',
      name: 'authToken',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Pre-generated Splunk authentication token',
      displayOptions: {
        show: {
          authType: ['token'],
        },
      },
    },
    {
      displayName: 'Validate SSL Certificates',
      name: 'validateCerts',
      type: 'boolean',
      default: true,
      description: 'Whether to validate SSL certificates. Disable for self-signed certificates.',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.baseUrl}}',
      url: '/services/server/info',
      method: 'GET',
      qs: {
        output_mode: 'json',
      },
      skipSslCertificateValidation: '={{!$credentials.validateCerts}}',
    },
  };
}
