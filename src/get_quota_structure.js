import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.ALCHEMER_API_KEY || '8e5ae063c79a1f56446d68517fb7c78c';
const API_SECRET = process.env.ALCHEMER_API_SECRET;
const SURVEY_ID = process.env.SURVEY_ID || '8154556';

async function getQuotaDetails() {
    console.log('🔍 Đang lấy danh sách quota...\n');

    try {
        // Get all quotas
        const listUrl = `https://api.alchemer.com/v5/survey/${SURVEY_ID}/quotas?api_token=${API_KEY}&api_token_secret=${API_SECRET}`;
        const listRes = await axios.get(listUrl);

        if (!listRes.data.result_ok) {
            console.error('❌ Lỗi:', listRes.data.message);
            return;
        }

        const quotas = listRes.data.data || [];
        console.log(`📊 Tìm thấy ${quotas.length} quota(s)\n`);

        // Get details of each quota
        for (const quota of quotas) {
            console.log('═'.repeat(60));
            console.log(`📝 Quota: ${quota.name} (ID: ${quota.id})`);
            console.log(`   Limit: ${quota.limit}`);

            // Get detailed quota info
            const detailUrl = `https://api.alchemer.com/v5/survey/${SURVEY_ID}/quotas/${quota.id}?api_token=${API_KEY}&api_token_secret=${API_SECRET}`;
            const detailRes = await axios.get(detailUrl);

            if (detailRes.data.result_ok && detailRes.data.data) {
                const detail = detailRes.data.data;

                console.log('\n   📋 RAW Data từ API:');
                console.log(JSON.stringify(detail, null, 2));

                if (detail.groups) {
                    console.log('\n   🎯 Groups (Logic) Structure:');
                    console.log(JSON.stringify(detail.groups, null, 2));
                }
            }
            console.log('\n');
        }

    } catch (error) {
        console.error('❌ Lỗi API:', error.response?.data || error.message);
    }
}

getQuotaDetails();
