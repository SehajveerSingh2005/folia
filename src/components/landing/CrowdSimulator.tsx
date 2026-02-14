"use client";

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const CrowdSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const config = {
      src: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/open-peeps-sheet.png',
      rows: 15,
      cols: 7,
    };

    // UTILS
    const randomRange = (min: number, max: number) => min + Math.random() * (max - min);
    const randomIndex = (array: any[]) => randomRange(0, array.length) | 0;
    const removeFromArray = (array: any[], i: number) => array.splice(i, 1)[0];
    const removeItemFromArray = (array: any[], item: any) => removeFromArray(array, array.indexOf(item));
    const removeRandomFromArray = (array: any[]) => removeFromArray(array, randomIndex(array));
    const getRandomFromArray = (array: any[]) => array[randomIndex(array) | 0];

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stage = {
      width: 0,
      height: 0,
    };

    const allPeeps: Peep[] = [];
    const availablePeeps: Peep[] = [];
    const crowd: Peep[] = [];

    class Peep {
      image: HTMLImageElement;
      rect: number[];
      width: number;
      height: number;
      drawArgs: [HTMLImageElement, number, number, number, number, number, number, number, number];
      x = 0;
      y = 0;
      anchorY = 0;
      scaleX = 1;
      walk: gsap.core.Timeline | null = null;

      constructor({ image, rect }: { image: HTMLImageElement; rect: number[] }) {
        this.image = image;
        this.rect = rect;
        this.width = rect[2];
        this.height = rect[3];
        this.drawArgs = [this.image, ...rect, 0, 0, this.width, this.height] as [HTMLImageElement, number, number, number, number, number, number, number, number];
      }

      render(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scaleX, 1);
        ctx.drawImage(...this.drawArgs);
        ctx.restore();
      }
    }

    // TWEEN FACTORIES
    const resetPeep = ({ stage, peep }: { stage: { width: number; height: number }; peep: Peep }) => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const offsetY = 100 - 250 * gsap.parseEase('power2.in')(Math.random());
      const startY = stage.height - peep.height + offsetY;
      let startX;
      let endX;

      if (direction === 1) {
        startX = -peep.width;
        endX = stage.width;
        peep.scaleX = 1;
      } else {
        startX = stage.width + peep.width;
        endX = 0;
        peep.scaleX = -1;
      }

      peep.x = startX;
      peep.y = startY;
      peep.anchorY = startY;

      return { startX, startY, endX };
    };

    const normalWalk = ({ peep, props }: { peep: Peep; props: any }) => {
      const { startY, endX } = props;
      const xDuration = 10;
      const yDuration = 0.25;

      const tl = gsap.timeline();
      tl.timeScale(randomRange(0.5, 1.5));
      tl.to(peep, { duration: xDuration, x: endX, ease: 'none' }, 0);
      tl.to(peep, { duration: yDuration, repeat: xDuration / yDuration, yoyo: true, y: startY - 10 }, 0);

      return tl;
    };

    const walks = [normalWalk];

    function addPeepToCrowd() {
      const peep = removeRandomFromArray(availablePeeps);
      const walk = getRandomFromArray(walks)({
        peep,
        props: resetPeep({ peep, stage }),
      }).eventCallback('onComplete', () => {
        removePeepFromCrowd(peep);
        addPeepToCrowd();
      });

      peep.walk = walk;
      crowd.push(peep);
      crowd.sort((a, b) => a.anchorY - b.anchorY);

      return peep;
    }

    function removePeepFromCrowd(peep: Peep) {
      removeItemFromArray(crowd, peep);
      availablePeeps.push(peep);
    }

    function initCrowd() {
      while (availablePeeps.length) {
        addPeepToCrowd().walk?.progress(Math.random());
      }
    }

    function resize() {
      const parent = canvas.parentElement;
      if (parent) {
        stage.width = parent.clientWidth;
        stage.height = parent.clientHeight;
        canvas.width = stage.width * devicePixelRatio;
        canvas.height = stage.height * devicePixelRatio;
      }

      crowd.forEach((peep) => {
        peep.walk?.kill();
      });

      crowd.length = 0;
      availablePeeps.length = 0;
      availablePeeps.push(...allPeeps);

      initCrowd();
    }

    function render() {
      if (canvas && ctx) {
        canvas.width = canvas.width;
        ctx.save();
        ctx.scale(devicePixelRatio, devicePixelRatio);

        crowd.forEach((peep) => {
          peep.render(ctx);
        });

        ctx.restore();
      }
    }

    function createPeeps() {
      const { rows, cols } = config;
      const { naturalWidth: width, naturalHeight: height } = img;
      const total = rows * cols;
      const rectWidth = width / rows;
      const rectHeight = height / cols;

      for (let i = 0; i < total; i++) {
        allPeeps.push(new Peep({
          image: img,
          rect: [(i % rows) * rectWidth, (i / rows | 0) * rectHeight, rectWidth, rectHeight],
        }));
      }
    }

    const img = document.createElement('img');
    img.onload = () => {
      createPeeps();
      resize();
      gsap.ticker.add(render);
    };
    img.src = config.src;

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      gsap.ticker.remove(render);
      crowd.forEach((peep) => peep.walk?.kill());
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />;
};

export default CrowdSimulator;