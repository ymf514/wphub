// Universe background with sound-reactive stars
let stars = [];
let relFont; // project font for canvas text
let audioContext;
let analyser;
let microphone;
let dataArray;
let volume = 0;
let smoothVolume = 0;
let lowVolumeCounter = 0;
// Threshold for volume (normalized 0-1). Set to 0.05 for moderate sensitivity.
const LOW_VOLUME_THRESHOLD = 0.005; // normalized threshold (0-1)
const MID_VOLUME_THRESHOLD = 0.30; // Approximately 35 decibels threshold - extended range
const NUM_CENTERS = 1;
let micEnabled = false;
let micError = '';
let showDebugInfo = false; // Toggle for debug info display

// Gradient colors for animated background
let gradientColors = [
  [100, 114, 119],
  [115, 130, 136],
  [98, 97, 113],
  [46, 76, 123],
  [42, 46, 57],
  [25, 28, 41],
  [25, 28, 44],
  [25, 30, 45],
  [33, 37, 58],
  [33, 56, 109],
  [81, 83, 89],
  [100, 116, 121]
];
let gradientOffset = 0;

// Custom cursor rotation angle
let cursorRotation = 0;
// (no 3D cursor model or offscreen buffer needed)

function setup() {
  createCanvas(windowWidth, windowHeight);

  if(relFont) textFont(relFont);
  // Hide default cursor
  noCursor();

  // Generate random stars (small dots with low saturation, close to white)
  let numStars = int(width * height / 3000);
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      vx: 0,
      vy: 0,
      size: random(1, 3),
      brightness: random(200, 255),
      alpha: random(150, 255),
      scatterX: random(width),
      scatterY: random(height)
    });
  }

  noStroke();

  // Initialize microphone using native Web Audio API
  initMicrophone();

  // create a small offscreen WEBGL graphics buffer for rendering the 3D heart cursor
  try{
    // no offscreen buffer required for the 2D emoji cursor
  }catch(e){
    // nothing to do
  }
}
function preload(){
  // load the shared QWERTYpe font for canvas text
  relFont = loadFont('../Relationship/assets/QWERTYpe-1.ttf');
  // load heart model for cursor (from Poster assets)
}


async function initMicrophone() {
  try {
    // Create audio context
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      } 
    });
    
    console.log('Microphone stream obtained');
    
    // Create analyser
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    
    // Connect microphone to analyser
    microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    
    // Create data array for volume analysis
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    micEnabled = true;
    console.log('Microphone setup complete');
    
  } catch (err) {
    console.error('Microphone initialization error:', err);
    micError = 'Error: ' + err.message;
    micEnabled = false;
  }
}

