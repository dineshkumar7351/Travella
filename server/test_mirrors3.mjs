import axios from 'axios';
import https from 'https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const testUrls = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osp/tools/overpass/api/interpreter',
];

const q = `[out:json][timeout:25];(node["amenity"="fuel"](around:2000,11.0168,76.9558););out body;`;

for (const u of testUrls) {
  try {
    const t0 = Date.now();
    const res = await axios.post(u, 'data=' + encodeURIComponent(q), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'TravellaRouting/2.0' },
      httpsAgent,
      timeout: 10000,
    });
    console.log(`PASS ${u} in ${Date.now() - t0}ms, count = ${res.data?.elements?.length}`);
  } catch (e) {
    console.log(`FAIL ${u}: ${e.response?.status || e.message}`);
  }
}
