import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

// Initialize GSAP timeline
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".timeline-container",
    pin: true,
    scrub: 1,
    end: "+=800%",
    snap: {
      snapTo: 1 / 8,
      duration: { min: 0.2, max: 0.6 },
      delay: 0.2,
    },
  },
});

// Animate each scene
document.querySelectorAll(".timeline-scene").forEach((scene, index) => {
  tl.from(
    scene,
    {
      opacity: 0,
      scale: 0.9,
      duration: 0.5,
    },
    index * 0.1,
  );
});

// Play/pause buttons
document.getElementById("playBtn").addEventListener("click", () => {
  tl.play();
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  tl.pause();
});

// Scene navigation buttons
document.querySelectorAll(".scene-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const sceneIndex = parseInt(btn.getAttribute("data-scene"));
    tl.scrollTrigger.scroll(sceneIndex / 8);

    // Update active button
    document.querySelectorAll(".scene-btn").forEach((b) => {
      b.classList.remove("opacity-100");
      b.classList.add("opacity-50");
    });
    btn.classList.remove("opacity-50");
    btn.classList.add("opacity-100");
  });
});

// Update active button on scroll
ScrollTrigger.addEventListener("scrollEnd", () => {
  const progress = tl.scrollTrigger.progress;
  const activeScene = Math.round(progress * 8);

  document.querySelectorAll(".scene-btn").forEach((btn, index) => {
    if (index === activeScene) {
      btn.classList.remove("opacity-50");
      btn.classList.add("opacity-100");
    } else {
      btn.classList.remove("opacity-100");
      btn.classList.add("opacity-50");
    }
  });
});

// Download button functionality
document.getElementById("downloadBtn").addEventListener("click", function () {
  // Create confetti effect
  createConfetti();

  // Get the HTML content
  const htmlContent = document.documentElement.outerHTML;

  // Create a Blob with the HTML content
  const blob = new Blob([htmlContent], { type: "text/html" });

  // Create a download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "CODE_Smart_Campus_Project.html";

  // Trigger the download
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
});

// Confetti animation function
function createConfetti() {
  const colors = ["#64ffda", "#ff647f", "#647fff", "#ffcb64"];

  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.left = Math.random() * 100 + "vw";
    confetti.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    confetti.style.width = Math.random() * 10 + 5 + "px";
    confetti.style.height = Math.random() * 10 + 5 + "px";
    confetti.style.opacity = "1";

    // Random animation duration and delay
    const duration = Math.random() * 3 + 2;
    const delay = Math.random() * 2;

    confetti.style.animation = `confetti-fall ${duration}s ease-in ${delay}s forwards`;

    document.body.appendChild(confetti);

    // Remove confetti after animation
    setTimeout(
      () => {
        confetti.remove();
      },
      (duration + delay) * 1000,
    );
  }
}

// Animate confetti in final scene
ScrollTrigger.create({
  trigger: "#scene8",
  start: "top center",
  onEnter: () => {
    createConfetti();
  },
  once: true,
});
