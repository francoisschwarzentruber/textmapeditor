/**
 * colors
 * */
const BACKGROUND = "rgb(32, 32, 32)";
const SELECTIONBACKGROUND = "rgb(96, 111, 222)";

String.prototype.replaceAt = function (i, replacement) {
  return this.substring(0, i) + replacement + this.substring(i + replacement.length);
}

function between(v, a, b) { return (a <= v && v <= b) || (b <= v && v <= a); }

/**
 * an immutable point in the plane with integers x and y as coordinates
 */
class Point {
  constructor(x, y) { this.x = x; this.y = y; }
  left() { return new Point(Math.max(0, this.x - 1), this.y); } // returns a new point
  up() { return new Point(this.x, Math.max(0, this.y - 1)); }
  right() { return new Point(this.x + 1, this.y); }
  down() { return new Point(this.x, this.y + 1); }
}

function addPrefixSameLetter(letter, zone) { return zone.split("\n").map((line) => letter + line).join("\n"); }
function addSuffixSameLetter(zone, letter) { return zone.split("\n").map((line) => line + letter).join("\n"); }

/**
 * represents a multi-line text
 */
class Text2D {
  constructor(str = "") { this.lines = str.split("\n"); }

  /**
   * 
   * @param {*} x 
   * @param {*} y 
   * @returns the character at line y column x
   */
  getCharAt(x, y) {
    if (y >= this.lines.length || x >= this.lines[y].length)
      return " ";
    return this.lines[y].charAt(x);
  }

  /**
   * 
   * @param {*} x 
   * @param {*} y 
   * @param {*} char 
   * @description set the character at line y column x
   */
  setCharAt(x, y, char) {
    if (y < this.lines.length) {
      if (x < this.lines[y].length)
        this.lines[y] = this.lines[y].replaceAt(x, char);
      else {
        this.lines[y] = this.lines[y] + " ".repeat(x - this.lines[y].length + 1);
        this.setCharAt(x, y, char);
      }
    }
    else {
      for (let y2 = this.lines.length; y2 <= y; y2++) {
        this.lines.push("");
      }
      this.setCharAt(x, y, char);
    }
  }

  /**
   * @return the x that ends the word at (x,y)
   */
  lastCurrentWord(x, y) {
    while (this.extractZone(x, y, x + 2, y).trim() != "")
      x++;
    return x;
  }

  get height() { return Math.max(20, this.lines.length); }
  get width() { return Math.max(150, Math.max(...this.lines.map(l => l.length))) }

  /**
   * 
   * @param {*} x1 
   * @param {*} y1 
   * @param {*} x2 
   * @param {*} y2 
   * @returns the string corresponding to the rectangle
   */
  extractZone(x1, y1, x2, y2) {
    let A = "";
    for (let y = y1; y <= y2; y++) {
      if (y > y1)
        A = A + "\n";
      for (let x = x1; x <= x2; x++)
        A = A + this.getCharAt(x, y);
    }
    return A;
  }


  /**
   * 
   * @param {*} xLeft 
   * @param {*} yTop 
   * @param {*} str 
   * @description put the string
   */
  blitText(xLeft, yTop, str) {
    const lines = str.split("\n");
    for (let y = 0; y < lines.length; y++)
      for (let x = 0; x < lines[y].length; x++)
        this.setCharAt(x + xLeft, y + yTop, lines[y][x]);
  }


  get text() {
    this.lines = this.lines.map((l) => l.trimEnd());
    const text = this.lines.join("\n");
    this.lines = text.split("\n");
    return text;
  }


  set text(txt) { this.lines = txt.split("\n"); }

  /**
   * 
   * @param {*} y
   * @description insert a line at y 
   */
  insertLine(y) { y = y + 1; this.lines = [...this.lines.slice(0, y), "", ...this.lines.slice(y)]; }

  deleteLine(y) { this.lines = [...this.lines.slice(0, y), ...this.lines.slice(y + 1)]; }

  isLineEmpty(y) { if (y >= this.lines.length) return true; else return this.lines[y].trim() == ""; }
}


