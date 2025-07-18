
import https from 'https';

export class SSLValidator {
  validate(host: string) {
    return new Promise((resolve, reject) => {
      const options = {
        host,
        port: 443,
        method: 'GET'
      };

      const req = https.request(options, (res) => {
        resolve(res.socket.getPeerCertificate());
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.end();
    });
  }
}
