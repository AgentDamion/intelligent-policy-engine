require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

// Basic test route
app.get('/', (req, res) => {
    res.json({ 
        message: 'aicomplyr.io API Server is running!',
        status: 'healthy'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 aicomplyr.io backend running on port ${PORT}`);
    console.log(`✅ Visit: http://localhost:${PORT}`);
});