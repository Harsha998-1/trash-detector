const video = document.getElementById('camera');
const preview = document.getElementById('preview');
const statusText = document.getElementById('status');
const locationText = document.getElementById('location');
const captureBtn = document.getElementById('captureBtn');

let currentStream = null;

// Function to stop all tracks of a stream (cleanup)
function stopStream() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
}

// Try to get back camera first, fallback to default
async function startCamera() {
  stopStream();
  statusText.textContent = "Requesting camera access...";
  try {
    currentStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } },
      audio: false
    });
  } catch (e) {
    // Fallback to any camera
    try {
      currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      statusText.textContent = "Back camera not found, using default camera.";
    } catch (err) {
      statusText.textContent = "Camera error: " + err.message;
      captureBtn.disabled = true;
      return;
    }
  }
  video.srcObject = currentStream;
  statusText.textContent = "Camera ready. You can capture a photo.";
  captureBtn.disabled = false;
}

startCamera();

// Capture photo and show preview
async function capturePhoto() {
  if (!currentStream) return;
  statusText.textContent = "Capturing photo...";

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageDataURL = canvas.toDataURL('image/jpeg');
  preview.src = imageDataURL;
  preview.style.display = 'block';

  statusText.textContent = "Photo captured, analyzing trash...";
  captureBtn.disabled = true;

  // Simulate trash detection AI call with fake function (replace with real AI call)
  const trashResult = await fakeTrashDetection(imageDataURL);

  statusText.textContent = trashResult;

  // Get location name
  locationText.textContent = "Detecting location...";
  const loc = await getLocationName();
  if (loc) {
    locationText.textContent = "Location: " + loc;
  } else {
    locationText.textContent = "Location not available";
  }
  captureBtn.disabled = false;

  // Here you can send imageDataURL + location + result to your backend/admin dashboard
}

// Dummy fake trash detection function (simulate AI)
// You should replace this with your actual model API call
async function fakeTrashDetection(imageBase64) {
  // Wait 2 seconds to simulate processing
  await new Promise(r => setTimeout(r, 2000));
  
  // Randomly decide trash/no-trash for demo (replace logic)
  const detected = Math.random() > 0.3; // 70% chance trash detected
  if (!detected) return "No trash detected. Clean and clear!";
  
  // Random trash types
  const types = ["Wet Waste", "Dry Waste", "Mixed Waste"];
  const type = types[Math.floor(Math.random() * types.length)];
  return `Trash detected: ${type}`;
}

// Get user's location coordinates and convert to human-readable place name
async function getLocationName() {
  if (!navigator.geolocation) {
    return null;
  }
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {timeout: 10000});
    });
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    // Use free OpenStreetMap Nominatim API for reverse geocoding
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

    const response = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!response.ok) return null;

    const data = await response.json();

    // Return display_name or city/village/town etc
    return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch (error) {
    return null;
  }
}
