/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

// Splunk API Response Types
export interface SplunkEntry<T = Record<string, unknown>> {
  name: string;
  id: string;
  updated: string;
  links: {
    alternate: string;
    list: string;
    edit?: string;
    remove?: string;
  };
  author: string;
  acl: SplunkAcl;
  content: T;
  [key: string]: unknown;
}

export interface SplunkAcl {
  app: string;
  can_change_perms: boolean;
  can_list: boolean;
  can_share_app: boolean;
  can_share_global: boolean;
  can_share_user: boolean;
  can_write: boolean;
  modifiable: boolean;
  owner: string;
  perms: {
    read: string[];
    write: string[];
  };
  removable: boolean;
  sharing: string;
}

export interface SplunkPaging {
  total: number;
  perPage: number;
  offset: number;
}

export interface SplunkResponse<T = Record<string, unknown>> {
  links: {
    create: string;
    alternate: string;
  };
  origin: string;
  updated: string;
  generator: {
    build: string;
    version: string;
  };
  entry: SplunkEntry<T>[];
  paging: SplunkPaging;
  messages?: SplunkMessage[];
  [key: string]: unknown;
}

export interface SplunkMessage {
  type: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  text: string;
}

// Search Job Types
export interface SearchJobContent {
  sid: string;
  label?: string;
  eventSearch?: string;
  eventSorting?: string;
  diskUsage?: number;
  dispatchState?: string;
  doneProgress?: number;
  dropCount?: number;
  earliestTime?: string;
  eventAvailableCount?: number;
  eventCount?: number;
  eventFieldCount?: number;
  eventIsStreaming?: boolean;
  eventIsTruncated?: boolean;
  isBatchModeSearch?: boolean;
  isDone?: boolean;
  isFailed?: boolean;
  isFinalized?: boolean;
  isPaused?: boolean;
  isPreviewEnabled?: boolean;
  isRealTimeSearch?: boolean;
  isRemoteTimeline?: boolean;
  isSaved?: boolean;
  isSavedSearch?: boolean;
  isZombie?: boolean;
  latestTime?: string;
  messages?: SplunkMessage[];
  numPreviews?: number;
  priority?: number;
  remoteSearch?: string;
  resultCount?: number;
  resultIsStreaming?: boolean;
  resultPreviewCount?: number;
  runDuration?: number;
  scanCount?: number;
  searchProviders?: string[];
  ttl?: number;
}

export interface SearchResult {
  _raw?: string;
  _time?: string;
  host?: string;
  source?: string;
  sourcetype?: string;
  index?: string;
  [key: string]: unknown;
}

export interface SearchResultsResponse {
  init_offset: number;
  messages?: SplunkMessage[];
  preview: boolean;
  results: SearchResult[];
  highlighted?: Record<string, unknown>;
  [key: string]: unknown;
}

// Saved Search Types
export interface SavedSearchContent {
  search: string;
  description?: string;
  disabled?: boolean;
  is_scheduled?: boolean;
  is_visible?: boolean;
  cron_schedule?: string;
  'dispatch.earliest_time'?: string;
  'dispatch.latest_time'?: string;
  'action.email'?: string;
  'action.email.to'?: string;
  'action.webhook'?: string;
  alert_type?: string;
  alert_comparator?: string;
  alert_threshold?: string;
  alert_condition?: string;
  alert_suppress?: boolean;
  alert_suppress_period?: string;
  next_scheduled_time?: string;
  qualifiedSearch?: string;
}

