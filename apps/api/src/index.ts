import express from 'express';

const app = express();

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    message: 'API is running 🚀',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
