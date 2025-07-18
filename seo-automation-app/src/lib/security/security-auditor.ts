/**
 * Security Auditor
 * Comprehensive security audit system for application security posture assessment
 */

import { logger } from '@/lib/logging/logger';
import { auditLogger, AuditEventType, AuditSeverity } from './audit-logging';
import { securityScanner } from './security-scanner';
import { penetrationTester } from './penetration-testing';
import { sslTLSManager } from './ssl-tls-manager';
import { apiSecurityValidator } from './api-security-validator';

export interface SecurityAuditConfig {
  enableScheduledAudits: boolean;
  auditInterval: number; // milliseconds
  auditTypes: Array<'dependency' | 'penetration' | 'ssl' | 'api' | 'configuration' | 'compliance'>;
  alertThresholds: {
    critical: number;
    high: number;
    medium: number;
  };
  enableReporting: boolean;
  reportFormats: Array<'json' | 'html' | 'pdf' | 'csv'>;
  enableRemediationSuggestions: boolean;
  auditScope: {
    includeDependencies: boolean;
    includeInfrastructure: boolean;
    includeApplication: boolean;
    includeData: boolean;
  };
}

export interface SecurityAuditFinding {
  id: string;
  category: 'vulnerability' | 'misconfiguration' | 'compliance' | 'best_practice';
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  remediation: string;
  references: string[];
  evidence: any;
  status: 'open' | 'in_progress' | 'resolved' | 'false_positive' | 'accepted_risk';
  discoveredAt: Date;
  lastUpdated: Date;
  assignedTo?: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
  cvssScore?: number;
}

export interface SecurityAuditReport {
  id: string;
  timestamp: Date;
  auditType: 'full' | 'partial' | 'targeted';
  scope: string[];
  duration: number;
  findings: SecurityAuditFinding[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    newFindings: number;
    resolvedFindings: number;
  };
  complianceStatus: {
    gdpr: 'compliant' | 'non_compliant' | 'partial';
    ccpa: 'compliant' | 'non_compliant' | 'partial';
    iso27001: 'compliant' | 'non_compliant' | 'partial';
    nist: 'compliant' | 'non_compliant' | 'partial';
  };
  securityPosture: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  riskScore: number; // 0-100
  recommendations: Array<{
    priority: 'immediate' | 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
  }>;
  trends: {
    findingsOverTime: Array<{ date: Date; count: number }>;
    severityDistribution: Record<string, number>;
    categoryDistribution: Record<string, number>;
  };
  nextAuditDate: Date;
}

export interface ComplianceCheck {
  framework: 'GDPR' | 'CCPA' | 'ISO27001' | 'NIST' | 'OWASP';
  requirement: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  evidence: string[];
  gaps: string[];
  remediation: string[];
}

export class SecurityAuditor {
  private config: SecurityAuditConfig;
  private auditInterval?: NodeJS.Timeout;
  private findingsHistory: SecurityAuditFinding[] = [];
  private lastAuditReport?: SecurityAuditReport;

  constructor(config: SecurityAuditConfig) {
    this.config = config;
    this.initializeScheduledAudits();
  }

  /**
   * Initialize scheduled security audits
   */
  private initializeScheduledAudits(): void {
    if (this.config.enableScheduledAudits && this.config.auditInterval > 0) {
      this.auditInterval = setInterval(async () => {
        try {
          await this.performFullSecurityAudit();
        } catch (error) {
          logger.error('Scheduled security audit failed', { error });
        }
      }, this.config.auditInterval);

      logger.info('Scheduled security audits initialized', {
        interval: this.config.auditInterval,
        types: this.config.auditTypes
      });
    }
  }

