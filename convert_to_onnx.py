import os
import datetime
import json
import joblib
import numpy as np
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")
BEST_MODEL_PATH = os.path.join(MODEL_DIR, "best_model.joblib")
COMP_DATA_PATH = os.path.join(MODEL_DIR, "comparison_data.joblib")
ONNX_OUTPUT_PATH = os.path.join(MODEL_DIR, "model.onnx")
METADATA_OUTPUT_PATH = os.path.join(MODEL_DIR, "metadata.json")

print("--- Step 1: Loading Saved Model and Data ---")
if not os.path.exists(BEST_MODEL_PATH) or not os.path.exists(COMP_DATA_PATH):
    raise FileNotFoundError("Run train_model.py first to generate model and comparison data.")

model = joblib.load(BEST_MODEL_PATH)
comp_data = joblib.load(COMP_DATA_PATH)

print(f"Loaded best model: {comp_data['best_algorithm']}")

print("\n--- Step 2: Converting Model to ONNX ---")
# Feature count is 4 (SepalLengthCm, SepalWidthCm, PetalLengthCm, PetalWidthCm)
initial_type = [('float_input', FloatTensorType([None, 4]))]

# Convert sklearn model to ONNX
# We set target_opset to 12 as it's widely supported across runtimes
try:
    onnx_model = convert_sklearn(
        model, 
        initial_types=initial_type, 
        target_opset=12,
        options={type(model): {'zipmap': False}}  # Disabling zipmap simplifies output to arrays in JS
    )
except Exception as e:
    print(f"Conversion with options failed: {e}. Retrying without options...")
    onnx_model = convert_sklearn(model, initial_types=initial_type, target_opset=12)

# Save the ONNX model
with open(ONNX_OUTPUT_PATH, "wb") as f:
    f.write(onnx_model.SerializeToString())

print(f"ONNX model saved successfully to {ONNX_OUTPUT_PATH}")

print("\n--- Step 3: Generating metadata.json ---")
# Get feature importances if the model supports it
feature_importances = {}
feature_names = comp_data["feature_names"]

if hasattr(model, "feature_importances_"):
    importances = model.feature_importances_
    feature_importances = {name: float(imp) for name, imp in zip(feature_names, importances)}
elif hasattr(model, "coef_"):
    # For Logistic Regression, we can use average magnitude of coefficients
    coefs = np.abs(model.coef_).mean(axis=0)
    coefs = coefs / coefs.sum() if coefs.sum() > 0 else coefs
    feature_importances = {name: float(val) for name, val in zip(feature_names, coefs)}
else:
    # Default uniform feature importance if not easily extractable (e.g. KNN or SVM)
    # We can assign weights based on correlation or uniform weights (1/4 = 0.25)
    feature_importances = {name: 0.25 for name in feature_names}

metadata = {
    "model_name": "Iris Flower Classifier",
    "version": "1.0.0",
    "training_date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "algorithm": comp_data["best_algorithm"],
    "input_features": [
        {"name": "sepal_length", "displayName": "Sepal Length (cm)", "min": 4.0, "max": 8.0, "index": 0},
        {"name": "sepal_width", "displayName": "Sepal Width (cm)", "min": 2.0, "max": 5.0, "index": 1},
        {"name": "petal_length", "displayName": "Petal Length (cm)", "min": 1.0, "max": 7.0, "index": 2},
        {"name": "petal_width", "displayName": "Petal Width (cm)", "min": 0.1, "max": 3.0, "index": 3}
    ],
    "output_classes": comp_data["classes"],
    "feature_importances": feature_importances,
    "dataset_info": comp_data["dataset_info"],
    "metrics": comp_data["best_model_metrics"],
    "model_comparison": comp_data["comparison"]
}

with open(METADATA_OUTPUT_PATH, "w") as f:
    json.dump(metadata, f, indent=2)

print(f"metadata.json generated successfully at {METADATA_OUTPUT_PATH}")
print("ONNX conversion process complete.")