function stringEmptyRectangle(w, h) {
  const A = [];
  const s = " ".repeat(w);
  for (let y = 0; y < h; y++)
    A.push(s);
  return A.join("\n");
}

const isDigit = (char) => {
  if (char == undefined) return false;
  const code = char.codePointAt(0);
  return 47 < code && code < 58;
}

class TextMapEditor extends HTMLElement {
  constructor() { super(); }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    const canvas = document.createElement("canvas");
    canvas.width = 12080;
    canvas.height = 420;

    this.style.overflow = "scroll";

    shadow.appendChild(canvas);

    this.text2d = new Text2D();
    this.clipBoard = "";
    class ActionBlit {
      constructor(text2d, pos, before, after) {
        this.text2d = text2d;
        this.pos = new Point(pos.x, pos.y);
        this.before = before;
        this.after = after;
      }
      do() { this.text2d.blitText(this.pos.x, this.pos.y, this.after); }
      undo() { this.text2d.blitText(this.pos.x, this.pos.y, this.before); }
    }

    class CancelStack {
      constructor() { this.stack = new Array(); this.i = -1; }

      undo() { if (this.i >= 0) { this.stack[this.i].undo(); this.i--; } }

      redo() {
        if (this.stack.length > 0) {
          if (this.i < this.stack.length - 1) { this.i++; this.stack[this.i].do(); }
        }
      }

      push(a) {
        this.stack = this.stack.slice(0, this.i + 1);
        this.stack.push(a);
        a.do();
        this.i++;
      }
    }

    this.cancelStack = new CancelStack();

    const CELLW = 9;
    const CELLH = 16;

    this.cursor = new Point(0, 0);
    let cursorMouse = new Point(0, 0);
    let endSelection = new Point(0, 0);
    let dAndDShift = undefined;
    let dAndDTopLeft = undefined;

    const ctx = canvas.getContext("2d");

    let isCursorVisible = true;

    const resizeCanvas = () => {
      canvas.width = Math.max(canvas.width, CELLW * (this.cursor.x + 6));
      canvas.height = Math.max(canvas.height, CELLH * (this.cursor.y + 6));
      canvas.width = Math.max(canvas.width, CELLW * (this.text2d.width + 4));
      canvas.height = Math.max(canvas.height, CELLH * (this.text2d.height + 4));
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 14px Monospace";
    }

    const update = () => {
      const topLeft = new Point(Math.floor(this.scrollLeft / CELLW), Math.floor(this.scrollTop / CELLH));
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if ((isCursorVisible || this.cursor.x != endSelection.x || this.cursor.y != endSelection.y)) {
        ctx.fillStyle = SELECTIONBACKGROUND;
        ctx.fillRect(CELLW * Math.min(this.cursor.x, endSelection.x),
          CELLH * Math.min(this.cursor.y, endSelection.y),
          CELLW * (Math.abs(endSelection.x - this.cursor.x) + 1),
          CELLH * (Math.abs(endSelection.y - this.cursor.y) + 1));
      }

      const R = this.getBoundingClientRect();

      for (let y = topLeft.y; y < topLeft.y + R.height / CELLH; y++)
        for (let x = topLeft.x; x < topLeft.x + R.width / CELLW; x++) {
          const char = this.text2d.getCharAt(x, y);
          if (char != " ") {
            ctx.fillStyle = "white";
            if (isDigit(char)) ctx.fillStyle = "pink";
            if (char == "(" || char == ")") ctx.fillStyle = "orange";
            ctx.fillText(char, CELLW / 2 + x * CELLW, CELLH / 2 + y * CELLH);
          }
        }

      if (dAndDTopLeft) {
        ctx.strokeStyle = "white";
        ctx.strokeRect(dAndDTopLeft.x * CELLW, dAndDTopLeft.y * CELLH,
          CELLW * (Math.abs(endSelection.x - this.cursor.x) + 1),
          CELLH * (Math.abs(endSelection.y - this.cursor.y) + 1));
      }

      ctx.strokeStyle = "rgba(128, 128, 128, 0.2)";
      const drawLine = (x1, y1, x2, y2) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      const drawH = (y) => { drawLine(0, y * CELLH, canvas.width, y * CELLH); }
      const drawV = (x) => { drawLine(x * CELLW, 0, x * CELLW, canvas.height); }

      drawH(Math.min(this.cursor.y, endSelection.y));
      drawH(Math.max(this.cursor.y, endSelection.y) + 1);
      drawV(Math.min(this.cursor.x, endSelection.x));
      drawV(Math.max(this.cursor.x, endSelection.x) + 1);

    }

