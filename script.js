// Get elements
const statusDiv = document.getElementById("status");

// Capture photo and location
async function handleCapture() {
  statusDiv.textContent = "Processing...";

  try {
    // Step 1: Get photo from camera
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.createElement("video");
    video.srcObject = stream;
    await video.play();

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/png");
    stream.getTracks().forEach(track => track.stop());

    // Step 2: Get location
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      // Reverse geocode (OpenCage or Google Maps API)
      const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=66e9e5abc32e4e67b1efbc368091ffa2`);
      const data = await response.json();
      const locationName = data.results[0].formatted;

      // Step 3: Send to "AI" (dummy logic for now)
      const isTrash = Math.random() < 0.5; // Dummy condition. Replace with real ML model later.

      statusDiv.textContent = isTrash
        ? `🚮 Trash Detected at ${locationName}`
        : `✅ Clean Area at ${locationName}`;
    });

  } catch (error) {
    console.error(error);
    statusDiv.textContent = "Failed to process.";
  }
}

document.getElementById("cameraBtn").addEventListener("click", handleCapture);
