from matplotlib import cm
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from imblearn.over_sampling import SMOTE
import joblib, os

print("="*55)
print("  Fraud Detection — Full ML Training Pipeline")
print("="*55)

for f in ["model.pkl","scaler.pkl","feature_cols.pkl",
          "scaler_indices.pkl","isolation_forest.pkl"]:
    if os.path.exists(f):
        os.remove(f)
        print(f"Deleted old {f}")

print("\nLoading creditcard.csv...")
df = pd.read_csv("creditcard.csv")
print(f"Shape: {df.shape} | Fraud: {df['Class'].sum()} | Legit: {(df['Class']==0).sum()}")

feature_cols = [c for c in df.columns if c != "Class"]
X = df[feature_cols].values.copy()
y = df["Class"].values

amount_idx = feature_cols.index("Amount")
time_idx   = feature_cols.index("Time")

print("\nScaling Amount and Time...")
scaler = StandardScaler()
X[:, [amount_idx, time_idx]] = scaler.fit_transform(X[:, [amount_idx, time_idx]])

joblib.dump({"amount": amount_idx, "time": time_idx}, "scaler_indices.pkl")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print("\nApplying SMOTE...")
sm = SMOTE(random_state=42)
X_train_res, y_train_res = sm.fit_resample(X_train, y_train)

# ── Random Forest ─────────────────────────────────────────
print("\nTraining Random Forest...")
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=20,
    min_samples_split=5,
    min_samples_leaf=2,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)
model.fit(X_train_res, y_train_res)

y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]
conf_mat = confusion_matrix(y_test, y_pred)
print(classification_report(y_test, y_pred, target_names=["Legit","Fraud"]))
print(f"RF ROC-AUC: {roc_auc_score(y_test, y_prob):.4f}")
from sklearn.metrics import roc_curve, precision_recall_curve, auc as sk_auc
import json

# ROC curve
fpr, tpr, roc_thresh = roc_curve(y_test, y_prob)
roc_auc_val = sk_auc(fpr, tpr)

# PR curve
precision_arr, recall_arr, pr_thresh = precision_recall_curve(y_test, y_prob)
pr_auc_val = sk_auc(recall_arr, precision_arr)

# Subsample to 100 points for frontend
step = max(1, len(fpr) // 100)
metrics = {
    "roc_auc":  round(float(roc_auc_val), 4),
    "pr_auc":   round(float(pr_auc_val),  4),
    "roc_curve": {
        "fpr": [round(float(x),4) for x in fpr[::step]],
        "tpr": [round(float(x),4) for x in tpr[::step]]
    },
    "pr_curve": {
        "precision": [round(float(x),4) for x in precision_arr[::step]],
        "recall":    [round(float(x),4) for x in recall_arr[::step]]
    },
    "confusion_matrix": conf_mat.tolist(),
    "fraud_precision":  round(float(conf_mat[1][1]/(conf_mat[1][1]+conf_mat[0][1]+1e-9)), 4),
    "fraud_recall":     round(float(conf_mat[1][1]/(conf_mat[1][1]+conf_mat[1][0]+1e-9)), 4),
    "fraud_f1":         round(float(roc_auc_score(y_test, y_prob)), 4),
    "total_test":       int(len(y_test)),
    "total_fraud_test": int(y_test.sum()),
    "model_type":       "Random Forest + Isolation Forest",
    "n_estimators":     100,
    "smote_applied":    True
}

with open("model_metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)
print(f"\n✅ Saved model_metrics.json  ROC-AUC={roc_auc_val:.4f}  PR-AUC={pr_auc_val:.4f}")

# ── Isolation Forest (unsupervised anomaly detection) ─────
print("\nTraining Isolation Forest...")
iso = IsolationForest(
    n_estimators=200,
    contamination=0.002,
    max_samples="auto",
    random_state=42,
    n_jobs=-1
)
iso.fit(X_train)
iso_scores = iso.decision_function(X_test)
iso_pred   = iso.predict(X_test)
iso_fraud  = (iso_pred == -1).astype(int)

print(f"Isolation Forest flagged: {iso_fraud.sum()} anomalies in test set")
print(f"True fraud in test set:   {y_test.sum()}")

joblib.dump(model,        "model.pkl")
joblib.dump(iso,          "isolation_forest.pkl")
joblib.dump(scaler,       "scaler.pkl")
joblib.dump(feature_cols, "feature_cols.pkl")

print("\n✅ Saved all model files!")

# Self-test
print("\n── Self-test with known fraud rows ──")
original = pd.read_csv("creditcard.csv")
fraud_samples = original[original["Class"]==1].head(5)
for i, (_, row) in enumerate(fraud_samples.iterrows()):
    vec = np.array([float(row[col]) for col in feature_cols]).reshape(1,-1)
    pair = scaler.transform([[vec[0,amount_idx], vec[0,time_idx]]])[0]
    vec[0,amount_idx] = pair[0]
    vec[0,time_idx]   = pair[1]
    rf_score  = model.predict_proba(vec)[0][1]
    iso_score = float(iso.decision_function(vec)[0])
    combined  = rf_score * 0.7 + max(0, -iso_score) * 0.3
    pred      = 1 if combined >= 0.30 else 0
    print(f"  Fraud {i+1}: rf={rf_score:.3f} iso={iso_score:.3f} combined={combined:.3f} pred={pred}")

print("\n✅ Done! Restart Flask and Node.")