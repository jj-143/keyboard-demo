import { Project } from "./lib/project";
import Monitor from "./objects/monitor";
import Keyboard from "./objects/keyboard";

const project = new Project();
const renderFn = project.render.bind(project);

const keyboard = new Keyboard(project.scene, renderFn);
const monitor = new Monitor(project.scene, renderFn);

keyboard.onInput((key) => {
  monitor.handleKeyInput(key);
});

project.render();
