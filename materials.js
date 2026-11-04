import * as THREE from './vendor/three.module.js';
const cache=new Map();
function colorTexture(name,repeat){if(typeof document==='undefined')return null;const key=name+repeat;if(!cache.has(key)){const t=new THREE.TextureLoader().load('./assets/materials/'+name);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=4;t.colorSpace=THREE.SRGBColorSpace;cache.set(key,t);}return cache.get(key);}
const finish=(color,roughness=.65,metalness=.1,extra={})=>new THREE.MeshStandardMaterial({color,roughness,metalness,envMapIntensity:.45,...extra});
export function studioMaterials(){return{floor:finish('#263d52',.8,.05),wall:finish('#22394e',.87,.02),wood:finish('#a9b5bc',.62,.06,{map:colorTexture('wood-color.jpg',.5)}),fabric:finish('#3c586c',.92,0,{map:colorTexture('fabric-color.jpg',2)}),metal:finish('#566e83',.36,.65),table:finish('#7895a9',.48,.3)};}
export function modelMaterials(){return{stone:finish('#c9dbe5',.65,.08),wood:finish('#b3bdc0',.68,.02,{map:colorTexture('wood-color.jpg',2)}),fabric:finish('#506e83',.92,0),metal:finish('#7392a4',.4,.55)};}