    update();
    setInterval(() => { isCursorVisible = !isCursorVisible; update() }, 500);

    this.onscroll = update;

    const selectionValidate = () => {
      const newCursor = new Point(Math.min(this.cursor.x, endSelection.x), Math.min(this.cursor.y, endSelection.y));
      const newEndSelection = new Point(Math.max(this.cursor.x, endSelection.x), Math.max(this.cursor.y, endSelection.y));
      this.cursor = newCursor;
      endSelection = newEndSelection;
    }

    const execute = (a) => { this.cancelStack.push(a); }

    const getSelectionZone = () => this.text2d.extractZone(this.cursor.x, this.cursor.y, endSelection.x, endSelection.y);
    const copySelection = () => {
      this.clipBoard = getSelectionZone();
      navigator.clipboard.writeText(this.clipBoard);
    }

    const paste = (clipText) => {
      selectionValidate();
      const clipText2D = new Text2D(clipText);
      const action = new ActionBlit(this.text2d, this.cursor,
        this.text2d.extractZone(this.cursor.x, this.cursor.y,
          this.cursor.x + clipText2D.width, this.cursor.x + clipText2D.height), clipText);
      execute(action);
    }

    const deleteSelection = () => {
      selectionValidate();
      const E = stringEmptyRectangle(endSelection.x - this.cursor.x + 1, endSelection.y - this.cursor.y + 1);
      const action = new ActionBlit(this.text2d, this.cursor,
        this.text2d.extractZone(this.cursor.x, this.cursor.y, endSelection.x, endSelection.y), E);
      execute(action);
    }



    const evtToPoint = (evt) => new Point(Math.floor(evt.offsetX / CELLW), Math.floor(evt.offsetY / CELLH));

    canvas.onmousedown = (evt) => {
      isCursorVisible = true;
      const p = evtToPoint(evt);
      selectionValidate;

      if (between(p.x, this.cursor.x, endSelection.x) && between(p.y, this.cursor.y, endSelection.y)
        && (this.cursor.x != endSelection.x || this.cursor.y != endSelection.y)) {
        dAndDShift = new Point(p.x - this.cursor.x, p.y - this.cursor.y);
        dAndDTopLeft = this.cursor;
      }
      else {
        this.cursor = cursorMouse;
        endSelection = cursorMouse;
      }
      requestAnimationFrame(update);
    }

    canvas.onmousemove = (evt) => {
      cursorMouse = evtToPoint(evt);
      if (dAndDTopLeft) dAndDTopLeft = new Point(cursorMouse.x - dAndDShift.x, cursorMouse.y - dAndDShift.y);
      else if (evt.buttons) endSelection = cursorMouse;

      requestAnimationFrame(update);
    }

    canvas.onmouseup = (evt) => {
      selectionValidate;
      if (dAndDTopLeft) {
        const A = getSelectionZone();
        if (!evt.ctrlKey) deleteSelection();
        execute(new ActionBlit(this.text2d, dAndDTopLeft,
          this.text2d.extractZone(this.cursor.x, this.cursor.y, endSelection.x, endSelection.y), A));
        endSelection.x += dAndDTopLeft.x - this.cursor.x;
        endSelection.y += dAndDTopLeft.y - this.cursor.y;
        this.cursor = dAndDTopLeft;
        dAndDTopLeft = undefined;
        requestAnimationFrame(update);
      }
    }

