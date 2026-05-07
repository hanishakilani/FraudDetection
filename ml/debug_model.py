# debug_model.py  — save this in your ml/ folder and run it
import pandas as pd
import numpy as np
import joblib

print("Loading model files...")
model        = joblib.load("model.pkl")
scaler       = joblib.load("scaler.pkl")
feature_cols = joblib.load("feature_cols.pkl")
print(f"Feature cols order: {feature_cols[:5]}...")  # should start with Time or Amount

# Load a real fraud row directly from the CSV
df = pd.read_csv("creditcard.csv")
fraud_rows = df[df["Class"] == 1]
legit_rows = df[df["Class"] == 0]

print(f"\nTotal fraud rows in CSV: {len(fraud_rows)}")
print(f"Total legit rows in CSV: {len(legit_rows)}")

# Test with first 5 fraud rows
print("\n── Testing 5 FRAUD rows ──")
for i in range(5):
    row = fraud_rows.iloc[i].drop("Class")
    row = row[feature_cols]  # ensure correct column order

    arr = row.values.reshape(1, -1).copy()

    # Scale Amount and Time
    amount_idx = feature_cols.index("Amount")
    time_idx   = feature_cols.index("Time")
    scaled = scaler.transform([[arr[0, amount_idx], arr[0, time_idx]]])[0]
    arr[0, amount_idx] = scaled[0]
    arr[0, time_idx]   = scaled[1]

    prob  = model.predict_proba(arr)[0][1]
    pred  = model.predict(arr)[0]
    print(f"  Row {i+1}: prediction={pred}, risk_score={prob:.4f}, amount={fraud_rows.iloc[i]['Amount']}")

# Test with first 3 legit rows
print("\n── Testing 3 LEGIT rows ──")
for i in range(3):
    row = legit_rows.iloc[i].drop("Class")
    row = row[feature_cols]

    arr = row.values.reshape(1, -1).copy()

    amount_idx = feature_cols.index("Amount")
    time_idx   = feature_cols.index("Time")
    scaled = scaler.transform([[arr[0, amount_idx], arr[0, time_idx]]])[0]
    arr[0, amount_idx] = scaled[0]
    arr[0, time_idx]   = scaled[1]

    prob = model.predict_proba(arr)[0][1]
    pred = model.predict(arr)[0]
    print(f"  Row {i+1}: prediction={pred}, risk_score={prob:.4f}, amount={legit_rows.iloc[i]['Amount']}")