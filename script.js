const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const status = document.getElementById('status');
const captureBtn = document.getElementById('capture');

// Start camera
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => {
    alert("Camera not working: " + err);
  });

captureBtn.addEventListener('click', async () => {
  // Capture image
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const image = canvas.toDataURL('image/png');

  // Get location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      // Fake detection (you can replace with real model later)
      const types = ["Wet Waste", "Dry Waste", "Mixed Waste"];
      const detected = types[Math.floor(Math.random() * types.length)];

      // Show message
      status.innerText = `Trash detected: ${detected}\nLocation: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;

      // Here you would send image + location + detection to your server or Firebase
      console.log({ image, lat, lon, detected });
    });
  } else {
    status.innerText = "Location not supported.";
  }
});
