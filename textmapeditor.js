/**
 * colors
 * */
/*
const BACKGROUND = "rgb(32, 32, 32)";
const COLOR = "rgb(255, 255, 222)";
const SELECTIONBACKGROUND = "rgb(96, 96, 164)";
*/
const CELLW = 10;
const CELLH = 20;


//day mode
const BACKGROUND = "white";
const COLOR = "black";
const SELECTIONBACKGROUND = "rgba(96, 111, 222, 0.3)";
const BRACKETCOLOR = "orange";
const COMMACOLOR = "rgb(0,0, 192)";
const DIGITCOLOR = "purple";
const SPECIALSYMBOLCOLOR = "rgb(0, 128, 0)";


function between(v, a, b) { return (a <= v && v <= b) || (b <= v && v <= a); }

/**
 * an immutable point in the plane with integers x and y as coordinates
 */
class Point {
  constructor(x, y) { this.x = x; this.y = y; }

  /**
   * @returns a new point corresponding to a move to the left (then resp. up, right, down)
   */
  left() { return new Point(Math.max(0, this.x - 1), this.y); }
  up() { return new Point(this.x, Math.max(0, this.y - 1)); }
  right() { return new Point(this.x + 1, this.y); }
  down() { return new Point(this.x, this.y + 1); }
}

/**
 * 
 * @param {*} zone a string (generally multi-line) 
 * @param {*} letter a symbol character
 * @returns a copy of zone in which we have added letter at the end of each line of zone
 */
function addSuffixSameLetter(zone, letter) { return zone.split("\n").map((line) => line + letter).join("\n"); }

/**
 * represents a multi-line text
 */
class Text2D {
  constructor(str) { this.array = str.split("\n").map((line) => [...line]); }

  /**
   * 
   * @param {*} x 
   * @param {*} y 
   * @returns the character at line y column x
   */
  getCharAt(x, y) {
    if (y >= this.array.length || x >= this.array[y].length) return " ";
    return this.array[y][x];
  }

  /**
   * 
   * @param {*} x 
   * @param {*} y 
   * @param {*} char 
   * @description set the character at line y column x
   */
  setCharAt(x, y, char) { this._makeCellExists(x, y); this.array[y][x] = char; }

  /**
   * 
   * @param {*} x 
   * @param {*} y
   * @description makes that the cell (x,y) physically exists (used by other methods internally) 
   */
  _makeCellExists(x, y) {
    if (y >= this.array.length) {
      for (let y2 = this.array.length; y2 <= y; y2++) {
        this.array.push([]);
      }
      this._makeCellExists(x, y);
    }
    else {
      for (let x1 = this.array[y].length; x1 <= x; x1++)
        this.array[y].push(" ");
    }
  }

  /**
   * @return the x that ends the word at (x,y)
   */
  getXlastCurrentWord(x, y) {
    while (this.extractZone(x, y, x + 2, y).trim() != "") x++;
    return x;
  }

  /**
   * the number of lines
   */
  get height() { return Math.max(this.array.length); }

  /**
   * the max length of a line
   */
  get width() { return Math.max(Math.max(...this.array.map(l => l.length))) }

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
      if (y > y1) A = A + "\n";
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
    for (let y = 0; y < lines.length; y++) {
      const line = [...lines[y]];
      for (let x = 0; x < line.length; x++)
        this.setCharAt(x + xLeft, y + yTop, line[x]);
    }
  }

  /**
   * @returns the string
   */
  get text() { return this.lines.join("\n"); }
  set text(txt) { this.array = txt.split("\n").map((line) => [...line]); }

  /**
   * @returns an array containing the lines
   */
  get lines() { return this.array.map((l) => l.join("").trimEnd()); }


  /**
   * 
   * @param {*} x 
   * @param {*} y 
   * @param {*} x2 
   * @param {*} y2 
   * @returns true if the rectangular zone is empty (only " ")
   */
  isFree(x, y, x2, y2 = y) {
    for (let iy = y; iy <= y2; iy++) {
      for (let ix = x; ix <= x2; ix++) {
        this._makeCellExists(ix, iy);
        if (this.array[iy][ix] != " ")
          return false;
      }
    }
    return true;
  }

  /**
   * 
   * @param {*} y
   * @description insert a line at y 
   */
  insertLine(y) { this.array = [...this.array.slice(0, y), [], ...this.array.slice(y)]; }

  /**
   * 
   * @param {*} y
   * @description removes line indexed by y (lines at y+1 becomes line at y, etc.) 
   */
  deleteLine(y) { this.array = [...this.array.slice(0, y), ...this.array.slice(y + 1)]; }

  /**
   * 
   * @param {*} y 
   * @returns true iff the line at y is empty (only contains " ")
   */
  isLineEmpty(y) { if (y >= this.array.length) return true; else return this.array[y].every((cell) => (cell == " ")); }
}

