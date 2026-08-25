/**
 * ResearchNexus - Animation Engine
 * GSAP, ScrollTrigger, Lenis Smooth Scroll, and WebGL Canvas Particle Simulators
 */

(function () {
  'use strict';

  // 1. Initialize Lenis Smooth Scroll (if loaded)
  let lenisInstance = null;
  if (typeof Lenis !== 'undefined') {
    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync with GSAP ScrollTrigger if both are present
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenisInstance.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenisInstance.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }
  }

  // 2. Interactive WebGL/2D Canvas Particle Network for Hero Canvas
  function initHeroCanvas() {
    const canvas = document.getElementById('hero-particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = canvas.parentElement.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight || window.innerHeight);

    let mouse = { x: width / 2, y: height / 2, radius: 180 };

    window.addEventListener('resize', () => {
      width = canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement.clientHeight || window.innerHeight;
    });

    window.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    // Particle nodes definition
    const particleCount = Math.min(75, Math.floor((width * height) / 14000));
    const particles = [];
    const colors = ['#00F0FF', '#8A2BE2', '#00FA64', '#7df4ff', '#dcb8ff'];

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
        this.radius = Math.random() * 2.2 + 1.2;
        this.baseColor = colors[Math.floor(Math.random() * colors.length)];
        this.color = this.baseColor;
        this.pulse = Math.random() * Math.PI * 2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Interaction with cursor
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          this.x -= Math.cos(angle) * force * 2.5;
          this.y -= Math.sin(angle) * force * 2.5;
        }

        this.pulse += 0.03;
      }

      draw() {
        ctx.beginPath();
        const currentRadius = this.radius + Math.sin(this.pulse) * 0.6;
        ctx.arc(this.x, this.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function render() {
      ctx.clearRect(0, 0, width, height);

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.35;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      requestAnimationFrame(render);
    }
    render();
  }

  // 3. Floating 3D Network Canvas for Auth Page
  function initAuth3DCanvas() {
    const container = document.getElementById('auth-canvas-container');
    if (!container) return;

    if (typeof THREE !== 'undefined') {
      const width = container.clientWidth || window.innerWidth / 2;
      const height = container.clientHeight || window.innerHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);

      // Core glowing geometric group
      const networkGroup = new THREE.Group();
      const nodeGeom = new THREE.IcosahedronGeometry(0.8, 1);
      const wireMatCyan = new THREE.MeshPhongMaterial({
        color: 0x00f0ff,
        wireframe: true,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.6,
      });
      const wireMatViolet = new THREE.MeshPhongMaterial({
        color: 0x8a2be2,
        wireframe: true,
        emissive: 0x8a2be2,
        emissiveIntensity: 0.6,
      });

      const nodes = [];
      const nodeCount = 28;
      for (let i = 0; i < nodeCount; i++) {
        const mat = i % 2 === 0 ? wireMatCyan : wireMatViolet;
        const mesh = new THREE.Mesh(nodeGeom, mat);
        const radius = 3.5 + Math.random() * 2.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        mesh.position.set(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        );
        mesh.scale.setScalar(Math.random() * 0.25 + 0.15);
        networkGroup.add(mesh);
        nodes.push(mesh);
      }

      // Connecting lines
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.25,
      });
      const lineGeom = new THREE.BufferGeometry();
      const linePositions = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[i].position.distanceTo(nodes[j].position) < 3.2) {
            linePositions.push(
              nodes[i].position.x, nodes[i].position.y, nodes[i].position.z,
              nodes[j].position.x, nodes[j].position.y, nodes[j].position.z
            );
          }
        }
      }
      lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const lineMesh = new THREE.LineSegments(lineGeom, lineMat);
      networkGroup.add(lineMesh);

      scene.add(networkGroup);

      // Ambient and directional lighting
      const ambLight = new THREE.AmbientLight(0x404040, 1.5);
      scene.add(ambLight);
      const cyanLight = new THREE.PointLight(0x00f0ff, 3, 20);
      cyanLight.position.set(4, 5, 4);
      scene.add(cyanLight);
      const violetLight = new THREE.PointLight(0x8a2be2, 3, 20);
      violetLight.position.set(-4, -5, 4);
      scene.add(violetLight);

      camera.position.z = 8;

      let mouseX = 0;
      let mouseY = 0;
      window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      });

      function animate() {
        requestAnimationFrame(animate);
        networkGroup.rotation.y += 0.003;
        networkGroup.rotation.x += 0.0015;

        // Interactive mouse tilt
        networkGroup.rotation.y += (mouseX * 0.5 - networkGroup.rotation.y) * 0.02;
        networkGroup.rotation.x += (-mouseY * 0.5 - networkGroup.rotation.x) * 0.02;

        nodes.forEach((n) => {
          n.rotation.x += 0.01;
          n.rotation.y += 0.01;
        });

        renderer.render(scene, camera);
      }
      animate();

      window.addEventListener('resize', () => {
        const w = container.clientWidth || window.innerWidth / 2;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
    }
  }

  // 4. GSAP & ScrollTrigger Animations
  function initGSAPAnimations() {
    if (typeof gsap === 'undefined') return;

    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    // Hero title & CTA fade-in
    const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } });
    if (document.querySelector('.hero-headline')) {
      heroTimeline
        .from('.hero-badge', { y: -20, opacity: 0, delay: 0.2 })
        .from('.hero-headline', { y: 30, opacity: 0 }, '-=0.6')
        .from('.hero-subtitle', { y: 20, opacity: 0 }, '-=0.6')
        .from('.hero-ctas .btn', { y: 20, opacity: 0, stagger: 0.15 }, '-=0.5')
        .from('.hero-stat-card', { y: 30, opacity: 0, stagger: 0.12 }, '-=0.4');
    }

    // Pinned Parallax Silo Section
    const siloSection = document.querySelector('#silo-problem-section');
    if (siloSection && typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.create({
        trigger: siloSection,
        start: 'top top',
        end: '+=1200',
        pin: true,
        scrub: 1,
        animation: gsap.timeline()
          .from('.silo-intro', { opacity: 1, y: 0 })
          .to('.silo-card-bio', { x: '0%', opacity: 1, ease: 'power2.inOut' }, 0.1)
          .to('.silo-card-mech', { x: '0%', opacity: 1, ease: 'power2.inOut' }, 0.1)
          .to('.silo-connector-beam', { scaleX: 1, opacity: 1, ease: 'power2.inOut' }, 0.4)
          .to('.silo-match-badge', { scale: 1, opacity: 1, ease: 'back.out(1.7)' }, 0.6)
          .to('.silo-breakthrough-note', { y: 0, opacity: 1 }, 0.8)
      });
    }

    // Pipeline Overview Cards Stagger
    const pipelineCards = document.querySelectorAll('.pipeline-step-card');
    if (pipelineCards.length > 0 && typeof ScrollTrigger !== 'undefined') {
      gsap.from(pipelineCards, {
        scrollTrigger: {
          trigger: '.pipeline-overview-section',
          start: 'top 75%',
        },
        y: 40,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: 'power3.out',
      });
    }

    // Stat Count-up Ticker on Visible
    const counterElements = document.querySelectorAll('[data-counter-target]');
    counterElements.forEach((el) => {
      const target = parseFloat(el.getAttribute('data-counter-target'));
      const prefix = el.getAttribute('data-counter-prefix') || '';
      const suffix = el.getAttribute('data-counter-suffix') || '';

      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.fromTo(
              { val: 0 },
              { val: target },
              {
                duration: 2,
                ease: 'power2.out',
                onUpdate: function () {
                  const current = Math.floor(this.targets()[0].val);
                  el.textContent = `${prefix}${current.toLocaleString()}${suffix}`;
                },
              }
            );
          },
        });
      }
    });
  }

  // Document Ready Initialization
  document.addEventListener('DOMContentLoaded', () => {
    initHeroCanvas();
    initAuth3DCanvas();
    initGSAPAnimations();
  });
})();
