const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
try {
    const routes = require('./api/routes');
    app.use('/api', routes);
} catch (error) {
    console.error('Error loading routes:', error);
}

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'AI Complyr Policy Engine API' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});