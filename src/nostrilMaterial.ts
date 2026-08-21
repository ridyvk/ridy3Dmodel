import * as THREE from "three";
import {
  NOSTRIL_TISSUE_MAX_HALF_WIDTH,
  NOSTRIL_TISSUE_MIN_HALF_WIDTH,
} from "./noseMotion";

export type NostrilTissueUniform = { value: number };

const MIN_WIDTH = NOSTRIL_TISSUE_MIN_HALF_WIDTH.toFixed(7);
const MAX_WIDTH = NOSTRIL_TISSUE_MAX_HALF_WIDTH.toFixed(7);

export function installNostrilTissueShader(
  material: THREE.MeshStandardMaterial,
  tissueUniform: NostrilTissueUniform,
) {
  const previousCompile = material.onBeforeCompile;
  const previousCacheKey = material.customProgramCacheKey.bind(material);

  material.onBeforeCompile = (shader, renderer) => {
    previousCompile.call(material, shader, renderer);
    shader.uniforms.uRabbitNostrilTissue = tissueUniform;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vRabbitSurfacePosition;",
      )
      .replace(
        "#include <skinning_vertex>",
        "#include <skinning_vertex>\nvRabbitSurfacePosition = transformed;",
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uRabbitNostrilTissue;
varying vec3 vRabbitSurfacePosition;

vec2 rabbitFoldInfo(vec2 point, vec2 start, vec2 endPoint) {
  vec2 axis = endPoint - start;
  float along = clamp(dot(point - start, axis) / dot(axis, axis), 0.0, 1.0);
  float distanceToFold = length(point - (start + axis * along));
  return vec2(distanceToFold, along);
}

float rabbitFoldMask(vec2 point, vec2 start, vec2 endPoint, float widthScale) {
  vec2 fold = rabbitFoldInfo(point, start, endPoint);
  float medialTaper = smoothstep(0.08, 0.28, fold.y);
  float lateralTaper = 1.0 - smoothstep(0.76, 0.98, fold.y);
  float taper = medialTaper * lateralTaper;
  float halfWidth = mix(${MIN_WIDTH}, ${MAX_WIDTH}, uRabbitNostrilTissue) * widthScale * taper;
  return (1.0 - smoothstep(halfWidth * 0.48, halfWidth, fold.x)) * taper;
}`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
float rabbitNoseFront = smoothstep(0.477, 0.482, vRabbitSurfacePosition.z);
float rabbitLeftFold = rabbitFoldMask(
  vRabbitSurfacePosition.xy,
  vec2(-0.0038, 0.3681),
  vec2(-0.0257, 0.3843),
  1.0
);
float rabbitRightFold = rabbitFoldMask(
  vRabbitSurfacePosition.xy,
  vec2(0.0039, 0.3682),
  vec2(0.0248, 0.3838),
  0.88
);
float rabbitTissueMask = max(rabbitLeftFold, rabbitRightFold)
  * rabbitNoseFront
  * uRabbitNostrilTissue;
vec3 rabbitMucosa = vec3(0.62, 0.285, 0.31);
diffuseColor.rgb = mix(diffuseColor.rgb, rabbitMucosa, rabbitTissueMask * 0.62);`,
      );
  };

  material.customProgramCacheKey = () =>
    `${previousCacheKey()}-rabbit-surface-fold-v19`;
  material.needsUpdate = true;
}
