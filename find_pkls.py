import os
import joblib
import glob

print("Searching for ALL pkl files on your system in this project...\n")

# Search the entire fraud-detection folder
for root, dirs, files in os.walk("C:\\fraud-detection"):
    for file in files:
        if file.endswith(".pkl"):
            full_path = os.path.join(root, file)
            size = os.path.getsize(full_path)
            print(f"FOUND: {full_path}  ({size:,} bytes)")

print("\n--- Checking what Flask actually loads ---")
# Simulate exactly what app.py does
ml_service_dir = "C:\\fraud-detection\\ml-service"
BASE = os.path.join(ml_service_dir, "..", "ml")
BASE = os.path.abspath(BASE)
print(f"Flask BASE path resolves to: {BASE}")

model_path   = os.path.join(BASE, "model.pkl")
scaler_path  = os.path.join(BASE, "scaler.pkl")
feature_path = os.path.join(BASE, "feature_cols.pkl")

print(f"model.pkl    → {model_path}  exists={os.path.exists(model_path)}")
print(f"scaler.pkl   → {scaler_path}  exists={os.path.exists(scaler_path)}")
print(f"feature_cols → {feature_path}  exists={os.path.exists(feature_path)}")

print("\n--- Testing the model Flask will load ---")
import pandas as pd
import numpy as np

model        = joblib.load(model_path)
scaler       = joblib.load(scaler_path)
feature_cols = joblib.load(feature_path)

row = {
    "Time":4462,"Amount":239.93,
    "V1":-3.0435,"V2":-3.1575,"V3":1.0886,"V4":2.2886,
    "V5":1.3598,"V6":-1.0670,"V7":-0.3677,"V8":-0.2707,
    "V9":-0.8381,"V10":-0.4147,"V11":-1.3922,"V12":-1.1473,
    "V13":0.4293,"V14":-2.4941,"V15":0.6520,"V16":-1.5704,
    "V17":-0.4869,"V18":-0.6033,"V19":0.1091,"V20":0.1992,
    "V21":0.3139,"V22":0.2770,"V23":-0.1100,"V24":0.0745,
    "V25":0.1285,"V26":0.0654,"V27":0.2494,"V28":0.0788
}

df = pd.DataFrame([{col: row.get(col, 0.0) for col in feature_cols}], columns=feature_cols)
df[["Amount","Time"]] = scaler.transform(df[["Amount","Time"]])
score = model.predict_proba(df)[0][1]
pred  = 1 if score >= 0.40 else 0

print(f"\nResult: prediction={pred}  score={score:.4f}")
if pred == 1:
    print("✅ Model file is CORRECT — problem is Flask not loading it")
else:
    print("❌ Model file itself gives wrong result — need to investigate further")