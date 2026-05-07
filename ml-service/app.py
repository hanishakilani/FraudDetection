from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import shap
import os, sys

app = Flask(__name__)
CORS(app)

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ml")
print(f"Loading models from: {BASE}")

try:
    model          = joblib.load(os.path.join(BASE, "model.pkl"))
    iso            = joblib.load(os.path.join(BASE, "isolation_forest.pkl"))
    scaler         = joblib.load(os.path.join(BASE, "scaler.pkl"))
    feature_cols   = joblib.load(os.path.join(BASE, "feature_cols.pkl"))
    scaler_indices = joblib.load(os.path.join(BASE, "scaler_indices.pkl"))
    amount_idx     = scaler_indices["amount"]
    time_idx       = scaler_indices["time"]
    print(f"✅ All models loaded | Features: {len(feature_cols)}")
    print(f"   Amount idx: {amount_idx} | Time idx: {time_idx}")
except Exception as e:
    print(f"❌ Load failed: {e}")
    sys.exit(1)

# Build SHAP explainer once at startup (slow first time)
print("Building SHAP explainer...")
explainer = shap.TreeExplainer(model)
print("✅ SHAP explainer ready")


def build_vector(data):
    """Build numpy vector from request data in correct column order."""
    vec = np.zeros((1, len(feature_cols)), dtype=float)
    for i, col in enumerate(feature_cols):
        val = data.get(col)
        if val is not None:
            vec[0, i] = float(val)
    # Scale Amount and Time
    pair = scaler.transform([[vec[0, amount_idx], vec[0, time_idx]]])[0]
    vec[0, amount_idx] = pair[0]
    vec[0, time_idx]   = pair[1]
    return vec


def get_risk_level(score):
    if score < 0.15:   return "LOW"
    elif score < 0.30: return "MEDIUM"
    elif score < 0.60: return "HIGH"
    else:              return "CRITICAL"


def get_shap_explanation(vec):
    """Return top 5 features driving the prediction."""
    try:
        shap_values = explainer.shap_values(vec)
        # shap_values[1] = values for fraud class
        fraud_shap = shap_values[1][0] if isinstance(shap_values, list) else shap_values[0]
        pairs = list(zip(feature_cols, fraud_shap))
        pairs.sort(key=lambda x: abs(x[1]), reverse=True)
        top5 = pairs[:5]
        return [
            {
                "feature":    name,
                "value":      round(float(vec[0, feature_cols.index(name)]), 4),
                "impact":     round(float(impact), 4),
                "direction":  "increases fraud risk" if impact > 0 else "decreases fraud risk"
            }
            for name, impact in top5
        ]
    except Exception as e:
        print(f"SHAP error: {e}")
        return []


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "features": len(feature_cols)})


@app.route("/ml-predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "Empty body"}), 400

        print(f"\nIN: Time={data.get('Time')} Amount={data.get('Amount')} V14={data.get('V14')}")

        vec = build_vector(data)

        # Random Forest score
        rf_score = float(model.predict_proba(vec)[0][1])

        # Isolation Forest score (negative = more anomalous)
        iso_raw   = float(iso.decision_function(vec)[0])
        iso_score = max(0.0, -iso_raw)  # convert to 0-1 range

        # Combined score: 70% RF + 30% Isolation Forest
        combined_score = (rf_score * 0.7) + (iso_score * 0.3)
        combined_score = min(1.0, combined_score)

        prediction = 1 if combined_score >= 0.30 else 0
        risk_level = get_risk_level(combined_score)

        # SHAP explanation
        explanation = get_shap_explanation(vec)

        print(f"RF={rf_score:.4f} ISO={iso_score:.4f} Combined={combined_score:.4f} Pred={prediction}")

        return jsonify({
            "prediction":     prediction,
            "label":          "Fraud" if prediction == 1 else "Not Fraud",
            "risk_score":     round(combined_score, 4),
            "rf_score":       round(rf_score, 4),
            "iso_score":      round(iso_score, 4),
            "risk_level":     risk_level,
            "explanation":    explanation
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/ml-bulk", methods=["POST"])
def bulk_predict():
    """Predict on multiple transactions at once."""
    try:
        data = request.get_json(force=True)
        transactions = data.get("transactions", [])
        if not transactions:
            return jsonify({"error": "No transactions provided"}), 400

        results = []
        for tx in transactions:
            vec        = build_vector(tx)
            rf_score   = float(model.predict_proba(vec)[0][1])
            iso_raw    = float(iso.decision_function(vec)[0])
            iso_score  = max(0.0, -iso_raw)
            combined   = min(1.0, rf_score * 0.7 + iso_score * 0.3)
            prediction = 1 if combined >= 0.30 else 0
            results.append({
                "prediction": prediction,
                "label":      "Fraud" if prediction == 1 else "Not Fraud",
                "risk_score": round(combined, 4),
                "risk_level": get_risk_level(combined)
            })

        return jsonify({"results": results, "total": len(results)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)