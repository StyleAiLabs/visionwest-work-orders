// middleware/webhook-auth.middleware.js
exports.validateWebhookApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Invalid API key'
        });
    }

    next();
};