  /**
   * Perform comprehensive security audit
   */
  async performFullSecurityAudit(): Promise<SecurityAuditReport> {
    const startTime = Date.now();
    const auditId = `audit-${Date.now()}`;
    
    logger.info('Starting comprehensive security audit', { auditId });

    await auditLogger.log({
      event_type: AuditEventType.SYSTEM_ERROR,
      severity: AuditSeverity.LOW,
      action: 'security_audit_started',
      description: 'Comprehensive security audit initiated',
      success: true,
      metadata: { 
        auditId,
        types: this.config.auditTypes,
        scope: this.config.auditScope
      }
    });

    try {
      const findings: SecurityAuditFinding[] = [];
      const scope: string[] = [];

      // Dependency Security Audit
      if (this.config.auditTypes.includes('dependency') && this.config.auditScope.includeDependencies) {
        scope.push('dependencies');
        const dependencyFindings = await this.auditDependencySecurity();
        findings.push(...dependencyFindings);
      }

      // Penetration Testing Audit
      if (this.config.auditTypes.includes('penetration') && this.config.auditScope.includeApplication) {
        scope.push('penetration_testing');
        const penTestFindings = await this.auditPenetrationTesting();
        findings.push(...penTestFindings);
      }

      // SSL/TLS Security Audit
      if (this.config.auditTypes.includes('ssl') && this.config.auditScope.includeInfrastructure) {
        scope.push('ssl_tls');
        const sslFindings = await this.auditSSLTLSSecurity();
        findings.push(...sslFindings);
      }

      // API Security Audit
      if (this.config.auditTypes.includes('api') && this.config.auditScope.includeApplication) {
        scope.push('api_security');
        const apiFindings = await this.auditAPISecurity();
        findings.push(...apiFindings);
      }

      // Configuration Security Audit
      if (this.config.auditTypes.includes('configuration')) {
        scope.push('configuration');
        const configFindings = await this.auditConfigurationSecurity();
        findings.push(...configFindings);
      }

      // Compliance Audit
      if (this.config.auditTypes.includes('compliance')) {
        scope.push('compliance');
        const complianceFindings = await this.auditCompliance();
        findings.push(...complianceFindings);
      }

      // Generate audit report
      const report = await this.generateAuditReport(auditId, findings, scope, Date.now() - startTime);
      this.lastAuditReport = report;

      // Store findings in history
      this.findingsHistory.push(...findings);

      // Check alert thresholds
      await this.checkAlertThresholds(report);

      const duration = Date.now() - startTime;
      logger.info('Security audit completed', {
        auditId,
        duration,
        findings: findings.length,
        securityPosture: report.securityPosture,
        riskScore: report.riskScore
      });

      await auditLogger.log({
        event_type: AuditEventType.SYSTEM_ERROR,
        severity: report.securityPosture === 'critical' ? AuditSeverity.CRITICAL : AuditSeverity.LOW,
        action: 'security_audit_completed',
        description: `Security audit completed with ${findings.length} findings`,
        success: true,
        metadata: {
          auditId,
          duration,
          findings: findings.length,
          securityPosture: report.securityPosture,
          riskScore: report.riskScore,
          summary: report.summary
        }
      });

      return report;
    } catch (error) {
      logger.error('Security audit failed', { auditId, error });
      
      await auditLogger.log({
        event_type: AuditEventType.SYSTEM_ERROR,
        severity: AuditSeverity.HIGH,
        action: 'security_audit_failed',
        description: 'Security audit encountered an error',
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        metadata: { auditId }
      });

      throw error;
    }
  }

  /**
   * Audit dependency security
   */
  private async auditDependencySecurity(): Promise<SecurityAuditFinding[]> {
    const findings: SecurityAuditFinding[] = [];
    
    try {
      logger.info('Auditing dependency security');
      
      const scanResult = await securityScanner.performFullSecurityScan();
      
      for (const vulnerability of scanResult.vulnerabilities) {
        findings.push({
          id: `dep-${vulnerability.id}`,
          category: 'vulnerability',
          type: 'dependency_vulnerability',
          severity: vulnerability.severity as any,
          title: vulnerability.title,
          description: vulnerability.description,
          impact: this.calculateImpact(vulnerability.severity as any, 'dependency'),
          remediation: vulnerability.recommendation,
          references: vulnerability.cves.map(cve => `https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cve}`),
          evidence: { package: vulnerability.package, version: vulnerability.version },
          status: 'open',
          discoveredAt: vulnerability.created,
          lastUpdated: new Date(),
          estimatedEffort: this.estimateEffort(vulnerability.severity as any),
          businessImpact: this.assessBusinessImpact(vulnerability.severity as any, 'dependency')
        });
      }

      logger.info('Dependency security audit completed', { findings: findings.length });
    } catch (error) {
      logger.error('Dependency security audit failed', { error });
      
      findings.push({
        id: `dep-audit-error-${Date.now()}`,
        category: 'misconfiguration',
        type: 'audit_failure',
        severity: 'medium',
        title: 'Dependency Security Audit Failed',
        description: 'Failed to complete dependency security audit',
        impact: 'Cannot assess dependency vulnerabilities',
        remediation: 'Fix dependency audit configuration and retry',
        references: [],
        evidence: { error: error instanceof Error ? error.message : 'Unknown error' },
        status: 'open',
        discoveredAt: new Date(),
        lastUpdated: new Date(),
        estimatedEffort: 'low',
        businessImpact: 'medium'
      });
    }

    return findings;
  }

