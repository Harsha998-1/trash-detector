document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const video = document.getElementById('camera');
  const preview = document.getElementById('preview');
  const statusText = document.getElementById('status');
  const locationText = document.getElementById('location');
  const timestampText = document.getElementById('timestamp');
  const captureBtn = document.getElementById('captureBtn');
  const switchBtn = document.getElementById('switchBtn');
  const previewContainer = document.querySelector('.preview-container');

  // App state
  let currentStream = null;
  let facingMode = "environment"; // Default to rear camera
  let capturedPhoto = null;

  // Initialize the app
  init();

  function init() {
      setupEventListeners();
      startCamera();
  }

  function setupEventListeners() {
      captureBtn.addEventListener('click', capturePhoto);
      switchBtn.addEventListener('click', switchCamera);
  }

  // Camera functions
  async function startCamera() {
      statusText.textContent = "Initializing camera...";
      statusText.className = "";
      captureBtn.disabled = true;
      switchBtn.disabled = true;

      try {
          stopStream();
          
          const constraints = {
              video: {
                  facingMode: facingMode,
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
              },
              audio: false
          };

          currentStream = await navigator.mediaDevices.getUserMedia(constraints);
          video.srcObject = currentStream;

          statusText.textContent = "Camera ready";
          captureBtn.disabled = false;
          switchBtn.disabled = false;
      } catch (err) {
          console.error("Camera error:", err);
          statusText.textContent = "Camera error: " + err.message;
          statusText.className = "error";
          captureBtn.disabled = true;
          switchBtn.disabled = true;
      }
  }

  function stopStream() {
      if (currentStream) {
          currentStream.getTracks().forEach(track => track.stop());
          currentStream = null;
      }
  }

  async function switchCamera() {
      facingMode = facingMode === "user" ? "environment" : "user";
      await startCamera();
  }

  // Photo capture functions
  async function capturePhoto() {
      if (!currentStream) return;

      // Disable buttons during capture
      captureBtn.disabled = true;
      switchBtn.disabled = true;
      statusText.textContent = "Capturing photo...";
      statusText.className = "";

      try {
          // Capture image from video stream
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Store the captured photo
          capturedPhoto = canvas.toDataURL('image/jpeg');
          preview.src = capturedPhoto;

          // Show preview and hide camera
          video.style.display = 'none';
          previewContainer.style.display = 'block';

          // Process the photo
          await processPhoto();
      } catch (err) {
          console.error("Capture error:", err);
          statusText.textContent = "Error capturing photo";
          statusText.className = "error";
          captureBtn.disabled = false;
          switchBtn.disabled = false;
      }
  }

  async function processPhoto() {
      statusText.textContent = "Analyzing image...";
      
      try {
          // Get location first
          const location = await getLocationName();
          locationText.textContent = location || "Location not available";

          // Set timestamp
          const now = new Date();
          timestampText.textContent = now.toLocaleString();

          // Simulate trash detection (replace with actual API call)
          const detectionResult = await detectTrash(capturedPhoto);
          
          statusText.textContent = detectionResult.message;
          statusText.className = detectionResult.status;
      } catch (err) {
          console.error("Processing error:", err);
          statusText.textContent = "Error processing image";
          statusText.className = "error";
      } finally {
          captureBtn.disabled = false;
          switchBtn.disabled = false;
      }
  }

  // Trash detection simulation (replace with real API call)
  async function detectTrash(imageData) {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate different detection results
      const random = Math.random();
      
      if (random < 0.2) {
          return {
              status: "success",
              message: "No trash detected. Area is clean!"
          };
      } else if (random < 0.5) {
          return {
              status: "warning",
              message: "Small amount of trash detected"
          };
      } else {
          const trashTypes = ["Plastic waste", "Organic waste", "Paper waste", "Metal waste", "Mixed waste"];
          const randomType = trashTypes[Math.floor(Math.random() * trashTypes.length)];
          
          return {
              status: "error",
              message: `Trash detected: ${randomType}`
          };
      }
  }

  // Location functions
  async function getLocationName() {
      if (!navigator.geolocation) {
          return "Geolocation not supported";
      }

      try {
          const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: true,
                  timeout: 10000,
                  maximumAge: 0
              });
          });

          const { latitude, longitude } = position.coords;
          
          // Try to get human-readable address
          try {
              const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16`
              );
              
              if (!response.ok) throw new Error("Geocoding failed");
              
              const data = await response.json();
              return data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          } catch (err) {
              console.error("Geocoding error:", err);
              return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          }
      } catch (err) {
          console.error("Geolocation error:", err);
          return "Location detection failed";
      }
  }

  // Reset function (could be added to a reset button)
  function resetCamera() {
      video.style.display = 'block';
      previewContainer.style.display = 'none';
      statusText.textContent = "Camera ready";
      statusText.className = "";
      locationText.textContent = "Not detected";
      timestampText.textContent = "-";
  }
});