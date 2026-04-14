FROM python:3.10-slim

# Install git-lfs and other basic dependencies
RUN apt-get update && apt-get install -y \
    git \
    git-lfs \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*
RUN git lfs install

# Define the working directory
WORKDIR /app

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Copy the requirements file into the container
COPY Backend/requirements.txt .

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# --- SPEED OPTIMIZATION ---
# Pre-download the HuggingFace BAAI/bge-m3 model during the build phase
# so the container doesn't hang at initialization on cold starts.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-m3')"

# Create a writable directory for sqlite database and persistent storage if HuggingFace volume is attached
RUN mkdir -p /data
ENV DB_PATH=/data/local_datbase.db

# Copy the rest of the application files
COPY Backend/ ./Backend/

# Set working directory to Backend where main.py lives
WORKDIR /app/Backend

# Expose the API port
EXPOSE 7860

# Command to run the application using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
