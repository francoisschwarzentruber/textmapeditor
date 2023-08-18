String.prototype.replaceAt = function (index, replacement) {
  return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}



class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  left() { this.x = Math.max(0, this.x - 1); }
  up() { this.y = Math.max(0, this.y - 1); }
  right() { this.x++; }
  down() { this.y++; }
}

class TextMapEditor extends HTMLElement {
  constructor() {
    super();

    // Création d'une racine fantôme
    const shadow = this.attachShadow({ mode: "open" });
    const wrapper = document.createElement("div");

    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;

    shadow.appendChild(wrapper);
    wrapper.appendChild(canvas);

    this.data = new Array();

    for (let y = 0; y < 100; y++)
      this.data[y] = "azeiww                                             ";

    const CELLW = 9;
    const CELLH = 16;

    let cursor = new Point(0, 0);

    const update = () => {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, 1000, 1000)
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let y = 0; y < 100; y++)
        for (let x = 0; x < 100; x++) {
          if (x == cursor.x && y == cursor.y) {
            ctx.fillStyle = "blue";
            ctx.fillRect(x * CELLW, y * CELLH, CELLW, CELLH);
          }
          if (this.data[y][x] != undefined) {
            ctx.fillStyle = "white";
            ctx.fillText(this.data[y][x], CELLW / 2 + x * CELLW, CELLH / 2 + y * CELLH);

          }
        }
    }

    update();

    canvas.onmousedown = (evt) => {
      cursor = new Point(Math.floor(evt.offsetX / CELLW), Math.floor(evt.offsetY / CELLH));
      update();
    }

    canvas.tabIndex = 1000;
    canvas.onkeydown = (evt) => {
      if (evt.key == "ArrowLeft") cursor.left();
      if (evt.key == "ArrowUp") cursor.up();
      if (evt.key == "ArrowDown") cursor.down();
      if (evt.key == "ArrowRight") cursor.right();

      if (evt.key.length == 1) {
        this.data[cursor.y] = this.data[cursor.y].replaceAt(cursor.x, evt.key);
        cursor.x++;
      }
      update();
    }

  }
}

customElements.define("text-map-editor", TextMapEditor);

