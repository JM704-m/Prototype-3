let END = { visible: false, score: 0, ui: null };

function showEndScreen(score) {
  END.visible = true;
  END.score = typeof score === "number" ? score : 0;
  END.ui = null; // recompute on next draw
}

function hideEndScreen() {
  END.visible = false;
}

function __endComputeUI() {
  const cardW = Math.min(420, width - 60);
  const cardH = 300;
  const x = (width - cardW) / 2;
  const y = (height - cardH) / 2;
  const btnW = (cardW - 60) / 2;
  const btnH = 44;

  return {
    card: { x, y, w: cardW, h: cardH },
    titleY: y + 48,
    scoreY: y + 110,
    nextBtn:   { x: x + 20,            y: y + cardH - 70, w: btnW, h: btnH },
    replayBtn: { x: x + cardW - 20 - btnW, y: y + cardH - 70, w: btnW, h: btnH }
  };
}

function __endDrawBtn(b, label) {
  fill(245); stroke(30); strokeWeight(1.5); rect(b.x, b.y, b.w, b.h, 10);
  noStroke(); fill(20); textAlign(CENTER, CENTER); textSize(18);
  text(label, b.x + b.w / 2, b.y + b.h / 2 + 1);
}

function drawEndScreen() {
  if (!END.visible) return;
  // dim background
  noStroke(); fill(0, 140); rect(0, 0, width, height);

  const ui = END.ui || (END.ui = __endComputeUI());

  // card
  fill(255); stroke(20); strokeWeight(2); rect(ui.card.x, ui.card.y, ui.card.w, ui.card.h, 16);

  // texts
  noStroke(); textAlign(CENTER, CENTER);
  fill(30); textSize(28); text("Restoration Complete!", width / 2, ui.titleY);
  fill(90); textSize(18); text("Score", width / 2, ui.scoreY - 22);
  fill(0);  textSize(48); text(END.score, width / 2, ui.scoreY + 20);

  // buttons
  __endDrawBtn(ui.nextBtn,   "Next Painting ▶");
  __endDrawBtn(ui.replayBtn, "Try Again");
}

function endScreenMousePressed() {
  if (!END.visible) return false;
  const ui = END.ui || __endComputeUI();
  const mx = mouseX, my = mouseY;
  const hit = r => mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;

  if (hit(ui.nextBtn)) {
    // Placeholder: 在这里触发 Jason 的“different pictures”加载逻辑
    // 现在先仅关闭结束界面；也可以显示一个“Loading...”文字（留空位）
    END.visible = false;
    return true; // consume
  }
  if (hit(ui.replayBtn)) {
    END.visible = false;
    // 简单复位到初始图像（不影响 Jason 评分逻辑）
    clear();
    image(bg, 10, 0, 480, 480);
    return true;
  }
  return true; // 点击其它处也吞掉，防止点到画布
}
