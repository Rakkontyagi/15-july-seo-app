
import { exec } from 'child_process';

export class PenetrationTester {
  private target: string;

  constructor(target: string) {
    this.target = target;
  }

  runNmap() {
    return new Promise((resolve, reject) => {
      exec(`nmap -A -T4 ${this.target}`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });
  }

  runNikto() {
    return new Promise((resolve, reject) => {
      exec(`nikto -h ${this.target}`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });
  }
}
