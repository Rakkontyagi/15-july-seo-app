/**
 * Automated Security Scanner
 * Comprehensive vulnerability detection and dependency scanning
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '@/lib/logging/logger';
import { auditLogger, AuditEventType, AuditSeverity } from './audit-logging';

const execAsync = promisify(exec);

export interface VulnerabilityReport {
  id: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  package: string;
  version: string;
  patched_versions?: string;
  recommendation: string;
  cves: string[];
  created: Date;
}

export interface SecurityScanResult {
  timestamp: Date;
  scanType: 'dependencies' | 'code' | 'containers' | 'full';
  status: 'completed' | 'failed' | 'partial';
  vulnerabilities: VulnerabilityReport[];
  summary: {
    total: number;
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
  recommendations: string[];
  nextScanDate: Date;
}

export interface SecurityConfig {
  enableAutomaticScanning: boolean;
  scanInterval: number; // milliseconds
  alertThresholds: {
    critical: number;
    high: number;
    moderate: number;
  };
  excludePackages: string[];
  enableSlackAlerts: boolean;
  enableEmailAlerts: boolean;
  maintainerEmails: string[];
}

export class SecurityScanner {
  private config: SecurityConfig;
  private scanInterval?: NodeJS.Timeout;
  private lastScanResult?: SecurityScanResult;

  constructor(config: SecurityConfig) {
    this.config = config;
    this.initializeScheduledScanning();
  }

  /**
   * Initialize automatic scheduled scanning
   */
  private initializeScheduledScanning(): void {
    if (this.config.enableAutomaticScanning && this.config.scanInterval > 0) {
      this.scanInterval = setInterval(async () => {
        try {
          await this.performFullSecurityScan();
        } catch (error) {
          logger.error('Scheduled security scan failed', { error });
        }
      }, this.config.scanInterval);

      logger.info('Automated security scanning initialized', {
        interval: this.config.scanInterval,
        enabled: this.config.enableAutomaticScanning
      });
    }
  }

  /**
   * Perform comprehensive security scan
   */
  async performFullSecurityScan(): Promise<SecurityScanResult> {
    const startTime = Date.now();
    logger.info('Starting full security scan');

    await auditLogger.log({
      event_type: AuditEventType.SYSTEM_ERROR, // Using existing enum
      severity: AuditSeverity.LOW,
      action: 'security_scan_started',
      description: 'Full security scan initiated',
      success: true,
      metadata: { scanType: 'full' }
    });

    try {
      const [dependencyVulns, codeVulns] = await Promise.all([
        this.scanDependencies(),
        this.scanCodeVulnerabilities()
      ]);

      const allVulnerabilities = [...dependencyVulns, ...codeVulns];
      const summary = this.generateSummary(allVulnerabilities);
      
      const result: SecurityScanResult = {
        timestamp: new Date(),
        scanType: 'full',
        status: 'completed',
        vulnerabilities: allVulnerabilities,
        summary,
        recommendations: this.generateRecommendations(allVulnerabilities),
        nextScanDate: new Date(Date.now() + this.config.scanInterval)
      };

      this.lastScanResult = result;

      // Check alert thresholds and send notifications
      await this.checkAlertThresholds(result);

      const duration = Date.now() - startTime;
      logger.info('Security scan completed', {
        duration,
        vulnerabilities: summary.total,
        critical: summary.critical,
        high: summary.high
      });

      await auditLogger.log({
        event_type: AuditEventType.SYSTEM_ERROR,
        severity: summary.critical > 0 ? AuditSeverity.CRITICAL : AuditSeverity.LOW,
        action: 'security_scan_completed',
        description: `Security scan found ${summary.total} vulnerabilities`,
        success: true,
        metadata: { 
          duration,
          summary,
          scanType: 'full'
        }
      });

      return result;
    } catch (error) {
      logger.error('Security scan failed', { error });
      
      await auditLogger.log({
        event_type: AuditEventType.SYSTEM_ERROR,
        severity: AuditSeverity.HIGH,
        action: 'security_scan_failed',
        description: 'Security scan encountered an error',
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  /**
   * Scan dependencies for vulnerabilities using npm audit
   */
  private async scanDependencies(): Promise<VulnerabilityReport[]> {
    try {
      logger.info('Scanning dependencies for vulnerabilities');
      
      const { stdout, stderr } = await execAsync('npm audit --json', {
        cwd: process.cwd(),
        timeout: 60000 // 1 minute timeout
      });

      if (stderr && !stderr.includes('npm WARN')) {
        logger.warn('npm audit stderr output', { stderr });
      }

      const auditResult = JSON.parse(stdout);
      const vulnerabilities: VulnerabilityReport[] = [];

      // Parse npm audit results
      if (auditResult.vulnerabilities) {
        for (const [packageName, vulnData] of Object.entries(auditResult.vulnerabilities as any)) {
          const vuln = vulnData as any;
          
          // Skip packages in exclude list
          if (this.config.excludePackages.includes(packageName)) {
            continue;
          }

          vulnerabilities.push({
            id: `dep-${packageName}-${Date.now()}`,
            severity: this.mapSeverity(vuln.severity),
            title: vuln.title || `Vulnerability in ${packageName}`,
            description: vuln.summary || vuln.overview || 'No description available',
            package: packageName,
            version: vuln.range || 'unknown',
            patched_versions: vuln.fixAvailable ? 'Available' : undefined,
            recommendation: vuln.fixAvailable ? 
              `Update ${packageName} to fix vulnerability` : 
              `Review ${packageName} for security issues`,
            cves: vuln.cves || [],
            created: new Date()
          });
        }
      }

      logger.info('Dependency scan completed', { 
        vulnerabilities: vulnerabilities.length 
      });

      return vulnerabilities;
    } catch (error) {
      if (error instanceof Error && error.message.includes('npm audit')) {
        // npm audit might exit with code 1 when vulnerabilities are found
        logger.warn('npm audit found vulnerabilities or warnings', { error: error.message });
        return [];
      }
      
      logger.error('Dependency scanning failed', { error });
      throw new Error(`Dependency scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Scan code for security vulnerabilities
   */
  private async scanCodeVulnerabilities(): Promise<VulnerabilityReport[]> {
    const vulnerabilities: VulnerabilityReport[] = [];
    
    try {
      logger.info('Scanning code for security patterns');

      // Common security patterns to check
      const securityPatterns = [
        {
          pattern: /console\.log\([^)]*password[^)]*\)/gi,
          severity: 'high' as const,
          title: 'Password logged to console',
          description: 'Sensitive information (password) found in console.log statement'
        },
        {
          pattern: /console\.log\([^)]*secret[^)]*\)/gi,
          severity: 'high' as const,
          title: 'Secret logged to console',
          description: 'Sensitive information (secret) found in console.log statement'
        },
        {
          pattern: /eval\s*\(/gi,
          severity: 'critical' as const,
          title: 'Use of eval() function',
          description: 'eval() function can execute arbitrary code and is a security risk'
        },
        {
          pattern: /document\.write\s*\(/gi,
          severity: 'moderate' as const,
          title: 'Use of document.write()',
          description: 'document.write() can be exploited for XSS attacks'
        },
        {
          pattern: /innerHTML\s*=/gi,
          severity: 'moderate' as const,
          title: 'Direct innerHTML assignment',
          description: 'Direct innerHTML assignment can lead to XSS vulnerabilities'
        },
        {
          pattern: /process\.env\.[A-Z_]+.*console\.log/gi,
          severity: 'high' as const,
          title: 'Environment variable exposed in logs',
          description: 'Environment variables may contain sensitive information'
        }
      ];

      // Scan TypeScript and JavaScript files
      const { stdout: findFiles } = await execAsync(
        'find src -type f \\( -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" \\) | head -100'
      );

      const files = findFiles.trim().split('\n').filter(file => file.length > 0);

      for (const file of files) {
        try {
          const { stdout: fileContent } = await execAsync(`cat "${file}"`);
          
          for (const { pattern, severity, title, description } of securityPatterns) {
            const matches = fileContent.match(pattern);
            if (matches) {
              vulnerabilities.push({
                id: `code-${file}-${pattern.source}-${Date.now()}`,
                severity,
                title,
                description: `${description} (found in ${file})`,
                package: file,
                version: 'current',
                recommendation: `Review and fix security issue in ${file}`,
                cves: [],
                created: new Date()
              });
            }
          }
        } catch (fileError) {
          logger.warn('Could not scan file', { file, error: fileError });
        }
      }

      logger.info('Code security scan completed', { 
        filesScanned: files.length,
        vulnerabilities: vulnerabilities.length 
      });

      return vulnerabilities;
    } catch (error) {
      logger.error('Code security scanning failed', { error });
      return vulnerabilities; // Return any vulnerabilities found before the error
    }
  }

  /**
   * Generate vulnerability summary
   */
  private generateSummary(vulnerabilities: VulnerabilityReport[]): SecurityScanResult['summary'] {
    const summary = {
      total: vulnerabilities.length,
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0
    };

    vulnerabilities.forEach(vuln => {
      summary[vuln.severity]++;
    });

    return summary;
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(vulnerabilities: VulnerabilityReport[]): string[] {
    const recommendations: string[] = [];
    const summary = this.generateSummary(vulnerabilities);

    if (summary.critical > 0) {
      recommendations.push('🚨 URGENT: Address critical vulnerabilities immediately');
      recommendations.push('Consider taking the application offline until critical issues are resolved');
    }

    if (summary.high > 0) {
      recommendations.push('⚠️ HIGH PRIORITY: Schedule immediate maintenance to fix high-severity vulnerabilities');
    }

    if (summary.moderate > 0) {
      recommendations.push('📋 Plan updates for moderate-severity vulnerabilities in next maintenance window');
    }

    if (summary.total > 0) {
      recommendations.push('🔄 Run `npm update` to update dependencies to latest secure versions');
      recommendations.push('📚 Review security documentation for affected packages');
      recommendations.push('🧪 Test application thoroughly after applying security updates');
    }

    if (summary.total === 0) {
      recommendations.push('✅ No vulnerabilities detected - maintain current security practices');
      recommendations.push('🔍 Continue regular security scanning');
    }

    return recommendations;
  }

  /**
   * Check alert thresholds and send notifications
   */
  private async checkAlertThresholds(result: SecurityScanResult): Promise<void> {
    const { summary } = result;
    const { alertThresholds } = this.config;

    let shouldAlert = false;
    let alertLevel: 'critical' | 'high' | 'moderate' = 'moderate';

    if (summary.critical >= alertThresholds.critical) {
      shouldAlert = true;
      alertLevel = 'critical';
    } else if (summary.high >= alertThresholds.high) {
      shouldAlert = true;
      alertLevel = 'high';
    } else if (summary.moderate >= alertThresholds.moderate) {
      shouldAlert = true;
      alertLevel = 'moderate';
    }

    if (shouldAlert) {
      await this.sendSecurityAlert(result, alertLevel);
    }
  }

  /**
   * Send security alert notifications
   */
  private async sendSecurityAlert(
    result: SecurityScanResult, 
    level: 'critical' | 'high' | 'moderate'
  ): Promise<void> {
    const message = this.generateAlertMessage(result, level);
    
    logger.warn('Security alert triggered', {
      level,
      vulnerabilities: result.summary.total,
      critical: result.summary.critical,
      high: result.summary.high
    });

    // Log security alert
    await auditLogger.log({
      event_type: AuditEventType.SUSPICIOUS_ACTIVITY,
      severity: level === 'critical' ? AuditSeverity.CRITICAL : 
               level === 'high' ? AuditSeverity.HIGH : AuditSeverity.MEDIUM,
      action: 'security_alert',
      description: `Security scan triggered ${level} alert`,
      success: true,
      metadata: {
        alertLevel: level,
        vulnerabilities: result.summary,
        scanTimestamp: result.timestamp
      }
    });

    // In a real implementation, you would integrate with:
    // - Email service (SendGrid, AWS SES, etc.)
    // - Slack webhook
    // - PagerDuty
    // - Microsoft Teams
    console.log(`SECURITY ALERT [${level.toUpperCase()}]:\n${message}`);
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(result: SecurityScanResult, level: string): string {
    const { summary } = result;
    
    return `
🚨 SECURITY ALERT - ${level.toUpperCase()} LEVEL

Security scan completed at ${result.timestamp.toISOString()}

VULNERABILITY SUMMARY:
- Total: ${summary.total}
- Critical: ${summary.critical}
- High: ${summary.high}
- Moderate: ${summary.moderate}
- Low: ${summary.low}

CRITICAL VULNERABILITIES:
${result.vulnerabilities
  .filter(v => v.severity === 'critical')
  .slice(0, 5)
  .map(v => `- ${v.title} (${v.package})`)
  .join('\n') || 'None'}

TOP RECOMMENDATIONS:
${result.recommendations.slice(0, 3).map(r => `- ${r}`).join('\n')}

Next scan scheduled: ${result.nextScanDate.toISOString()}
    `.trim();
  }

  /**
   * Map npm audit severity to our severity levels
   */
  private mapSeverity(npmSeverity: string): VulnerabilityReport['severity'] {
    const mapping: Record<string, VulnerabilityReport['severity']> = {
      'critical': 'critical',
      'high': 'high',
      'moderate': 'moderate',
      'low': 'low',
      'info': 'low'
    };
    
    return mapping[npmSeverity] || 'moderate';
  }

  /**
   * Get the last scan result
   */
  getLastScanResult(): SecurityScanResult | undefined {
    return this.lastScanResult;
  }

  /**
   * Update scanner configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart scanning if interval changed
    if (newConfig.scanInterval !== undefined || newConfig.enableAutomaticScanning !== undefined) {
      if (this.scanInterval) {
        clearInterval(this.scanInterval);
      }
      this.initializeScheduledScanning();
    }

    logger.info('Security scanner configuration updated', { config: this.config });
  }

  /**
   * Stop scheduled scanning
   */
  stopScheduledScanning(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = undefined;
      logger.info('Scheduled security scanning stopped');
    }
  }

  /**
   * Perform quick dependency scan
   */
  async quickDependencyScan(): Promise<VulnerabilityReport[]> {
    return this.scanDependencies();
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(): Promise<string> {
    if (!this.lastScanResult) {
      throw new Error('No scan results available. Run a security scan first.');
    }

    const result = this.lastScanResult;
    
    return `
# Security Scan Report

**Scan Date:** ${result.timestamp.toISOString()}
**Scan Type:** ${result.scanType}
**Status:** ${result.status}

## Summary

| Severity | Count |
|----------|-------|
| Critical | ${result.summary.critical} |
| High     | ${result.summary.high} |
| Moderate | ${result.summary.moderate} |
| Low      | ${result.summary.low} |
| **Total** | **${result.summary.total}** |

## Vulnerabilities

${result.vulnerabilities.map(v => `
### ${v.title}
- **Package:** ${v.package}
- **Severity:** ${v.severity}
- **Description:** ${v.description}
- **Recommendation:** ${v.recommendation}
${v.cves.length > 0 ? `- **CVEs:** ${v.cves.join(', ')}` : ''}
`).join('\n')}

## Recommendations

${result.recommendations.map(r => `- ${r}`).join('\n')}

**Next Scan:** ${result.nextScanDate.toISOString()}
    `.trim();
  }
}

// Default security configuration
export const defaultSecurityConfig: SecurityConfig = {
  enableAutomaticScanning: true,
  scanInterval: 24 * 60 * 60 * 1000, // 24 hours
  alertThresholds: {
    critical: 1,
    high: 3,
    moderate: 10
  },
  excludePackages: [],
  enableSlackAlerts: false,
  enableEmailAlerts: false,
  maintainerEmails: []
};

// Create global security scanner instance
export const securityScanner = new SecurityScanner(defaultSecurityConfig);