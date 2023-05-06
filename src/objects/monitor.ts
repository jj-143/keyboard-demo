import * as THREE from "three";
import { color } from "../lib/shared";

import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader";

export default class Monitor {
  scene: THREE.Scene;
  renderFn: () => void;

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

    const geometry = new TextGeometry(this.content, {
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
    const lines = this.content.split("\n");
    if (this.objectData.caret.mesh) {
      const { mesh } = this.objectData.caret;
      mesh.position.x = -100 + 10 + lines[lines.length - 1].length * 3.3 + 2;
      mesh.position.y = 100 - 20 + 25 + lines.length * -7.8 + 8 + 2;
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
    document.addEventListener("keydown", (e) => {
      if (e.key === "Backspace") {
        this.updateContent(
          this.content.substring(0, Math.max(0, this.content.length - 1))
        );
        return;
      }

      if (e.key === "Enter") {
        this.updateContent(this.content + "\n");
        return;
      }

      if (!e.key.match(/^[\w`~!@#$%^&*()_+-=\[\]{}\\|'"<>? ]$/)) return;

      this.updateContent(this.content + e.key);
    });
  }
}
