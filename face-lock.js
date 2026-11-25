const camera = document.getElementById("camera");
const statusText = document.getElementById("status");
const startButton = document.getElementById("startCamera");
const continueButton = document.getElementById("continueBtn");
let cameraStream = null;

startButton.addEventListener("click", async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    statusText.textContent = "Camera is unavailable. Use HTTPS or localhost, or continue in demo mode.";
    continueButton.disabled = false;
    return;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });
    camera.srcObject = cameraStream;
    statusText.textContent = "Camera enabled. This is a demo preview, not real face recognition.";
    continueButton.disabled = false;
    startButton.textContent = "Camera Enabled ✓";
  } catch (error) {
    statusText.textContent = "Camera permission was not granted. You can still continue in demo mode.";
    continueButton.disabled = false;
  }
});

continueButton.addEventListener("click", () => {
  if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
  window.location.href = "home.html";
});

window.addEventListener("beforeunload", () => {
  if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
});
