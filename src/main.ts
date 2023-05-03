import { Monitor } from "./lib/monitor";
import { Keyboarded } from "./scenes/keyboard";

const project = new Keyboarded();
const monitor = new Monitor(
  project.scene,
  project.renderer,
  project.render.bind(project)
);

project.render();
