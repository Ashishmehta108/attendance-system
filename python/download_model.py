from huggingface_hub import snapshot_download, list_repo_files
import os
import shutil
from pathlib import Path

REPO_ID = "microsoft/Phi-4-mini-instruct-onnx"
TARGET_DIR = Path("models/phi-4-mini-onnx")

def find_onnx_folder(repo_id):
    print(f"Inspecting repo {repo_id}...")
    files = list_repo_files(repo_id)
    
    # Common patterns for CPU INT4 ONNX models in Microsoft repos
    candidates = [
        "cpu_and_mobile/cpu-int4-rtn-block-32-acc-level-4",
        "cpu-int4-rtn-block-32-acc-level-4",
        "cpu_and_mobile/cpu-int4-rtn-block-32",
        "onnx/cpu_and_mobile/cpu-int4-rtn-block-32-acc-level-4"
    ]
    
    for candidate in candidates:
        # Check if any file starts with this path
        if any(f.startswith(candidate) for f in files):
            print(f"Found ONNX model at: {candidate}")
            return candidate
            
    # Fallback: look for any folder with .onnx files
    print("Could not find standard path. Searching for any .onnx file...")
    for f in files:
        if f.endswith(".onnx") and "cpu" in f and "int4" in f:
            return str(Path(f).parent).replace("\\", "/")
            
    return None

def download_model():
    subfolder = find_onnx_folder(REPO_ID)
    if not subfolder:
        print("Could not identify a suitable CPU INT4 ONNX folder in the repo.")
        return

    print(f"Downloading from {subfolder}...")
    
    path = snapshot_download(
        repo_id=REPO_ID, 
        allow_patterns=[f"{subfolder}/*"],
        local_dir="temp_download",
    )
    
    source_path = Path(path) / subfolder
    
    if TARGET_DIR.exists():
        shutil.rmtree(TARGET_DIR)
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
        
    print(f"Moving files to {TARGET_DIR}...")
    for file in source_path.glob("*"):
        if file.is_file():
            shutil.move(str(file), str(TARGET_DIR / file.name))
        
    # Cleanup temp
    try:
        shutil.rmtree("temp_download")
    except Exception as e:
        print(f"Warning: Could not cleanup temp dir: {e}")
        
    print("Model setup complete.")

if __name__ == "__main__":
    download_model()