/**
 * 
 * @param {*} w 
 * @param {*} h 
 * @returns a string of h lines made up of w spaces (" ")
 */
function stringEmptyRectangle(w, h) {
  const A = [];
  const s = " ".repeat(w);
  for (let y = 0; y < h; y++)
    A.push(s);
  return A.join("\n");
}

/**
 * 
 * @param {*} char 
 * @returns true if char is in ["0", ..., "9"]
 */
const isDigit = (char) => {
  if (char == undefined) return false;
  const code = char.codePointAt(0);
  return 47 < code && code < 58;
}


/**
 * agressively put the text txt at pos (it just blits and replace what there is there)
 */
class ActionBlit {
  constructor(text2d, pos, txt) {
    this.text2d = text2d;
    this.pos = new Point(pos.x, pos.y);
    const afterText2d = new Text2D(txt);
    this.before = text2d.extractZone(pos.x, pos.y,
      pos.x + afterText2d.width, pos.y + afterText2d.height);
    this.after = txt;
  }
  do() { this.text2d.blitText(this.pos.x, this.pos.y, this.after); }
  undo() { this.text2d.blitText(this.pos.x, this.pos.y, this.before); }
}


/**
 * abstract action made up of several actions
 */
class ActionComposite {
  constructor() { this.actions = []; }
  addAction(a) { this.actions.push(a) }
  do() { this.actions.map((a) => a.do()) }
  undo() { const ar = [...this.actions].reverse(); ar.map((a) => a.undo()) }
}

/**
 * write the txt. It shift to the right if there are some text already there
 */
class ActionWrite extends ActionComposite {
  constructor(text2d, pos, txt) {
    super();
    this.text2d = text2d;
    this.pos = new Point(pos.x, pos.y);

    const afterText2d = new Text2D(txt);
    this.afterText2d = afterText2d;

    const write = (x, y, str) => {
      if (text2d.isFree(x, y, x + str.length + 1, y))
        this.addAction(new ActionBlit(text2d, { x, y }, str))
      else {
        const xEnd = x + str.length;
        const xLastWEnd = text2d.getXlastCurrentWord(xEnd, y);

        let xBegin = x;

        while (text2d.getCharAt(xBegin, y) == " ")
          xBegin++;


        const A = new ActionBlit(text2d, { x, y }, str);
        if (xBegin < xEnd) {
          const nextstr = text2d.extractZone(xBegin, y, xLastWEnd, y);
          this.addAction(new ActionBlit(text2d, { x: xBegin, y }, " ".repeat(xLastWEnd - xBegin)));
          text2d.blitText(xBegin, y, " ".repeat(xLastWEnd - xBegin));
          write(xEnd, y, nextstr);
        }
        this.addAction(A);
      }
    }

    for (let y = pos.y; y < pos.y + afterText2d.height; y++) {
      const strInsert = afterText2d.array[y - pos.y].join("") + ((text2d.getCharAt(pos.x, y) == " ") ? " " : "");
      write(pos.x, y, strInsert);
    }
  }

}

/**
 * @description action that inserts a new line at y
 */
class ActionInsertLine {
  constructor(text2d, y) { this.text2d = text2d; this.y = y; }
  do() { this.text2d.insertLine(this.y); }
  undo() { this.text2d.deleteLine(this.y); }
}


/**
 * action that deletes the line at y
 */
class ActionDeleteLine {
  constructor(text2d, y) { this.text2d = text2d; this.y = y; this.previousLine = text2d.lines[y]; }
  do() { this.text2d.deleteLine(this.y); }
  undo() {
    this.text2d.insertLine(this.y);
    this.text2d.array[this.y] = this.previousLine.split("");
  }
}


