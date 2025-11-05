let penColors = ["white", "red", "orange", "yellow", "green", "blue", "purple", "black"]
let win = false;

function preload() {
  bg = loadImage('assets/EcceHomoFlaking.jpg');
  dropper = loadImage('assets/Dropper.jpg');
  blur = loadImage('assets/Blur.jpg');
}

function setup() {
  // Pen variables
  penSize = 30; // 5; <=50; +=5
  penColor = "red";
  
  createCanvas(480, 480);
  image(bg,10,0,480,480);
  fill("white")
  stroke("black")
  textSize(32);
  text("Repair the Painting!", 100, 55);
}

function draw() {
  if (!win) {
    drawPalette();
    textSize(256);
    text("Repair the Painting", 120, 120);
  }
}

function mouseDragged() {
  //if !overPalette
  noStroke();
  fill(penColor);
  circle(mouseX, mouseY, penSize);
}

function overPalette() {} //if mouse is over the palette, make clicks change pen color/size to match

function drawPalette() {
  // Draws main palette
  stroke("black");
  fill("white");
  paletteX = 0;
  paletteY = 10;
  rect(paletteX, paletteY, 75, 460);
  
  // Draws color pods
  paletteX = 28;
  paletteY = 30;
  offset = 20;
  for (let x of penColors) {
    paletteX += offset;
    fill(x);
    ellipse(paletteX, paletteY, 50, 30);
    offset *= -1;
    paletteY += 30;
  }
  
  // Draws dropper button
  paletteX -= 20;
  paletteY -= 10;
  fill("white")
  rect(paletteX, paletteY, 60, 20)
  image(dropper, paletteX+22, paletteY+1, 18, 18)
  
  // Draws pod with current color
  paletteX += 30;
  paletteY += 45;
  fill(penColor);
  ellipse(paletteX, paletteY, 60, 40);
  
  // Draws blur button
  paletteX -= 30;
  paletteY += 30;
  fill("white")
  rect(paletteX, paletteY, 60, 21)
  image(blur, paletteX+22, paletteY+1, 18, 18)
  
  // Draws size buttons
  fill("black");
  paletteX += 20;
  paletteY += 35;
  triangle(paletteX, paletteY, paletteX, paletteY+20, paletteX-20, paletteY+10);
  paletteX += 20;
  triangle(paletteX, paletteY, paletteX, paletteY+20, paletteX+20, paletteY+10);
  
  // Draw pen size example
  paletteX -= 10;
  paletteY += 45;
  circle(paletteX, paletteY, penSize)
  
  // Draws finish button
  paletteX -= 35;
  paletteY += 30;
  fill("white")
  rect(paletteX, paletteY, 70, 21)
  fill("black")
  textSize(18)
  textFont("Constantia")
  text("Done?", paletteX+10, paletteY+3, 70, 21)
}

let __dropperActive = false;
let __blurActive = false;
let __endActive = false;
let __endScreen = false;

function __computeUI() {
  const panel = { x: 0, y: 10, w: 75, h: 400 };
  let cx = 28, cy = 30, off = 20;
  const pods = [];
  for (let i = 0; i < penColors.length; i++) {
    cx += off;
    pods.push({ x: cx, y: cy, w: 50, h: 30, color: penColors[i] });
    off *= -1;
    cy += 30;
  }
  const dropperBtn = { x: cx - 20, y: cy - 10, w: 60, h: 20 };
  const px = dropperBtn.x;
  const py = dropperBtn.y + 75;
  const blurBtn = { x: px, y: py, w: 60, h: 20 };
  const triLeftBBox  = { x: px, y: py + 35, w: 20, h: 20 };
  const triRightBBox = { x: px + 40, y: py + 35, w: 20, h: 20 }; 
  const endBtn = { x: px - 5, y: py + 110, w: 70, h: 20 };

  return { panel, pods, dropperBtn, blurBtn, triLeftBBox, triRightBBox, endBtn };
}

function __hitRect(mx, my, r) {
  return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
}
function __hitEllipse(mx, my, cx, cy, w, h) {
  const a = w / 2, b = h / 2;
  return ((mx - cx) ** 2) / (a * a) + ((my - cy) ** 2) / (b * b) <= 1;
}

const __origDrawPalette = drawPalette;
function draw() {
  __origDrawPalette();
  if (__dropperActive) {
    const { dropperBtn } = __computeUI();
    noFill(); stroke(0); strokeWeight(2);
    rect(dropperBtn.x - 2, dropperBtn.y - 2, dropperBtn.w + 4, dropperBtn.h + 4);
    strokeWeight(1);
  }
  if (__blurActive) {
    const { blurBtn } = __computeUI();
    noFill(); stroke(0); strokeWeight(2);
    rect(blurBtn.x - 2, blurBtn.y - 2, blurBtn.w + 4, blurBtn.h + 4);
    strokeWeight(1);
  }
  if (__endActive) {
    const { endBtn } = __computeUI();
    noFill(); stroke(0); strokeWeight(2);
    rect(endBtn.x - 2, endBtn.y - 2, endBtn.w + 4, endBtn.h + 4);
    strokeWeight(1);
  }
}

function mouseDragged() {
  const { panel } = __computeUI();
  if (!__hitRect(mouseX, mouseY, panel)) {
    noStroke();
    fill(penColor);
    circle(mouseX, mouseY, penSize);
  }
}

function mousePressed() {
  const { panel, pods, dropperBtn, blurBtn, triLeftBBox, triRightBBox, endBtn } = __computeUI();
  if (__hitRect(mouseX, mouseY, dropperBtn)) {
    __blurActive = false;
    __dropperActive = true;
    return;
  }
  if (__hitRect(mouseX, mouseY, blurBtn)) {
    if (__blurActive == false) {
      __dropperActive = false;
    }
    __blurActive = !__blurActive;
    return;
  }
  if (__hitRect(mouseX, mouseY, endBtn)) {
    __endScreen = true;
    return;
  }

  if (__dropperActive && !__hitRect(mouseX, mouseY, panel)) {
    const c = get(mouseX, mouseY);
    penColor = color(c[0], c[1], c[2], c[3]);
    __dropperActive = false;
    return;
  }
  
  if (__blurActive && !__hitRect(mouseX, mouseY, panel)) {
    // TODO: Blur code - Jeffrey
    const c = get(mouseX - 10, mouseY - 10, 20, 20);
    //penColor = color(c[0], c[1], c[2], c[3]);
    return;
  }
  
  if (__endScreen && !__hitRect(mouseX, mouseY, panel)) {
    // TODO: End Screen code - Jeffrey
    // Grading - Jason
    // Different pictures - Jason
    return;
  }

  for (const p of pods) {
    if (__hitEllipse(mouseX, mouseY, p.x, p.y, p.w, p.h)) {
      penColor = p.color;
      return;
    }
  }

  if (__hitRect(mouseX, mouseY, triLeftBBox)) {
    penSize = max(5, penSize - 5);
    return;
  }
  if (__hitRect(mouseX, mouseY, triRightBBox)) {
    penSize = min(50, penSize + 5);
    return;
  }
}

function mouseMoved() {
  const { panel, pods, dropperBtn, blurBtn, triLeftBBox, triRightBBox, endBtn } = __computeUI();
  if (__hitRect(mouseX, mouseY, endBtn)) {
    __endActive = true;
  }
  else {
    __endActive = false;
    return;
  }
}