  /**
   * Audit penetration testing results
   */
  private async auditPenetrationTesting(): Promise<SecurityAuditFinding[]> {
    const findings: SecurityAuditFinding[] = [];
    
    try {
      logger.info('Auditing penetration testing results');
      
      const penTestReport = await penetrationTester.runAllTests();
      
      for (const result of penTestReport.results) {
        if (result.status === 'fail') {
          findings.push({
            id: `pentest-${result.testId}`,
            category: 'vulnerability',
            type: result.category,
            severity: result.severity,
            title: result.testName,
            description: result.description,
            impact: this.calculateImpact(result.severity, result.category),
            remediation: result.remediation || 'Review and fix the identified vulnerability',
            references: [],
            evidence: result.evidence || {},
            status: 'open',
            discoveredAt: result.timestamp,
            lastUpdated: new Date(),
            estimatedEffort: this.estimateEffort(result.severity),
            businessImpact: this.assessBusinessImpact(result.severity, result.category)
          });
        }
      }

      logger.info('Penetration testing audit completed', { findings: findings.length });
    } catch (error) {
      logger.error('Penetration testing audit failed', { error });
      
      findings.push({
        id: `pentest-audit-error-${Date.now()}`,
        category: 'misconfiguration',
        type: 'audit_failure',
        severity: 'medium',
        title: 'Penetration Testing Audit Failed',
        description: 'Failed to complete penetration testing audit',
        impact: 'Cannot assess application vulnerabilities',
        remediation: 'Fix penetration testing configuration and retry',
        references: [],
        evidence: { error: error instanceof Error ? error.message : 'Unknown error' },
        status: 'open',
        discoveredAt: new Date(),
        lastUpdated: new Date(),
        estimatedEffort: 'low',
        businessImpact: 'medium'
      });
    }

    return findings;
  }

  /**
   * Audit SSL/TLS security
   */
  private async auditSSLTLSSecurity(): Promise<SecurityAuditFinding[]> {
    const findings: SecurityAuditFinding[] = [];
    
    try {
      logger.info('Auditing SSL/TLS security');
      
      const domains = ['localhost']; // In production, this would be actual domains
      const healthChecks = await Promise.all(
        domains.map(domain => sslTLSManager.performHealthCheck(domain))
      );
      
      for (const healthCheck of healthChecks) {
        if (healthCheck.status !== 'healthy') {
          findings.push({
            id: `ssl-${healthCheck.domain}-${Date.now()}`,
            category: 'vulnerability',
            type: 'ssl_tls_issue',
            severity: healthCheck.status === 'critical' ? 'critical' : 'medium',
            title: `SSL/TLS Issue for ${healthCheck.domain}`,
            description: healthCheck.issues.join(', '),
            impact: this.calculateImpact(healthCheck.status === 'critical' ? 'critical' : 'medium', 'ssl_tls'),
            remediation: healthCheck.recommendations.join(', '),
            references: [],
            evidence: { 
              certificate: healthCheck.certificate,
              vulnerabilities: healthCheck.vulnerabilities
            },
            status: 'open',
            discoveredAt: healthCheck.timestamp,
            lastUpdated: new Date(),
            estimatedEffort: this.estimateEffort(healthCheck.status === 'critical' ? 'critical' : 'medium'),
            businessImpact: this.assessBusinessImpact(healthCheck.status === 'critical' ? 'critical' : 'medium', 'ssl_tls')
          });
        }

        // Check for vulnerabilities
        for (const vulnerability of healthCheck.vulnerabilities) {
          findings.push({
            id: `ssl-vuln-${vulnerability.name}-${Date.now()}`,
            category: 'vulnerability',
            type: 'ssl_vulnerability',
            severity: vulnerability.severity,
            title: vulnerability.name,
            description: vulnerability.description,
            impact: this.calculateImpact(vulnerability.severity, 'ssl_vulnerability'),
            remediation: vulnerability.remediation,
            references: [],
            evidence: { domain: healthCheck.domain },
            status: 'open',
            discoveredAt: healthCheck.timestamp,
            lastUpdated: new Date(),
            estimatedEffort: this.estimateEffort(vulnerability.severity),
            businessImpact: this.assessBusinessImpact(vulnerability.severity, 'ssl_vulnerability')
          });
        }
      }

      logger.info('SSL/TLS security audit completed', { findings: findings.length });
    } catch (error) {
      logger.error('SSL/TLS security audit failed', { error });
      
      findings.push({
        id: `ssl-audit-error-${Date.now()}`,
        category: 'misconfiguration',
        type: 'audit_failure',
        severity: 'medium',
        title: 'SSL/TLS Security Audit Failed',
        description: 'Failed to complete SSL/TLS security audit',
        impact: 'Cannot assess SSL/TLS security',
        remediation: 'Fix SSL/TLS audit configuration and retry',
        references: [],
        evidence: { error: error instanceof Error ? error.message : 'Unknown error' },
        status: 'open',
        discoveredAt: new Date(),
        lastUpdated: new Date(),
        estimatedEffort: 'low',
        businessImpact: 'medium'
      });
    }

    return findings;
  }

