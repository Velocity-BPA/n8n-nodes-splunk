/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Splunk REST API endpoints
 */
export const ENDPOINTS = {
  // Authentication
  AUTH_LOGIN: '/services/auth/login',

  // Search Jobs
  SEARCH_JOBS: '/services/search/jobs',
  SEARCH_JOB: (sid: string) => `/services/search/jobs/${encodeURIComponent(sid)}`,
  SEARCH_RESULTS: (sid: string) => `/services/search/jobs/${encodeURIComponent(sid)}/results`,
  SEARCH_EVENTS: (sid: string) => `/services/search/jobs/${encodeURIComponent(sid)}/events`,
  SEARCH_SUMMARY: (sid: string) => `/services/search/jobs/${encodeURIComponent(sid)}/summary`,
  SEARCH_TIMELINE: (sid: string) => `/services/search/jobs/${encodeURIComponent(sid)}/timeline`,
  SEARCH_CONTROL: (sid: string) => `/services/search/jobs/${encodeURIComponent(sid)}/control`,

  // Saved Searches
  SAVED_SEARCHES: '/servicesNS/-/-/saved/searches',
  SAVED_SEARCH: (name: string) => `/servicesNS/-/-/saved/searches/${encodeURIComponent(name)}`,
  SAVED_SEARCH_DISPATCH: (name: string) =>
    `/servicesNS/-/-/saved/searches/${encodeURIComponent(name)}/dispatch`,
  SAVED_SEARCH_HISTORY: (name: string) =>
    `/servicesNS/-/-/saved/searches/${encodeURIComponent(name)}/history`,
  SAVED_SEARCH_SUPPRESS: (name: string) =>
    `/servicesNS/-/-/saved/searches/${encodeURIComponent(name)}/suppress`,
  SAVED_SEARCH_ACK: (name: string) =>
    `/servicesNS/-/-/saved/searches/${encodeURIComponent(name)}/acknowledge`,

  // Indexes
  INDEXES: '/services/data/indexes',
  INDEX: (name: string) => `/services/data/indexes/${encodeURIComponent(name)}`,
  INDEX_DISABLE: (name: string) => `/services/data/indexes/${encodeURIComponent(name)}/disable`,
  INDEX_ENABLE: (name: string) => `/services/data/indexes/${encodeURIComponent(name)}/enable`,
  INDEX_ROLL_HOT_BUCKETS: (name: string) =>
    `/services/data/indexes/${encodeURIComponent(name)}/roll-hot-buckets`,

  // Data Inputs - Monitor
  INPUTS_MONITOR: '/services/data/inputs/monitor',
  INPUT_MONITOR: (name: string) => `/services/data/inputs/monitor/${encodeURIComponent(name)}`,

  // Data Inputs - TCP
  INPUTS_TCP_COOKED: '/services/data/inputs/tcp/cooked',
  INPUT_TCP_COOKED: (port: string) => `/services/data/inputs/tcp/cooked/${encodeURIComponent(port)}`,
  INPUTS_TCP_RAW: '/services/data/inputs/tcp/raw',
  INPUT_TCP_RAW: (port: string) => `/services/data/inputs/tcp/raw/${encodeURIComponent(port)}`,

  // Data Inputs - UDP
  INPUTS_UDP: '/services/data/inputs/udp',
  INPUT_UDP: (port: string) => `/services/data/inputs/udp/${encodeURIComponent(port)}`,

  // Data Inputs - Scripted
  INPUTS_SCRIPT: '/services/data/inputs/script',
  INPUT_SCRIPT: (name: string) => `/services/data/inputs/script/${encodeURIComponent(name)}`,

  // HTTP Event Collector
  HEC_TOKENS: '/services/data/inputs/http',
  HEC_TOKEN: (name: string) => `/services/data/inputs/http/${encodeURIComponent(name)}`,
  HEC_GLOBAL_SETTINGS: '/services/data/inputs/http/http',
  HEC_EVENT: '/services/collector/event',
  HEC_RAW: '/services/collector/raw',
  HEC_HEALTH: '/services/collector/health',

  // Alerts
  FIRED_ALERTS: '/services/alerts/fired_alerts',
  ALERTS_FIRED: '/services/alerts/fired_alerts',
  ALERT_FIRED: (name: string) => `/services/alerts/fired_alerts/${encodeURIComponent(name)}`,
  ALERT_ACTIONS: '/services/alerts/alert_actions',

  // Users
  USERS: '/services/authentication/users',
  USER: (name: string) => `/services/authentication/users/${encodeURIComponent(name)}`,
  CURRENT_USER: '/services/authentication/current-context',

  // Roles
  ROLES: '/services/authorization/roles',
  ROLE: (name: string) => `/services/authorization/roles/${encodeURIComponent(name)}`,

  // Capabilities
  CAPABILITIES: '/services/authorization/capabilities',

  // Apps
  APPS_LOCAL: '/services/apps/local',
  APP_LOCAL: (name: string) => `/services/apps/local/${encodeURIComponent(name)}`,
  APP: (name: string) => `/services/apps/local/${encodeURIComponent(name)}`,
  APP_INSTALL: '/services/apps/local',
  APP_UPDATE: (name: string) => `/services/apps/local/${encodeURIComponent(name)}/update`,
  APPS_APPSLOCAL: '/servicesNS/-/-/apps/local',

  // KV Store
  KVSTORE_COLLECTIONS: (app: string, owner: string) =>
    `/servicesNS/${encodeURIComponent(owner)}/${encodeURIComponent(app)}/storage/collections/config`,
  KVSTORE_COLLECTION: (app: string, owner: string, collection: string) =>
    `/servicesNS/${encodeURIComponent(owner)}/${encodeURIComponent(app)}/storage/collections/config/${encodeURIComponent(collection)}`,
  KVSTORE_DATA: (app: string, owner: string, collection: string) =>
    `/servicesNS/${encodeURIComponent(owner)}/${encodeURIComponent(app)}/storage/collections/data/${encodeURIComponent(collection)}`,
  KVSTORE_RECORD: (app: string, owner: string, collection: string, key: string) =>
    `/servicesNS/${encodeURIComponent(owner)}/${encodeURIComponent(app)}/storage/collections/data/${encodeURIComponent(collection)}/${encodeURIComponent(key)}`,

  // Server
  SERVER_INFO: '/services/server/info',
  SERVER_SETTINGS: '/services/server/settings',
  SERVER_STATUS: '/services/server/status',
  SERVER_CONTROL: '/services/server/control',
  SERVER_CONTROL_RESTART: '/services/server/control/restart',
  SERVER_RESTART: '/services/server/control/restart',
  SERVER_MESSAGES: '/services/messages',
  MESSAGES: '/services/messages',
  SERVER_HEALTH: '/services/server/health/splunkd',
  HEALTH: '/services/server/health/splunkd',
  SERVER_HEALTH_DETAILS: '/services/server/health/splunkd/details',
  SERVER_INTROSPECTION: '/services/server/introspection',
  LICENSES: '/services/licenser/licenses',

  // Cluster
  CLUSTER_MASTER: '/services/cluster/master',
  CLUSTER_MASTER_INFO: '/services/cluster/master/info',
  CLUSTER_PEERS: '/services/cluster/master/peers',
  CLUSTER_MASTER_PEERS: '/services/cluster/master/peers',
  CLUSTER_SEARCHHEADS: '/services/cluster/master/searchheads',
  CLUSTER_MASTER_SEARCHHEADS: '/services/cluster/master/searchheads',
  CLUSTER_GENERATION: '/services/cluster/master/generation',
  CLUSTER_MASTER_GENERATION: '/services/cluster/master/generation',
  CLUSTER_BUCKETS: '/services/cluster/master/buckets',
  CLUSTER_MASTER_BUCKETS: '/services/cluster/master/buckets',
  CLUSTER_CONFIG: '/services/cluster/config',
  CLUSTER_PEER: (peer: string) => `/services/cluster/master/peers/${encodeURIComponent(peer)}`,

  // Deployment
  DEPLOYMENT_SERVER: '/services/deployment/server',
  DEPLOYMENT_CLIENTS: '/services/deployment/server/clients',

  // License
  LICENSE_MESSAGES: '/services/licenser/messages',
  LICENSE_POOLS: '/services/licenser/pools',
  LICENSE_SLAVES: '/services/licenser/slaves',
  LICENSE_STACKS: '/services/licenser/stacks',
} as const;

