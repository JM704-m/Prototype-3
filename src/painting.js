let penColors = ["white", "red", "orange", "yellow", "green", "blue", "purple", "black"]
let win = false;
let baseScore = 0

let __prevX = null, __prevY = null;

function preload() {
  bg = loadImage('assets/EcceHomoFlaking.jpg');
  endResult = loadImage('/assets/EcceHomoFinal.png');
  dropper = loadImage('assets/Dropper.jpg');
  blur = loadImage('assets/Blur.jpg');
}

function setup() {
  pixelDensity(1);
  // Pen variables
  penSize = 30; // 5; <=50; +=5
  penColor = "red";
  createCanvas(480, 480);
  drawingContext.imageSmoothingEnabled = true;
  drawingContext.imageSmoothingQuality = 'high';

  image(endResult,10,0,480,480);
  solution = [];
  loadPixels();
  solution = pixels;
  updatePixels();
  image(bg,10,0,480,480);
  fill("white")
  stroke("black")
  textSize(32);
  text("Repair the Painting!", 100, 55);
  baseScore = __gradeCalc()
}

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
  const panel = { x: 0, y: 10, w: 75, h: 460 };
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

  if (typeof drawEndScreen === "function") {
    drawEndScreen();
  }
}

// Blur function
function __smudgeDirectional(cx, cy, radius, baseStrength = 0.65) {
  let vx = mouseX - pmouseX, vy = mouseY - pmouseY;
  const vlen = Math.sqrt(vx*vx + vy*vy) || 1; vx /= vlen; vy /= vlen;

  const pull = Math.max(3, Math.floor(radius * (0.9 + Math.min(vlen, 12) / 18)));
  const tau  = pull * 0.45;
  loadPixels();
  const W = width, H = height;
  const idx = (x, y) => 4 * (y * W + x);

  // ROI
  const x0 = Math.max(0, Math.round(cx - radius));
  const y0 = Math.max(0, Math.round(cy - radius));
  const x1 = Math.min(W - 1, Math.round(cx + radius));
  const y1 = Math.min(H - 1, Math.round(cy + radius));
  const rw = x1 - x0 + 1, rh = y1 - y0 + 1;
  const buf = new Uint8ClampedArray(rw * rh * 4);
  for (let yy = 0; yy < rh; yy++) {
    const si = 4 * ((y0 + yy) * W + x0);
    buf.set(pixels.subarray(si, si + rw * 4), yy * rw * 4);
  }
  const bidx = (x, y) => 4 * (y * rw + x);
  const orthoMax = Math.max(1, Math.floor(Math.min(2, radius * 0.15)));
  const orthoOffsets = [0, 1, -1, 2, -2].filter(o => Math.abs(o) <= orthoMax);
  const inv2sigmaR2 = 1 / (2 * 50 * 50); // range σ≈50

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx*dx + dy*dy > radius*radius) continue;

      const bi = bidx(x - x0, y - y0);
      const r0 = buf[bi], g0 = buf[bi + 1], b0 = buf[bi + 2];

      let rSum=0, gSum=0, bSum=0, wSum=0;

      for (let s = 0; s <= pull; s++) {
        const wDir = Math.exp(-s / Math.max(1, tau));
        for (let o of orthoOffsets) {
          const ox = -vy * o, oy = vx * o;
          const sx = Math.round(x - vx * s + ox);
          const sy = Math.round(y - vy * s + oy);
          if (sx < x0 || sy < y0 || sx > x1 || sy > y1) continue;

          const sbi = bidx(sx - x0, sy - y0);
          const rs = buf[sbi], gs = buf[sbi + 1], bs = buf[sbi + 2];

          const wOrtho = (orthoMax === 0) ? 1 : (1 - Math.min(1, Math.abs(o) / (orthoMax + 0.5)));
          const dR = rs - r0, dG = gs - g0, dB = bs - b0;
          const wEdge = Math.exp(-(dR*dR + dG*dG + dB*dB) * inv2sigmaR2);

          const wgt = wDir * (0.8 + 0.2 * wEdge) * wOrtho;

          rSum += rs * wgt; gSum += gs * wgt; bSum += bs * wgt; wSum += wgt;
        }
      }

      const rSm = rSum / Math.max(1e-6, wSum);
      const gSm = gSum / Math.max(1e-6, wSum);
      const bSm = bSum / Math.max(1e-6, wSum);

      const sizeBoost  = 0.12 * Math.min(1, radius / 28);
      const speedBoost = Math.min(0.35, vlen / 14);
      const k = Math.min(1, baseStrength * (0.9 + speedBoost) + sizeBoost);

      const di = idx(x, y);
      pixels[di]     = r0 + (rSm - r0) * k;
      pixels[di + 1] = g0 + (gSm - g0) * k;
      pixels[di + 2] = b0 + (bSm - b0) * k;
      pixels[di + 3] = 255;
    }
  }
  updatePixels();
}

function mouseDragged() {
  const { panel } = __computeUI();
  if (__hitRect(mouseX, mouseY, panel)) return;

  const x0 = (__prevX == null) ? mouseX : __prevX;
  const y0 = (__prevY == null) ? mouseY : __prevY;
  const x1 = mouseX, y1 = mouseY;
  const dx = x1 - x0, dy = y1 - y0;
  const dist = Math.sqrt(dx*dx + dy*dy);

  const step = Math.max(1, (penSize * 0.4));
  const n = Math.max(1, Math.ceil(dist / step));

  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const ix = Math.round(x0 + dx * t);
    const iy = Math.round(y0 + dy * t);

    if (__blurActive) {
      const r = Math.max(3, Math.floor(penSize / 2));
      __smudgeDirectional(ix, iy, r, 0.75);
    } else {
      noStroke();
      fill(penColor);
      circle(ix, iy, penSize);
    }
  }

  __prevX = mouseX;
  __prevY = mouseY;
}

function mouseReleased() {
  __prevX = __prevY = null;
}

function mousePressed() {
  __prevX = mouseX;
  __prevY = mouseY;

  const { panel, pods, dropperBtn, blurBtn, triLeftBBox, triRightBBox, endBtn } = __computeUI();
  if (typeof END !== "undefined" && END && END.visible && typeof endScreenMousePressed === "function") {
    endScreenMousePressed();
    return;
  }

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
    if (typeof showEndScreen === "function") {
      avgScore = max(0, 1 - (__gradeCalc()/(baseScore * 2))).toFixed(2);
      showEndScreen(round(avgScore * 100));
    }
    return;
  }

  if (__dropperActive && !__hitRect(mouseX, mouseY, panel)) {
    const c = get(mouseX, mouseY);
    penColor = color(c[0], c[1], c[2], c[3]);
    __dropperActive = false;
    return;
  }
  
  if (__blurActive && !__hitRect(mouseX, mouseY, panel)) {
    const r = Math.max(3, Math.floor(penSize / 2));
    __smudgeDirectional(mouseX, mouseY, r, 0.75);
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

function __gradeCalc() {
  avgScore = 0;
  loadPixels();
  for (let i = 0; i < pixels.length; i += 4) {
    deltaR = sq(solution[i] - pixels[i]);
    deltaB = sq(solution[i+1] - pixels[i+1]);
    deltaG = sq(solution[i+3] - pixels[i+3]);
    redMean = (solution[i] + pixels[i]) / 2;

    distance = sqrt(((2 + (redMean/256)) * sq(deltaR)) + (4 * sq(deltaG)) + ((2 + ((255 - redMean) / 256)) * sq(deltaB)));
    avgScore += distance;
  }
  avgScore = avgScore / pixels.length;
  return(avgScore);
}