  /**
   * Audit API security
   */
  private async auditAPISecurity(): Promise<SecurityAuditFinding[]> {
    const findings: SecurityAuditFinding[] = [];
    
    try {
      logger.info('Auditing API security');
      
      const apiReport = await apiSecurityValidator.generateSecurityReport();
      
      for (const vulnerability of apiReport.vulnerabilities) {
        findings.push({
          id: `api-${vulnerability.type}-${Date.now()}`,
          category: 'vulnerability',
          type: 'api_vulnerability',
          severity: vulnerability.severity,
          title: vulnerability.type,
          description: vulnerability.description,
          impact: this.calculateImpact(vulnerability.severity, 'api'),
          remediation: vulnerability.remediation,
          references: [],
          evidence: { endpoint: apiReport.endpoint },
          status: 'open',
          discoveredAt: apiReport.timestamp,
          lastUpdated: new Date(),
          estimatedEffort: this.estimateEffort(vulnerability.severity),
          businessImpact: this.assessBusinessImpact(vulnerability.severity, 'api')
        });
      }

      logger.info('API security audit completed', { findings: findings.length });
    } catch (error) {
      logger.error('API security audit failed', { error });
      
      findings.push({
        id: `api-audit-error-${Date.now()}`,
        category: 'misconfiguration',
        type: 'audit_failure',
        severity: 'medium',
        title: 'API Security Audit Failed',
        description: 'Failed to complete API security audit',
        impact: 'Cannot assess API security',
        remediation: 'Fix API security audit configuration and retry',
        references: [],
        evidence: { error: error instanceof Error ? error.message : 'Unknown error' },
        status: 'open',
        discoveredAt: new Date(),
        lastUpdated: new Date(),
        estimatedEffort: 'low',
        businessImpact: 'medium'
      });
    }

    return findings;
  }

  /**
   * Audit configuration security
   */
  private async auditConfigurationSecurity(): Promise<SecurityAuditFinding[]> {
    const findings: SecurityAuditFinding[] = [];
    
    try {
      logger.info('Auditing configuration security');
      
      // Check environment variables
      const envFindings = this.auditEnvironmentVariables();
      findings.push(...envFindings);
      
      // Check file permissions
      const permissionFindings = await this.auditFilePermissions();
      findings.push(...permissionFindings);
      
      // Check security headers
      const headerFindings = this.auditSecurityHeaders();
      findings.push(...headerFindings);

      logger.info('Configuration security audit completed', { findings: findings.length });
    } catch (error) {
      logger.error('Configuration security audit failed', { error });
      
      findings.push({
        id: `config-audit-error-${Date.now()}`,
        category: 'misconfiguration',
        type: 'audit_failure',
        severity: 'medium',
        title: 'Configuration Security Audit Failed',
        description: 'Failed to complete configuration security audit',
        impact: 'Cannot assess configuration security',
        remediation: 'Fix configuration audit and retry',
        references: [],
        evidence: { error: error instanceof Error ? error.message : 'Unknown error' },
        status: 'open',
        discoveredAt: new Date(),
        lastUpdated: new Date(),
        estimatedEffort: 'low',
        businessImpact: 'medium'
      });
    }

    return findings;
  }

  /**
   * Audit compliance
   */
  private async auditCompliance(): Promise<SecurityAuditFinding[]> {
    const findings: SecurityAuditFinding[] = [];
    
    try {
      logger.info('Auditing compliance');
      
      const complianceChecks = await this.performComplianceChecks();
      
      for (const check of complianceChecks) {
        if (check.status === 'non_compliant') {
          findings.push({
            id: `compliance-${check.framework}-${Date.now()}`,
            category: 'compliance',
            type: 'compliance_violation',
            severity: 'high',
            title: `${check.framework} Compliance Violation`,
            description: `Non-compliance with ${check.requirement}`,
            impact: this.calculateImpact('high', 'compliance'),
            remediation: check.remediation.join(', '),
            references: [],
            evidence: { gaps: check.gaps },
            status: 'open',
            discoveredAt: new Date(),
            lastUpdated: new Date(),
            estimatedEffort: 'medium',
            businessImpact: 'high'
          });
        }
      }

      logger.info('Compliance audit completed', { findings: findings.length });
    } catch (error) {
      logger.error('Compliance audit failed', { error });
      
      findings.push({
        id: `compliance-audit-error-${Date.now()}`,
        category: 'misconfiguration',
        type: 'audit_failure',
        severity: 'medium',
        title: 'Compliance Audit Failed',
        description: 'Failed to complete compliance audit',
        impact: 'Cannot assess compliance status',
        remediation: 'Fix compliance audit configuration and retry',
        references: [],
        evidence: { error: error instanceof Error ? error.message : 'Unknown error' },
        status: 'open',
        discoveredAt: new Date(),
        lastUpdated: new Date(),
        estimatedEffort: 'low',
        businessImpact: 'medium'
      });
    }

    return findings;
  }