class CancelStack {
  constructor() { this.stack = new Array(); this.i = -1; }

  /**
   * undo the previous action
   */
  undo() { if (this.i >= 0) { this.stack[this.i].undo(); this.i--; } }

  /**
   * redo the next action
   */
  redo() {
    if (this.stack.length > 0) {
      if (this.i < this.stack.length - 1) { this.i++; this.stack[this.i].do(); }
    }
  }

  /**
   * 
   * @param {*} action
   * @description push the action into the cancel stack 
   */
  push(action) {
    this.stack = this.stack.slice(0, this.i + 1);
    this.stack.push(action);
    action.do();
    this.i++;
  }
}


/**
 * the HTML element for the text map editor
 */
class TextMapEditor extends HTMLElement {
  constructor() { super(); }


  /**
   * 
   * @param {*} point 
   * @returns true if the point is in the bound of the selected area
   */
  isCursorInSelection(point) {
    return (between(point.x, this.cursor.x, this.endSelection.x) && between(point.y, this.cursor.y, this.endSelection.y)
      && (this.cursor.x != this.endSelection.x || this.cursor.y != this.endSelection.y));
  }


  setCursorBlinkingVisible() {
    this.divSelection.style.opacity = 1.0;
    this.cursorBlinkingState = 1;
    this._cursorBlinkingReset();
  }

  cursorBlinkingState = 1;
  cursorBlinkingTimer = undefined;

  _cursorBlinkingReset() {
    if (this.cursorBlinkingTimer != undefined)
      clearInterval(this.cursorBlinkingTimer);

    this.cursorBlinkingTimer = setInterval(() => {
      this.divSelection.style.opacity = ((this.cursor.x != this.endSelection.x) || (this.cursor.y != this.endSelection.y)) ? 1 : this.cursorBlinkingState;
      this.cursorBlinkingState = 1 - this.cursorBlinkingState;
    }, 500);

  }


