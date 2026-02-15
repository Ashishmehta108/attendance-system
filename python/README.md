# Classroom Feedback Analyzer - AI Backend

A Python microservice powered by **Microsoft Phi-4 Mini (ONNX)** to analyze classroom feedback and generate actionable insights.

## Features

- **Analyze Feedback**: Sentiment analysis, theme extraction, and key takeaways using Phi-4 Mini.
- **FastAPI**: Async API with validation and documentation.
- **ONNX Runtime GenAI**: Optimized CPU/GPU inference without needing heavy PyTorch dependencies.
- **Privacy First**: PII redaction and local processing (no external API calls).

## Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Download Model**:
   ```bash
   python download_model.py
   ```
   (Downloads ~4GB ONNX model to `./models`)

3. **Run Server**:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Usage

- **POST** `/api/v1/analyze`
- **GET** `/api/v1/health`

See `postman_collection.json` for examples.