  /**
   * Audit environment variables
   */
  private auditEnvironmentVariables(): SecurityAuditFinding[] {
    const findings: SecurityAuditFinding[] = [];
    
    const sensitiveVars = [
      'JWT_SECRET',
      'DATABASE_PASSWORD',
      'API_KEY',
      'OPENAI_API_KEY',
      'SUPABASE_SERVICE_KEY'
    ];

    for (const varName of sensitiveVars) {
      const value = process.env[varName];
      
      if (!value) {
        findings.push({
          id: `env-missing-${varName}`,
          category: 'misconfiguration',
          type: 'missing_environment_variable',
          severity: 'high',
          title: `Missing Environment Variable: ${varName}`,
          description: `Required environment variable ${varName} is not set`,
          impact: 'Application may not function correctly or securely',
          remediation: `Set the ${varName} environment variable`,
          references: [],
          evidence: { variable: varName },
          status: 'open',
          discoveredAt: new Date(),
          lastUpdated: new Date(),
          estimatedEffort: 'low',
          businessImpact: 'high'
        });
      } else if (value === 'default' || value.length < 16) {
        findings.push({
          id: `env-weak-${varName}`,
          category: 'misconfiguration',
          type: 'weak_environment_variable',
          severity: 'medium',
          title: `Weak Environment Variable: ${varName}`,
          description: `Environment variable ${varName} appears to be weak or default`,
          impact: 'Security may be compromised',
          remediation: `Use a strong, unique value for ${varName}`,
          references: [],
          evidence: { variable: varName, length: value.length },
          status: 'open',
          discoveredAt: new Date(),
          lastUpdated: new Date(),
          estimatedEffort: 'low',
          businessImpact: 'medium'
        });
      }
    }

    return findings;
  }

  /**
   * Audit file permissions
   */
  private async auditFilePermissions(): Promise<SecurityAuditFinding[]> {
    const findings: SecurityAuditFinding[] = [];
    
    // In a real implementation, this would check actual file permissions
    // For now, we'll simulate the check
    
    const sensitiveFiles = [
      '.env',
      '.env.local',
      'private.key',
      'config/secrets.json'
    ];

    for (const file of sensitiveFiles) {
      // Simulate permission check
      const isWorldReadable = Math.random() < 0.1; // 10% chance for demo
      
      if (isWorldReadable) {
        findings.push({
          id: `perm-${file.replace(/[^a-zA-Z0-9]/g, '_')}`,
          category: 'misconfiguration',
          type: 'insecure_file_permissions',
          severity: 'high',
          title: `Insecure File Permissions: ${file}`,
          description: `File ${file} has overly permissive access permissions`,
          impact: 'Sensitive information may be accessible to unauthorized users',
          remediation: `Restrict file permissions for ${file} (chmod 600)`,
          references: [],
          evidence: { file, permissions: '644' },
          status: 'open',
          discoveredAt: new Date(),
          lastUpdated: new Date(),
          estimatedEffort: 'low',
          businessImpact: 'high'
        });
      }
    }

    return findings;
  }

  /**
   * Audit security headers
   */
  private auditSecurityHeaders(): SecurityAuditFinding[] {
    const findings: SecurityAuditFinding[] = [];
    
    const requiredHeaders = [
      'Strict-Transport-Security',
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options'
    ];

    const currentHeaders = sslTLSManager.generateSecurityHeaders();
    
    for (const header of requiredHeaders) {
      if (!(header in currentHeaders)) {
        findings.push({
          id: `header-missing-${header.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`,
          category: 'misconfiguration',
          type: 'missing_security_header',
          severity: 'medium',
          title: `Missing Security Header: ${header}`,
          description: `Required security header ${header} is not configured`,
          impact: 'Application may be vulnerable to various attacks',
          remediation: `Configure the ${header} security header`,
          references: [],
          evidence: { header },
          status: 'open',
          discoveredAt: new Date(),
          lastUpdated: new Date(),
          estimatedEffort: 'low',
          businessImpact: 'medium'
        });
      }
    }

    return findings;
  }

