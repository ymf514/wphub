let heart;
let backgroundVideo1, backgroundVideo2;
let playing = true;
let font1, font2;

function preload() {
  // Use a relative path (no leading slash) and correct filename casing
  // The OBJ in the project is named `Heart.obj` inside the `assets` folder.
  heart = loadModel('assets/Heart.obj');
  //backgroundVideo = loadVideo('assets/昼夜更替.mp4');
  // load the project-wide QWERTYpe font instead of local poster fonts
  font1 = loadFont('../Relationship/assets/QWERTYpe-1.ttf');
  font2 = font1;
}

function setup() {
   createCanvas(windowWidth, windowHeight, WEBGL);
   //noCanvas();
   //angleMode(DEGREES);
    //noStroke();
    normalMaterial();
  // Debug: confirm model object exists after preload
  console.log('heart model:', heart);
  imageMode(CENTER);
  // Create and configure videos here (safer for autoplay and element attributes)
  backgroundVideo1 = createVideo('assets/昼夜更替.mp4');
  backgroundVideo1.hide();
  // mute the video so browsers allow autoplay
  try{ backgroundVideo1.elt.muted = true; }catch(e){}
  backgroundVideo1.volume(0);
  backgroundVideo1.attribute('playsinline', '');
  backgroundVideo1.loop();
  // ensure playback starts (muted autoplay is generally allowed)
  try{ backgroundVideo1.play(); }catch(e){ console.warn('video play prevented by browser:', e); }

  backgroundVideo2 = createVideo('assets/昼夜更替.mp4');
  backgroundVideo2.hide();
  try{ backgroundVideo2.elt.muted = true; }catch(e){}
  backgroundVideo2.volume(0);
  backgroundVideo2.attribute('playsinline', '');
  backgroundVideo2.loop();
  try{ backgroundVideo2.play(); }catch(e){ /* may require user gesture */ }

  // Attempt to start playback (may still require user gesture in some browsers)
  try{ backgroundVideo1.play(); }catch(e){}
  try{ backgroundVideo2.play(); }catch(e){}
  // debug info about loaded assets
  console.log('heart model (preload):', heart);
  console.log('backgroundVideo1 element:', backgroundVideo1 ? backgroundVideo1.elt : null);
  console.log('backgroundVideo2 element:', backgroundVideo2 ? backgroundVideo2.elt : null);
  window._posterDebugLastLog = 0;
}

function draw() {
    //background(backgroundVideo,150);
    background(0);
    //panorama(backgroundVideo);
  //background(0);
  // back video
  push();
  translate(0, 0, -1);   // 放到前方
  // Only use the video as a texture when it has loaded enough data
  if(backgroundVideo1 && backgroundVideo1.elt && backgroundVideo1.elt.readyState >= 2){
    texture(backgroundVideo1);
  } else {
    // fallback fill so canvas is visible even if video hasn't started
    noStroke();
    fill(30);
  }
  plane(windowWidth-100, windowHeight-100);
  
     // back text
  push();
  rotateY(PI); 
  translate(0, 0, 200);
  fill(255);
  textAlign(CENTER, CENTER);
  textFont(font1);
  textSize(50);
  text("STILL", 0, 0);
  pop();

  pop();



  // front video
  push();
  translate(0, 0, 1);   
  rotateY(PI);           
  if(backgroundVideo2 && backgroundVideo2.elt && backgroundVideo2.elt.readyState >= 2){
    texture(backgroundVideo2);
  } else {
    noStroke();
    fill(40);
  }
  plane(windowWidth-100, windowHeight-100);
  pop();
 
  // front text
  push();
  //rotateY(PI); 
  translate(0, 0, 200);
  fill(255);
  textAlign(CENTER, CENTER);
  textFont(font1);
  textSize(50);
  text("PULSE", 0, 0);
  pop();

  orbitControl();


  // Lover
 push();
  translate(0, 0, 170);
  rotateY(HALF_PI);
  rotateX(PI);
  // add simple lighting so the model is visible
  ambientLight(80);
  directionalLight(200,200,200, 0.5, 0.5, -1);
  // scale model to reasonable size relative to window
  const s = min(width, height) / 700.0;
  scale(s);
if (playing) {
  let beat = 1 + 0.1 * sin(frameCount * 0.2); 
  // 1 = 基础大小，0.1 = 放大缩小幅度，0.2 = 心跳速度（调快/慢可改变心率）
  fill(240,0,0);
  scale(beat);
}else{
  fill(100,100,100);
  // --- IGNORE ---
  //  scale(beat); --- IGNORE ---
  //} --- IGNORE ---
}
  //rotateZ(frameCount * 0.1);
  //rotateWithFrameCount();

  //fill(240,0,0);
  //rotateZ(0);
  model(heart);
  pop(); 

  //notice
  push();
  //noCursor();
  textSize(75);
  fill(255);
  let mx = mouseX - width / 2;
  let my = mouseY - height / 2;
  text("💧", mx, my);
  pop();

  // occasional debug logs to help diagnose readiness
  if(frameCount - (window._posterDebugLastLog || 0) > 120){
    window._posterDebugLastLog = frameCount;
    try{
      const s1 = backgroundVideo1 && backgroundVideo1.elt ? backgroundVideo1.elt.readyState : 'no-elt';
      const s2 = backgroundVideo2 && backgroundVideo2.elt ? backgroundVideo2.elt.readyState : 'no-elt';
      console.log('poster debug readyState -> video1:', s1, 'video2:', s2, 'playing?', playing);
    }catch(e){console.warn('debug log failed', e)}
  }
}

function rotateWithFrameCount() {
   rotateZ(frameCount*0.1);
  rotateX(frameCount*0.1);
}

function mousePressed() {
  // When the canvas is clicked, check to see if the videos are
  // paused or playing. If they are playing, pause the videos.
  if (playing) {
    backgroundVideo2.pause();
  } else {
    backgroundVideo2.loop();
  }
  // Change the playing value to the opposite boolean.
  playing = !playing;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}