    canvas.tabIndex = 1000;
    canvas.onkeydown = (evt) => {
      resizeCanvas();
      if (evt.ctrlKey) {
        if (evt.key == "z") this.cancelStack.undo();
        else if (evt.key == "y") this.cancelStack.redo();
        if (evt.key == "x") {
          selectionValidate();
          copySelection();
          deleteSelection();
        }
        if (evt.key == "c") {
          selectionValidate();
          copySelection();
        }
        if (evt.key == "v") navigator.clipboard.readText().then((t) => paste(t));
        if (evt.key == "a") {
          this.cursor = new Point(0, 0);
          endSelection = new Point(this.text2d.width, this.text2d.height);
        }
        if (evt.key == "l") {
          selectionValidate();
          this.cursor = new Point(0, this.cursor.y);
          endSelection = new Point(this.text2d.width, endSelection.y);
          evt.preventDefault();
        }
        if (evt.key == "m") {
          selectionValidate();
          this.cursor = new Point(this.cursor.x, 0);
          endSelection = new Point(endSelection.x, this.text2d.height);
          evt.preventDefault();
        }
      }
      if (evt.key == "ArrowLeft") { endSelection = endSelection.left(); isCursorVisible = true; if (!evt.shiftKey) this.cursor = endSelection; evt.preventDefault(); }
      if (evt.key == "ArrowUp") { endSelection = endSelection.up(); isCursorVisible = true; if (!evt.shiftKey) this.cursor = endSelection; evt.preventDefault(); }
      if (evt.key == "ArrowDown") { endSelection = endSelection.down(); isCursorVisible = true; if (!evt.shiftKey) this.cursor = endSelection; evt.preventDefault(); }
      if (evt.key == "ArrowRight") { endSelection = endSelection.right(); isCursorVisible = true; if (!evt.shiftKey) this.cursor = endSelection; evt.preventDefault(); }
      if (evt.key == "Backspace") {
        selectionValidate();
        const isSelectionLinesEmpty = () => {
          for (let y = this.cursor.y; y <= endSelection.y; y++)
            if (!this.text2d.isLineEmpty(y))
              return false;
          return true;
        }

        if (this.cursor.x == 0 && isSelectionLinesEmpty()) {
          for (let y = this.cursor.y; y <= endSelection.y; y++)
            this.text2d.deleteLine(y);
        }
        else if (this.cursor.x != endSelection.x)
          deleteSelection();
        else {
          this.cursor = this.cursor.left();
          endSelection.x = this.cursor.x;
          let x = 0;
          for (let y = this.cursor.y; y <= endSelection.y; y++)
            x = Math.max(x, this.text2d.lastCurrentWord(this.cursor.x, y));

          const action = new ActionBlit(this.text2d, this.cursor,
            this.text2d.extractZone(this.cursor.x, this.cursor.y, x + 1, endSelection.y),
            addSuffixSameLetter(this.text2d.extractZone(this.cursor.x + 1, this.cursor.y, x, endSelection.y), " "));
          execute(action);

        }
      }
      if (evt.key == "Escape")
        endSelection = this.cursor;
      if (evt.key == "Delete")
        deleteSelection();
      if (evt.key == "Enter") {
        this.text2d.insertLine(this.cursor.y);
        this.cursor = this.cursor.down();
        endSelection = this.cursor;

      }
      if (!evt.ctrlKey && evt.key.length == 1) {
        selectionValidate();

        let x = 0;
        for (let y = this.cursor.y; y <= endSelection.y; y++)
          x = Math.max(x, this.text2d.lastCurrentWord(this.cursor.x, y));

        const action = new ActionBlit(this.text2d, this.cursor,
          this.text2d.extractZone(this.cursor.x, this.cursor.y, x + 1, endSelection.y),
          addPrefixSameLetter(evt.key, this.text2d.extractZone(this.cursor.x, this.cursor.y, x, endSelection.y)));
        execute(action);
        this.cursor.x++;
        endSelection = new Point(this.cursor.x, endSelection.y);
        evt.preventDefault();
      }
      update();
    }
  }

  get lines() { return this.text2d.lines; }
  get text() { return this.text2d.text; }
  set text(txt) { this.text2d.text = txt; update(); }
}

customElements.define("text-map-editor", TextMapEditor);