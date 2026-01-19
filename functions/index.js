require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

admin.initializeApp();

/**
 * Proxy function to interact with Alchemer API using secure credentials
 * Usage from frontend:
 * fetch('https://<region>-<project>.cloudfunctions.net/alchemerProxy', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     path: '/survey/123/quotas',
 *     method: 'GET',
 *     params: { ... }
 *   })
 * })
 */
exports.alchemerProxy = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method === "OPTIONS") {
            res.status(204).send("");
            return;
        }

        const { path, method = "GET", params = {}, data = {} } = req.body;

        if (!path) {
            res.status(400).json({ result_ok: false, message: "Path is required" });
            return;
        }

        const apiToken = process.env.ALCHEMER_API_TOKEN;
        const apiSecret = process.env.ALCHEMER_API_SECRET;

        if (!apiToken || !apiSecret) {
            res.status(500).json({
                result_ok: false,
                message: "Server credentials not configured. Please set ALCHEMER_API_TOKEN and ALCHEMER_API_SECRET."
            });
            return;
        }

        try {
            // Clean path (remove leading slash if present)
            const cleanPath = path.startsWith('/') ? path.substring(1) : path;
            const url = `https://api.alchemer.com/v5/${cleanPath}`;

            const requestParams = {
                ...params,
                api_token: apiToken,
                api_token_secret: apiSecret
            };

            const axiosConfig = {
                url,
                method,
                params: requestParams,
                timeout: 30000
            };

            // Only include data if it's not a GET or DELETE request
            if (method !== "GET" && method !== "DELETE" && Object.keys(data).length > 0) {
                axiosConfig.data = data;
            }

            const response = await axios(axiosConfig);
            res.status(200).json(response.data);
        } catch (error) {
            console.error(`Alchemer Proxy Error [${method} ${path}]:`, error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                result_ok: false,
                message: error.message,
                details: error.response?.data || null,
                path: path,
                method: method
            });
        }
    });
});
