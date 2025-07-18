/**
 * SSL/TLS Security Manager
 * Comprehensive SSL/TLS encryption and certificate management
 */

import * as crypto from 'crypto';
import { logger } from '@/lib/logging/logger';
import { auditLogger, AuditEventType, AuditSeverity } from './audit-logging';

export interface SSLCertificate {
  id: string;
  domain: string;
  issuer: string;
  subject: string;
  validFrom: Date;
  validTo: Date;
  fingerprint: string;
  algorithm: string;
  keySize: number;
  isWildcard: boolean;
  isExpired: boolean;
  daysUntilExpiry: number;
  status: 'valid' | 'expired' | 'expiring' | 'invalid';
}

export interface SSLConfiguration {
  enforceHTTPS: boolean;
  strictTransportSecurity: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  certificatePinning: {
    enabled: boolean;
    pins: string[];
    reportUri?: string;
  };
  minimumTLSVersion: '1.0' | '1.1' | '1.2' | '1.3';
  cipherSuites: string[];
  enableOCSPStapling: boolean;
  enableCertificateTransparency: boolean;
  redirectNonHTTPS: boolean;
  secureHeaders: {
    contentSecurityPolicy: string;
    xFrameOptions: string;
    xContentTypeOptions: boolean;
    referrerPolicy: string;
  };
}

export interface SSLHealthCheck {
  timestamp: Date;
  domain: string;
  status: 'healthy' | 'warning' | 'critical';
  certificate: SSLCertificate;
  issues: string[];
  recommendations: string[];
  tlsVersion: string;
  cipherSuite: string;
  vulnerabilities: Array<{
    name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    remediation: string;
  }>;
}

export class SSLTLSManager {
  private config: SSLConfiguration;
  private monitoringInterval?: NodeJS.Timeout;
  private certificateCache = new Map<string, SSLCertificate>();

  constructor(config: SSLConfiguration) {
    this.config = config;
    this.initializeMonitoring();
  }

