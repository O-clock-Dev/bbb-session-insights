const { utils: { parseKey }, Client } = require('ssh2');

export default function executeSSHCommand(host, username, ssh_key, command, callback) {
  const conn = new Client();
  conn.on('ready', () => {
    console.log('Client :: ready');
    conn.exec(command, (err, stream) => {
      if (err) {
        conn.end();
        return callback(err);
      }
      let dataReceived = '';
      stream.on('close', (code, signal) => {
        console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
        conn.end();
        callback(null, dataReceived);
      }).on('data', (data) => {
        // console.log('STDOUT: ' + data);
        dataReceived += data;
      }).stderr.on('data', (data) => {
        console.log('STDERR: ' + data);
        callback(data);
      });
    });
  }).connect({
    host: host,
    port: 22,
    username: username,
    privateKey: ssh_key
  });
}
