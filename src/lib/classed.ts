import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import { loadRGBE } from "./utils";

import environment from "../assets/environment.hdr";

export class Project {
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;

  orbitControls: OrbitControls;

  constructor() {
    const container = document.createElement("div");
    document.body.appendChild(container);

    this.scene = new THREE.Scene();

    this.camera = this.createCamera();

    // Lights
    // const light = new THREE.PointLight(0xffffff, 0.5, 100);
    // light.position.set(1, 1, 1);
    // const light = new THREE.AmbientLight(0xffffff, 0.6);
    const light = new THREE.DirectionalLight(0xffffff, 0.4);
    light.position.set(0, 1, 0);
    light.lookAt(0, 0, 0);
    this.scene.add(light);

    // const pointLightHelper = new THREE.PointLightHelper(light, 1);
    // this.scene.add(pointLightHelper);

    // Renderer setup

    const renderer = (this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    }));
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    window.addEventListener("resize", this.onWindowResize.bind(this));

    // Scene setup
    this.setupEnvironment();

    // helpers
    this.orbitControls = this.createOrbitControls();
    this.addHelpers(light);
    this.addAxisHelper();
  }

  setupEnvironment() {
    loadRGBE(environment).then(([texture]) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      // this.scene.background = texture;
      this.scene.background = new THREE.Color(0x77bebe);
      this.scene.environment = texture;
      this.render();
    });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.render();
  }

  createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.25,
      2000
    );
    camera.position.set(0, 124.1, 246.77444985578987);
    return camera;
  }

  createOrbitControls() {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.addEventListener("change", this.render.bind(this)); // use if there is no animation loop
    controls.minDistance = 2;
    controls.maxDistance = 1000;

    // about the mid point of the screen
    controls.target.set(0, 35, 0);
    controls.update();
    return controls;
  }

  addHelpers(object: THREE.Object3D) {
    const tc = new TransformControls(this.camera, this.renderer.domElement);

    tc.addEventListener("change", this.render.bind(this));
    tc.addEventListener("dragging-changed", (event) => {
      this.orbitControls.enabled = !event.value;
    });

    // tc.attach(object);
    // this.scene.add(tc);
  }

  addAxisHelper() {
    // const axesHelper = new THREE.AxesHelper(5);
    // this.scene.add(axesHelper);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