// Index Types
export interface IndexContent {
  assureUTF8?: boolean;
  blockSignSize?: number;
  bucketRebuildMemoryHint?: string;
  coldPath?: string;
  coldPath_expanded?: string;
  coldToFrozenDir?: string;
  coldToFrozenScript?: string;
  compressRawdata?: boolean;
  currentDBSizeMB?: number;
  datatype?: 'event' | 'metric';
  defaultDatabase?: string;
  disabled?: boolean;
  enableOnlineBucketRepair?: boolean;
  frozenTimePeriodInSecs?: number;
  homePath?: string;
  homePath_expanded?: string;
  indexThreads?: string;
  isInternal?: boolean;
  isReadyOnly?: boolean;
  isVirtual?: boolean;
  journalCompression?: string;
  lastInitTime?: string;
  maxBloomBackfillBucketAge?: string;
  maxConcurrentOptimizes?: number;
  maxDataSize?: string;
  maxHotBuckets?: number;
  maxHotIdleSecs?: number;
  maxHotSpanSecs?: number;
  maxMemMB?: number;
  maxMetaEntries?: number;
  maxRunningProcessGroups?: number;
  maxRunningProcessGroupsLowPriority?: number;
  maxTime?: string;
  maxTotalDataSizeMB?: number;
  maxWarmDBCount?: number;
  memPoolMB?: string;
  minRawFileSyncSecs?: string;
  minTime?: string;
  partialServiceMetaPeriod?: number;
  processTrackerServiceInterval?: number;
  quarantineFutureSecs?: number;
  quarantinePastSecs?: number;
  rawChunkSizeBytes?: number;
  repFactor?: string;
  rotatePeriodInSecs?: number;
  serviceMetaPeriod?: number;
  suppressBannerList?: string;
  sync?: number;
  syncMeta?: boolean;
  thawedPath?: string;
  thawedPath_expanded?: string;
  throttleCheckPeriod?: number;
  totalEventCount?: number;
  tstatsHomePath?: string;
  tstatsHomePath_expanded?: string;
}

// Data Input Types
export interface DataInputContent {
  disabled?: boolean;
  host?: string;
  index?: string;
  sourcetype?: string;
  _rcvbuf?: number;
  connection_host?: string;
  group?: string;
  no_appending_timestamp?: boolean;
  no_priority_stripping?: boolean;
  queue?: string;
  rawTcpDoneTimeout?: number;
  restrictToHost?: string;
  SSL?: boolean;
  source?: string;
  crcSalt?: string;
  followTail?: boolean;
  ignoreOlderThan?: string;
  recursive?: boolean;
  time_before_close?: number;
  whitelist?: string;
  blacklist?: string;
}

// HEC Types
export interface HecTokenContent {
  disabled?: boolean;
  host?: string;
  index?: string;
  indexes?: string[];
  name?: string;
  source?: string;
  sourcetype?: string;
  token?: string;
  useACK?: boolean;
}

export interface HecEvent {
  event: unknown;
  time?: number;
  host?: string;
  source?: string;
  sourcetype?: string;
  index?: string;
  fields?: Record<string, unknown>;
}

export interface HecResponse {
  text: string;
  code: number;
  ackId?: number;
}

// Alert Types
export interface AlertContent {
  actions?: string;
  alert_type?: string;
  expiration_time?: string;
  savedsearch_name?: string;
  severity?: string;
  sid?: string;
  trigger_time?: string;
  triggered_alerts?: number;
}

// User Types
export interface UserContent {
  capabilities?: string[];
  defaultApp?: string;
  defaultAppIsUserOverride?: boolean;
  defaultAppSourceRole?: string;
  email?: string;
  password?: string;
  realname?: string;
  restart_background_jobs?: boolean;
  roles?: string[];
  tz?: string;
  type?: string;
}

// Role Types
export interface RoleContent {
  capabilities?: string[];
  cumulativeRTSrchJobsQuota?: number;
  cumulativeSrchJobsQuota?: number;
  defaultApp?: string;
  imported_capabilities?: string[];
  imported_roles?: string[];
  imported_rtSrchJobsQuota?: number;
  imported_srchDiskQuota?: number;
  imported_srchFilter?: string;
  imported_srchIndexesAllowed?: string[];
  imported_srchIndexesDefault?: string[];
  imported_srchJobsQuota?: number;
  imported_srchTimeWin?: number;
  rtSrchJobsQuota?: number;
  srchDiskQuota?: number;
  srchFilter?: string;
  srchIndexesAllowed?: string[];
  srchIndexesDefault?: string[];
  srchJobsQuota?: number;
  srchTimeWin?: number;
}

// App Types
export interface AppContent {
  build?: string;
  check_for_updates?: boolean;
  configured?: boolean;
  core?: boolean;
  description?: string;
  disabled?: boolean;
  install_source_checksum?: string;
  label?: string;
  managed_by_deployment_client?: boolean;
  show_in_nav?: boolean;
  source_location?: string;
  state_change_requires_restart?: boolean;
  version?: string;
  visible?: boolean;
}

// KV Store Types
export interface KvStoreCollection {
  name: string;
  field?: Record<string, string>;
  accelerated_fields?: Record<string, string>;
  replicate?: boolean;
}

