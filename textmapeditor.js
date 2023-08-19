const BACKGROUND = "rgb(32, 32, 32)";
const SELECTIONBACKGROUND = "rgb(96, 111, 222)";

String.prototype.replaceAt = function (index, replacement) {
  return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

function between(v, a, b) { return (a <= v && v <= b) || (b <= v && v <= a); }

class Point {
  constructor(x, y) { this.x = x; this.y = y; }
  left() { return new Point(Math.max(0, this.x - 1), this.y); }
  up() { return new Point(this.x, Math.max(0, this.y - 1)); }
  right() { return new Point(this.x + 1, this.y); }
  down() { return new Point(this.x, this.y + 1); }
}



function addPrefixSameLetter(letter, zone) {
  return zone.split("\n").map((line) => letter + line).join("\n");
}

class Text2D {
  constructor(char = " ") {
    this.lines = new Array();
    this.lines.push(char);
  }

  getCharAt(x, y) {
    if (y >= this.lines.length || x >= this.lines[y].length)
      return " ";
    return this.lines[y][x];
  }

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


  lastCurrentWord(x, y) {
    while (this.extractZone(x, y, x + 2, y).trim() != "")
      x++;
    return x;
  }
  get height() { return this.lines.length; }
  get width() { return Math.max(...this.lines.map(l => l.length)) }

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

  blitText(xLeft, yTop, A) {
    const lines = A.split("\n");
    for (let y = 0; y < lines.length; y++)
      for (let x = 0; x < lines[y].length; x++)
        this.setCharAt(x + xLeft, y + yTop, lines[y][x]);
  }


  get text() {
    this.lines = this.lines.map((l) => l.trimEnd())
    const text = this.lines.join("\n");
    this.lines = text.split("\n");
    return text;
  }



  insertLine(y) {
    y = y + 1;
    this.lines = [
      ...this.lines.slice(0, y),
      "",
      ...this.lines.slice(y)
    ];
  }

}


function stringEmptyRectangle(w, h) {
  let s = "";
  for (let y = 0; y < h; y++) {
    if (y > 0) s += "\n";
    s += " ".repeat(w);
  }
  return s;
}

const isDigit = (character) => {
  if (character == undefined) return false;
  const code = character.codePointAt(0);
  return 47 < code && code < 58;
}

class TextMapEditor extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    const canvas = document.createElement("canvas");
    canvas.width = 12080;
    canvas.height = 420;

    this.style.overflowX = "scroll";
    this.style.overflowY = "scroll";


    shadow.appendChild(canvas);

    this.text2d = new Text2D();
    this.clipBoard = "";
    class ActionBlit {
      constructor(text2d, pos, previous, after) {
        this.text2d = text2d;
        this.pos = pos;
        this.previous = previous;
        this.after = after;
      }

      do() { this.text2d.blitText(this.pos.x, this.pos.y, this.after); }
      undo() { this.text2d.blitText(this.pos.x, this.pos.y, this.previous); }
    }

    this.cancelStack = new Array();

    const CELLW = 9;
    const CELLH = 16;

    this.cursor = new Point(0, 0);
    let cursorMouse = new Point(0, 0);
    let endSelection = new Point(0, 0);

    const ctx = canvas.getContext("2d");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 14px Sans Serif";

    const update = () => {
      const topLeft = new Point(Math.floor(this.scrollLeft / CELLW), Math.floor(this.scrollTop / CELLH));
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = SELECTIONBACKGROUND;
      ctx.fillRect(CELLW * Math.min(this.cursor.x, endSelection.x), CELLH * Math.min(this.cursor.y, endSelection.y),
        CELLW * (Math.abs(endSelection.x - this.cursor.x) + 1), CELLH * (Math.abs(endSelection.y - this.cursor.y) + 1));

      const R = this.getBoundingClientRect();

      for (let y = topLeft.y; y < topLeft.y + R.height / CELLH; y++)
        for (let x = topLeft.x; x < topLeft.x + R.width / CELLW; x++) {
          const char = this.text2d.getCharAt(x, y);
          ctx.fillStyle = "white";
          if (isDigit(char)) ctx.fillStyle = "pink";
          if (char == "(" || char == ")") ctx.fillStyle = "orange";

          ctx.fillText(char, CELLW / 2 + x * CELLW, CELLH / 2 + y * CELLH);

        }
    }

    update();

    this.onscroll = update;


    canvas.onmousedown = (evt) => {
      this.cursor = cursorMouse;
      endSelection = cursorMouse;
      requestAnimationFrame(update);
    }

    canvas.onmousemove = (evt) => {
      cursorMouse = new Point(Math.floor(evt.offsetX / CELLW), Math.floor(evt.offsetY / CELLH));
      if (evt.buttons) {
        endSelection = cursorMouse;
      }
      requestAnimationFrame(update);
    }

    const selectionValidate = () => {
      const newCursor = new Point(Math.min(this.cursor.x, endSelection.x), Math.min(this.cursor.y, endSelection.y));
      const newEndSelection = new Point(Math.max(this.cursor.x, endSelection.x), Math.max(this.cursor.y, endSelection.y));
      this.cursor = newCursor;
      endSelection = newEndSelection;
    }

    const execute = (a) => {
      this.cancelStack.push(a);
      a.do();
    }

    const copySelection = () => {
      this.clipBoard = this.text2d.extractZone(this.cursor.x, this.cursor.y, endSelection.x, endSelection.y);
      navigator.clipboard.writeText(this.clipBoard);
    }

    const paste = (clipText) => {
      console.log(clipText)
      selectionValidate();
      const action = new ActionBlit(this.text2d, this.cursor,
        this.text2d.extractZone(this.cursor.x, this.cursor.y, endSelection.x, endSelection.y), clipText);
      execute(action);
    }

    const deleteSelection = () => {
      selectionValidate();
      const E = stringEmptyRectangle(endSelection.x - this.cursor.x + 1, endSelection.y - this.cursor.y + 1);
      const action = new ActionBlit(this.text2d, this.cursor,
        this.text2d.extractZone(this.cursor.x, this.cursor.y, endSelection.x, endSelection.y), E);
      execute(action);
    }

    const resizeCanvas = () => {
      canvas.width = Math.max(canvas.width, CELLW * (this.cursor.x + 6));
      canvas.height = Math.max(canvas.height, CELLH * (this.cursor.y + 6));

      canvas.width = Math.max(canvas.width, CELLW * (this.text2d.width + 4));
      canvas.height = Math.max(canvas.height, CELLH * (this.text2d.height + 4));

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 14px Sans Serif";

    }
    canvas.onmouseup = selectionValidate;

    canvas.tabIndex = 1000;
    canvas.onkeydown = (evt) => {
      resizeCanvas();
      if (evt.ctrlKey) {
        if (evt.key == "z" && this.cancelStack.length > 0) {
          const a = this.cancelStack.pop();
          a.undo();
        }
        if (evt.key == "x") {
          selectionValidate();
          copySelection();
          deleteSelection();
        }
        if (evt.key == "c") {
          selectionValidate();
          copySelection();
        }
        if (evt.key == "v") {
          navigator.clipboard.readText().then((t) => paste(t));
          //paste(this.clipBoard);
        }
        if (evt.key == "a") {
          this.cursor = new Point(0, 0);
          endSelection = new Point(this.text2d.width, this.text2d.height);
        }

        if (evt.key == "l") {
          this.cursor = new Point(0, this.cursor.y);
          endSelection = new Point(this.text2d.width, this.cursor.y);
          evt.preventDefault();
        }
      }
      if (evt.key == "ArrowLeft") { endSelection = endSelection.left(); if (!evt.shiftKey) this.cursor = endSelection; evt.preventDefault(); }
      if (evt.key == "ArrowUp") { endSelection = endSelection.up(); if (!evt.shiftKey) this.cursor = endSelection; evt.preventDefault(); }
      if (evt.key == "ArrowDown") { endSelection = endSelection.down(); if (!evt.shiftKey) this.cursor = endSelection; evt.preventDefault(); }
      if (evt.key == "ArrowRight") { endSelection = endSelection.right(); if (!evt.shiftKey) this.cursor = endSelection; evt.preventDefault(); }
      if (evt.key == "Backspace") {
        if (this.cursor.x != endSelection.x) {
          deleteSelection();
        }
        else {
          this.cursor = this.cursor.left();
          endSelection.x = this.cursor.x;
          let x = 0;
          for (let y = this.cursor.y; y <= endSelection.y; y++)
            x = Math.max(x, this.text2d.lastCurrentWord(this.cursor.x, y));

          const action = new ActionBlit(this.text2d, this.cursor,
            this.text2d.extractZone(this.cursor.x, this.cursor.y, x + 1, endSelection.y),
            this.text2d.extractZone(this.cursor.x + 1, this.cursor.y, x, endSelection.y) + " ");
          execute(action);

        }
      }
      if (evt.key == "Delete") {
        deleteSelection();
      }
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
}

customElements.define("text-map-editor", TextMapEditor);