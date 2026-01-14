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
exports.alchemerProxy = functions.runWith({
    secrets: ["ALCHEMER_API_TOKEN", "ALCHEMER_API_SECRET"]
}).https.onRequest((req, res) => {
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

            const response = await axios({
                url,
                method,
                params: requestParams,
                data,
                timeout: 30000
            });

            res.status(200).json(response.data);
        } catch (error) {
            console.error("Alchemer Proxy Error:", error.response?.data || error.message);
            res.status(error.response?.status || 500).json(
                error.response?.data || { result_ok: false, message: error.message }
            );
        }
    });
});
