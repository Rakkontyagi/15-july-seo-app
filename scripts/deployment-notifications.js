#!/usr/bin/env node
/**
 * Deployment Notifications System
 * Handles alerts and notifications for deployment events
 */

const https = require('https');
const crypto = require('crypto');
const deploymentConfig = require('../deployment.config.js');

class DeploymentNotifications {
  constructor(environment = 'staging') {
    this.environment = environment;
    this.config = deploymentConfig.environments[environment];
    this.notificationHistory = [];
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, 
      Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '');
  }

  async sendSlackNotification(message, channel = null) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (!webhookUrl) {
      this.log('warn', 'Slack webhook URL not configured');
      return false;
    }

    const notificationChannel = channel || this.config.notifications.slack.channel;
    
    const payload = {
      channel: notificationChannel,
      username: 'SEO Automation Deployment Bot',
      icon_emoji: ':robot_face:',
      ...message
    };

    try {
      const response = await this.makeHttpRequest(webhookUrl, 'POST', payload);
      
      if (response.statusCode === 200) {
        this.log('info', 'Slack notification sent successfully');
        return true;
      } else {
        this.log('error', 'Failed to send Slack notification', {
          statusCode: response.statusCode,
          response: response.body
        });
        return false;
      }
    } catch (error) {
      this.log('error', 'Error sending Slack notification', { error: error.message });
      return false;
    }
  }

  async sendEmailNotification(subject, body, recipients = null) {
    // In a real implementation, this would integrate with email service
    // For now, we'll log the email notification
    
    const emailRecipients = recipients || this.config.notifications.email.recipients;
    
    this.log('info', 'Email notification (simulated)', {
      to: emailRecipients,
      subject,
      body
    });

    return true;
  }

  async sendTeamsNotification(message) {
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
    
    if (!webhookUrl) {
      this.log('warn', 'Teams webhook URL not configured');
      return false;
    }

    const payload = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": message.color || "0076D7",
      "summary": message.title,
      "sections": [{
        "activityTitle": message.title,
        "activitySubtitle": message.subtitle || `Environment: ${this.environment}`,
        "activityImage": message.image || "https://via.placeholder.com/64x64",
        "facts": message.facts || [],
        "markdown": true
      }],
      "potentialAction": message.actions || []
    };

    try {
      const response = await this.makeHttpRequest(webhookUrl, 'POST', payload);
      
      if (response.statusCode === 200) {
        this.log('info', 'Teams notification sent successfully');
        return true;
      } else {
        this.log('error', 'Failed to send Teams notification', {
          statusCode: response.statusCode
        });
        return false;
      }
    } catch (error) {
      this.log('error', 'Error sending Teams notification', { error: error.message });
      return false;
    }
  }

  async sendPagerDutyAlert(severity, description, details = {}) {
    const integrationKey = process.env.PAGERDUTY_INTEGRATION_KEY;
    
    if (!integrationKey) {
      this.log('warn', 'PagerDuty integration key not configured');
      return false;
    }

    const payload = {
      routing_key: integrationKey,
      event_action: 'trigger',
      dedup_key: `deployment-${this.environment}-${Date.now()}`,
      payload: {
        summary: description,
        severity: severity,
        source: 'seo-automation-deployment',
        component: 'deployment-system',
        group: this.environment,
        class: 'deployment',
        custom_details: details
      }
    };

    try {
      const response = await this.makeHttpRequest(
        'https://events.pagerduty.com/v2/enqueue',
        'POST',
        payload
      );
      
      if (response.statusCode === 202) {
        this.log('info', 'PagerDuty alert sent successfully');
        return true;
      } else {
        this.log('error', 'Failed to send PagerDuty alert', {
          statusCode: response.statusCode
        });
        return false;
      }
    } catch (error) {
      this.log('error', 'Error sending PagerDuty alert', { error: error.message });
      return false;
    }
  }

  makeHttpRequest(url, method, data) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const postData = JSON.stringify(data);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'SEO-Automation-Deployment-Bot/1.0'
        }
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseBody
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  async notifyDeploymentStart(deploymentInfo) {
    const message = {
      text: `🚀 Deployment Started - ${this.environment.toUpperCase()}`,
      attachments: [{
        color: 'warning',
        fields: [
          {
            title: 'Environment',
            value: this.environment,
            short: true
          },
          {
            title: 'Branch',
            value: deploymentInfo.branch || 'unknown',
            short: true
          },
          {
            title: 'Commit',
            value: deploymentInfo.commit || 'unknown',
            short: true
          },
          {
            title: 'Started By',
            value: deploymentInfo.user || 'system',
            short: true
          },
          {
            title: 'Timestamp',
            value: new Date().toISOString(),
            short: false
          }
        ]
      }]
    };

    const results = await Promise.allSettled([
      this.sendSlackNotification(message),
      this.sendEmailNotification(
        `Deployment Started - ${this.environment}`,
        `Deployment has started for ${this.environment} environment.`
      )
    ]);

    return this.processNotificationResults(results);
  }

  async notifyDeploymentSuccess(deploymentInfo) {
    const duration = this.formatDuration(deploymentInfo.duration || 0);
    
    const message = {
      text: `✅ Deployment Successful - ${this.environment.toUpperCase()}`,
      attachments: [{
        color: 'good',
        fields: [
          {
            title: 'Environment',
            value: this.environment,
            short: true
          },
          {
            title: 'Duration',
            value: duration,
            short: true
          },
          {
            title: 'Deployment URL',
            value: deploymentInfo.url || this.config.url,
            short: false
          },
          {
            title: 'Health Check',
            value: deploymentInfo.healthCheck ? '✅ Passed' : '❌ Failed',
            short: true
          },
          {
            title: 'Version',
            value: deploymentInfo.version || 'unknown',
            short: true
          }
        ]
      }]
    };

    const teamsMessage = {
      title: '✅ Deployment Successful',
      subtitle: `${this.environment.toUpperCase()} - ${duration}`,
      color: '36a64f',
      facts: [
        { name: 'Environment', value: this.environment },
        { name: 'Duration', value: duration },
        { name: 'URL', value: deploymentInfo.url || this.config.url },
        { name: 'Health Check', value: deploymentInfo.healthCheck ? 'Passed' : 'Failed' }
      ],
      actions: [{
        "@type": "OpenUri",
        "name": "View Application",
        "targets": [{ "os": "default", "uri": deploymentInfo.url || this.config.url }]
      }]
    };

    const results = await Promise.allSettled([
      this.sendSlackNotification(message),
      this.sendTeamsNotification(teamsMessage),
      this.sendEmailNotification(
        `Deployment Successful - ${this.environment}`,
        `Deployment to ${this.environment} completed successfully in ${duration}.`
      )
    ]);

    return this.processNotificationResults(results);
  }

  async notifyDeploymentFailure(deploymentInfo, error) {
    const duration = this.formatDuration(deploymentInfo.duration || 0);
    
    const message = {
      text: `❌ Deployment Failed - ${this.environment.toUpperCase()}`,
      attachments: [{
        color: 'danger',
        fields: [
          {
            title: 'Environment',
            value: this.environment,
            short: true
          },
          {
            title: 'Duration',
            value: duration,
            short: true
          },
          {
            title: 'Error',
            value: error.message || 'Unknown error',
            short: false
          },
          {
            title: 'Failed Stage',
            value: deploymentInfo.failedStage || 'unknown',
            short: true
          },
          {
            title: 'Workflow URL',
            value: deploymentInfo.workflowUrl || 'N/A',
            short: true
          }
        ]
      }]
    };

    const teamsMessage = {
      title: '❌ Deployment Failed',
      subtitle: `${this.environment.toUpperCase()} - ${duration}`,
      color: 'ff0000',
      facts: [
        { name: 'Environment', value: this.environment },
        { name: 'Duration', value: duration },
        { name: 'Error', value: error.message || 'Unknown error' },
        { name: 'Failed Stage', value: deploymentInfo.failedStage || 'unknown' }
      ]
    };

    const results = await Promise.allSettled([
      this.sendSlackNotification(message),
      this.sendTeamsNotification(teamsMessage),
      this.sendEmailNotification(
        `Deployment Failed - ${this.environment}`,
        `Deployment to ${this.environment} failed after ${duration}. Error: ${error.message}`
      )
    ]);

    // Send PagerDuty alert for production failures
    if (this.environment === 'production') {
      await this.sendPagerDutyAlert(
        'error',
        `Production deployment failed: ${error.message}`,
        {
          environment: this.environment,
          duration: duration,
          failedStage: deploymentInfo.failedStage,
          workflowUrl: deploymentInfo.workflowUrl
        }
      );
    }

    return this.processNotificationResults(results);
  }

  async notifyRollbackStart(rollbackInfo) {
    const message = {
      text: `🔄 Rollback Started - ${this.environment.toUpperCase()}`,
      attachments: [{
        color: 'warning',
        fields: [
          {
            title: 'Environment',
            value: this.environment,
            short: true
          },
          {
            title: 'Rollback Type',
            value: rollbackInfo.type || 'full',
            short: true
          },
          {
            title: 'Reason',
            value: rollbackInfo.reason || 'Emergency rollback',
            short: false
          },
          {
            title: 'Initiated By',
            value: rollbackInfo.user || 'system',
            short: true
          },
          {
            title: 'Target Version',
            value: rollbackInfo.targetVersion || 'previous',
            short: true
          }
        ]
      }]
    };

    const results = await Promise.allSettled([
      this.sendSlackNotification(message),
      this.sendEmailNotification(
        `Rollback Started - ${this.environment}`,
        `Rollback has been initiated for ${this.environment} environment. Reason: ${rollbackInfo.reason}`
      )
    ]);

    return this.processNotificationResults(results);
  }

  async notifyRollbackComplete(rollbackInfo) {
    const duration = this.formatDuration(rollbackInfo.duration || 0);
    const status = rollbackInfo.success ? 'Successful' : 'Failed';
    const color = rollbackInfo.success ? 'good' : 'danger';
    const emoji = rollbackInfo.success ? '✅' : '❌';
    
    const message = {
      text: `${emoji} Rollback ${status} - ${this.environment.toUpperCase()}`,
      attachments: [{
        color: color,
        fields: [
          {
            title: 'Environment',
            value: this.environment,
            short: true
          },
          {
            title: 'Duration',
            value: duration,
            short: true
          },
          {
            title: 'Status',
            value: status,
            short: true
          },
          {
            title: 'Type',
            value: rollbackInfo.type || 'full',
            short: true
          },
          {
            title: 'Health Check',
            value: rollbackInfo.healthCheck ? '✅ Passed' : '❌ Failed',
            short: true
          },
          {
            title: 'Current URL',
            value: rollbackInfo.currentUrl || this.config.url,
            short: false
          }
        ]
      }]
    };

    const results = await Promise.allSettled([
      this.sendSlackNotification(message),
      this.sendEmailNotification(
        `Rollback ${status} - ${this.environment}`,
        `Rollback for ${this.environment} environment ${status.toLowerCase()} in ${duration}.`
      )
    ]);

    return this.processNotificationResults(results);
  }

  async notifyHealthCheckFailure(healthCheckInfo) {
    const message = {
      text: `⚠️ Health Check Failed - ${this.environment.toUpperCase()}`,
      attachments: [{
        color: 'danger',
        fields: [
          {
            title: 'Environment',
            value: this.environment,
            short: true
          },
          {
            title: 'Failed Endpoint',
            value: healthCheckInfo.endpoint || 'unknown',
            short: true
          },
          {
            title: 'Error',
            value: healthCheckInfo.error || 'Unknown error',
            short: false
          },
          {
            title: 'Response Time',
            value: `${healthCheckInfo.responseTime || 0}ms`,
            short: true
          },
          {
            title: 'Status Code',
            value: healthCheckInfo.statusCode || 'N/A',
            short: true
          }
        ]
      }]
    };

    const results = await Promise.allSettled([
      this.sendSlackNotification(message),
      this.sendEmailNotification(
        `Health Check Failed - ${this.environment}`,
        `Health check failed for ${this.environment} environment. Endpoint: ${healthCheckInfo.endpoint}`
      )
    ]);

    // Send PagerDuty alert for production health check failures
    if (this.environment === 'production') {
      await this.sendPagerDutyAlert(
        'error',
        `Production health check failed: ${healthCheckInfo.endpoint}`,
        healthCheckInfo
      );
    }

    return this.processNotificationResults(results);
  }

  async notifyMaintenanceMode(maintenanceInfo) {
    const action = maintenanceInfo.enabled ? 'Enabled' : 'Disabled';
    const color = maintenanceInfo.enabled ? 'warning' : 'good';
    const emoji = maintenanceInfo.enabled ? '🚧' : '✅';
    
    const message = {
      text: `${emoji} Maintenance Mode ${action} - ${this.environment.toUpperCase()}`,
      attachments: [{
        color: color,
        fields: [
          {
            title: 'Environment',
            value: this.environment,
            short: true
          },
          {
            title: 'Status',
            value: action,
            short: true
          },
          {
            title: 'Reason',
            value: maintenanceInfo.reason || 'Scheduled maintenance',
            short: false
          },
          {
            title: 'Duration',
            value: maintenanceInfo.duration || 'Unknown',
            short: true
          },
          {
            title: 'Initiated By',
            value: maintenanceInfo.user || 'system',
            short: true
          }
        ]
      }]
    };

    const results = await Promise.allSettled([
      this.sendSlackNotification(message),
      this.sendEmailNotification(
        `Maintenance Mode ${action} - ${this.environment}`,
        `Maintenance mode has been ${action.toLowerCase()} for ${this.environment} environment.`
      )
    ]);

    return this.processNotificationResults(results);
  }

  processNotificationResults(results) {
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;
    
    const failed = results.length - successful;
    
    this.log('info', 'Notification results', {
      successful,
      failed,
      total: results.length
    });
    
    return {
      successful,
      failed,
      total: results.length,
      success: successful > 0
    };
  }

  async testNotifications() {
    this.log('info', 'Testing notification channels...');
    
    const testMessage = {
      text: `🧪 Test Notification - ${this.environment.toUpperCase()}`,
      attachments: [{
        color: 'good',
        fields: [
          {
            title: 'Test Status',
            value: 'All systems operational',
            short: true
          },
          {
            title: 'Environment',
            value: this.environment,
            short: true
          },
          {
            title: 'Timestamp',
            value: new Date().toISOString(),
            short: false
          }
        ]
      }]
    };

    const results = await Promise.allSettled([
      this.sendSlackNotification(testMessage),
      this.sendEmailNotification(
        `Test Notification - ${this.environment}`,
        'This is a test notification from the deployment system.'
      )
    ]);

    return this.processNotificationResults(results);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'staging';
  const action = args.find(arg => arg.startsWith('--action='))?.split('=')[1] || 'test';
  
  const notifications = new DeploymentNotifications(environment);
  
  try {
    let result;
    
    switch (action) {
      case 'test':
        result = await notifications.testNotifications();
        break;
      case 'deployment-start':
        result = await notifications.notifyDeploymentStart({
          branch: args.find(arg => arg.startsWith('--branch='))?.split('=')[1],
          commit: args.find(arg => arg.startsWith('--commit='))?.split('=')[1],
          user: args.find(arg => arg.startsWith('--user='))?.split('=')[1]
        });
        break;
      case 'deployment-success':
        result = await notifications.notifyDeploymentSuccess({
          duration: parseInt(args.find(arg => arg.startsWith('--duration='))?.split('=')[1]) || 0,
          url: args.find(arg => arg.startsWith('--url='))?.split('=')[1],
          healthCheck: args.includes('--health-check-passed')
        });
        break;
      case 'deployment-failure':
        result = await notifications.notifyDeploymentFailure(
          {
            duration: parseInt(args.find(arg => arg.startsWith('--duration='))?.split('=')[1]) || 0,
            failedStage: args.find(arg => arg.startsWith('--failed-stage='))?.split('=')[1]
          },
          {
            message: args.find(arg => arg.startsWith('--error='))?.split('=')[1] || 'Unknown error'
          }
        );
        break;
      default:
        console.log('Usage: node deployment-notifications.js --env=<environment> --action=<action>');
        console.log('Actions: test, deployment-start, deployment-success, deployment-failure');
        process.exit(1);
    }
    
    if (result.success) {
      console.log(`✅ Notifications sent successfully (${result.successful}/${result.total})`);
    } else {
      console.log(`❌ All notifications failed (${result.failed}/${result.total})`);
    }
    
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Notification process failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DeploymentNotifications };