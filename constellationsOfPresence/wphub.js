let sun = []; 
let frameNum = 0;
let R;
let isMissed = false;
let tear;
let eye;
let orig;
let letter;
// navigation images replacing text labels
let navImages = []; // will hold Pic-01.png, Pic-02.png, Pic-03.png
let navLinks = ['Poster/index.html', 'RelationshipUniverse/index.html', 'Relationship/relationship.html']; // mapped to Pic-01, Pic-02, Pic-03
let navPositions = []; // {x, y, size, rotation, targetRotation}
let navPositionsInitialized = false;

function preload() {
  tear = loadImage("tear.gif");
  for(let i=0;i<19;i++){
  sun[i] = loadImage('assets/'+i+'.png')}
  // load navigation images
  navImages.push(loadImage('Pic-01.png'));
  navImages.push(loadImage('Pic-02.png'));
  navImages.push(loadImage('Pic-03.png'));
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

  // initialize random safe positions for navigation images once per page load (after R known)
  if(!navPositionsInitialized){
    navPositionsInitialized = true;
    navPositions = [];
    const imgSize = R; // match eye circle size
    
    // compute eye centers (matches openEye/eye.js pupil positions)
    const leftEyeX = width * 6/20;
    const rightEyeX = width * 14/20;
    const eyeY = height / 2;
    const safeRadius = R * 1.5; // avoid overlapping eye circles
    
    // generate random non-overlapping positions avoiding eyes
    for(let i = 0; i < 3; i++){
      let validPos = false;
      let x, y;
      let attempts = 0;
      
      while(!validPos && attempts < 100){
        attempts++;
        x = random(imgSize/2 + 20, width - imgSize/2 - 20);
        y = random(imgSize/2 + 20, height - imgSize/2 - 20);
        
        // check distance from left eye
        const distLeft = dist(x, y, leftEyeX, eyeY);
        // check distance from right eye
        const distRight = dist(x, y, rightEyeX, eyeY);
        // check distance from existing images
        let overlapping = false;
        for(let pos of navPositions){
          if(dist(x, y, pos.x, pos.y) < imgSize * 1.2){
            overlapping = true;
            break;
          }
        }
        
        if(distLeft > safeRadius && distRight > safeRadius && !overlapping){
          validPos = true;
        }
      }
      
      navPositions.push({
        x: x,
        y: y,
        size: imgSize,
        rotation: 0,
        targetRotation: 0
      });
    }
  }

  fill(225);

  push() ;

  fill(0);

  pop ();
  
  push();
  // draw navigation images with rotation on hover
  imageMode(CENTER);
  angleMode(RADIANS);
  
  let hovering = false;
  let hoverIndex = -1;
  
  // check which image is being hovered
  if(!isMissed){
    for(let i = 0; i < navPositions.length; i++){
      const pos = navPositions[i];
      const d = dist(mouseX, mouseY, pos.x, pos.y);
      if(d < pos.size / 2){
        hovering = true;
        hoverIndex = i;
        break;
      }
    }
  }
  
  // draw each navigation image
  for(let i = 0; i < navPositions.length; i++){
    const pos = navPositions[i];
    
    // update rotation (smooth rotation when hovering)
    if(hoverIndex === i){
      pos.targetRotation += 0.02; // slow continuous rotation on hover
    } else {
      // gradually return to 0 when not hovering
      pos.targetRotation = lerp(pos.targetRotation, 0, 0.1);
    }
    
    // smooth rotation interpolation
    pos.rotation = lerp(pos.rotation, pos.targetRotation, 0.15);
    
    push();
    translate(pos.x, pos.y);
    rotate(pos.rotation);
    image(navImages[i], 0, 0, pos.size, pos.size);
    pop();
  }
  
  // change cursor on hover
  if(hovering) cursor(HAND); else cursor(ARROW);
  
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
  // If user clicked on one of the navigation images, navigate to that page
  for(let i = 0; i < navPositions.length; i++){
    const pos = navPositions[i];
    const d = dist(mouseX, mouseY, pos.x, pos.y);
    if(d < pos.size / 2){
      // navigate relative to this page
      window.location.href = navLinks[i];
      return;
    }
  }

  // otherwise toggle missed/open eye state
  isMissed = !isMissed;
}



function windowResized(){
  resizeCanvas(windowWidth,windowHeight);
  // force navigation image positions to be recalculated for the new size
  navPositionsInitialized = false;
}