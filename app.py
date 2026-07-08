import os
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # Enable Cross-Origin Resource Sharing (allows GitHub Pages to request this backend)

# Load model and comparison data
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "best_model.joblib")
COMPARISON_PATH = os.path.join(BASE_DIR, "model", "comparison_data.joblib")

if not os.path.exists(MODEL_PATH) or not os.path.exists(COMPARISON_PATH):
    raise FileNotFoundError("Run train_model.py first to generate the joblib model files.")

model = joblib.load(MODEL_PATH)
comp_data = joblib.load(COMPARISON_PATH)
classes_map = comp_data["classes"] # e.g. {0: "Iris-setosa", 1: "Iris-versicolor", 2: "Iris-virginica"}
feature_names = comp_data["feature_names"] # e.g. ["SepalLengthCm", "SepalWidthCm", "PetalLengthCm", "PetalWidthCm"]

def get_class_name(idx):
    """Helper to safely fetch class name mapping regardless of key type (int vs string)"""
    if idx in classes_map:
        return classes_map[idx]
    elif str(idx) in classes_map:
        return classes_map[str(idx)]
    return f"Class-{idx}"

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Support both a flat array format or object key mapping
        if "inputs" in data:
            # Format: {"inputs": [5.1, 3.5, 1.4, 0.2]}
            features = [float(v) for v in data["inputs"]]
        else:
            # Format: {"sepal_length": 5.1, "sepal_width": 3.5, "petal_length": 1.4, "petal_width": 0.2}
            features = [
                float(data.get("sepal_length", 0)),
                float(data.get("sepal_width", 0)),
                float(data.get("petal_length", 0)),
                float(data.get("petal_width", 0))
            ]
        
        if len(features) != 4:
            return jsonify({"error": f"Expected 4 numeric inputs, got {len(features)}"}), 400

        # Convert to pandas DataFrame to match the feature names used during training,
        # which avoids scikit-learn's UserWarning regarding feature names.
        df_features = pd.DataFrame([features], columns=feature_names)

        # Perform inference on the loaded scikit-learn model
        prediction_idx = int(model.predict(df_features)[0])
        probabilities = model.predict_proba(df_features)[0].tolist()
        
        predicted_species = get_class_name(prediction_idx)
        confidence = probabilities[prediction_idx]
        
        # Build probability distribution response
        probabilities_dict = {get_class_name(i): prob for i, prob in enumerate(probabilities)}
        
        response = {
            "species": predicted_species,
            "confidence": confidence,
            "probabilities": probabilities_dict
        }
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Bind to PORT env var if set (standard on Render), fallback to 5000
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
