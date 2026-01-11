# n8n-nodes-splunk

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for Splunk Enterprise, the industry-leading platform for log management, SIEM, and machine data analytics. This node enables workflow automation for search operations, index management, saved searches, alerts, and data ingestion.

![n8n](https://img.shields.io/badge/n8n-community--node-blue)
![Splunk](https://img.shields.io/badge/Splunk-Enterprise-green)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)

## Features

- **Search Jobs**: Create, manage, and retrieve results from ad-hoc and scheduled searches
- **Saved Searches**: Create, update, and run saved searches with alerting capabilities
- **Indexes**: Create, manage, and configure Splunk indexes
- **Data Inputs**: Configure file monitors, TCP, UDP, and scripted inputs
- **HTTP Event Collector (HEC)**: Manage HEC tokens and send events directly
- **Alerts**: Monitor fired alerts and manage alert actions
- **Users & Roles**: Full user and role management capabilities
- **Apps**: Install, configure, and manage Splunk apps
- **KV Store**: Manage collections and records in Splunk's Key-Value Store
- **Server**: Get server info, status, health, and perform restarts
- **Cluster**: Monitor and manage cluster master, peers, and configuration
- **Trigger Node**: Poll-based trigger for alert monitoring and search completion

## Installation

### Community Nodes (Recommended)

1. Go to **Settings** > **Community Nodes**
2. Click **Install**
3. Enter `n8n-nodes-splunk`
4. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n custom nodes directory
cd ~/.n8n/custom

# Install the package
npm install n8n-nodes-splunk
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-splunk.git
cd n8n-nodes-splunk

# Install dependencies
npm install

# Build the project
npm run build

# Create symlink to n8n custom nodes directory
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-splunk

# Restart n8n
n8n start
```

## Credentials Setup

| Field | Description | Required |
|-------|-------------|----------|
| Base URL | Splunk instance URL (e.g., `https://splunk.company.com:8089`) | Yes |
| Auth Type | `Basic Auth` or `Token` | Yes |
| Username | Splunk username (for Basic Auth) | Conditional |
| Password | Splunk password (for Basic Auth) | Conditional |
| Auth Token | Pre-generated authentication token | Conditional |
| Validate Certificates | Enable/disable SSL certificate validation | No |

## Resources & Operations

### Search Jobs
- Create, Get, Get All, Get Results, Get Events, Get Summary
- Cancel, Pause, Unpause, Finalize, Set TTL
- Supports normal, blocking, and oneshot execution modes

### Saved Searches
- Create, Get, Get All, Update, Delete
- Run (dispatch), Get History, Acknowledge alerts
- Scheduling with cron expressions

### Indexes
- Create, Get, Get All, Update, Delete
- Enable, Disable, Roll hot buckets
- Configure retention and sizing

### Data Inputs
- Create, Get, Get All, Update, Delete
- Enable, Disable
- Support for monitor, TCP, UDP, and scripted inputs

### HEC (HTTP Event Collector)
- Create, Get, Get All, Update, Delete
- Enable, Disable HEC tokens
- Send Event, Send Batch (bulk ingestion)

### Alerts
- Get, Get All, Update, Delete
- Get configured alert actions

### Users
- Create, Get, Get All, Update, Delete
- Get Roles, Set Roles

### Roles
- Create, Get, Get All, Update, Delete
- Capability management

### Apps
- Create, Get, Get All, Update, Delete
- Enable, Disable, Get Config

### KV Store
- Create, Get, Get All, Delete collections
- Insert, Get, Update, Delete records
- Query with filters

### Server
- Get Info, Get Status, Get Config
- Get Messages, Get Health
- Restart

### Cluster
- Get Master Info, Get Peers, Get Search Heads
- Get Generation, Get Buckets
- Maintenance mode control

## Trigger Node

The Splunk Trigger node supports:

- **Alert Fired**: Triggers when configured alerts fire
- **New Search Results**: Triggers when new results are found
- **Saved Search Completed**: Triggers when scheduled searches complete

## Usage Examples

### Run a Search Query

```javascript
// Search for failed login attempts in the last 24 hours
{
  "resource": "searchJob",
  "operation": "create",
  "search": "index=security sourcetype=auth failed login | stats count by user, src_ip",
  "execMode": "blocking",
  "earliestTime": "-24h",
  "latestTime": "now"
}
```

### Send Events via HEC

```javascript
// Send a batch of events
{
  "resource": "hec",
  "operation": "sendBatch",
  "events": [
    { "event": "User login", "index": "main", "sourcetype": "app_logs" },
    { "event": "Data processed", "index": "main", "sourcetype": "app_logs" }
  ]
}
```

### Create a Saved Search with Alerting

```javascript
// Create an alert for error spikes
{
  "resource": "savedSearch",
  "operation": "create",
  "name": "Error Spike Alert",
  "search": "index=app ERROR | stats count | where count > 100",
  "isScheduled": true,
  "cronSchedule": "*/5 * * * *",
  "alertType": "number of results",
  "alertComparator": "greater than",
  "alertThreshold": "0"
}
```

## Error Handling

The node handles common Splunk API errors:

- **400 Bad Request**: Invalid SPL query or malformed request
- **401 Unauthorized**: Invalid or expired credentials
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **503 Service Unavailable**: Splunk service temporarily unavailable

## Security Best Practices

1. **Use Token Authentication**: Prefer pre-generated tokens over basic auth for production
2. **Limit Token Permissions**: Create tokens with minimal required capabilities
3. **Enable SSL**: Always use HTTPS in production environments
4. **Rotate Credentials**: Regularly rotate authentication tokens
5. **Audit Access**: Monitor Splunk audit logs for API access

## Development

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm test

# Build the project
npm run build

# Watch for changes
npm run dev
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- **Documentation**: [Splunk REST API Reference](https://docs.splunk.com/Documentation/Splunk/latest/RESTREF/RESTprolog)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-splunk/issues)
- **n8n Community**: [n8n Community Forum](https://community.n8n.io/)

## Acknowledgments

- [Splunk](https://www.splunk.com/) for their comprehensive REST API
- [n8n](https://n8n.io/) for the workflow automation platform
- The open-source community for contributions and feedback
