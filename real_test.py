import pandas as pd
import numpy as np
import requests
import joblib
import os

print("Reading real fraud rows from CSV...")
df = pd.read_csv("ml/creditcard.csv")

fraud_rows = df[df["Class"] == 1].head(10)

print(f"Found {len(fraud_rows)} fraud rows to test\n")

# ── Load model directly and test ──────────────────────────
BASE         = "ml"
model        = joblib.load(os.path.join(BASE, "model.pkl"))
scaler       = joblib.load(os.path.join(BASE, "scaler.pkl"))
feature_cols = joblib.load(os.path.join(BASE, "feature_cols.pkl"))

amount_idx = feature_cols.index("Amount")
time_idx   = feature_cols.index("Time")

print("="*55)
print("TEST A — Direct model (no Flask, no Node)")
print("="*55)
for i, (_, row) in enumerate(fraud_rows.iterrows()):
    vec = np.array([float(row[col]) for col in feature_cols]).reshape(1, -1)
    pair = scaler.transform([[vec[0, amount_idx], vec[0, time_idx]]])[0]
    vec[0, amount_idx] = pair[0]
    vec[0, time_idx]   = pair[1]
    score = model.predict_proba(vec)[0][1]
    pred  = 1 if score >= 0.40 else 0
    print(f"  Row {i+1}: pred={pred}  score={score:.4f}  amount={row['Amount']:.2f}  time={row['Time']:.0f}")

# ── Pick the best scoring fraud row ──────────────────────
print("\nFinding best scoring fraud row to use as test case...")
best_score = 0
best_row   = None
for _, row in fraud_rows.iterrows():
    vec = np.array([float(row[col]) for col in feature_cols]).reshape(1, -1)
    pair = scaler.transform([[vec[0, amount_idx], vec[0, time_idx]]])[0]
    vec[0, amount_idx] = pair[0]
    vec[0, time_idx]   = pair[1]
    score = model.predict_proba(vec)[0][1]
    if score > best_score:
        best_score = score
        best_row   = row

print(f"Best row: amount={best_row['Amount']}  score={best_score:.4f}")

# Build Flask payload (uppercase keys) from real CSV values
flask_payload = {"Time": float(best_row["Time"]), "Amount": float(best_row["Amount"])}
for i in range(1, 29):
    flask_payload[f"V{i}"] = float(best_row[f"V{i}"])

# Build Node payload (lowercase keys)
node_payload = {"time": float(best_row["Time"]), "amount": float(best_row["Amount"])}
for i in range(1, 29):
    node_payload[f"v{i}"] = float(best_row[f"V{i}"])

print("\n" + "="*55)
print("TEST B — Flask directly (real CSV values)")
print("="*55)
try:
    r = requests.post("http://localhost:5001/ml-predict", json=flask_payload)
    result = r.json()
    print(f"  label      = {result.get('label')}")
    print(f"  risk_score = {result.get('risk_score')}")
    print(f"  prediction = {result.get('prediction')}")
    if result.get("prediction") == 1:
        print("  ✅ Flask WORKS with real values!")
    else:
        print("  ❌ Flask still wrong — pipeline bug confirmed")
except Exception as e:
    print(f"  ❌ Flask unreachable: {e}")

print("\n" + "="*55)
print("TEST C — Through Node (real CSV values)")
print("="*55)
try:
    r = requests.post("http://localhost:3000/predict", json=node_payload)
    result = r.json()
    print(f"  label      = {result.get('label')}")
    print(f"  riskScore  = {result.get('riskScore')}")
    print(f"  prediction = {result.get('prediction')}")
    if result.get("prediction") == 1:
        print("  ✅ Full pipeline WORKS!")
    else:
        print("  ❌ Node still wrong")
except Exception as e:
    print(f"  ❌ Node unreachable: {e}")

# Print the actual correct JSON to use in Postman
print("\n" + "="*55)
print("CORRECT JSON to paste into Postman (Node — lowercase):")
print("="*55)
import json
print(json.dumps(node_payload, indent=2))

print("\n" + "="*55)
print("CORRECT JSON to paste into Postman (Flask — uppercase):")
print("="*55)
print(json.dumps(flask_payload, indent=2))