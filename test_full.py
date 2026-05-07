import requests
import json

FLASK_URL = "http://localhost:5001/ml-predict"
NODE_URL  = "http://localhost:3000/predict"

# The fraud row that scored 0.9778 in training
FRAUD = {
    "Time": 4462, "Amount": 239.93,
    "V1": -3.0435, "V2": -3.1575, "V3":  1.0886, "V4":  2.2886,
    "V5":  1.3598, "V6": -1.0670, "V7": -0.3677, "V8": -0.2707,
    "V9": -0.8381, "V10":-0.4147, "V11":-1.3922, "V12":-1.1473,
    "V13": 0.4293, "V14":-2.4941, "V15": 0.6520, "V16":-1.5704,
    "V17":-0.4869, "V18":-0.6033, "V19": 0.1091, "V20": 0.1992,
    "V21": 0.3139, "V22": 0.2770, "V23":-0.1100, "V24": 0.0745,
    "V25": 0.1285, "V26": 0.0654, "V27": 0.2494, "V28": 0.0788
}

# Node expects lowercase v1..v28
FRAUD_NODE = {
    "time": 4462, "amount": 239.93,
    "v1": -3.0435, "v2": -3.1575, "v3":  1.0886, "v4":  2.2886,
    "v5":  1.3598, "v6": -1.0670, "v7": -0.3677, "v8": -0.2707,
    "v9": -0.8381, "v10":-0.4147, "v11":-1.3922, "v12":-1.1473,
    "v13": 0.4293, "v14":-2.4941, "v15": 0.6520, "v16":-1.5704,
    "v17":-0.4869, "v18":-0.6033, "v19": 0.1091, "v20": 0.1992,
    "v21": 0.3139, "v22": 0.2770, "v23":-0.1100, "v24": 0.0745,
    "v25": 0.1285, "v26": 0.0654, "v27": 0.2494, "v28": 0.0788
}

print("=" * 55)
print("TEST 1 — Direct Flask call (uppercase keys)")
print("=" * 55)
try:
    r = requests.post(FLASK_URL, json=FRAUD)
    result = r.json()
    print(f"Label      : {result.get('label')}")
    print(f"Risk Score : {result.get('risk_score')}")
    print(f"Risk Level : {result.get('risk_level')}")
    print(f"Prediction : {result.get('prediction')}")
    if result.get("prediction") == 1:
        print("✅ Flask is working correctly!")
    else:
        print("❌ Flask returned Not Fraud — model not reloaded properly")
        print("   → Stop Flask, check ml-service/app.py was saved, restart")
except Exception as e:
    print(f"❌ Could not reach Flask: {e}")
    print("   → Make sure python app.py is running in ml-service/")

print()
print("=" * 55)
print("TEST 2 — Through Node (lowercase keys)")
print("=" * 55)
try:
    r = requests.post(NODE_URL, json=FRAUD_NODE)
    result = r.json()
    print(f"Label      : {result.get('label')}")
    print(f"Risk Score : {result.get('riskScore')}")
    print(f"Risk Level : {result.get('riskLevel')}")
    print(f"Prediction : {result.get('prediction')}")
    if result.get("prediction") == 1:
        print("✅ Node → Flask pipeline is working!")
    else:
        print("❌ Node returned Not Fraud")
        print("   → Check backend/routes/predict.js mapping of v1→V1")
except Exception as e:
    print(f"❌ Could not reach Node: {e}")
    print("   → Make sure npm run dev is running in backend/")