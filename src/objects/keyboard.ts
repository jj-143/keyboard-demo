import * as THREE from "three";
import { loadGLTF } from "../lib/utils";

export default class Keyboard {
  scene: THREE.Scene;
  render: () => void;

  keyObjectMap: Record<string, THREE.Mesh | THREE.Object3D> = {};

  #onInputListeners: Set<(key: string) => void> = new Set();
  #pressingKeys: Set<THREE.Object3D> = new Set();

  constructor(scene: THREE.Scene, render: () => void) {
    this.scene = scene;
    this.render = render;

    this.setupModel();
    this.attachEvents();
    this.setupMouse();
  }

  setupModel() {
    loadGLTF(`${import.meta.env.VITE_ASSET_BASE_URL}/air75-1.glb`).then(
      (gltf) => {
        this.scene.add(gltf.scene);
        gltf.scene.scale.multiplyScalar(80);

        const keys = gltf.scene.getObjectByName("Keys");

        keys?.children.forEach((row) => {
          row.children.forEach((key) => {
            const name: string = key.userData["name"];
            const keyName = name.match(/-(.*)$/)?.[1];
            if (!keyName) {
              console.log("noname:", name);
              return;
            }
            this.keyObjectMap[keyName] = key;

            // pre-calculate key press positions
            key.userData.upPos = key.position.toArray();
            key.userData.downPos = key.position
              .clone()
              .add(new THREE.Vector3(0, -0.027, 0))
              .toArray();
          });
        });

        this.render();
      }
    );
  }

  pressKey(keyOrObject: string | THREE.Object3D) {
    const object =
      typeof keyOrObject === "string"
        ? this.getKeyObjByKey(keyOrObject)
        : keyOrObject;
    if (!object) return;
    object.position.fromArray(object.userData.downPos as THREE.Vector3Tuple);
    this.render();
  }

  releaseKey(keyOrObject: string | THREE.Object3D) {
    const object =
      typeof keyOrObject === "string"
        ? this.getKeyObjByKey(keyOrObject)
        : keyOrObject;
    if (!object) return;
    object.position.fromArray(object.userData.upPos as THREE.Vector3Tuple);
    this.render();
  }

  attachEvents() {
    document.addEventListener("keydown", (e) => {
      e.preventDefault();
      this.pressKey(e.code);
    });

    document.addEventListener("keyup", (e) => {
      this.releaseKey(e.code);
    });
  }

  getKeyObjByKey(key: string): THREE.Object3D | THREE.Mesh | undefined {
    return this.keyObjectMap[key as keyof typeof this.keyObjectMap];
  }

  setupMouse() {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const findKey = () => {
      // update the picking ray with the camera and pointer position
      const camera = this.scene.getObjectByName("main-camera") as THREE.Camera;
      raycaster.setFromCamera(pointer, camera);

      // calculate objects intersecting the picking ray
      const keys = this.scene.getObjectByName("Keys") as THREE.Object3D;
      const intersects = raycaster.intersectObject(keys);

      let intersect: THREE.Object3D | null = null;
      for (let i = 0; i < intersects.length; i++) {
        const it = intersects[i];
        let current: typeof it.object | null = it.object;
        while (current) {
          if (current.parent?.userData.name?.startsWith("Row")) {
            intersect = current;
            break;
          }
          current = current.parent;
        }
        if (intersect) break;
      }

      return intersect;
    };

    window.addEventListener("pointerdown", (event) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

      const key = findKey();
      if (key) {
        this.#pressingKeys.add(key);
        this.pressKey(key);
        const char = toKeyCharacter(key);
        if (char) {
          this.#onInputListeners.forEach((callback) => {
            callback(char);
          });
        }

        const release = () => {
          this.#pressingKeys.delete(key);
          this.releaseKey(key);
          window.removeEventListener("pointerup", release);
        };
        window.addEventListener("pointerup", release);
      }
    });
  }

  onInput(callback: (key: string) => void) {
    this.#onInputListeners.add(callback);
  }
}

// utils

function toKeyCharacter(keyObject: THREE.Object3D): string | undefined {
  const name: string = keyObject.userData["name"];
  const key = name.match(/-(.*)$/)?.[1];
  if (!key) return;

  if (key.startsWith("Key") || key.startsWith("Digit")) {
    return key.replace("Key", "").replace("Digit", "").toLocaleLowerCase();
  }

  return (
    {
      Backquote: "`",
      Minus: "-",
      Equal: "=",
      BracketLeft: "[",
      BracketRight: "]",
      Backslash: "\\",
      Semicolon: ";",
      Quote: "'",
      Comma: ",",
      Period: ".",
      Slash: "/",
      Space: " ",
    }[key] ?? key
  );
}
