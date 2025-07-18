
import { exec } from 'child_process';

export class DependencyScanner {
  scan() {
    return new Promise((resolve, reject) => {
      exec('npm audit --json', (error, stdout, stderr) => {
        if (error && error.code !== 1) {
          reject(error);
          return;
        }

        try {
          const audit = JSON.parse(stdout);
          resolve(audit);
        } catch (e) {
          reject(e);
        }
      });
    });
  }
}
