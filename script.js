document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const video = document.getElementById('camera');
    const captureBtn = document.getElementById('captureBtn');
    const switchBtn = document.getElementById('switchBtn');
    const statusText = document.getElementById('status');
    const locationText = document.getElementById('location');
    const timestampText = document.getElementById('timestamp');
    const photosGrid = document.getElementById('photosGrid');

    // App state
    let currentStream = null;
    let facingMode = "environment"; // Default to rear camera

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

            statusText.textContent = "Camera ready - Tap Capture Photo";
            statusText.className = "success";
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

            // Get the image data
            const imageDataURL = canvas.toDataURL('image/jpeg');
            
            // Process the photo (get location and detection)
            const result = await processPhoto(imageDataURL);
            
            // Add the photo to the grid
            addPhotoToGrid(imageDataURL, result);
            
            // Re-enable buttons
            captureBtn.disabled = false;
            switchBtn.disabled = false;
            statusText.textContent = "Photo captured! Ready for next capture";
            statusText.className = "success";
        } catch (err) {
            console.error("Capture error:", err);
            statusText.textContent = "Error capturing photo";
            statusText.className = "error";
            captureBtn.disabled = false;
            switchBtn.disabled = false;
        }
    }

    async function processPhoto(imageDataURL) {
        const result = {
            location: "Detecting...",
            timestamp: new Date().toLocaleString(),
            detection: "Analyzing..."
        };

        try {
            // Get location
            result.location = await getLocationName() || "Location not available";
            
            // Simulate trash detection
            const detectionResult = await detectTrash(imageDataURL);
            result.detection = detectionResult.message;
            result.status = detectionResult.status;
        } catch (err) {
            console.error("Processing error:", err);
            result.detection = "Analysis failed";
            result.status = "error";
        }

        return result;
    }

    function addPhotoToGrid(imageDataURL, photoInfo) {
        const photoElement = document.createElement('div');
        photoElement.className = 'captured-photo';
        
        photoElement.innerHTML = `
            <img src="${imageDataURL}" alt="Captured photo">
            <div class="photo-info">
                <div>${photoInfo.detection}</div>
                <div>${photoInfo.location}</div>
                <div>${photoInfo.timestamp}</div>
            </div>
        `;
        
        photosGrid.insertBefore(photoElement, photosGrid.firstChild);
    }

    // Trash detection simulation
    async function detectTrash(imageData) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simulate different detection results
        const random = Math.random();
        
        if (random < 0.2) {
            return {
                status: "success",
                message: "Clean - No trash"
            };
        } else if (random < 0.5) {
            return {
                status: "warning",
                message: "Small trash detected"
            };
        } else {
            const trashTypes = ["Plastic", "Organic", "Paper", "Metal", "Mixed"];
            const randomType = trashTypes[Math.floor(Math.random() * trashTypes.length)];
            
            return {
                status: "error",
                message: `Trash: ${randomType}`
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
});