  /**
   * @description creation of the text area
   */
  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });

    const wrapper = document.createElement("div");
    wrapper.style.overflow = "scroll";
    wrapper.style.position = "absolute";
    wrapper.style.background = BACKGROUND;
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    this.wrapper = wrapper;
    const canvas = document.createElement("canvas");
    canvas.style.cursor = "text";

    this.canvas = canvas;
    canvas.width = 12080;
    canvas.height = 620;
    canvas.style.zIndex = 100;
    canvas.style.position = "absolute";

    const textareaForClipBoard = document.createElement("textarea"); // a hack for having copy-paste without the browser asking questions
    textareaForClipBoard.style.height = "0px";
    textareaForClipBoard.style.width = "0px";
    textareaForClipBoard.style.top = "-100px";
    // textareaForClipBoard.style.position = "absolute";
    this.textareaForClipBoard = textareaForClipBoard;


    this.divSelection = document.createElement("div");
    this.divSelection.style.position = "absolute";
    this.divSelection.style.backgroundColor = SELECTIONBACKGROUND;
    this.divSelection.style.borderLeft = "1px solid black";
    this.divSelection.style.pointerEvents = "none";
    this.divSelection.style.zIndex = 1;




    this._cursorBlinkingReset();


    this.wrapper.appendChild(this.divSelection);
    shadow.appendChild(wrapper);
    wrapper.appendChild(canvas);
    shadow.appendChild(textareaForClipBoard);

    this.text2d = new Text2D("");
    this.clipBoard = "";

    this.cancelStack = new CancelStack();

    this.cursor = new Point(0, 0);
    let cursorMouse = new Point(0, 0);
    this.endSelection = new Point(0, 0);
    this.dAndDShift = undefined;
    this.dAndDTopLeft = undefined;

    const ctx = canvas.getContext("2d");

    this.isCursorVisible = true;

    this.update();

    this.onscroll = this.update;

    const selectionValidate = () => {
      const newCursor = new Point(Math.min(this.cursor.x, this.endSelection.x), Math.min(this.cursor.y, this.endSelection.y));
      const newEndSelection = new Point(Math.max(this.cursor.x, this.endSelection.x), Math.max(this.cursor.y, this.endSelection.y));
      this.cursor = newCursor;
      this.endSelection = newEndSelection;
    }

    const execute = (a) => { this.cancelStack.push(a); }

    const getSelectionZone = () => this.text2d.extractZone(this.cursor.x, this.cursor.y, this.endSelection.x, this.endSelection.y);
    const copySelection = () => {
      this.clipBoard = getSelectionZone();
      navigator.clipboard.writeText(this.clipBoard);
    }

    this.blit = (clipText) => {
      selectionValidate();
      const clipText2D = new Text2D(clipText);
      const action = new ActionBlit(this.text2d, this.cursor, clipText);
      execute(action);
      this.cursor.x += clipText2D.width;
      this.cursor.y += clipText2D.height - 1;
      this.endSelection = this.cursor;
      this.update();
    }


    this.write = (clipText) => {
      selectionValidate();
      const clipText2D = new Text2D(clipText);
      const action = new ActionWrite(this.text2d, this.cursor, clipText);
      execute(action);
      this.cursor.x += clipText2D.width;
      this.cursor.y += clipText2D.height - 1;
      this.endSelection = this.cursor;
      this.update();
    }

    const deleteSelection = () => {
      selectionValidate();
      const E = stringEmptyRectangle(this.endSelection.x - this.cursor.x + 1, this.endSelection.y - this.cursor.y + 1);
      const action = new ActionBlit(this.text2d, this.cursor, E);
      execute(action);
    }

    const evtToPoint = (evt) => new Point(Math.floor(evt.offsetX / CELLW), Math.floor(evt.offsetY / CELLH));

    canvas.onmousedown = (evt) => {
      this.isCursorVisible = true;
      const p = evtToPoint(evt);
      selectionValidate();

      if (this.isCursorInSelection(p)) {
        this.dAndDShift = new Point(p.x - this.cursor.x, p.y - this.cursor.y);
        this.dAndDTopLeft = this.cursor;
      }
      else {
        this.cursor = cursorMouse;
        this.endSelection = cursorMouse;
        this.setCursorBlinkingVisible();
      }
      requestAnimationFrame(() => this.update());
    }




    canvas.onmousemove = (evt) => {
      cursorMouse = evtToPoint(evt);
      if (this.dAndDTopLeft)
        this.dAndDTopLeft = new Point(cursorMouse.x - this.dAndDShift.x, cursorMouse.y - this.dAndDShift.y);
      else if (evt.buttons) {
        this.setCursorBlinkingVisible();
        this.endSelection = cursorMouse;

        this.makePositionVisible({ x: cursorMouse.x + 1, y: cursorMouse.y })
        this.makePositionVisible({ x: cursorMouse.x - 1, y: cursorMouse.y })

      }
      else
        canvas.style.cursor = this.isCursorInSelection(cursorMouse) ? "grab" : "text";

      requestAnimationFrame(() => this.update());
    }

    canvas.onmouseup = (evt) => {
      selectionValidate();
      if (this.dAndDTopLeft) {
        const A = getSelectionZone();
        if (!evt.ctrlKey) deleteSelection();
        execute(new ActionBlit(this.text2d, this.dAndDTopLeft, A));
        this.endSelection.x += this.dAndDTopLeft.x - this.cursor.x;
        this.endSelection.y += this.dAndDTopLeft.y - this.cursor.y;
        this.cursor = this.dAndDTopLeft;
        this.dAndDTopLeft = undefined;
        requestAnimationFrame(() => this.update());
      }
    }

    canvas.tabIndex = 1000;
    this.onkeydown = (evt) => {
      this.setCursorBlinkingVisible();


      this.resizeCanvas();

      if (!evt.shiftKey)
        selectionValidate();
      if (evt.ctrlKey) {
        if (!evt.shiftKey && evt.key == "z") this.cancelStack.undo();
        else if (evt.key == "y" || (evt.shiftKey && evt.key == "Z")) this.cancelStack.redo();
        if (evt.key == "x") {
          copySelection();
          deleteSelection();
        }
        else if (evt.key == "c")
          copySelection();
        else if (evt.key == "v") {
          setTimeout(() => {
            this.write(this.textareaForClipBoard.value);
          }, 100);

        }//navigator.clipboard.readText().then((t) => this.write(t));
        else if (evt.key == "a") {
          this.cursor = new Point(0, 0);
          this.endSelection = new Point(this.text2d.width, this.text2d.height);
        }
        else if (evt.key == "l") {
          this.cursor = new Point(0, this.cursor.y);
          this.endSelection = new Point(this.text2d.width, this.endSelection.y);
          evt.preventDefault();
        }
        else if (evt.key == "m") {
          this.cursor = new Point(this.cursor.x, 0);
          this.endSelection = new Point(this.endSelection.x, this.text2d.height);
          evt.preventDefault();
        }
      }
      else if (evt.key == "ArrowLeft") {
        this.isCursorVisible = true;
        if (evt.shiftKey) {
          this.endSelection = this.endSelection.left();
        }
        else {
          this.cursor = this.cursor.left();
          this.endSelection = this.cursor;
        }
        evt.preventDefault();
      }
      else if (evt.key == "ArrowUp") {
        this.isCursorVisible = true;
        if (evt.shiftKey) {
          this.endSelection = this.endSelection.up();
        }
        else {
          this.cursor = this.cursor.up();
          this.endSelection = this.cursor;
        }
        evt.preventDefault();
      }
      else if (evt.key == "ArrowDown") { this.endSelection = this.endSelection.down(); this.isCursorVisible = true; if (!evt.shiftKey) this.cursor = this.endSelection; evt.preventDefault(); }
      else if (evt.key == "ArrowRight") { this.endSelection = this.endSelection.right(); this.isCursorVisible = true; if (!evt.shiftKey) this.cursor = this.endSelection; evt.preventDefault(); }
      else if (evt.key == "Backspace") {
        const isSelectionLinesEmpty = () => {
          for (let y = this.cursor.y; y <= this.endSelection.y; y++)
            if (!this.text2d.isLineEmpty(y))
              return false;
          return true;
        }

        if (this.cursor.x == 0 && isSelectionLinesEmpty()) {
          for (let y = this.cursor.y; y <= this.endSelection.y; y++) {
            const action = new ActionDeleteLine(this.text2d, y);
            execute(action);
          }
        }
        else {
          if (this.endSelection.x == this.cursor.x) {
            this.cursor = this.cursor.left();
            this.endSelection.x = this.cursor.x;
          }
          let x = 0;
          for (let y = this.cursor.y; y <= this.endSelection.y; y++)
            x = Math.max(x, this.text2d.getXlastCurrentWord(this.endSelection.x, y));

          const action = new ActionBlit(this.text2d, this.cursor,
            addSuffixSameLetter(this.text2d.extractZone(this.endSelection.x + 1, this.cursor.y, x, this.endSelection.y), " ".repeat(this.endSelection.x + 1 - this.cursor.x)));
          execute(action);

          this.endSelection.x = this.cursor.x;
        }
      }
      else if (evt.key == "Escape")
        this.endSelection = this.cursor;
      else if (evt.key == "Delete")
        deleteSelection();
      else if (evt.key == "Enter") {
        const action = new ActionInsertLine(this.text2d, (this.cursor.x == 0) ? this.cursor.y : this.cursor.y + 1);
        execute(action)
        this.cursor = this.cursor.down();
        this.endSelection = this.cursor;

      }
      else if (evt.key.length == 1) {
        let x = 0;
        for (let y = this.cursor.y; y <= this.endSelection.y; y++)
          x = Math.max(x, this.text2d.getXlastCurrentWord(this.cursor.x, y));

        const action = new ActionWrite(this.text2d, this.cursor,
          Array(this.endSelection.y - this.cursor.y + 1).fill(evt.key).join("\n"));
        execute(action);
        this.cursor.x++;
        this.endSelection = new Point(this.cursor.x, this.endSelection.y);
        evt.preventDefault();
      }
      this.update();

      this.makePositionVisible(this.endSelection);
      this.textareaForClipBoard.value = "";
    }



  }



  resizeCanvas() {
    const canvas = this.canvas;
    const ctx = canvas.getContext("2d");
    canvas.width = Math.max(canvas.width, CELLW * (this.cursor.x + 6));
    canvas.height = Math.max(canvas.height, CELLH * (this.cursor.y + 6));
    canvas.width = Math.max(canvas.width, CELLW * (this.text2d.width + 4));
    canvas.height = Math.max(canvas.height, CELLH * (this.text2d.height + 4));
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "14px Monospace";
  }


  get visibleZone() {
    return {
      x: Math.floor(this.wrapper.scrollLeft / CELLW),
      y: Math.floor(this.wrapper.scrollTop / CELLH),
      w: Math.floor(this.wrapper.clientWidth / CELLW),
      h: Math.floor(this.wrapper.clientHeight / CELLH)
    };
  }

  updateSelection() {
    this.divSelection.style.left = CELLW * Math.min(this.cursor.x, this.endSelection.x) + "px";
    this.divSelection.style.top = CELLH * Math.min(this.cursor.y, this.endSelection.y) + "px";
    this.divSelection.style.width = CELLW * (Math.abs(this.endSelection.x - this.cursor.x) + 1) + "px";
    this.divSelection.style.height = CELLH * (Math.abs(this.endSelection.y - this.cursor.y) + 1) + "px";
  }

  update() {
    this.updateSelection();
    const visibleZone = this.visibleZone;
    const canvas = this.canvas;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = visibleZone.y; y <= visibleZone.y + visibleZone.h; y++)
      for (let x = visibleZone.x; x <= visibleZone.x + visibleZone.w; x++) {
        const char = this.text2d.getCharAt(x, y);
        if (char != " ") {
          ctx.fillStyle = COLOR;
          if (isDigit(char)) ctx.fillStyle = DIGITCOLOR;
          if (char == "(" || char == ")") ctx.fillStyle = BRACKETCOLOR;
          if (char == "[" || char == "]") ctx.fillStyle = BRACKETCOLOR;
          if (char == "," || char == "'") ctx.fillStyle = COMMACOLOR;
          if (char == "#" || char == "♭" || char == "♯") ctx.fillStyle = SPECIALSYMBOLCOLOR;

          ctx.fillText(char, CELLW / 2 + x * CELLW, CELLH / 2 + y * CELLH);
        }
      }

    if (this.dAndDTopLeft) {
      ctx.strokeStyle = COLOR;
      ctx.strokeRect(this.dAndDTopLeft.x * CELLW, this.dAndDTopLeft.y * CELLH,
        CELLW * (Math.abs(this.endSelection.x - this.cursor.x) + 1),
        CELLH * (Math.abs(this.endSelection.y - this.cursor.y) + 1));
    }

    ctx.strokeStyle = "rgba(128, 128, 128, 0.2)";
    const drawLine = (x1, y1, x2, y2) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const drawH = (y) => { drawLine(0, y * CELLH, canvas.width, y * CELLH); }
    const drawV = (x) => { drawLine(x * CELLW, 0, x * CELLW, canvas.height); }

    drawH(Math.min(this.cursor.y, this.endSelection.y));
    drawH(Math.max(this.cursor.y, this.endSelection.y) + 1);
    drawV(Math.min(this.cursor.x, this.endSelection.x));
    drawV(Math.max(this.cursor.x, this.endSelection.x) + 1);

    this.onchange();

    this.textareaForClipBoard.value = "";
    this.textareaForClipBoard.focus({
      preventScroll: true
    });
  }

  makePositionVisible(position) {
    const visibleZone = this.visibleZone;

    if (position.x < visibleZone.x)
      this.wrapper.scrollLeft = position.x * CELLW;
    else if (position.x >= visibleZone.x + visibleZone.w - 1)
      this.wrapper.scrollLeft = (position.x + 1 - visibleZone.w) * CELLW;

    if (position.y <= visibleZone.y + 1)
      this.wrapper.scrollTop = (position.y - 1) * CELLH;
    else if (position.y >= visibleZone.y + visibleZone.h - 2)
      this.wrapper.scrollTop = (position.y + 2 - visibleZone.h) * CELLH;
  }

  get lines() { return this.text2d.lines; }
  get text() { return this.text2d.text; }
  set text(txt) { this.text2d.text = txt; this.resizeCanvas(); this.update(); }
  onchange = () => { };
}





customElements.define("text-map-editor", TextMapEditor);