# Text map editor

This text editor is an HTML Web component dedicated for editing texts like **ascii-art**, or a **tile editor**, texts where both rows and colmuns are important (hence the word **map** like a 2D map). The selection is rectangular.

![image](https://github.com/francoisschwarzentruber/textmapeditor/assets/43071857/dc4f0980-b20d-450f-9a4a-68b5fed6b4ee)

## Features

- HTML Web component
- Less than 15kB
- Implemented with canvas
- Drag drop
- Rectangular selection
- Multiple cursors
- Ctrl + Z, Y: Undo/redo
- Ctrl + L: select line(s)
- Ctrl + M: select column(s)
- Ctrl + X, C, V: Cut/copy/paste
- Retro-style editor
- Cursor column/row guidelines
- UTF-8 characters

## Roadmap
- Customizable (like having pictures etc. instead of text)

## How to use it

- Add ` <script src="https://cdn.jsdelivr.net/gh/francoisschwarzentruber/textmapeditor@latest/textmapeditor.js"></script>`
- Add ` <text-map-editor id="editor"></text-map-editor>`
- Access the text with the properties `editor.text` (the string of the full text) or `editor.lines` (array of lines)
