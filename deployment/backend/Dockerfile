# Use the specified base image
#FROM runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04
FROM pytorch/pytorch:2.2.1-cuda12.1-cudnn8-devel

# Set the working directory


# Set the working directory
WORKDIR /app

# Install the Python packages from the requirements.txt file
# Note: We assume the requirements.txt file will be available in the mounted volume
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r /app/requirements.txt

# Expose the port 8008
EXPOSE 8008

# The actual application code will be mounted as a volume at runtime
VOLUME /app

# Set environment variables to ensure GPU access
#ENV NVIDIA_VISIBLE_DEVICES all
#ENV NVIDIA_DRIVER_CAPABILITIES compute,utility

# Run the application
#CMD ["uvicorn", "rag_api.main:app", "--host", "0.0.0.0", "--port", "8008"]
#CMD ["python", "./src/main.py"]
