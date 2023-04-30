import * as THREE from "three";
import { color } from "../lib/shared";
import { loadGLTF } from "../lib/utils";
import { Project } from "../lib/classed";

import model from "../assets/keyboard.glb";
import model2 from "../assets/keyboard-air75-1.glb";

export class Keyboarded extends Project {
  keyObjectMap: Record<string, THREE.Mesh | THREE.Object3D> = {};
  keyOrder = "qwertyuiop[]asdfghjkl;'zxcvbnm,./";

  keyDistance = 0.04;
  keyDownY = 0;
  keyUpY = 0;

  constructor() {
    super();
    this.setupKeyboard();
    this.attachEvents();
    this.setupMouse();
  }

  setupKeyboard() {
    loadGLTF(model2).then((gltf) => {
      this.scene.add(gltf.scene);

      const keys = gltf.scene.getObjectByName("keys");
      keys?.children.forEach((key) => {
        const keyName = key.name[4];
        console.log(key.name, keyName);
        key.userData["key"] = keyName;
        this.keyObjectMap[keyName] = key;
      });

      // set key levels
      const singleKey = keys?.children[0];
      this.keyUpY = singleKey?.position.y ?? 0;
      this.keyDownY = this.keyUpY - this.keyDistance;

      this.render();
    });
  }

  pressKey(key: string) {
    const object = this.getKeyObjByKey(key);
    if (!object) return;
    object.position.setY(this.keyDownY);
    this.render();
  }

  releaseKey(key: string) {
    const object = this.getKeyObjByKey(key);
    if (!object) return;
    object.position.setY(this.keyUpY);
    this.render();
  }

  attachEvents() {
    document.addEventListener("keydown", (e) => {
      this.pressKey(e.key);
    });

    document.addEventListener("keyup", (e) => {
      this.releaseKey(e.key);
    });
  }

  getKeyObjByKey(key: string): THREE.Object3D | THREE.Mesh | undefined {
    return this.keyObjectMap[key as keyof typeof this.keyObjectMap];
  }

  setupMouse() {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const render = () => {
      // update the picking ray with the camera and pointer position
      raycaster.setFromCamera(pointer, this.camera);

      // calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(this.scene.children);

      console.log(intersects);

      const intersect = intersects.find((it) =>
        it.object.parent?.name.startsWith("key-")
      );

      if (intersect) {
        const key = intersect.object.parent?.userData["key"];
        this.pressKey(key);
        setTimeout(() => {
          this.releaseKey(key);
        }, 100);
      }

      this.renderer.render(this.scene, this.camera);
    };

    window.addEventListener("click", (event) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      window.requestAnimationFrame(render);
    });
  }
}

///////// Utils

function createKeys(): THREE.Mesh[] {
  const rowM = 0.4 + 0.15;
  const row1 = createRow(12);
  positionRow(row1, [0, 0.2, 0]);
  const row2 = createRow(11);
  positionRow(row2, [0.2, 0.2, rowM]);
  const row3 = createRow(10);
  positionRow(row3, [0.4, 0.2, rowM * 2]);

  return row1.concat(row2, row3);
}

function createRow(count: number): THREE.Mesh[] {
  const keys = Array.from(Array(count)).map((_, idx) => {
    const geometry = new THREE.BoxGeometry(0.4, 0.15, 0.4);
    const material = new THREE.MeshPhongMaterial({
      color: color.color1,
      shininess: 1,
      reflectivity: 1,
    });
    const cube = new THREE.Mesh(geometry, material);
    return cube;
  });

  return keys;
}

function positionRow(
  row: THREE.Mesh[],
  startingPosition: [number, number, number]
) {
  const [x, y, z] = startingPosition;
  row.forEach((key, idx) => {
    key.position.set(x + (0.4 + 0.15) * idx, y, z);
  });
}