  /**
   * Initialize SSL/TLS monitoring
   */
  private initializeMonitoring(): void {
    // Check certificates every 6 hours
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error('SSL/TLS monitoring failed', { error });
      }
    }, 6 * 60 * 60 * 1000);

    logger.info('SSL/TLS monitoring initialized');
  }

  /**
   * Perform comprehensive SSL/TLS health check
   */
  async performHealthCheck(domain?: string): Promise<SSLHealthCheck> {
    const targetDomain = domain || this.extractDomainFromUrl(process.env.NEXT_PUBLIC_APP_URL || 'localhost');
    const startTime = Date.now();

    logger.info('Starting SSL/TLS health check', { domain: targetDomain });

    await auditLogger.log({
      event_type: AuditEventType.SYSTEM_ERROR,
      severity: AuditSeverity.LOW,
      action: 'ssl_health_check_started',
      description: `SSL/TLS health check initiated for ${targetDomain}`,
      success: true,
      metadata: { domain: targetDomain }
    });

    try {
      const certificate = await this.getCertificateInfo(targetDomain);
      const tlsAnalysis = await this.analyzeTLSConfiguration(targetDomain);
      const vulnerabilities = await this.scanForSSLVulnerabilities(targetDomain);
      
      const issues: string[] = [];
      const recommendations: string[] = [];
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';

      // Check certificate expiry
      if (certificate.isExpired) {
        status = 'critical';
        issues.push('Certificate has expired');
        recommendations.push('Renew SSL certificate immediately');
      } else if (certificate.daysUntilExpiry <= 30) {
        status = 'warning';
        issues.push(`Certificate expires in ${certificate.daysUntilExpiry} days`);
        recommendations.push('Schedule certificate renewal');
      }

      // Check TLS version
      if (tlsAnalysis.version < this.config.minimumTLSVersion) {
        status = 'critical';
        issues.push(`TLS version ${tlsAnalysis.version} is below minimum required ${this.config.minimumTLSVersion}`);
        recommendations.push(`Upgrade to TLS ${this.config.minimumTLSVersion} or higher`);
      }

      // Check for critical vulnerabilities
      const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical');
      if (criticalVulns.length > 0) {
        status = 'critical';
        issues.push(`${criticalVulns.length} critical SSL/TLS vulnerabilities detected`);
        recommendations.push('Address critical vulnerabilities immediately');
      }

      const healthCheck: SSLHealthCheck = {
        timestamp: new Date(),
        domain: targetDomain,
        status,
        certificate,
        issues,
        recommendations,
        tlsVersion: tlsAnalysis.version,
        cipherSuite: tlsAnalysis.cipherSuite,
        vulnerabilities
      };

      const duration = Date.now() - startTime;
      logger.info('SSL/TLS health check completed', {
        domain: targetDomain,
        status,
        duration,
        issues: issues.length,
        vulnerabilities: vulnerabilities.length
      });

      await auditLogger.log({
        event_type: AuditEventType.SYSTEM_ERROR,
        severity: status === 'critical' ? AuditSeverity.CRITICAL : 
                 status === 'warning' ? AuditSeverity.MEDIUM : AuditSeverity.LOW,
        action: 'ssl_health_check_completed',
        description: `SSL/TLS health check completed with status: ${status}`,
        success: true,
        metadata: {
          domain: targetDomain,
          status,
          duration,
          issues,
          vulnerabilities: vulnerabilities.length
        }
      });

      // Send alerts if critical issues found
      if (status === 'critical') {
        await this.sendSSLAlert(healthCheck);
      }

      return healthCheck;
    } catch (error) {
      logger.error('SSL/TLS health check failed', { domain: targetDomain, error });
      
      await auditLogger.log({
        event_type: AuditEventType.SYSTEM_ERROR,
        severity: AuditSeverity.HIGH,
        action: 'ssl_health_check_failed',
        description: 'SSL/TLS health check encountered an error',
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        metadata: { domain: targetDomain }
      });

      throw error;
    }
  }

  /**
   * Get certificate information for a domain
   */
  async getCertificateInfo(domain: string): Promise<SSLCertificate> {
    // Check cache first
    const cached = this.certificateCache.get(domain);
    if (cached && !this.isCertificateCacheExpired(cached)) {
      return cached;
    }

    try {
      // In a real implementation, this would make an actual TLS connection
      // For now, we'll simulate certificate information
      const certificate: SSLCertificate = {
        id: `cert-${domain}-${Date.now()}`,
        domain,
        issuer: 'Let\'s Encrypt Authority X3',
        subject: `CN=${domain}`,
        validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        fingerprint: this.generateFingerprint(domain),
        algorithm: 'RSA',
        keySize: 2048,
        isWildcard: domain.startsWith('*.'),
        isExpired: false,
        daysUntilExpiry: 60,
        status: 'valid'
      };

      // Calculate actual expiry status
      const now = new Date();
      certificate.isExpired = certificate.validTo < now;
      certificate.daysUntilExpiry = Math.ceil((certificate.validTo.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      
      if (certificate.isExpired) {
        certificate.status = 'expired';
      } else if (certificate.daysUntilExpiry <= 7) {
        certificate.status = 'expiring';
      } else {
        certificate.status = 'valid';
      }

      // Cache the result
      this.certificateCache.set(domain, certificate);

      logger.info('Certificate information retrieved', {
        domain,
        status: certificate.status,
        daysUntilExpiry: certificate.daysUntilExpiry
      });

      return certificate;
    } catch (error) {
      logger.error('Failed to get certificate info', { domain, error });
      throw new Error(`Certificate retrieval failed for ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze TLS configuration
   */
  private async analyzeTLSConfiguration(domain: string): Promise<{ version: string; cipherSuite: string }> {
    // In a real implementation, this would analyze the actual TLS handshake
    // For now, we'll return simulated data
    return {
      version: '1.3',
      cipherSuite: 'TLS_AES_256_GCM_SHA384'
    };
  }

  /**
   * Scan for SSL/TLS vulnerabilities
   */
  private async scanForSSLVulnerabilities(domain: string): Promise<SSLHealthCheck['vulnerabilities']> {
    const vulnerabilities: SSLHealthCheck['vulnerabilities'] = [];

    // Simulate vulnerability scanning
    // In a real implementation, this would check for known vulnerabilities:
    // - Heartbleed
    // - POODLE
    // - BEAST
    // - CRIME
    // - BREACH
    // - ROBOT
    // - TLS-FALLBACK-SCSV
    // - Weak cipher suites
    // - Certificate issues

    // Example: Check for weak cipher suites
    const weakCipherSuites = [
      'SSL_RSA_WITH_3DES_EDE_CBC_SHA',
      'SSL_RSA_WITH_RC4_128_MD5',
      'SSL_RSA_WITH_RC4_128_SHA'
    ];

    // Simulate cipher suite check
    const usedCipherSuite = 'TLS_AES_256_GCM_SHA384'; // This would come from actual analysis
    
    if (weakCipherSuites.includes(usedCipherSuite)) {
      vulnerabilities.push({
        name: 'Weak Cipher Suite',
        severity: 'high',
        description: `Weak cipher suite detected: ${usedCipherSuite}`,
        remediation: 'Configure server to use strong cipher suites only'
      });
    }

    // Check for common vulnerabilities (simulated)
    if (Math.random() < 0.1) { // 10% chance for demo
      vulnerabilities.push({
        name: 'Heartbleed',
        severity: 'critical',
        description: 'Server may be vulnerable to Heartbleed attack (CVE-2014-0160)',
        remediation: 'Update OpenSSL to version 1.0.1g or later'
      });
    }

    logger.info('SSL vulnerability scan completed', {
      domain,
      vulnerabilities: vulnerabilities.length
    });

    return vulnerabilities;
  }

  /**
   * Generate security headers for HTTPS
   */
  generateSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Strict Transport Security
    if (this.config.strictTransportSecurity.enabled) {
      let hstsHeader = `max-age=${this.config.strictTransportSecurity.maxAge}`;
      if (this.config.strictTransportSecurity.includeSubDomains) {
        hstsHeader += '; includeSubDomains';
      }
      if (this.config.strictTransportSecurity.preload) {
        hstsHeader += '; preload';
      }
      headers['Strict-Transport-Security'] = hstsHeader;
    }

    // Certificate Pinning
    if (this.config.certificatePinning.enabled && this.config.certificatePinning.pins.length > 0) {
      let pinHeader = this.config.certificatePinning.pins
        .map(pin => `pin-sha256="${pin}"`)
        .join('; ');
      
      pinHeader += '; max-age=5184000'; // 60 days
      
      if (this.config.certificatePinning.reportUri) {
        pinHeader += `; report-uri="${this.config.certificatePinning.reportUri}"`;
      }
      
      headers['Public-Key-Pins'] = pinHeader;
    }

    // Content Security Policy
    if (this.config.secureHeaders.contentSecurityPolicy) {
      headers['Content-Security-Policy'] = this.config.secureHeaders.contentSecurityPolicy;
    }

    // X-Frame-Options
    if (this.config.secureHeaders.xFrameOptions) {
      headers['X-Frame-Options'] = this.config.secureHeaders.xFrameOptions;
    }

    // X-Content-Type-Options
    if (this.config.secureHeaders.xContentTypeOptions) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    // Referrer Policy
    if (this.config.secureHeaders.referrerPolicy) {
      headers['Referrer-Policy'] = this.config.secureHeaders.referrerPolicy;
    }

    return headers;
  }

  /**
   * Validate SSL/TLS configuration
   */
  async validateConfiguration(): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check minimum TLS version
    if (parseFloat(this.config.minimumTLSVersion) < 1.2) {
      issues.push('Minimum TLS version is below 1.2');
      recommendations.push('Set minimum TLS version to 1.2 or higher');
    }

    // Check HSTS configuration
    if (!this.config.strictTransportSecurity.enabled) {
      issues.push('HTTP Strict Transport Security (HSTS) is not enabled');
      recommendations.push('Enable HSTS to prevent protocol downgrade attacks');
    } else if (this.config.strictTransportSecurity.maxAge < 31536000) { // 1 year
      issues.push('HSTS max-age is less than recommended 1 year');
      recommendations.push('Increase HSTS max-age to at least 31536000 seconds (1 year)');
    }

    // Check certificate pinning
    if (!this.config.certificatePinning.enabled) {
      recommendations.push('Consider enabling certificate pinning for additional security');
    }

    // Check secure headers
    if (!this.config.secureHeaders.contentSecurityPolicy) {
      issues.push('Content Security Policy (CSP) is not configured');
      recommendations.push('Implement a comprehensive Content Security Policy');
    }

    const isValid = issues.length === 0;

    logger.info('SSL/TLS configuration validation completed', {
      isValid,
      issues: issues.length,
      recommendations: recommendations.length
    });

    return { isValid, issues, recommendations };
  }

  /**
   * Generate certificate signing request (CSR)
   */
  generateCSR(domain: string, organizationInfo: {
    commonName: string;
    organization: string;
    organizationalUnit?: string;
    city: string;
    state: string;
    country: string;
    email: string;
  }): { csr: string; privateKey: string } {
    // In a real implementation, this would generate an actual CSR
    // For now, we'll return placeholder data
    const csr = `-----BEGIN CERTIFICATE REQUEST-----
MIICXjCCAUYCAQAwGTEXMBUGA1UEAwwOeW91ci1kb21haW4uY29t
... (certificate request data) ...
-----END CERTIFICATE REQUEST-----`;

    const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7...
... (private key data) ...
-----END PRIVATE KEY-----`;

    logger.info('CSR generated', { domain });

    return { csr, privateKey };
  }

  /**
   * Check certificate expiry for all monitored domains
   */
  async checkCertificateExpiry(domains: string[]): Promise<Array<{
    domain: string;
    status: 'valid' | 'expiring' | 'expired';
    daysUntilExpiry: number;
  }>> {
    const results = [];

    for (const domain of domains) {
      try {
        const certificate = await this.getCertificateInfo(domain);
        results.push({
          domain,
          status: certificate.status,
          daysUntilExpiry: certificate.daysUntilExpiry
        });
      } catch (error) {
        logger.error('Failed to check certificate expiry', { domain, error });
        results.push({
          domain,
          status: 'expired' as const,
          daysUntilExpiry: -1
        });
      }
    }

    return results;
  }

  /**
   * Send SSL/TLS alert
   */
  private async sendSSLAlert(healthCheck: SSLHealthCheck): Promise<void> {
    const message = this.generateSSLAlertMessage(healthCheck);
    
    logger.warn('SSL/TLS alert triggered', {
      domain: healthCheck.domain,
      status: healthCheck.status,
      issues: healthCheck.issues.length
    });

    await auditLogger.log({
      event_type: AuditEventType.SUSPICIOUS_ACTIVITY,
      severity: AuditSeverity.CRITICAL,
      action: 'ssl_alert',
      description: `SSL/TLS critical issue detected for ${healthCheck.domain}`,
      success: true,
      metadata: {
        domain: healthCheck.domain,
        status: healthCheck.status,
        issues: healthCheck.issues,
        vulnerabilities: healthCheck.vulnerabilities.length
      }
    });

    // In a real implementation, send actual alerts via email/Slack/etc.
    console.log(`SSL/TLS ALERT:\n${message}`);
  }

  /**
   * Generate SSL alert message
   */
  private generateSSLAlertMessage(healthCheck: SSLHealthCheck): string {
    const criticalVulns = healthCheck.vulnerabilities.filter(v => v.severity === 'critical');
    
    return `
🔒 SSL/TLS SECURITY ALERT

Domain: ${healthCheck.domain}
Status: ${healthCheck.status.toUpperCase()}
Timestamp: ${healthCheck.timestamp.toISOString()}

CERTIFICATE INFORMATION:
- Valid From: ${healthCheck.certificate.validFrom.toISOString()}
- Valid To: ${healthCheck.certificate.validTo.toISOString()}
- Days Until Expiry: ${healthCheck.certificate.daysUntilExpiry}
- Status: ${healthCheck.certificate.status}

ISSUES DETECTED:
${healthCheck.issues.map(issue => `- ${issue}`).join('\n')}

CRITICAL VULNERABILITIES:
${criticalVulns.map(vuln => `- ${vuln.name}: ${vuln.description}`).join('\n') || 'None'}

IMMEDIATE ACTIONS REQUIRED:
${healthCheck.recommendations.slice(0, 3).map(rec => `- ${rec}`).join('\n')}

TLS Configuration:
- Version: ${healthCheck.tlsVersion}
- Cipher Suite: ${healthCheck.cipherSuite}
    `.trim();
  }

  /**
   * Helper methods
   */
  private extractDomainFromUrl(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  private generateFingerprint(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  private isCertificateCacheExpired(certificate: SSLCertificate): boolean {
    // Cache expires after 1 hour
    const cacheExpiry = new Date(certificate.validFrom.getTime() + 60 * 60 * 1000);
    return new Date() > cacheExpiry;
  }

  /**
   * Update SSL configuration
   */
  updateConfiguration(newConfig: Partial<SSLConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('SSL/TLS configuration updated', { config: this.config });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      logger.info('SSL/TLS monitoring stopped');
    }
  }

  /**
   * Get configuration
   */
  getConfiguration(): SSLConfiguration {
    return { ...this.config };
  }

  /**
   * Generate SSL/TLS report
   */
  async generateSSLReport(domains: string[]): Promise<string> {
    const checks = await Promise.all(
      domains.map(domain => this.performHealthCheck(domain))
    );

    const totalDomains = checks.length;
    const healthyDomains = checks.filter(c => c.status === 'healthy').length;
    const warningDomains = checks.filter(c => c.status === 'warning').length;
    const criticalDomains = checks.filter(c => c.status === 'critical').length;

    return `
# SSL/TLS Security Report

**Generated:** ${new Date().toISOString()}
**Domains Checked:** ${totalDomains}

## Summary

| Status | Count | Percentage |
|--------|-------|------------|
| Healthy | ${healthyDomains} | ${((healthyDomains / totalDomains) * 100).toFixed(1)}% |
| Warning | ${warningDomains} | ${((warningDomains / totalDomains) * 100).toFixed(1)}% |
| Critical | ${criticalDomains} | ${((criticalDomains / totalDomains) * 100).toFixed(1)}% |

## Domain Details

${checks.map(check => `
### ${check.domain}
- **Status:** ${check.status}
- **Certificate Expiry:** ${check.certificate.daysUntilExpiry} days
- **TLS Version:** ${check.tlsVersion}
- **Issues:** ${check.issues.length}
- **Vulnerabilities:** ${check.vulnerabilities.length}

${check.issues.length > 0 ? `**Issues:**\n${check.issues.map(issue => `- ${issue}`).join('\n')}` : ''}
${check.recommendations.length > 0 ? `\n**Recommendations:**\n${check.recommendations.map(rec => `- ${rec}`).join('\n')}` : ''}
`).join('\n')}

## Configuration Status

${(await this.validateConfiguration()).issues.length === 0 ? 
  '✅ SSL/TLS configuration is valid' : 
  `⚠️ Configuration issues detected:\n${(await this.validateConfiguration()).issues.map(issue => `- ${issue}`).join('\n')}`}
    `.trim();
  }
}

// Default SSL/TLS configuration
export const defaultSSLConfig: SSLConfiguration = {
  enforceHTTPS: true,
  strictTransportSecurity: {
    enabled: true,
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  certificatePinning: {
    enabled: false,
    pins: []
  },
  minimumTLSVersion: '1.2',
  cipherSuites: [
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-SHA384',
    'ECDHE-RSA-AES128-SHA256'
  ],
  enableOCSPStapling: true,
  enableCertificateTransparency: true,
  redirectNonHTTPS: true,
  secureHeaders: {
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'",
    xFrameOptions: 'DENY',
    xContentTypeOptions: true,
    referrerPolicy: 'strict-origin-when-cross-origin'
  }
};

// Create global SSL/TLS manager instance
export const sslTLSManager = new SSLTLSManager(defaultSSLConfig);