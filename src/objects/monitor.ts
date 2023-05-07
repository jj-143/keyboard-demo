import * as THREE from "three";
import { color } from "../lib/shared";

import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader";

const LINE_SEP = "\u2028";

const REGEX_SOFT_LINES = new RegExp(LINE_SEP, "g");
const REGEX_LINES = new RegExp(`(${LINE_SEP}|\n)`, "g");

export default class Monitor {
  scene: THREE.Scene;
  renderFn: () => void;

  cursor = [0, 0];
  printWidth = 55;
  content: string = "i just hope ur doing well";
  blinkAnimationId?: number;

  textColor: number = color.color1;
  font!: Font;

  materials = {
    text: new THREE.MeshBasicMaterial({ color: this.textColor }),
    caret: new THREE.MeshBasicMaterial({
      color: this.textColor,
      transparent: true,
    }),
  };

  objectData = {
    caret: {
      mesh: undefined as THREE.Mesh | undefined,
    },
    content: {
      geometry: undefined as TextGeometry | undefined,
      mesh: undefined as THREE.Mesh | undefined,
    },
  };

  constructor(scene: THREE.Scene, renderFn: () => void) {
    this.scene = scene;
    this.renderFn = renderFn;

    this.setupModel();
    this.loadFont().then(() => {
      this.renderCaret();
      this.renderContent();
    });

    this.setupKeyboardEvent();

    // set cursor to the end of content
    const lines = this.content.split("\n");
    this.cursor = [lines.length - 1, lines[lines.length - 1].length];
  }

  setupModel() {
    const geometry = new THREE.PlaneGeometry(200, 100);
    const material = new THREE.MeshBasicMaterial({ color: color.bg });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 70, -80);
    this.scene.add(mesh);
  }

  loadFont(): Promise<Font> {
    return new Promise<Font>((resolve) => {
      const loader = new FontLoader();
      loader.load(
        `${
          import.meta.env.VITE_ASSET_BASE_URL
        }/droid_sans_mono_regular.typeface.json`,
        (font) => {
          this.font = font;
          resolve(font);
        }
      );
    });
  }

  renderContent() {
    const { content: obj } = this.objectData;

    // clear previous objects
    if (obj.mesh) {
      this.scene.remove(obj.mesh);
      obj.geometry?.dispose();
      obj.mesh?.remove();
    }

    // display soft lines as hard lines
    const toRender = this.content.replace(REGEX_SOFT_LINES, "\n");

    const geometry = new TextGeometry(toRender, {
      font: this.font,
      size: 4,
      height: 1,
      curveSegments: 4,
    });
    geometry.computeBoundingBox();

    const mesh = new THREE.Mesh(geometry, this.materials.text);

    mesh.position.x = -100 + 10;
    mesh.position.y = 100 - 20 + 25;
    mesh.position.z = -80 - 0.6;

    this.objectData.content = {
      geometry,
      mesh,
    };

    this.positionCaret();
    this.scene.add(mesh);
  }

  updateContent(text: string) {
    this.content = text;
    this.renderContent();
    this.stopBlink();
    this.animateBlink();
  }

  renderCaret() {
    const geometry = new THREE.BoxGeometry(2, 6, 1);
    const mesh = new THREE.Mesh(geometry, this.materials.caret);

    mesh.position.z = -80;
    this.objectData.caret.mesh = mesh;
    this.scene.add(mesh);

    this.animateBlink();
  }

  positionCaret() {
    const row = this.content.match(REGEX_LINES)?.length ?? 0;
    // don't roll over the cursor to the next line when at the end of a line (printWidth)
    // e.g. printWidth(3):
    // col - 0, 1, 2, 3, 1, 2, 3, 1, 2, 3
    const col = ((this.cursor[1] - 1) % this.printWidth) + 1;

    if (this.objectData.caret.mesh) {
      const { mesh } = this.objectData.caret;
      mesh.position.x = -100 + 10 + col * 3.3 + 2;
      mesh.position.y = 100 - 20 + 25 + row * -7.8 + 2;
    }
  }

  animateBlink() {
    // to start in full opacity.
    this.materials.caret.opacity = 1;
    const id = setInterval(() => {
      this.blinkCaret();
    }, 500);

    this.blinkAnimationId = id;
  }

  stopBlink() {
    clearInterval(this.blinkAnimationId);
    this.blinkAnimationId = undefined;
  }

  blinkCaret() {
    const { caret } = this.materials;
    if (caret.opacity < 0.5) {
      caret.opacity = 1;
    } else {
      caret.opacity = 0;
    }
    this.renderFn();
  }

  // interactive stuff

  setupKeyboardEvent() {
    document.addEventListener("keydown", (e) => this.handleKeyInput(e.key));
  }

  #handleBackspace() {
    const lines = this.content.split("\n");
    const [row, col] = this.cursor;

    if (col > 0) {
      this.cursor[1] -= 1;
      const line = lines[row].replace(REGEX_SOFT_LINES, "");
      const draft = line.substring(0, col - 1) + line.substring(col);
      lines.splice(row, 1, wrapLine(draft, this.printWidth));

      this.updateContent(lines.join("\n"));
    } else {
      // remove line
      this.cursor[0] = Math.max(0, row - 1);
      this.cursor[1] = lines[this.cursor[0]].replace(
        REGEX_SOFT_LINES,
        ""
      ).length;
      this.updateContent(lines.slice(0, this.cursor[0] + 1).join("\n"));
    }
    return;
  }

  #handleInsert(text: string) {
    const [row, col] = this.cursor;
    const lines = this.content.split("\n");

    const line = lines[row].replace(REGEX_SOFT_LINES, "");
    const draft = line.substring(0, col) + text + line.substring(col);

    // replace current line
    lines.splice(row, 1, wrapLine(draft, this.printWidth));

    this.cursor[1] += text.length;
    this.updateContent(lines.join("\n"));
  }

  handleKeyInput = (key: string) => {
    if (key === "Backspace") {
      return this.#handleBackspace();
    }

    if (key === "Enter") {
      const [row] = this.cursor;
      this.cursor = [row + 1, 0];
      this.updateContent(this.content + "\n");
      return;
    }

    // insert text
    if (!key.match(/^[\w`~!@#$%^&*()_+-=\[\]{}\\|'"<>? ]$/)) return;
    this.#handleInsert(key);
  };
}

function wrapLine(line: string, printWidth: number): string {
  return (
    line.match(new RegExp(`.{1,${printWidth}}`, "g"))?.join(LINE_SEP) ?? ""
  );
}
