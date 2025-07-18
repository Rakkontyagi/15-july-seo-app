
import { DependencyScanner } from './dependency-scanner';
import { PenetrationTester } from './penetration-tester';
import { SSLValidator } from './ssl-validator';

export class SecurityAuditor {
  private dependencyScanner: DependencyScanner;
  private penetrationTester: PenetrationTester;
  private sslValidator: SSLValidator;

  constructor(target: string) {
    this.dependencyScanner = new DependencyScanner();
    this.penetrationTester = new PenetrationTester(target);
    this.sslValidator = new SSLValidator();
  }

  async runAudit() {
    const dependencyReport = await this.dependencyScanner.scan();
    const nmapReport = await this.penetrationTester.runNmap();
    const niktoReport = await this.penetrationTester.runNikto();
    const sslReport = await this.sslValidator.validate('google.com');

    return {
      dependencyReport,
      nmapReport,
      niktoReport,
      sslReport,
    };
  }
}
