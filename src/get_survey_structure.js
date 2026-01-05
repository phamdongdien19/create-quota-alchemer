import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const API_KEY = process.env.ALCHEMER_API_KEY;
const API_SECRET = process.env.ALCHEMER_API_SECRET;
const SURVEY_ID = process.env.SURVEY_ID;

const BASE_URL = `https://api.alchemer.com/v5/survey/${SURVEY_ID}`;

async function getSurveyQuestions() {
    try {
        console.log('🔍 Đang lấy danh sách câu hỏi từ survey...\n');

        const url = `${BASE_URL}/surveyquestion?api_token=${API_KEY}&api_token_secret=${API_SECRET}`;
        const response = await axios.get(url);

        if (response.data.result_ok) {
            const questions = response.data.data;
            const simplified = [];

            for (const q of questions) {
                if (q.type === 'RADIO' || q.type === 'CHECKBOX' || q.type === 'MENU') {
                    const questionInfo = {
                        id: q.id,
                        title: q.title?.English || q.title,
                        type: q.type,
                        options: []
                    };

                    if (q.options) {
                        for (const opt of q.options) {
                            questionInfo.options.push({
                                id: opt.id,
                                value: opt.value,
                                title: opt.title?.English || opt.title
                            });
                        }
                    }

                    simplified.push(questionInfo);
                }
            }

            // Lưu ra file
            fs.writeFileSync('survey_structure.json', JSON.stringify(simplified, null, 2), 'utf8');

            console.log('✅ Đã lưu cấu trúc survey vào: survey_structure.json\n');
            console.log('📋 Danh sách câu hỏi có options:\n');

            for (const q of simplified) {
                console.log(`Question ID: ${q.id}`);
                console.log(`  Title: ${q.title}`);
                console.log(`  Options:`);
                for (const opt of q.options) {
                    console.log(`    - ID: ${opt.id}, Value: "${opt.value}"`);
                }
                console.log('');
            }

        } else {
            console.error('❌ Lỗi:', response.data.message);
        }
    } catch (error) {
        console.error('❌ Lỗi khi gọi API:', error.response?.data || error.message);
    }
}

getSurveyQuestions();