function draw() {
  // Animated gradient background - cycle through colors
  drawGradientBackground();
  
  // Slowly animate the gradient (cycle through all colors over time)
  gradientOffset += 0.001;
  
  // Get audio input level using Web Audio API
  if (micEnabled && analyser) {
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate volume (RMS of frequency data)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    let average = sum / dataArray.length;
    
    // Normalize to 0-1 range (typical range is 0-255)
    volume = average / 255;
    
    // Apply smoothing
    smoothVolume = lerp(smoothVolume, volume, 0.1);
  }
  
  // Draw title at top center
  fill(255);
  noStroke();
  textAlign(CENTER, TOP);
  textSize(20);
  text('Gathering into galaxy', width / 2, 20);
  
  // Draw clickable hint below title
  textSize(7);
  fill(200);
  text('(click title to toggle debug info)', width / 2, 45);
  
  // Debug: Display detailed microphone status (only if showDebugInfo is true)
  if (showDebugInfo) {
    fill(255);
    textAlign(LEFT, TOP);
    textSize(14);
    
    if (!micEnabled) {
      text('⚠️ Microphone not enabled', 10, 90);
      text('Please allow microphone access', 10, 110);
      if (micError) {
        text(micError, 10, 130);
      }
      text('Click anywhere to retry', 10, 150);
    } else {
      text('🎤 Microphone: ACTIVE', 10, 90);
      text('Raw Volume: ' + nf(volume, 1, 6), 10, 110);
      text('Smooth Volume: ' + nf(smoothVolume, 1, 6), 10, 130);
      text('Threshold: ' + nf(LOW_VOLUME_THRESHOLD, 1, 3), 10, 150);
      text('Max gathering at: ' + nf(MID_VOLUME_THRESHOLD, 1, 3), 10, 170);
      
      if (smoothVolume > LOW_VOLUME_THRESHOLD) {
        fill(0, 255, 0);
        text('✓ GATHERING ACTIVE', 10, 190);
      } else {
        fill(255, 100, 100);
        text('✗ Below threshold - make louder sounds', 10, 190);
      }
    }
  }
  
  // Update center to follow mouse position
  let mouseCenter = {
    x: mouseX,
    y: mouseY
  };
  
  // Update star positions based on volume
  for (let i = 0; i < stars.length; i++) {
    let star = stars[i];
    
    if (smoothVolume > LOW_VOLUME_THRESHOLD) {
      // Volume above threshold: arrange in concentric circles around mouse
      // Calculate target position on a circle with increasing stars per ring
      
      // Determine which ring this star belongs to
      // Each outer ring has 30% more stars than the inner ring
      let ringIndex = 0;
      let starsAccumulated = 0;
      let baseStarsInFirstRing = 20; // Start with 20 stars in innermost ring
      
      // Calculate ring index based on cumulative star counts
      while (starsAccumulated + floor(baseStarsInFirstRing * pow(1.3, ringIndex)) <= i) {
        starsAccumulated += floor(baseStarsInFirstRing * pow(1.3, ringIndex));
        ringIndex++;
      }
      
      // Calculate position within this ring
      let starsInThisRing = floor(baseStarsInFirstRing * pow(1.3, ringIndex));
      let positionInRing = i - starsAccumulated;
      let angleStep = TWO_PI / starsInThisRing;
      let angle = positionInRing * angleStep;
      
      // Ring radius increases with ring index, scaled by volume
      // Larger base radius for more spread out circles
      let baseRadius = 80 + ringIndex * 60;
      // Higher volume = smaller radius = tighter gathering
      // Extended range to allow more volume variation to show
      let targetRadius = baseRadius * map(smoothVolume, LOW_VOLUME_THRESHOLD, MID_VOLUME_THRESHOLD, 1, 0.2);
      targetRadius = constrain(targetRadius, 20, baseRadius);
      
      // Target position on the circle
      let targetX = mouseCenter.x + cos(angle) * targetRadius;
      let targetY = mouseCenter.y + sin(angle) * targetRadius;
      
      // Move towards target position with reduced speed
      let tdx = targetX - star.x;
      let tdy = targetY - star.y;
      let targetDist = sqrt(tdx * tdx + tdy * tdy);
      
      if (targetDist > 1) {
        // Map volume to force - reduced for slower gathering
        let normalizedVolume = map(smoothVolume, LOW_VOLUME_THRESHOLD, MID_VOLUME_THRESHOLD, 0.1, 1);
        normalizedVolume = constrain(normalizedVolume, 0.1, 1);
        let easedVolume = pow(normalizedVolume, 0.7);
        
        // Further reduced force for even slower movement
        let force = easedVolume * 40;
        star.vx += (tdx / targetDist) * force * 0.01;
        star.vy += (tdy / targetDist) * force * 0.01;
      }
    } else {
      // Volume below threshold: gradually spread evenly across the page
      // Move towards the pre-assigned scattered position
      let tdx = star.scatterX - star.x;
      let tdy = star.scatterY - star.y;
      let targetDist = sqrt(tdx * tdx + tdy * tdy);
      
      if (targetDist > 1) {
        // Gentle force towards scattered position
        star.vx += (tdx / targetDist) * 0.5;
        star.vy += (tdy / targetDist) * 0.5;
      }
      
      // Occasionally reassign scatter position for natural distribution
      if (random() < 0.001) {
        star.scatterX = random(width);
        star.scatterY = random(height);
      }
    }
    
    // Apply velocity with stronger damping for slower movement
    star.x += star.vx * 0.5;
    star.y += star.vy * 0.5;
    star.vx *= 0.92;
    star.vy *= 0.92;
    
    // Wrap around edges
    if (star.x < 0) star.x = width;
    if (star.x > width) star.x = 0;
    if (star.y < 0) star.y = height;
    if (star.y > height) star.y = 0;
    
    // Draw star
    fill(star.brightness, star.brightness, star.brightness, star.alpha);
    circle(star.x, star.y, star.size);
  }
  
  // Draw custom cursor (sun triangles)
  drawCursor();
  
  // Optional: Draw centers for debugging (comment out if not needed)
  // for (let center of centers) {
  //   fill(255, 100, 100, 100);
  //   circle(center.x, center.y, 10);
  // }
}

// Allow user to click to retry microphone access or toggle debug info
function mousePressed() {
  // Check if click is on title area (top center region)
  if (mouseY < 75 && abs(mouseX - width / 2) < 200) {
    showDebugInfo = !showDebugInfo;
    return;
  }
  
  // Otherwise try to initialize microphone if not enabled
  if (!micEnabled) {
    initMicrophone();
  }
}

// Draw animated gradient background
function drawGradientBackground() {
  // Calculate current position in color cycle (0 to gradientColors.length)
  let scaledPosition = (gradientOffset * gradientColors.length) % gradientColors.length;
  
  // Find the two colors to interpolate between
  let colorIndex1 = floor(scaledPosition) % gradientColors.length;
  let colorIndex2 = (colorIndex1 + 1) % gradientColors.length;
  let lerpAmount = scaledPosition - floor(scaledPosition);
  
  // Interpolate between the two colors
  let c1 = gradientColors[colorIndex1];
  let c2 = gradientColors[colorIndex2];
  let r = lerp(c1[0], c2[0], lerpAmount);
  let g = lerp(c1[1], c2[1], lerpAmount);
  let b = lerp(c1[2], c2[2], lerpAmount);
  
  // Fill entire background with interpolated color
  background(r, g, b);
}

// Draw custom cursor using sunTris triangles
function drawCursor() {
  // Draw emoji heart as cursor using canvas text
  push();
  textAlign(CENTER, CENTER);
  // choose a size similar to previous cursor (approx 24-28)
  const emojiSize = max(20, floor(min(width, height) * 0.03));
  textSize(emojiSize);
  // prefer loaded project font if available (some systems render emoji better with system font)
  // Use a system heart glyph (monochrome) and ensure a font that can render it
  // Using '❤' (U+2764) avoids color emoji fallback and allows fill() to color it.
  // Temporarily set a generic emoji-capable font family so the glyph renders.
  try{
    textFont('Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, EmojiOne, sans-serif');
  }catch(e){ /* ignore if not supported */ }
  // draw heart glyph in red
  fill(220, 40, 40);
  noStroke();
  text('❤', mouseX, mouseY);
  pop();
}



function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Regenerate stars for new canvas size
  stars = [];
  let numStars = int(width * height / 3000);
  
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      vx: 0,
      vy: 0,
      size: random(1, 3),
      brightness: random(200, 255),
      alpha: random(150, 255),
      scatterX: random(width),
      scatterY: random(height)
    });
  }
}
