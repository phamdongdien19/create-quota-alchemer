import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

dotenv.config();

const API_KEY = process.env.ALCHEMER_API_KEY;
const API_SECRET = process.env.ALCHEMER_API_SECRET;
const SURVEY_ID = process.env.SURVEY_ID;

const BASE_URL = `https://api.alchemer.com/v5/survey/${SURVEY_ID}/quotas`;

// Default logic: Question 212 (source) is answered
// Format theo Alchemer API: [[{rule}]]
const DEFAULT_GROUPS = JSON.stringify([[{
    input_value: "212",
    operator: "20",  // 20 = is answered
    answers_type: "17",
    answers_values: []
}]]);

/**
 * Tạo quota mới với logic mặc định (source is answered)
 */
async function createQuota(name, limit) {
    try {
        const params = new URLSearchParams();
        params.append('api_token', API_KEY);
        params.append('api_token_secret', API_SECRET);
        params.append('_method', 'PUT');
        params.append('name', name);
        params.append('limit', limit);
        params.append('groups', DEFAULT_GROUPS);

        const url = `${BASE_URL}?${params.toString()}`;
        const response = await axios.get(url);

        if (response.data.result_ok) {
            console.log(`✅ Đã tạo: "${name}" (Limit: ${limit})`);
            return true;
        } else {
            console.error(`❌ Lỗi "${name}":`, response.data.message);
            return false;
        }
    } catch (error) {
        console.error(`❌ Lỗi API "${name}":`, error.response?.data || error.message);
        return false;
    }
}

/**
 * Đọc file CSV và tạo quota hàng loạt
 */
async function bulkCreateQuotas() {
    const csvPath = process.argv[2] || 'quotas.csv';

    if (!fs.existsSync(csvPath)) {
        console.error(`❌ Không tìm thấy file: ${csvPath}`);
        return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    console.log(`\n🚀 Bắt đầu tạo ${records.length} quota...\n`);
    console.log(`📌 Logic mặc định: source (Q212) is answered`);
    console.log(`⚠️ Bạn có thể vào UI để sửa logic sau.\n`);

    let success = 0;
    let failed = 0;

    for (const record of records) {
        const name = record.name;
        const limit = parseInt(record.limit) || 100;

        const result = await createQuota(name, limit);
        if (result) {
            success++;
        } else {
            failed++;
        }

        await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`\n📊 Kết quả: ${success} thành công, ${failed} thất bại`);
    console.log(`👉 https://app.alchemer.com/projects/setup/id/${SURVEY_ID}/tab/quotas`);
}

bulkCreateQuotas();
