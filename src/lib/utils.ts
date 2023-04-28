import { DataTexture } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

export function loadGLTF(
  url: string,
  options?: { onProgress?: (event: ProgressEvent) => void },
): Promise<GLTF> {
  return new Promise<GLTF>((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => resolve(gltf), options?.onProgress, reject);
  });
}

export function loadRGBE(
  url: string,
  options?: { onProgress?: (event: ProgressEvent) => void },
): Promise<[DataTexture, object]> {
  return new Promise((resolve, reject) => {
    const loader = new RGBELoader();
    loader.load(url, (...results) => resolve(results), options?.onProgress, reject);
  });
}
