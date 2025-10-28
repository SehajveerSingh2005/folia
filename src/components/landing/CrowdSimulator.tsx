"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

const CrowdSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 20);

    const noise2D = createNoise2D();
    const PARTICLE_COUNT = 1000;
    const GROUP_COUNT = 5;
    let mouse = new THREE.Vector2(0, 0);

    class Particle {
      pos: THREE.Vector3;
      vel: THREE.Vector3;
      acc: THREE.Vector3;
      color: THREE.Color;
      maxSpeed: number;
      maxForce: number;
      theta: number;
      group: number;

      constructor(group: number, groupColor: THREE.Color) {
        this.pos = new THREE.Vector3(Math.random() * 20 - 10, Math.random() * 20 - 10, 0);
        this.vel = new THREE.Vector3();
        this.acc = new THREE.Vector3();
        this.color = groupColor;
        this.maxSpeed = 0.1;
        this.maxForce = 0.2;
        this.theta = 0;
        this.group = group;
      }

      update() {
        this.vel.add(this.acc);
        this.vel.clampLength(0, this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.multiplyScalar(0);
      }

      applyForce(force: THREE.Vector3) {
        this.acc.add(force);
      }

      flow(field: (x: number, y: number) => number) {
        const angle = field(this.pos.x * 0.1, this.pos.y * 0.1);
        const force = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
        force.multiplyScalar(0.005);
        this.applyForce(force);
      }

      seek(target: THREE.Vector3) {
        const desired = new THREE.Vector3().subVectors(target, this.pos);
        desired.normalize();
        desired.multiplyScalar(this.maxSpeed);
        const steer = new THREE.Vector3().subVectors(desired, this.vel);
        steer.clampLength(0, this.maxForce);
        this.applyForce(steer);
      }
    }

    const particles: Particle[] = [];
    const groupColors = [
      new THREE.Color(0x7dd3fc), // sky-300
      new THREE.Color(0x67e8f9), // cyan-300
      new THREE.Color(0x5eead4), // teal-300
      new THREE.Color(0x6ee7b7), // emerald-300
      new THREE.Color(0x86efac), // green-300
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const groupIndex = Math.floor(i / (PARTICLE_COUNT / GROUP_COUNT));
      particles.push(new Particle(groupIndex, groupColors[groupIndex]));
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({ size: 0.05, vertexColors: true });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const onResize = () => {
      const parent = renderer.domElement.parentElement;
      if (parent) {
        const width = parent.clientWidth;
        const height = parent.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };
    window.addEventListener('resize', onResize);
    onResize();

    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      mouse.x = (x / rect.width) * 2 - 1;
      mouse.y = -(y / rect.height) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const target = new THREE.Vector3(mouse.x * 10, mouse.y * 10, 0);
      
      particles.forEach((p, i) => {
        p.flow((x, y) => noise2D(x, y) * 10);
        p.seek(target);
        p.update();

        positions[i * 3] = p.pos.x;
        positions[i * 3 + 1] = p.pos.y;
        positions[i * 3 + 2] = p.pos.z;
        p.color.toArray(colors, i * 3);
      });

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />;
};

export default CrowdSimulator;