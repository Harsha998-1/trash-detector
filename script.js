// === Full Updated script.js with Google Sheet Integration ===
const video = document.getElementById('camera');
const preview = document.getElementById('preview');
const statusText = document.getElementById('status');
const locationText = document.getElementById('location');
const captureBtn = document.getElementById('captureBtn');

let currentStream = null;

function stopStream() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
}

async function startCamera() {
  stopStream();
  statusText.textContent = "Requesting camera access...";
  try {
    currentStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } },
      audio: false
    });
  } catch (e) {
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

  const trashResult = await fakeTrashDetection(imageDataURL);
  statusText.textContent = trashResult;

  locationText.textContent = "Detecting location...";
  const loc = await getLocationName();
  if (loc) {
    locationText.textContent = "Location: " + loc;
  } else {
    locationText.textContent = "Location not available";
  }

  captureBtn.disabled = false;

  // Send to Google Sheet via Apps Script
  await uploadToSheet(imageDataURL, loc || "Not available");
}

async function fakeTrashDetection(imageBase64) {
  await new Promise(r => setTimeout(r, 2000));
  const detected = Math.random() > 0.3;
  if (!detected) return "No trash detected. Clean and clear!";
  const types = ["Wet Waste", "Dry Waste", "Mixed Waste"];
  const type = types[Math.floor(Math.random() * types.length)];
  return `Trash detected: ${type}`;
}

async function getLocationName() {
  if (!navigator.geolocation) return null;
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
    });
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    const response = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!response.ok) return null;
    const data = await response.json();
    return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch (error) {
    return null;
  }
}

// ✅ NEW FUNCTION TO SEND TO YOUR GOOGLE SHEET
async function uploadToSheet(image, location) {
  const response = await fetch("https://script.google.com/macros/s/AKfycbyX3ukeWY2KqXe7NeeRUb8f05BdOwuJcvgZn5qDnBqzWhs_gAv6TpqQhduTmH8pqXBCaw/exec", {
    method: "POST",
    body: JSON.stringify({
      image: image,
      location: location
    }),
    headers: {
      "Content-Type": "application/json"
    }
  });

  const result = await response.text();
  console.log("Upload result:", result);
  statusText.textContent += " | Report saved.";
}
