import { Project } from "./lib/project";
import Monitor from "./objects/monitor";
import Keyboard from "./objects/keyboard";

const project = new Project();
const renderFn = project.render.bind(project);

new Keyboard(project.scene, renderFn);
new Monitor(project.scene, renderFn);

project.render();
