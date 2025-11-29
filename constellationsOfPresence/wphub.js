let sun = []; 
let frameNum = 0;
let R;
let isMissed = false;
let tear;
let eye;
let orig;
let letter;
// labels for navigation
let hubLabels = ['Personal Emotion', 'Relational Time', 'Collective Presence'];
let hubLinks = ['Poster/index.html', 'Relationship/relationship.html', 'RelationshipUniverse/index.html'];
let hubBoxes = []; // clickable bounding boxes computed each frame
let hubPositionsInitialized = false;
let hubPositions = []; // {x,y,box}

function preload() {
  tear = loadImage("tear.gif");
  for(let i=0;i<19;i++){
  sun[i] = loadImage('assets/'+i+'.png')}
  // use central QWERTYpe font from Relationship assets
  letter = loadFont('Relationship/assets/QWERTYpe-1.ttf');
}

function setup() {

  createCanvas(windowWidth, windowHeight);
  frameRate (80);
  eye = new closedEye(width,height);
  orig = new openEye(width,height);
}

function draw() {
  push();
  let howLong = mouseX/width;
  background(0, 0 , 0);

  //frameNum = round(map(mouseX, 0, width, 0,11, true));
      
 if (frameCount%10==0&&isMissed == false){
   if(frameNum<18){
     frameNum++;
    }else{
    frameNum = 0;
      }
  }
  console.log(frameNum);

  imageMode(CENTER);
  image(sun[frameNum], width/2, height/2);
  pop ();
  
  //eye
  strokeWeight(10);
 
  if(width<height){
    R=width/8;
  }else{R =height/8;}

  // initialize random safe positions for hub labels once per page load (after R known)
  if(!hubPositionsInitialized){
    hubPositionsInitialized = true;
    hubPositions = [];
    // deterministic positions: left above left eye, right above right eye, middle centered near bottom
    textFont(letter);
    const labelSize = floor(width/50); // half previous size
    textSize(labelSize);
    const padding = 12;

    // compute eye centers (matches openEye/eye.js pupil positions)
    const leftEyeX = width * 6/20;
    const rightEyeX = width * 14/20;
    const eyeY = height / 2;
    // vertical offset above the eye = 1/8 width
    const aboveOffset = width / 8;

    // left label
    {
      const lab = hubLabels[0];
      const tw = textWidth(lab);
      let x = leftEyeX;
      let y = eyeY - aboveOffset;
      // clamp inside canvas
      x = constrain(x, tw/2 + padding, width - tw/2 - padding);
      y = constrain(y, labelSize/2 + padding, height - labelSize/2 - padding);
      const box = { x1: x - tw/2 - padding, x2: x + tw/2 + padding, y1: y - labelSize/2 - padding, y2: y + labelSize/2 + padding };
      hubPositions.push({x,y,box,lab});
    }

    // middle label (centered, distance 1/5 height from bottom)
    {
      const lab = hubLabels[1];
      const tw = textWidth(lab);
      const x = width/2;
      const y = height - height/5;
      const bx = { x1: x - tw/2 - padding, x2: x + tw/2 + padding, y1: y - labelSize/2 - padding, y2: y + labelSize/2 + padding };
      hubPositions.push({x,y,box:bx,lab});
    }

    // right label
    {
      const lab = hubLabels[2];
      const tw = textWidth(lab);
      let x = rightEyeX;
      let y = eyeY - aboveOffset;
      x = constrain(x, tw/2 + padding, width - tw/2 - padding);
      y = constrain(y, labelSize/2 + padding, height - labelSize/2 - padding);
      const box = { x1: x - tw/2 - padding, x2: x + tw/2 + padding, y1: y - labelSize/2 - padding, y2: y + labelSize/2 + padding };
      hubPositions.push({x,y,box,lab});
    }
  }

  fill(225);

  push() ;

  fill(0);

  pop ();
  
  push();
  // draw navigation labels from precomputed safe positions
  textFont(letter);
  textAlign(CENTER, CENTER);
  const labelSize = floor(width/50); // half the previous size
  textSize(labelSize);
  fill(225);
  hubBoxes = [];
  const padding = 12;
  for(let i=0;i<hubPositions.length;i++){
    const p = hubPositions[i];
    const lab = p.lab;
    const x = p.x;
    const y = p.y;
    text(lab, x, y);
    // recompute textWidth in case of DPI changes
    const tw = textWidth(lab);
    const box = { x1: x - tw/2 - padding, x2: x + tw/2 + padding, y1: y - labelSize/2 - padding, y2: y + labelSize/2 + padding };
    hubBoxes.push(box);
  }
  // hover: change cursor if over a label and not in missed state
  let hovering = false;
  if(!isMissed){
    for(let b of hubBoxes){
      if(mouseX >= b.x1 && mouseX <= b.x2 && mouseY >= b.y1 && mouseY <= b.y2){
        hovering = true; break;
      }
    }
    if(hovering) cursor(HAND); else cursor(ARROW);
  }
  pop();
  
  //open
  if (!isMissed) {
    orig.show();
    cursor(ARROW);
  } else {
    eye.show();
    
    push();
    textFont(letter);
    textAlign(CENTER);
    fill(225);
    textSize(width/25);
    //text("Still.",width/2,height/10+width/25);
    pop();
    
    push();
    noCursor();
    imageMode(CENTER);
    image(
    tear,
    mouseX,
    mouseY,
    tear.width/2,
    tear.height/2 
  );
  pop();
  }
  
}


function mousePressed() {
  // If user clicked on one of the hub labels, navigate to that page
  for(let i=0;i<hubBoxes.length;i++){
    const b = hubBoxes[i];
    if(mouseX >= b.x1 && mouseX <= b.x2 && mouseY >= b.y1 && mouseY <= b.y2){
      // navigate relative to this page
      window.location.href = hubLinks[i];
      return;
    }
  }

  // otherwise toggle missed/open eye state
  isMissed = !isMissed;
}



function windowResized(){
  resizeCanvas(windowWidth,windowHeight);
  // force hub label positions to be recalculated for the new size
  hubPositionsInitialized = false;
}