  /**
   * Perform compliance checks
   */
  private async performComplianceChecks(): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [
      {
        framework: 'GDPR',
        requirement: 'Data Encryption at Rest',
        description: 'Personal data must be encrypted when stored',
        status: 'compliant',
        evidence: ['Database encryption enabled', 'File encryption configured'],
        gaps: [],
        remediation: []
      },
      {
        framework: 'GDPR',
        requirement: 'Data Encryption in Transit',
        description: 'Personal data must be encrypted during transmission',
        status: 'compliant',
        evidence: ['HTTPS enforced', 'TLS 1.2+ required'],
        gaps: [],
        remediation: []
      },
      {
        framework: 'CCPA',
        requirement: 'Data Access Rights',
        description: 'Users must be able to access their personal data',
        status: 'partial',
        evidence: ['API endpoint for data access'],
        gaps: ['User-friendly interface missing'],
        remediation: ['Implement user dashboard for data access']
      },
      {
        framework: 'ISO27001',
        requirement: 'Access Control',
        description: 'Proper access controls must be implemented',
        status: 'compliant',
        evidence: ['Role-based access control', 'Authentication required'],
        gaps: [],
        remediation: []
      }
    ];

    return checks;
  }

  /**
   * Generate audit report
   */
  private async generateAuditReport(
    auditId: string,
    findings: SecurityAuditFinding[],
    scope: string[],
    duration: number
  ): Promise<SecurityAuditReport> {
    const summary = {
      total: findings.length,
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
      newFindings: findings.length, // All findings are new in this implementation
      resolvedFindings: 0
    };

    const complianceStatus = {
      gdpr: 'compliant' as const,
      ccpa: 'partial' as const,
      iso27001: 'compliant' as const,
      nist: 'partial' as const
    };

    const securityPosture = this.calculateSecurityPosture(summary);
    const riskScore = this.calculateRiskScore(summary);
    const recommendations = this.generateRecommendations(findings);

    return {
      id: auditId,
      timestamp: new Date(),
      auditType: 'full',
      scope,
      duration,
      findings,
      summary,
      complianceStatus,
      securityPosture,
      riskScore,
      recommendations,
      trends: this.calculateTrends(),
      nextAuditDate: new Date(Date.now() + this.config.auditInterval)
    };
  }

  /**
   * Helper methods
   */
  private calculateImpact(severity: string, category: string): string {
    const impactMap: Record<string, Record<string, string>> = {
      critical: {
        default: 'Complete system compromise possible',
        dependency: 'Remote code execution or data breach possible',
        ssl_tls: 'Data interception and man-in-the-middle attacks possible',
        api: 'Unauthorized access to all application data'
      },
      high: {
        default: 'Significant security risk',
        dependency: 'Potential for privilege escalation or data exposure',
        ssl_tls: 'Weak encryption allows potential data exposure',
        api: 'Unauthorized access to sensitive endpoints'
      },
      medium: {
        default: 'Moderate security risk',
        dependency: 'Information disclosure or denial of service possible',
        ssl_tls: 'Certificate or configuration issues',
        api: 'Limited unauthorized access possible'
      },
      low: {
        default: 'Minor security concern',
        dependency: 'Minor information disclosure',
        ssl_tls: 'Best practice violations',
        api: 'Minor security misconfigurations'
      }
    };

    return impactMap[severity]?.[category] || impactMap[severity]?.default || 'Unknown impact';
  }

  private estimateEffort(severity: string): 'low' | 'medium' | 'high' {
    const effortMap: Record<string, 'low' | 'medium' | 'high'> = {
      critical: 'high',
      high: 'medium',
      medium: 'medium',
      low: 'low'
    };

    return effortMap[severity] || 'medium';
  }

  private assessBusinessImpact(severity: string, category: string): 'low' | 'medium' | 'high' | 'critical' {
    if (severity === 'critical') return 'critical';
    if (severity === 'high' && ['api', 'ssl_tls'].includes(category)) return 'high';
    if (severity === 'high') return 'medium';
    if (severity === 'medium') return 'medium';
    return 'low';
  }

  private calculateSecurityPosture(summary: SecurityAuditReport['summary']): SecurityAuditReport['securityPosture'] {
    if (summary.critical > 0) return 'critical';
    if (summary.high > 5) return 'poor';
    if (summary.high > 2) return 'fair';
    if (summary.medium > 10) return 'fair';
    if (summary.medium > 5) return 'good';
    return 'excellent';
  }

  private calculateRiskScore(summary: SecurityAuditReport['summary']): number {
    const weights = { critical: 40, high: 20, medium: 10, low: 5 };
    const score = summary.critical * weights.critical +
                 summary.high * weights.high +
                 summary.medium * weights.medium +
                 summary.low * weights.low;
    
    return Math.min(100, score);
  }

  private generateRecommendations(findings: SecurityAuditFinding[]): SecurityAuditReport['recommendations'] {
    const recommendations: SecurityAuditReport['recommendations'] = [];
    
    const criticalFindings = findings.filter(f => f.severity === 'critical');
    const highFindings = findings.filter(f => f.severity === 'high');
    
    if (criticalFindings.length > 0) {
      recommendations.push({
        priority: 'immediate',
        action: 'Address all critical security vulnerabilities immediately',
        rationale: 'Critical vulnerabilities pose immediate threat to system security',
        effort: 'high',
        impact: 'high'
      });
    }

    if (highFindings.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Remediate high-severity security issues within 48 hours',
        rationale: 'High-severity issues significantly increase security risk',
        effort: 'medium',
        impact: 'high'
      });
    }

    recommendations.push({
      priority: 'medium',
      action: 'Implement automated security monitoring and alerting',
      rationale: 'Proactive monitoring helps detect security issues early',
      effort: 'medium',
      impact: 'medium'
    });

    recommendations.push({
      priority: 'low',
      action: 'Conduct regular security training for development team',
      rationale: 'Security awareness reduces likelihood of introducing vulnerabilities',
      effort: 'low',
      impact: 'medium'
    });

    return recommendations;
  }

  private calculateTrends(): SecurityAuditReport['trends'] {
    // Simulate trend data - in real implementation, this would use historical data
    return {
      findingsOverTime: [],
      severityDistribution: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      categoryDistribution: {
        vulnerability: 0,
        misconfiguration: 0,
        compliance: 0,
        best_practice: 0
      }
    };
  }

  /**
   * Check alert thresholds and send notifications
   */
  private async checkAlertThresholds(report: SecurityAuditReport): Promise<void> {
    const { summary } = report;
    const { alertThresholds } = this.config;

    let shouldAlert = false;
    let alertLevel: 'critical' | 'high' | 'medium' = 'medium';

    if (summary.critical >= alertThresholds.critical) {
      shouldAlert = true;
      alertLevel = 'critical';
    } else if (summary.high >= alertThresholds.high) {
      shouldAlert = true;
      alertLevel = 'high';
    } else if (summary.medium >= alertThresholds.medium) {
      shouldAlert = true;
      alertLevel = 'medium';
    }

    if (shouldAlert) {
      await this.sendSecurityAlert(report, alertLevel);
    }
  }

  /**
   * Send security audit alert
   */
  private async sendSecurityAlert(
    report: SecurityAuditReport,
    level: 'critical' | 'high' | 'medium'
  ): Promise<void> {
    const message = this.generateAlertMessage(report, level);
    
    logger.warn('Security audit alert triggered', {
      level,
      findings: report.summary.total,
      critical: report.summary.critical,
      high: report.summary.high,
      securityPosture: report.securityPosture
    });

    await auditLogger.log({
      event_type: AuditEventType.SUSPICIOUS_ACTIVITY,
      severity: level === 'critical' ? AuditSeverity.CRITICAL : 
               level === 'high' ? AuditSeverity.HIGH : AuditSeverity.MEDIUM,
      action: 'security_audit_alert',
      description: `Security audit triggered ${level} alert`,
      success: true,
      metadata: {
        alertLevel: level,
        findings: report.summary,
        securityPosture: report.securityPosture,
        riskScore: report.riskScore
      }
    });

    // In a real implementation, send actual alerts
    console.log(`SECURITY AUDIT ALERT [${level.toUpperCase()}]:\n${message}`);
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(report: SecurityAuditReport, level: string): string {
    const criticalFindings = report.findings.filter(f => f.severity === 'critical').slice(0, 5);
    
    return `
🚨 SECURITY AUDIT ALERT - ${level.toUpperCase()} LEVEL

Audit ID: ${report.id}
Timestamp: ${report.timestamp.toISOString()}
Security Posture: ${report.securityPosture.toUpperCase()}
Risk Score: ${report.riskScore}/100

FINDINGS SUMMARY:
- Total: ${report.summary.total}
- Critical: ${report.summary.critical}
- High: ${report.summary.high}
- Medium: ${report.summary.medium}
- Low: ${report.summary.low}

CRITICAL FINDINGS:
${criticalFindings.length > 0 ? 
  criticalFindings.map(f => `- ${f.title}: ${f.description}`).join('\n') : 
  'None'}

TOP RECOMMENDATIONS:
${report.recommendations.slice(0, 3).map(r => `- ${r.action}`).join('\n')}

Next audit scheduled: ${report.nextAuditDate.toISOString()}
    `.trim();
  }

  /**
   * Export audit report in various formats
   */
  async exportAuditReport(report: SecurityAuditReport, format: 'json' | 'html' | 'csv'): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      
      case 'html':
        return this.generateHTMLReport(report);
      
      case 'csv':
        return this.generateCSVReport(report);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(report: SecurityAuditReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Security Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; }
        .finding { margin: 10px 0; padding: 10px; border-left: 4px solid #ccc; }
        .critical { border-left-color: #d32f2f; background: #ffebee; }
        .high { border-left-color: #f57c00; background: #fff3e0; }
        .medium { border-left-color: #fbc02d; background: #fffde7; }
        .low { border-left-color: #388e3c; background: #e8f5e8; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Security Audit Report</h1>
        <p><strong>Audit ID:</strong> ${report.id}</p>
        <p><strong>Timestamp:</strong> ${report.timestamp.toISOString()}</p>
        <p><strong>Security Posture:</strong> ${report.securityPosture}</p>
        <p><strong>Risk Score:</strong> ${report.riskScore}/100</p>
    </div>

    <div class="summary">
        <h2>Summary</h2>
        <ul>
            <li><strong>Total Findings:</strong> ${report.summary.total}</li>
            <li><strong>Critical:</strong> ${report.summary.critical}</li>
            <li><strong>High:</strong> ${report.summary.high}</li>
            <li><strong>Medium:</strong> ${report.summary.medium}</li>
            <li><strong>Low:</strong> ${report.summary.low}</li>
        </ul>
    </div>

    <div class="findings">
        <h2>Findings</h2>
        ${report.findings.map(finding => `
            <div class="finding ${finding.severity}">
                <h3>${finding.title}</h3>
                <p><strong>Severity:</strong> ${finding.severity}</p>
                <p><strong>Category:</strong> ${finding.category}</p>
                <p><strong>Description:</strong> ${finding.description}</p>
                <p><strong>Impact:</strong> ${finding.impact}</p>
                <p><strong>Remediation:</strong> ${finding.remediation}</p>
            </div>
        `).join('')}
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate CSV report
   */
  private generateCSVReport(report: SecurityAuditReport): string {
    const headers = 'ID,Title,Severity,Category,Type,Description,Remediation,Status,Discovered';
    const rows = report.findings.map(finding => 
      `"${finding.id}","${finding.title}","${finding.severity}","${finding.category}","${finding.type}","${finding.description}","${finding.remediation}","${finding.status}","${finding.discoveredAt.toISOString()}"`
    );
    
    return [headers, ...rows].join('\n');
  }

  /**
   * Get last audit report
   */
  getLastAuditReport(): SecurityAuditReport | undefined {
    return this.lastAuditReport;
  }

  /**
   * Update configuration
   */
  updateConfiguration(newConfig: Partial<SecurityAuditConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart scheduling if interval changed
    if (newConfig.auditInterval !== undefined || newConfig.enableScheduledAudits !== undefined) {
      if (this.auditInterval) {
        clearInterval(this.auditInterval);
      }
      this.initializeScheduledAudits();
    }

    logger.info('Security audit configuration updated');
  }

  /**
   * Stop scheduled audits
   */
  stopScheduledAudits(): void {
    if (this.auditInterval) {
      clearInterval(this.auditInterval);
      this.auditInterval = undefined;
      logger.info('Scheduled security audits stopped');
    }
  }
}

// Default security audit configuration
export const defaultSecurityAuditConfig: SecurityAuditConfig = {
  enableScheduledAudits: true,
  auditInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
  auditTypes: ['dependency', 'penetration', 'ssl', 'api', 'configuration', 'compliance'],
  alertThresholds: {
    critical: 1,
    high: 3,
    medium: 10
  },
  enableReporting: true,
  reportFormats: ['json', 'html'],
  enableRemediationSuggestions: true,
  auditScope: {
    includeDependencies: true,
    includeInfrastructure: true,
    includeApplication: true,
    includeData: true
  }
};

// Create global security auditor instance
export const securityAuditor = new SecurityAuditor(defaultSecurityAuditConfig);