// Main Application Controller
class TrashVisionApp {
  constructor() {
      // DOM Elements
      this.video = document.getElementById('camera');
      this.captureBtn = document.getElementById('captureBtn');
      this.switchBtn = document.getElementById('switchBtn');
      this.flashBtn = document.getElementById('flashBtn');
      this.exportBtn = document.getElementById('exportBtn');
      this.statusText = document.getElementById('status');
      this.locationText = document.getElementById('location');
      this.timestampText = document.getElementById('timestamp');
      this.photosGrid = document.getElementById('photosGrid');
      this.photosCount = document.getElementById('photosCount');
      this.trashCount = document.getElementById('trashCount');
      this.cleanScore = document.getElementById('cleanScore');
      this.loadingModal = document.getElementById('loadingModal');
      this.loadingText = document.getElementById('loadingText');
      this.exportModal = document.getElementById('exportModal');
      this.closeExportModal = document.getElementById('closeExportModal');
      
      // App State
      this.currentStream = null;
      this.facingMode = "environment";
      this.flashActive = false;
      this.capturedPhotos = [];
      this.trashItems = 0;
      this.cleanAreas = 0;
      this.userLocation = null;
      
      // Initialize
      this.init();
  }
  
  async init() {
      this.setupEventListeners();
      await this.startCamera();
      this.setupServiceWorker();
      this.checkPWA();
      this.updateTimestamp();
      setInterval(() => this.updateTimestamp(), 60000); // Update every minute
      
      // Show welcome message
      this.showLoading("Initializing TrashVision AI");
      setTimeout(() => {
          this.hideLoading();
          this.showNotification("System ready. Start detecting trash!");
      }, 2000);
  }
  
