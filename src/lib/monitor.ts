import * as THREE from "three";
import { color } from "./shared";

import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import fontJson from "three/examples/fonts/droid/droid_sans_mono_regular.typeface.json";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader";

export class Monitor {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  font!: Font;

  textColor: number = color.color1;

  content: string = "i just hope ur doing well";
  textMaterial = new THREE.MeshBasicMaterial({ color: this.textColor });
  caretMaterial = new THREE.MeshBasicMaterial({
    color: this.textColor,
    transparent: true,
  });

  caretMesh!: THREE.Mesh;
  blinkAnimationId?: number;

  textRelated: {
    geometry?: TextGeometry;
    mesh?: THREE.Mesh;
  } = {};

  renderFn: () => void;

  constructor(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    renderFn: () => void
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.renderFn = renderFn;

    const geometry = new THREE.PlaneGeometry(200, 100);
    const material = new THREE.MeshBasicMaterial({ color: color.bg });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 70, -80);
    this.scene.add(mesh);

    const loader = new FontLoader();

    // this.font = loader.parse(fontJson);
    loader.load(
      `${
        import.meta.env.VITE_ASSET_BASE_URL
      }/droid_sans_mono_regular.typeface.json`,
      (font) => {
        this.font = font;
        this.displayCaret();
        this.drawScreen();
      }
    );

    document.addEventListener("keydown", (e) => {
      console.log("hi");

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

  drawScreen() {
    if (this.textRelated.mesh) {
      this.scene.remove(this.textRelated.mesh);
    }
    const geometry = new TextGeometry(this.content, {
      font: this.font,
      size: 4,
      height: 1,
      curveSegments: 4,
    });

    geometry.computeBoundingBox();

    const centerOffset =
      -0.5 * (geometry.boundingBox!.max.x - geometry.boundingBox!.min.x);

    const mesh = new THREE.Mesh(geometry, this.textMaterial);

    mesh.position.x = -100 + 10;
    mesh.position.y = 100 - 20 + 25;
    mesh.position.z = -80 - 0.6;
    // console.log(mesh.position);

    this.textRelated.geometry?.dispose();
    this.textRelated.mesh?.remove();

    this.textRelated = {
      geometry,
      mesh,
    };

    this.positionCaret();

    this.scene.add(mesh);
  }

  updateContent(text: string) {
    this.content = text;
    this.drawScreen();
    this.stopBlink();
    this.animateBlink();
  }

  positionCaret() {
    const lines = this.content.split("\n");
    if (this.caretMesh) {
      this.caretMesh.position.x =
        -100 + 10 + lines[lines.length - 1].length * 3.3 + 2;
      this.caretMesh.position.y = 100 - 20 + 25 + lines.length * -7.8 + 8 + 2;
    }
  }

  displayCaret() {
    const geometry = new THREE.BoxGeometry(2, 6, 1);
    const mesh = new THREE.Mesh(geometry, this.caretMaterial);

    mesh.position.z = -80;
    this.caretMesh = mesh;
    this.scene.add(mesh);

    this.animateBlink();
  }

  animateBlink() {
    // to start in full opacity.
    this.caretMaterial.opacity = 1;
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
    if (this.caretMaterial.opacity < 0.5) {
      this.caretMaterial.opacity = 1;
    } else {
      this.caretMaterial.opacity = 0;
    }
    this.renderFn();
  }
}
