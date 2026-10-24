import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export default function RobotScene({ lite = false }) {
  const mount = useRef(null);

  useEffect(() => {
    const holder = mount.current;
    if (!holder) return;
    const w = holder.clientWidth || 360;
    const h = holder.clientHeight || 300;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, w / h, .1, 100);
    camera.position.set(0, .1, 9.5);
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !lite, powerPreference: 'low-power' }); }
    catch { return; } // Thiết bị không hỗ trợ WebGL: giữ hình nền fallback.
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1 : 1.65));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    holder.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0x9bdff9, 0x070819, 1.75));
    const key = new THREE.PointLight(0x38eeff, 42, 14); key.position.set(-3, 3, 5); scene.add(key);
    const rim = new THREE.PointLight(0x9455ff, 40, 14); rim.position.set(3, -2, 2); scene.add(rim);

    const navy = new THREE.MeshStandardMaterial({ color: 0x12233b, metalness: .82, roughness: .23 });
    const black = new THREE.MeshStandardMaterial({ color: 0x050b17, metalness: .54, roughness: .26 });
    const silver = new THREE.MeshStandardMaterial({ color: 0x324c6b, metalness: .84, roughness: .2 });
    const cyan = new THREE.MeshStandardMaterial({ color: 0x44f3fb, emissive: 0x16b8d3, emissiveIntensity: 2.8, metalness: .38, roughness: .2 });
    const purple = new THREE.MeshStandardMaterial({ color: 0xa279fa, emissive: 0x7e49ff, emissiveIntensity: 2.6, metalness: .25 });
    const visor = new THREE.MeshPhysicalMaterial({ color: 0x071c30, metalness: .6, roughness: .16, transparent: true, opacity: .96 });
    const robot = new THREE.Group(); scene.add(robot);

    function rounded(width, height, depth, radius, material, x, y, z) {
      const mesh = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 5, radius), material);
      mesh.position.set(x, y, z);
      robot.add(mesh);
      return mesh;
    }
    rounded(2.6, 2.2, .92, .37, black, 0, .18, -.05);
    rounded(2.46, 2.08, .84, .34, navy, 0, .2, .09);
    rounded(2.2, .88, .19, .22, silver, 0, .30, .57);
    rounded(2.09, .69, .16, .20, visor, 0, .32, .70);
    const leftEye = rounded(.56, .14, .09, .06, cyan, -.49, .32, .82);
    const rightEye = rounded(.56, .14, .09, .06, cyan, .49, .32, .82);
    rounded(.72, .075, .06, .02, black, 0, -.45, .67);
    for (let i = 0; i < 5; i++) rounded(.09, .065, .04, .013, cyan, (i-2)*.12, -.45, .73);
    rounded(.29, .7, .53, .12, silver, -1.37, .13, .01);
    rounded(.29, .7, .53, .12, silver, 1.37, .13, .01);
    rounded(.12, .37, .28, .04, cyan, -1.53, .13, .02);
    rounded(.12, .37, .28, .04, purple, 1.53, .13, .02);
    rounded(.6, .18, .36, .05, silver, 0, 1.37, 0);
    rounded(.13, .27, .13, .045, silver, 0, 1.57, 0);
    const antenna = new THREE.Mesh(new THREE.SphereGeometry(.12, 18, 18), cyan);
    antenna.position.set(0, 1.77, 0); robot.add(antenna);
    rounded(.65, .32, .55, .11, silver, 0, -1.10, -.16);
    rounded(2.2, .54, .71, .19, navy, 0, -1.49, -.2);
    rounded(.65, .08, .07, .03, cyan, 0, -1.42, .2);
    rounded(.23, .6, .58, .08, silver, -1.03, -1.35, -.16).rotation.z = -.28;
    rounded(.23, .6, .58, .08, silver, 1.03, -1.35, -.16).rotation.z = .28;
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x26d9ff, transparent: true, opacity: .35 });
    const backRing = new THREE.Mesh(new THREE.TorusGeometry(2.43, .009, 4, 160), ringMaterial);
    backRing.position.z = -.65; backRing.rotation.x = .24; scene.add(backRing);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.09, .009, 4, 140),
      new THREE.MeshBasicMaterial({ color: 0x985aff, transparent: true, opacity: .4 }));
    ring2.position.z = -1.0; ring2.rotation.y = .18; scene.add(ring2);

    if (!lite) {
      const positions = new Float32Array(170 * 3);
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] = (Math.random() - .5) * 10;
        positions[i + 1] = (Math.random() - .5) * 6;
        positions[i + 2] = (Math.random() - .5) * 3 - 1;
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x3adce7, size: .025, transparent: true, opacity: .75, blending: THREE.AdditiveBlending }));
      scene.add(pts);
    }

    const clock = new THREE.Clock();
    const desired = { x: 0, y: 0 };
    const pointer = (e) => {
      const bounds = holder.getBoundingClientRect();
      desired.y = ((e.clientX - bounds.left) / bounds.width - .5) * .48;
      desired.x = ((e.clientY - bounds.top) / bounds.height - .5) * -.20;
    };
    holder.addEventListener('pointermove', pointer);
    let animationId;
    function tick() {
      const t = clock.getElapsedTime();
      robot.rotation.y += (desired.y + Math.sin(t * .65) * .08 - robot.rotation.y) * .055;
      robot.rotation.x += (desired.x + Math.sin(t * .8) * .018 - robot.rotation.x) * .055;
      robot.position.y = Math.sin(t * 1.3) * .055 + .15;
      leftEye.material.emissiveIntensity = 2.3 + Math.sin(t * 2.6) * .35;
      backRing.rotation.z += .0015;
      ring2.rotation.z -= .001;
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(tick);
    }
    tick();
    const observer = new ResizeObserver(() => {
      const ww = holder.clientWidth, hh = holder.clientHeight;
      if (!ww || !hh) return;
      camera.aspect = ww / hh; camera.updateProjectionMatrix();
      renderer.setSize(ww, hh, false);
    });
    observer.observe(holder);
    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      holder.removeEventListener('pointermove', pointer);
      scene.traverse(obj => { obj.geometry?.dispose(); });
      [navy, black, silver, cyan, purple, visor, ringMaterial, ring2.material].forEach(m => m.dispose());
      renderer.dispose();
      if (holder.contains(renderer.domElement)) holder.removeChild(renderer.domElement);
    };
  }, [lite]);
  return <div className="robot-canvas" ref={mount}><div className="robot-fallback">◈</div></div>;
}
