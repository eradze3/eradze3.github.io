import * as THREE from './vendor/three.module.js';
const cache=new Map();
function colorTexture(name,repeat){if(typeof document==='undefined')return null;const key=name+repeat;if(!cache.has(key)){const t=new THREE.TextureLoader().load('./assets/materials/'+name);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=4;t.colorSpace=THREE.SRGBColorSpace;cache.set(key,t);}return cache.get(key);}
const finish=(color,roughness=.65,metalness=.1,extra={})=>new THREE.MeshStandardMaterial({color,roughness,metalness,envMapIntensity:.45,...extra});
// Tonal separation gives the existing light and cached contact shadows more
// definition: matte blue walls, a cooler floor, satin tops and dark metal edges.
export function studioMaterials(){return{floor:finish('#30495e',.72,.04,{envMapIntensity:.35}),wall:finish('#192f45',.94,.01,{envMapIntensity:.23}),wood:finish('#b1b2a8',.64,.04,{map:colorTexture('wood-color.jpg',.5)}),fabric:finish('#3e5c71',.94,0,{map:colorTexture('fabric-color.jpg',2)}),metal:finish('#526b7e',.32,.76,{envMapIntensity:.62}),table:finish('#89a4b5',.43,.28,{envMapIntensity:.56})};}
export function modelMaterials(){return{stone:finish('#c9dbe5',.65,.08),wood:finish('#b3bdc0',.68,.02,{map:colorTexture('wood-color.jpg',2)}),fabric:finish('#506e83',.92,0),metal:finish('#7392a4',.4,.55)};}
