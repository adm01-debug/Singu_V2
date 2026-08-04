const https = require('https');
const PAT = 'sbp_5bf00619e37fa3d4705d6643f6c051d624fe2203';
const REF = 'pgxfvjmuubtbowutlide';
function mgmt(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: 'api.supabase.com', port: 443,
      path: '/v1/projects/' + REF + '/database/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + PAT,
        'apikey': PAT,
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 30000,
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('TIMEOUT')); });
    req.write(body);
    req.end();
  });
}
async function main() {
  // Check interactions columns
  const r2 = await mgmt("SELECT column_name FROM information_schema.columns WHERE table_name = 'interactions' ORDER BY ordinal_position");
  console.log('INTERACTIONS COLS:', JSON.stringify(r2.body));
  // Check contacts
  const r3 = await mgmt("SELECT column_name FROM information_schema.columns WHERE table_name = 'contacts' AND column_name IN ('id','first_name','last_name','company_id','user_id')");
  console.log('CONTACTS ID/NAME:', JSON.stringify(r3.body));
}
main().catch(e => console.error(e.message));