/**
 * Default values
 */
export const DEFAULTS = {
  PAGINATION_COUNT: 100,
  SEARCH_TIMEOUT: 300,
  POLL_INTERVAL: 2,
  HEC_BATCH_SIZE: 100,
  MAX_RESULTS: 50000,
} as const;

/**
 * Search execution modes
 */
export const EXEC_MODES = {
  NORMAL: 'normal',
  BLOCKING: 'blocking',
  ONESHOT: 'oneshot',
} as const;

/**
 * Output modes
 */
export const OUTPUT_MODES = {
  JSON: 'json',
  JSON_COLS: 'json_cols',
  JSON_ROWS: 'json_rows',
  XML: 'xml',
  CSV: 'csv',
} as const;

/**
 * Alert types
 */
export const ALERT_TYPES = {
  ALWAYS: 'always',
  CUSTOM: 'custom',
  NUMBER_OF_EVENTS: 'number of events',
  NUMBER_OF_RESULTS: 'number of results',
  NUMBER_OF_HOSTS: 'number of hosts',
  NUMBER_OF_SOURCES: 'number of sources',
} as const;

/**
 * Alert comparators
 */
export const ALERT_COMPARATORS = {
  GREATER_THAN: 'greater than',
  LESS_THAN: 'less than',
  EQUAL_TO: 'equal to',
  NOT_EQUAL_TO: 'not equal to',
  RISES_BY: 'rises by',
  DROPS_BY: 'drops by',
  RISES_BY_PERC: 'rises by perc',
  DROPS_BY_PERC: 'drops by perc',
} as const;

/**
 * Index states
 */
export const INDEX_STATES = {
  ENABLED: 'enabled',
  DISABLED: 'disabled',
} as const;

/**
 * Bucket types
 */
export const BUCKET_TYPES = {
  HOT: 'hot',
  WARM: 'warm',
  COLD: 'cold',
  FROZEN: 'frozen',
  THAWED: 'thawed',
} as const;

/**
 * Cluster modes
 */
export const CLUSTER_MODES = {
  MASTER: 'master',
  SLAVE: 'slave',
  SEARCHHEAD: 'searchhead',
  DISABLED: 'disabled',
} as const;

/**
 * Server roles
 */
export const SERVER_ROLES = {
  INDEXER: 'indexer',
  SEARCH_HEAD: 'search_head',
  FORWARDER: 'forwarder',
  HEAVY_FORWARDER: 'heavy_forwarder',
  DEPLOYMENT_SERVER: 'deployment_server',
  CLUSTER_MASTER: 'cluster_master',
  LICENSE_MASTER: 'license_master',
  SHC_DEPLOYER: 'shc_deployer',
  SHC_MEMBER: 'shc_member',
} as const;
