# 🛡 FraudGuard — ML-Powered Fraud Detection System

A full-stack fraud detection web application using machine learning.

## Tech Stack
- **Frontend**: HTML, CSS, Vanilla JavaScript, Chart.js
- **Backend**: Node.js + Express + Socket.io
- **ML Service**: Python Flask + scikit-learn + SHAP
- **Database**: MongoDB
- **Dataset**: Kaggle Credit Card Fraud Detection (284,807 transactions)

## Features
- Real-time fraud detection using Random Forest + Isolation Forest
- SHAP explainability — why each transaction was flagged
- WebSocket live transaction feed
- ROC-AUC and PR-AUC model performance curves
- Risk matrix heatmap
- Bulk CSV upload (1000 rows at once)
- Email alerts for high-risk transactions
- JWT authentication
- Analytics dashboard with charts
- PDF and CSV export

## Setup Instructions

### 1. Download dataset
Get `creditcard.csv` from [Kaggle](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)
and place it in the `ml/` folder.

### 2. Train the model
```bash
cd ml
pip install -r requirements.txt
python train_model.py
```

### 3. Start Flask ML service
```bash
cd ml-service
pip install -r requirements.txt
python app.py
```

### 4. Start MongoDB
```bash
mongod --dbpath ~/data/db
```

### 5. Start Node backend
```bash
cd backend
npm install
npm run dev
```

### 6. Open the app
Visit `http://localhost:3000`

## Environment Variables
Create `backend/.env`:

PORT=3000
MONGO_URI=mongodb://localhost:27017/frauddb
ML_SERVICE_URL=http://localhost:5001
ALERT_THRESHOLD=0.30
JWT_SECRET=your_secret_key
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
ALERT_EMAIL=admin@yourdomain.com

## Note
The `creditcard.csv` dataset and trained model `.pkl` files are excluded
from this repository due to file size. Run `train_model.py` to regenerate them.
