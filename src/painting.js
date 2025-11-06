let penColors = ["white", "red", "orange", "yellow", "green", "blue", "purple", "black"]
let win = false;

let __scorePlaceholder = 0;

function preload() {
  bg = loadImage('assets/EcceHomoFlaking.jpg');
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
  image(bg,10,0,480,480);
  fill("white")
  stroke("black")
  textSize(32);
  text("Repair the Painting!", 100, 55);
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

  if (typeof drawEndScreen === "function") {
    drawEndScreen(); 
  }
}

// Blur function
function __smudgeDirectional(cx, cy, radius, baseStrength = 0.65) {
  let vx = mouseX - pmouseX, vy = mouseY - pmouseY;
  const vlen = Math.sqrt(vx*vx + vy*vy) || 1; vx /= vlen; vy /= vlen;

  const pull = Math.max(4, Math.floor(radius * (1.3 + Math.min(vlen, 12) / 14)));

  const x0 = Math.round(cx - radius), y0 = Math.round(cy - radius);
  const w = radius * 2, h = radius * 2;
  const src = get(x0, y0, w, h);
  const out = createImage(w, h);
  src.loadPixels(); out.loadPixels();
  const idx = (x, y) => 4 * (y * w + x);
  const tau = pull * 0.55;

  const orthoMax = Math.max(1, Math.floor(Math.min(2, radius * 0.16)));
  const orthoOffsets = [0, 1, -1, 2, -2].filter(o => Math.abs(o) <= orthoMax);

  let cR=0,cG=0,cB=0,cN=0;
  const core = Math.max(2, Math.floor(radius * 0.35));
  for (let yy = -core; yy <= core; yy++) {
    for (let xx = -core; xx <= core; xx++) {
      if (xx*xx + yy*yy > core*core) continue;
      const i = idx(xx + radius, yy + radius);
      cR += src.pixels[i]; cG += src.pixels[i+1]; cB += src.pixels[i+2]; cN++;
    }
  }
  cR /= cN || 1; cG /= cN || 1; cB /= cN || 1;

  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const dx = xx - radius, dy = yy - radius;
      const dist2 = dx*dx + dy*dy;
      const di = idx(xx, yy);

      if (dist2 > radius*radius) {
        out.pixels[di]     = src.pixels[di];
        out.pixels[di + 1] = src.pixels[di + 1];
        out.pixels[di + 2] = src.pixels[di + 2];
        out.pixels[di + 3] = src.pixels[di + 3];
        continue;
      }

      let rSum=0,gSum=0,bSum=0,wSum=0;
      for (let s = 0; s <= pull; s++) {
        const wDir = Math.exp(-s / Math.max(1, tau));
        for (let o of orthoOffsets) {
          const ox = -vy * o, oy = vx * o;
          const sx = Math.round(xx - vx*s + ox);
          const sy = Math.round(yy - vy*s + oy);
          if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
          const si = idx(sx, sy);
          const wOrtho = (orthoMax === 0) ? 1 : (1 - Math.min(1, Math.abs(o)/(orthoMax+0.5)));
          const wgt = wDir * wOrtho;
          rSum += src.pixels[si]     * wgt;
          gSum += src.pixels[si + 1] * wgt;
          bSum += src.pixels[si + 2] * wgt;
          wSum += wgt;
        }
      }
      const rSm = rSum / Math.max(1e-6, wSum);
      const gSm = gSum / Math.max(1e-6, wSum);
      const bSm = bSum / Math.max(1e-6, wSum);

      const r0 = src.pixels[di], g0 = src.pixels[di+1], b0 = src.pixels[di+2];
      const dist = Math.sqrt(dist2);
      const t = 1 - dist / radius;
      const squeeze = t * t;
      const rCore = r0 + (cR - r0) * (0.55 * squeeze);
      const gCore = g0 + (cG - g0) * (0.55 * squeeze);
      const bCore = b0 + (cB - b0) * (0.55 * squeeze);

      const sizeBoost  = 0.12 * Math.min(1, radius/28);
      const speedBoost = Math.min(0.4, vlen/14);
      const gap = Math.min(1, Math.sqrt((rSm-r0)**2 + (gSm-g0)**2 + (bSm-b0)**2) / 200);
      const k = Math.min(1, baseStrength * (0.9 + speedBoost) + sizeBoost + 0.2*gap);

      const mixSmudge = 0.6 + 0.4 * squeeze;
      const rBlend = rSm * (1 - mixSmudge) + rCore * mixSmudge;
      const gBlend = gSm * (1 - mixSmudge) + gCore * mixSmudge;
      const bBlend = bSm * (1 - mixSmudge) + bCore * mixSmudge;

      out.pixels[di]     = r0 + (rBlend - r0) * k;
      out.pixels[di + 1] = g0 + (gBlend - g0) * k;
      out.pixels[di + 2] = b0 + (bBlend - b0) * k;
      out.pixels[di + 3] = 255;
    }
  }
  out.updatePixels();
  copy(out, 0, 0, out.width, out.height, x0, y0, out.width, out.height);
}

function mouseDragged() {
  const { panel } = __computeUI();

  if (typeof END !== "undefined" && END && END.visible) return;

  if (__blurActive && !__hitRect(mouseX, mouseY, panel)) {
    const r = Math.max(3, Math.floor(penSize / 2));
    __smudgeDirectional(mouseX, mouseY, r, 0.65);
    return;
  }

  if (!__hitRect(mouseX, mouseY, panel)) {
    noStroke();
    fill(penColor);
    circle(mouseX, mouseY, penSize);
  }
}

function mousePressed() {
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
    //Grading - Jason
    if (typeof showEndScreen === "function") {
      showEndScreen(__scorePlaceholder);
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
    __smudgeDirectional(mouseX, mouseY, r, 0.65);
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
