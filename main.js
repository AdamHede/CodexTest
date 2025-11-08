const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");

function resizeCanvas() {
  const scale = window.devicePixelRatio || 1;
  const { width, height } = canvas;
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.scale(scale, scale);
}

function drawGreeting() {
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#8a9bff");
  gradient.addColorStop(1, "#5d7cff");

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(10, 14, 24, 0.85)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = gradient;
  context.font = "bold 48px 'Segoe UI', Tahoma, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("Hello, world!", canvas.width / 2, canvas.height / 2 - 20);

  context.font = "24px 'Segoe UI', Tahoma, sans-serif";
  context.fillStyle = "rgba(240, 243, 255, 0.9)";
  context.fillText("Your interactive adventure starts here.", canvas.width / 2, canvas.height / 2 + 28);
}

resizeCanvas();
drawGreeting();

window.addEventListener("resize", () => {
  context.setTransform(1, 0, 0, 1, 0, 0);
  resizeCanvas();
  drawGreeting();
});
