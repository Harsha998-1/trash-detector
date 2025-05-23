const video = document.getElementById('camera');
const preview = document.getElementById('preview');
const statusText = document.getElementById('status');

// Try to access back camera (environment facing)
navigator.mediaDevices.getUserMedia({
  video: { facingMode: { exact: "environment" } },
  audio: false
})
.then(stream => {
  video.srcObject = stream;
})
.catch(err => {
  // Fallback: if exact back camera not available, try any camera
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      video.srcObject = stream;
      statusText.textContent = "Using default camera.";
    })
    .catch(err => {
      statusText.textContent = "Camera error: " + err.message;
    });
});

// Capture photo from video and show preview
function capturePhoto() {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageDataURL = canvas.toDataURL('image/jpeg');
  preview.src = imageDataURL;
  preview.style.display = 'block';

  statusText.textContent = "Photo captured. Ready for trash classification.";
  
  // Here you can call your AI trash detection function with the imageDataURL
}
