/**
 * Mathematical Particle Network Animation
 * Creates an interactive network of connected nodes with geometric patterns
 */

(function() {
  'use strict';

  class ParticleNetwork {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      // Configuration
      this.options = {
        particleCount: options.particleCount || 80,
        particleColor: options.particleColor || 'rgba(255, 255, 255, 0.6)',
        lineColor: options.lineColor || 'rgba(255, 255, 255, 0.15)',
        particleRadius: options.particleRadius || 2,
        lineWidth: options.lineWidth || 1,
        connectionDistance: options.connectionDistance || 150,
        mouseConnectionDistance: options.mouseConnectionDistance || 200,
        speed: options.speed || 0.3,
        ...options
      };

      this.particles = [];
      this.mouse = { x: null, y: null, radius: this.options.mouseConnectionDistance };
      this.animationId = null;
      this.isVisible = true;

      this.init();
    }

    init() {
      this.resize();
      this.createParticles();
      this.bindEvents();
      this.animate();
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.width = rect.width;
      this.height = rect.height;

      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.canvas.style.width = this.width + 'px';
      this.canvas.style.height = this.height + 'px';
      this.ctx.scale(dpr, dpr);
    }

    createParticles() {
      this.particles = [];
      const count = Math.min(this.options.particleCount, Math.floor((this.width * this.height) / 12000));

      for (let i = 0; i < count; i++) {
        // Create some particles in geometric patterns
        let x, y;
        const pattern = Math.random();

        if (pattern < 0.3) {
          // Circular distribution
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * Math.min(this.width, this.height) * 0.4;
          x = this.width / 2 + Math.cos(angle) * radius;
          y = this.height / 2 + Math.sin(angle) * radius;
        } else if (pattern < 0.5) {
          // Grid-like distribution with some randomness
          const gridSize = 100;
          x = Math.floor(Math.random() * (this.width / gridSize)) * gridSize + Math.random() * 50;
          y = Math.floor(Math.random() * (this.height / gridSize)) * gridSize + Math.random() * 50;
        } else {
          // Random distribution
          x = Math.random() * this.width;
          y = Math.random() * this.height;
        }

        this.particles.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * this.options.speed,
          vy: (Math.random() - 0.5) * this.options.speed,
          radius: this.options.particleRadius + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    bindEvents() {
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.mouse.x = null;
        this.mouse.y = null;
      });

      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.resize();
          this.createParticles();
        }, 200);
      });

      document.addEventListener('visibilitychange', () => {
        this.isVisible = !document.hidden;
      });
    }

    updateParticles() {
      for (const particle of this.particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > this.width) {
          particle.vx *= -1;
          particle.x = Math.max(0, Math.min(this.width, particle.x));
        }
        if (particle.y < 0 || particle.y > this.height) {
          particle.vy *= -1;
          particle.y = Math.max(0, Math.min(this.height, particle.y));
        }
      }
    }

    drawParticles() {
      for (const particle of this.particles) {
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.options.particleColor;
        this.ctx.fill();
      }
    }

    drawConnections() {
      const connectionDist = this.options.connectionDistance;
      const connectionDistSq = connectionDist * connectionDist;

      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dx = this.particles[i].x - this.particles[j].x;
          const dy = this.particles[i].y - this.particles[j].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < connectionDistSq) {
            const opacity = 1 - Math.sqrt(distSq) / connectionDist;
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.15})`;
            this.ctx.lineWidth = this.options.lineWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
            this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
            this.ctx.stroke();
          }
        }
      }
    }

    drawMouseConnections() {
      if (this.mouse.x === null || this.mouse.y === null) return;

      const mouseDistSq = this.mouse.radius * this.mouse.radius;

      for (const particle of this.particles) {
        const dx = this.mouse.x - particle.x;
        const dy = this.mouse.y - particle.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < mouseDistSq) {
          const dist = Math.sqrt(distSq);
          const opacity = 1 - dist / this.mouse.radius;

          // Draw line to mouse
          this.ctx.strokeStyle = `rgba(166, 38, 57, ${opacity * 0.5})`;
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(this.mouse.x, this.mouse.y);
          this.ctx.stroke();

          // Make particle glow when near mouse
          this.ctx.fillStyle = `rgba(166, 38, 57, ${opacity * 0.8})`;
          this.ctx.beginPath();
          this.ctx.arc(particle.x, particle.y, particle.radius + 2 * opacity, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }

      // Draw mouse cursor glow
      const gradient = this.ctx.createRadialGradient(
        this.mouse.x, this.mouse.y, 0,
        this.mouse.x, this.mouse.y, 30
      );
      gradient.addColorStop(0, 'rgba(166, 38, 57, 0.3)');
      gradient.addColorStop(1, 'rgba(166, 38, 57, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, 30, 0, Math.PI * 2);
      this.ctx.fill();
    }

    animate() {
      if (!this.isVisible) {
        this.animationId = requestAnimationFrame(() => this.animate());
        return;
      }

      this.ctx.clearRect(0, 0, this.width, this.height);

      this.updateParticles();
      this.drawConnections();
      this.drawParticles();
      this.drawMouseConnections();

      this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
    }
  }

  // Initialize particle network
  function initParticleNetwork() {
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
      new ParticleNetwork(canvas, {
        particleCount: 80,
        connectionDistance: 130,
        mouseConnectionDistance: 180,
        speed: 0.25
      });
    }
  }

  /**
   * Navbar Controller
   * Handles transparent/solid navbar state with direct style manipulation
   */
  function initNavbarController() {
    const navbar = document.querySelector('.navbar.navbar-custom');
    const isLandingPage = document.body.classList.contains('landing-page');

    if (!navbar || !isLandingPage) return;

    const scrollThreshold = 50;

    // Style configurations
    const transparentStyles = {
      backgroundColor: 'transparent',
      backdropFilter: 'none',
      webkitBackdropFilter: 'none',
      borderBottom: 'none',
      boxShadow: 'none'
    };

    const scrolledStyles = {
      backgroundColor: '#ffffff',
      backdropFilter: 'none',
      webkitBackdropFilter: 'none',
      borderBottom: '1px solid #E2E8F0',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
    };

    const transparentTextColor = '#ffffff';
    const scrolledTextColor = '#2D3748';
    const hoverColor = '#A62639';

    function applyStyles(styles, textColor) {
      navbar.style.backgroundColor = styles.backgroundColor;
      navbar.style.backdropFilter = styles.backdropFilter;
      navbar.style.webkitBackdropFilter = styles.webkitBackdropFilter;
      navbar.style.borderBottom = styles.borderBottom;
      navbar.style.boxShadow = styles.boxShadow;

      // Apply text colors
      const brand = navbar.querySelector('.navbar-brand');
      const navLinks = navbar.querySelectorAll('.nav-link');

      if (brand) {
        brand.style.color = textColor;
        brand.style.textShadow = textColor === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none';
      }

      navLinks.forEach(link => {
        link.style.color = textColor;
        link.style.textShadow = textColor === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none';
      });

      // Update hamburger icon
      const togglerIcon = navbar.querySelector('.navbar-toggler-icon');
      if (togglerIcon) {
        const strokeColor = textColor === '#ffffff' ? 'rgba(255,255,255,0.9)' : 'rgba(45,55,72,0.9)';
        togglerIcon.style.backgroundImage = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='${encodeURIComponent(strokeColor)}' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e")`;
      }
    }

    function updateNavbar() {
      const scrollY = window.scrollY || window.pageYOffset;

      if (scrollY > scrollThreshold) {
        applyStyles(scrolledStyles, scrolledTextColor);
        navbar.classList.remove('navbar-transparent');
        navbar.classList.add('navbar-scrolled');
      } else {
        applyStyles(transparentStyles, transparentTextColor);
        navbar.classList.remove('navbar-scrolled');
        navbar.classList.add('navbar-transparent');
      }
    }

    // Add hover effects for nav links
    const navLinks = navbar.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        const isScrolled = window.scrollY > scrollThreshold;
        link.style.color = isScrolled ? hoverColor : 'rgba(255,255,255,0.8)';
      });
      link.addEventListener('mouseleave', () => {
        const isScrolled = window.scrollY > scrollThreshold;
        link.style.color = isScrolled ? scrolledTextColor : transparentTextColor;
        link.style.textShadow = isScrolled ? 'none' : '0 1px 2px rgba(0,0,0,0.2)';
      });
    });

    // Throttled scroll handler
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateNavbar();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Apply initial state after a short delay to override Beautiful Jekyll's init
    setTimeout(() => {
      updateNavbar();
    }, 100);

    // Also apply immediately
    updateNavbar();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initParticleNetwork();
      initNavbarController();
    });
  } else {
    initParticleNetwork();
    initNavbarController();
  }
})();
