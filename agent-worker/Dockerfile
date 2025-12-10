# Use a lightweight Python image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the worker code
COPY . .

# Run the worker with unbuffered output (so you see logs in Railway)
CMD ["python", "-u", "worker.py"]