export interface KvStoreRecord {
  _key?: string;
  _user?: string;
  [key: string]: unknown;
}

// Server Types
export interface ServerInfoContent {
  activeLicenseGroup?: string;
  activeLicenseSubgroup?: string;
  build?: string;
  cluster_label?: string[];
  cpu_arch?: string;
  eai_acl?: null;
  guid?: string;
  health_info?: string;
  host?: string;
  host_fqdn?: string;
  host_resolved?: string;
  isForwarding?: boolean;
  isFree?: boolean;
  isTrial?: boolean;
  kvStoreStatus?: string;
  licenseKeys?: string[];
  licenseLabels?: string[];
  licenseSignature?: string;
  licenseState?: string;
  license_labels?: string[];
  master_guid?: string;
  master_uri?: string;
  max_users?: number;
  mode?: string;
  numberOfCores?: number;
  numberOfVirtualCores?: number;
  os_build?: string;
  os_name?: string;
  os_version?: string;
  physicalMemoryMB?: number;
  product_type?: string;
  rtsearch_enabled?: boolean;
  serverName?: string;
  server_roles?: string[];
  startup_time?: number;
  staticAssetId?: string;
  version?: string;
}

// Cluster Types
export interface ClusterMasterContent {
  active_bundle?: {
    bundle_path: string;
    checksum: string;
    timestamp: number;
  };
  apply_bundle_status?: {
    invalid_bundle?: {
      bundle_path: string;
      bundle_validation_errors_on_master: string[];
      checksum: string;
      timestamp: number;
    };
    reload_bundle_issued?: boolean;
    status?: string;
  };
  eai_acl?: null;
  generation?: number;
  indexing_ready_flag?: boolean;
  initialized_flag?: boolean;
  label?: string;
  maintenance_mode?: boolean;
  multisite?: boolean;
  peers?: Record<string, ClusterPeer>;
  primaries_backup_status?: string;
  quiet_period_flag?: boolean;
  rolling_restart_flag?: boolean;
  rolling_restart_or_upgrade?: boolean;
  service_ready_flag?: boolean;
  start_time?: number;
}

export interface ClusterPeer {
  bucket_count?: number;
  bucket_count_by_index?: Record<string, number>;
  default_mount_point?: string;
  guid?: string;
  heartbeat_count?: number;
  host_port_pair?: string;
  indexing_disk_space?: number;
  is_searchable?: boolean;
  label?: string;
  last_heartbeat?: number;
  peer_registered_summaries_count?: number;
  pending_job_count?: number;
  primary_count?: number;
  primary_count_remote?: number;
  replication_count?: number;
  replication_port?: number;
  replication_use_ssl?: boolean;
  search_state_counter?: Record<string, number>;
  site?: string;
  splunk_version?: string;
  status?: string;
  status_counter?: Record<string, number>;
}

// Error Types
export interface SplunkError {
  messages: SplunkMessage[];
}

// Operation Parameters
export interface SearchJobParams {
  search: string;
  earliest_time?: string;
  latest_time?: string;
  exec_mode?: 'normal' | 'blocking' | 'oneshot';
  output_mode?: 'json' | 'json_cols' | 'json_rows' | 'xml' | 'csv';
  max_count?: number;
  status_buckets?: number;
  rf?: string;
  preview?: boolean;
  adhoc_search_level?: 'verbose' | 'fast' | 'smart';
  auto_cancel?: number;
  auto_finalize_ec?: number;
  auto_pause?: number;
  enable_lookups?: boolean;
  force_bundle_replication?: boolean;
  id?: string;
  index_earliest?: string;
  index_latest?: string;
  max_time?: number;
  namespace?: string;
  now?: string;
  reduce_freq?: number;
  reload_macros?: boolean;
  remote_server_list?: string;
  reuse_max_seconds_ago?: number;
  rt_blocking?: boolean;
  rt_indexfilter?: boolean;
  rt_maxblocksecs?: number;
  rt_queue_size?: number;
  search_listener?: string;
  search_mode?: 'normal' | 'realtime';
  spawn_process?: boolean;
  sync_bundle_replication?: boolean;
  time_format?: string;
  timeout?: number;
}

export interface GetResultsParams {
  count?: number;
  offset?: number;
  output_mode?: string;
  search?: string;
  field_list?: string;
}