  setupEventListeners() {
      // Camera Controls
      this.captureBtn.addEventListener('click', () => this.capturePhoto());
      this.switchBtn.addEventListener('click', () => this.switchCamera());
      this.flashBtn.addEventListener('click', () => this.toggleFlash());
      
      // Export Controls
      this.exportBtn.addEventListener('click', () => this.showExportModal());
      this.closeExportModal.addEventListener('click', () => this.hideExportModal());
      document.querySelectorAll('.export-option').forEach(btn => {
          btn.addEventListener('click', (e) => this.handleExport(e.target.dataset.type));
      });
      
      // PWA Installation
      window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault();
          this.deferredPrompt = e;
          document.getElementById('installBtn').style.display = 'block';
          document.getElementById('installBtn').addEventListener('click', () => {
              this.deferredPrompt.prompt();
              this.deferredPrompt.userChoice.then((choiceResult) => {
                  if (choiceResult.outcome === 'accepted') {
                      console.log('User accepted PWA install');
                  }
                  this.deferredPrompt = null;
              });
          });
      });
      
      // Online/Offline detection
      window.addEventListener('online', () => this.updateStatus('Online - System ready', 'ready'));
      window.addEventListener('offline', () => this.updateStatus('Offline - Limited functionality', 'error'));
  }
  
  // Camera Functions
  async startCamera() {
      this.updateStatus('Starting camera...', 'processing');
      this.captureBtn.disabled = true;
      this.switchBtn.disabled = true;
      
      try {
          this.stopStream();
          
          const constraints = {
              video: {
                  facingMode: this.facingMode,
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
              },
              audio: false
          };
          
          // Try to get the preferred camera first
          try {
              this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
          } catch (err) {
              console.warn("Preferred camera failed, trying any camera");
              constraints.video.facingMode = { ideal: 'user' };
              this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
          }
          
          this.video.srcObject = this.currentStream;
          this.updateStatus('Camera ready', 'ready');
          this.captureBtn.disabled = false;
          this.switchBtn.disabled = false;
          
          // Start AI analysis (simulated)
          this.simulateAIAnalysis();
          
          // Get location
          this.getLocation();
          
      } catch (err) {
          console.error("Camera error:", err);
          this.updateStatus(`Camera error: ${err.message}`, 'error');
          this.captureBtn.disabled = true;
          this.switchBtn.disabled = true;
      }
  }
  
  stopStream() {
      if (this.currentStream) {
          this.currentStream.getTracks().forEach(track => track.stop());
          this.currentStream = null;
      }
  }
  
  async switchCamera() {
      this.facingMode = this.facingMode === "user" ? "environment" : "user";
      await this.startCamera();
  }
  
  toggleFlash() {
      if (!this.currentStream) return;
      
      this.flashActive = !this.flashActive;
      this.flashBtn.classList.toggle('active', this.flashActive);
      
      // Simulate flash effect
      if (this.flashActive) {
          document.body.classList.add('flash-effect');
          setTimeout(() => document.body.classList.remove('flash-effect'), 300);
      }
  }
  
  // Photo Capture Functions
  async capturePhoto() {
      if (!this.currentStream) {
          this.showNotification("Camera not ready", "error");
          return;
      }
      
      // Disable button during capture
      this.captureBtn.disabled = true;
      this.updateStatus("Capturing photo...", "processing");
      
      try {
          // Ensure video is ready
          if (this.video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
              throw new Error("Video feed not ready");
          }
          
          // Create canvas for capture
          const canvas = document.createElement('canvas');
          canvas.width = this.video.videoWidth;
          canvas.height = this.video.videoHeight;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) throw new Error("Could not get canvas context");
          
          // Apply flash effect if active
          if (this.flashActive) {
              ctx.fillStyle = "white";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          // Capture image
          ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);
          
          // Apply visual effect to canvas
          this.applyCaptureEffect(ctx, canvas.width, canvas.height);
          
          // Get image data
          const imageDataURL = canvas.toDataURL('image/jpeg');
          
          // Create photo object
          const photo = {
              id: Date.now(),
              imageData: imageDataURL,
              timestamp: new Date(),
              location: this.userLocation,
              analysis: await this.analyzePhoto(canvas) // Simulated AI analysis
          };
          
          // Store photo
          this.capturedPhotos.unshift(photo);
          
          // Update UI
          this.addPhotoToGrid(photo);
          this.updateStats();
          
          this.updateStatus("Photo captured!", "ready");
          this.showNotification("Trash analysis complete");
          
          // Simulate saving to local storage
          this.saveToLocalStorage(photo);
          
      } catch (err) {
          console.error("Capture failed:", err);
          this.updateStatus(`Error: ${err.message}`, "error");
          this.showNotification("Capture failed", "error");
      } finally {
          this.captureBtn.disabled = false;
      }
  }
  
  applyCaptureEffect(ctx, width, height) {
      // Add subtle vignette effect
      const gradient = ctx.createRadialGradient(
          width/2, height/2, 0,
          width/2, height/2, Math.max(width, height)/2
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Add watermark
      ctx.font = "16px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.textAlign = "right";
      ctx.fillText("GC's TrashVision", width - 10, height - 10);
  }
  
  // Photo Analysis (Simulated AI)
  async analyzePhoto(canvas) {
      this.showLoading("Analyzing for trash...");
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
      
      // Random results for simulation
      const hasTrash = Math.random() > 0.3; // 70% chance of trash
      const trashTypes = ["plastic", "organic", "paper", "metal", "mixed"];
      const randomType = trashTypes[Math.floor(Math.random() * trashTypes.length)];
      
      // Update indicators
      this.updateAIIndicators(randomType);
      
      this.hideLoading();
      
      if (!hasTrash) {
          this.cleanAreas++;
          return {
              hasTrash: false,
              message: "No trash detected",
              type: null,
              confidence: (Math.random() * 30 + 70).toFixed(0) + "%"
          };
      }
      
      this.trashItems++;
      return {
          hasTrash: true,
          message: `Detected: ${randomType}`,
          type: randomType,
          confidence: (Math.random() * 30 + 70).toFixed(0) + "%"
      };
  }
  
  updateAIIndicators(type) {
      // Reset all indicators
      document.querySelectorAll('.indicator').forEach(ind => {
          ind.classList.remove('active', 'pulse');
      });
      
      if (!type) return;
      
      // Activate the relevant indicator
      const activeIndicator = document.querySelector(`.indicator.${type}`);
      if (activeIndicator) {
          activeIndicator.classList.add('active', 'pulse');
          setTimeout(() => activeIndicator.classList.remove('pulse'), 2000);
      }
  }
  
  // UI Functions
  addPhotoToGrid(photo) {
      const photoElement = document.createElement('div');
      photoElement.className = 'captured-photo';
      photoElement.innerHTML = `
          <img src="${photo.imageData}" alt="Captured photo">
          <div class="photo-info">
              <div>${photo.analysis.message}</div>
              <div>${photo.timestamp.toLocaleTimeString()}</div>
              ${photo.analysis.type ? 
                  `<div class="photo-type type-${photo.analysis.type}">${photo.analysis.type.toUpperCase()}</div>` : ''
              }
          </div>
      `;
      
      // Add click to enlarge
      photoElement.addEventListener('click', () => this.showPhotoModal(photo));
      
      this.photosGrid.prepend(photoElement);
  }
  
  updateStats() {
      this.photosCount.textContent = this.capturedPhotos.length;
      this.trashCount.textContent = this.trashItems;
      
      const total = this.trashItems + this.cleanAreas;
      const score = total > 0 ? Math.round((this.cleanAreas / total) * 100) : 100;
      this.cleanScore.textContent = `${score}%`;
      
      // Update clean score color
      if (score < 50) {
          this.cleanScore.style.color = 'var(--danger)';
      } else if (score < 80) {
          this.cleanScore.style.color = 'var(--accent)';
      } else {
          this.cleanScore.style.color = 'var(--primary)';
      }
  }
  
  updateStatus(text, status = 'ready') {
      this.statusText.textContent = text;
      this.statusText.className = status;
  }
  
  updateTimestamp() {
      this.timestampText.textContent = new Date().toLocaleString();
  }
  
  // Location Functions
  async getLocation() {
      if (!navigator.geolocation) {
          this.locationText.textContent = "Geolocation not supported";
          return;
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
          this.userLocation = { lat: latitude, lng: longitude };
          
          // Get human-readable address
          try {
              const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16`
              );
              
              if (!response.ok) throw new Error("Geocoding failed");
              
              const data = await response.json();
              this.locationText.textContent = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          } catch (err) {
              console.error("Geocoding error:", err);
              this.locationText.textContent = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          }
      } catch (err) {
          console.error("Geolocation error:", err);
          this.locationText.textContent = "Location detection failed";
      }
  }
  
  // Export Functions
  showExportModal() {
      this.exportModal.style.display = 'flex';
  }
  
  hideExportModal() {
      this.exportModal.style.display = 'none';
  }
  
  handleExport(type) {
      this.hideExportModal();
      
      switch (type) {
          case 'csv':
              this.exportCSV();
              break;
          case 'pdf':
              this.showNotification("PDF export would be generated here");
              break;
          case 'json':
              this.exportJSON();
              break;
      }
  }
  
  exportCSV() {
      if (this.capturedPhotos.length === 0) {
          this.showNotification("No data to export", "error");
          return;
      }
      
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "ID,Timestamp,Location,Trash Type,Confidence\n";
      
      this.capturedPhotos.forEach(photo => {
          const row = [
              photo.id,
              photo.timestamp.toISOString(),
              photo.location ? `${photo.location.lat},${photo.location.lng}` : "Unknown",
              photo.analysis.type || "None",
              photo.analysis.confidence || "N/A"
          ].join(",");
          
          csvContent += row + "\n";
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `trashvision_export_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.showNotification("CSV exported successfully");
  }
  
  exportJSON() {
      if (this.capturedPhotos.length === 0) {
          this.showNotification("No data to export", "error");
          return;
      }
      
      const exportData = {
          app: "TrashVision",
          version: "1.0",
          generatedAt: new Date().toISOString(),
          createdBy: "GC REDDY",
          photos: this.capturedPhotos.map(photo => ({
              id: photo.id,
              timestamp: photo.timestamp.toISOString(),
              location: photo.location,
              analysis: photo.analysis
          }))
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const link = document.createElement("a");
      link.setAttribute("href", dataUri);
      link.setAttribute("download", `trashvision_data_${new Date().toISOString()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.showNotification("JSON exported successfully");
  }
  
  // Helper Functions
  showLoading(text) {
      this.loadingText.textContent = text;
      this.loadingModal.style.display = 'flex';
  }
  
  hideLoading() {
      this.loadingModal.style.display = 'none';
  }
  
  showNotification(message, type = "success") {
      const notification = document.createElement('div');