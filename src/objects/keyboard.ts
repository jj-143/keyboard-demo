import * as THREE from "three";
import { loadGLTF } from "../lib/utils";

export default class Keyboard {
  scene: THREE.Scene;
  render: () => void;

  keyObjectMap: Record<string, THREE.Mesh | THREE.Object3D> = {};

  keyDistance = 0.04;
  keyDownY = 0;
  keyUpY = 0;

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

        // set key levels
        const singleKey = this.keyObjectMap["KeyA"];
        this.keyUpY = singleKey?.position.y ?? 0;
        this.keyDownY = this.keyUpY - this.keyDistance;

        this.render();
      }
    );
  }

  pressKey(key: string) {
    const object = this.getKeyObjByKey(key);
    if (!object) return;
    object.position.fromArray(object.userData.downPos as THREE.Vector3Tuple);
    this.render();
  }

  releaseKey(key: string) {
    const object = this.getKeyObjByKey(key);
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

    const render = () => {
      // update the picking ray with the camera and pointer position
      const camera = this.scene.getObjectByName("main-camera") as THREE.Camera;
      raycaster.setFromCamera(pointer, camera);

      // calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(this.scene.children);

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

      this.render();
    };

    window.addEventListener("click", (event) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      window.requestAnimationFrame(render);
    });
  }
}
