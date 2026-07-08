import traceback
import sys

print("Python version:", sys.version)
print("Executable:", sys.executable)

try:
    print("Attempting to import skl2onnx...")
    import skl2onnx
    print("Success importing skl2onnx!")
except Exception as e:
    print("Caught exception:", str(e))
    with open(r"l:\Vishakh_dutt_mishra\error.txt", "w") as f:
        traceback.print_exc(file=f)
    print("Traceback written to error.txt")
except BaseException as e:
    print("Caught BaseException:", str(e))
    with open(r"l:\Vishakh_dutt_mishra\error.txt", "w") as f:
        traceback.print_exc(file=f)
    print("BaseException Traceback written to error.txt")
