 class ParameterAnimator {
    constructor() {
        this.animations = new Map();
        this.isAnimating = false;
    }

    animateTo(object, property, targetValue, duration = 300, onComplete = null, onUpdate = null) {
        const key = `${object.constructor.name}_${property}`;
        const startValue = object[property];
        const startTime = Date.now();

        if (this.animations.has(key)) {
            this.animations.delete(key);
        }

        this.animations.set(key, {
            object,
            property,
            startValue,
            targetValue,
            startTime,
            duration,
            onComplete,
            onUpdate
        });

        if (!this.isAnimating) {
            this.startAnimationLoop();
        }
    }

    startAnimationLoop() {
        this.isAnimating = true;

        const animate = () => {
            const currentTime = Date.now();
            let hasActiveAnimations = false;

            for (const [key, anim] of this.animations) {
                const elapsed = currentTime - anim.startTime;
                const progress = Math.min(elapsed / anim.duration, 1);

                const easedProgress = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                const currentValue = anim.startValue + (anim.targetValue - anim.startValue) * easedProgress;
                anim.object[anim.property] = currentValue;
                
                if (anim.onUpdate) {
                    anim.onUpdate();
                }

                if (progress >= 1) {
                    if (anim.onComplete) {
                        anim.onComplete();
                    }
                    this.animations.delete(key);
                } else {
                    hasActiveAnimations = true;
                }
            }

            if (hasActiveAnimations) {
                requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
            }
        };

        requestAnimationFrame(animate);
    }
}

class SimpleExplosion {
    constructor(position, params, scene, color = 0xffffff) {
        this.startTime = Date.now();
        this.params = params;
        this.scene = scene;
        this.color = color;

        this.positions = new Float32Array(params.particleCount * 3);
        this.velocities = [];

        for (let i = 0; i < params.particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            const dirX = Math.sin(phi) * Math.cos(theta);
            const dirY = Math.sin(phi) * Math.sin(theta);
            const dirZ = Math.cos(phi);

            this.positions[i * 3] = position.x;
            this.positions[i * 3 + 1] = position.y;
            this.positions[i * 3 + 2] = position.z;

            const speed = (0.5 + Math.random() * 1.5) * params.speed;
            this.velocities.push({
                x: dirX * speed,
                y: dirY * speed,
                z: dirZ * speed
            });
        }

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

        this.material = new THREE.PointsMaterial({
            color: this.color,
            size: params.size,
            sizeAttenuation: true,
            transparent: true,
            opacity: 1.0,
            blending: color === 0x000000 ? THREE.NormalBlending : THREE.AdditiveBlending
        });

        this.points = new THREE.Points(this.geometry, this.material);
        this.points.renderOrder = 1;
        scene.add(this.points);
    }

    update() {
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.params.lifeTime;

        if (progress >= 1) {
            return false;
        }

        for (let i = 0; i < this.params.particleCount; i++) {
            const vel = this.velocities[i];

            this.positions[i * 3] += vel.x;
            this.positions[i * 3 + 1] += vel.y;
            this.positions[i * 3 + 2] += vel.z;

            vel.x *= 0.98;
            vel.y *= 0.98;
            vel.z *= 0.98;
        }

        this.material.opacity = Math.max(0, 1 - progress);
        this.geometry.attributes.position.needsUpdate = true;

        return true;
    }

    dispose() {
        this.scene.remove(this.points);
        this.geometry.dispose();
        this.material.dispose();
    }
}

class PufParticleSystem {
    constructor(options = {}) {
        this.innerParams = {
            count: 100000,
            density: 0.04,
            speed: 1.0,
            randomness: 1.2,
            directionX: -0.6,
            directionY: 1.0,
            directionZ: 0.0,
            size: 0.0045,
            originalSize: 0.0045,
            gradientIntensity: 0.9,
            sphereRadius: 1.0,
            visible: true
        };

        this.outerParams = {
            count: 50000,
            density: 0.04,
            direction: 0.06,
            rotationX: 0.0,
            rotationY: 0.0,
            size: 0.003,
            originalSize: 0.003,
            maxSize: 0.02,
            originalMaxSize: 0.02,
            innerRadius: 1.0,
            outerRadius: 2.4
        };

        this.explosionParams = {
            particleCount: 100,
            maxRadius: 4.0,
            speed: 0.03,
            lifeTime: 3000,
            size: 0.006
        };

        this.logoParams = {
            visible: true,
            sizeMultiplier: 0.4
        };

        this.hoverParams = {
            directionX: -1.5,
            speed: 2.6,
            density: 0.8,
            gradientIntensity: 0.9,
            logoScale: 1.08,
            outerDirection: 1.0,
            outerDensity: 0.35
        };

        this.originalParams = {
            directionX: this.innerParams.directionX,
            directionY: this.innerParams.directionY,
            speed: this.innerParams.speed,
            density: this.innerParams.density,
            gradientIntensity: this.innerParams.gradientIntensity,
            logoScale: 1.0,
            outerDirection: 0.06,
            outerDensity: this.outerParams.density
        };

        this.breakpoints = {
            mobile: 478,
            mobileLandscape: 767,
            tablet: 991,
            desktop: 992
        };

        this.sphereSizes = {
            desktop: { value: 55, unit: 'vh' },
            tablet: { value: 50, unit: 'vw' },
            mobileLandscape: { value: 62, unit: 'vh' },
            mobile: { value: 58, unit: 'vw' }
        };

        this.outerRadiusValues = {
            desktop: 2.4,
            tablet: 4.0,
            mobileLandscape: 4.0,
            mobile: 4.0
        };

        this.particleSizeMultipliers = {
            desktop: 1.0,
            tablet: 1.2,
            mobileLandscape: 1.4,
            mobile: 1.6
        };

        this.explosions = [];
        this.currentBreakpoint = 'desktop';
        this.currentPageMode = 'home';
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseInteractionEnabled = true;
        this.paramAnimator = new ParameterAnimator();
        this.innerGradientOverlay = null;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.innerParticles = null;
        this.outerParticles = null;
        this.backgroundSphere = null;
        this.innerMaterial = null;
        this.outerMaterial = null;
        this.innerGeometry = null;
        this.outerGeometry = null;
        this.innerSphericalCoords = [];
        this.innerSphericalSpeeds = [];
        this.outerRadialCoords = [];
        this.outerRadialSpeeds = [];

        this.container = options.container || document.body;
        
        this.init();
    }

    init() {
        this.createScene();
        this.createParticles();
        this.setupEventListeners();
        this.createGradientOverlays();
        this.createLogo();
        this.updateResponsiveSettings();
        this.preventZoom();
        this.animate();

        console.log('✅ PUF Partikül Sistemi başlatıldı!');
    }

    createScene() {
        this.scene = new THREE.Scene();
        
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        this.renderer.domElement.id = 'particle-canvas';
        this.renderer.domElement.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: -1000 !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: none !important;
            transform: scale(1) !important;
            -webkit-transform: scale(1) !important;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
        `;
        
        const layoutDiv = document.querySelector('.layout');
        if (layoutDiv) {
            document.body.insertBefore(this.renderer.domElement, layoutDiv);
        } else {
            document.body.insertBefore(this.renderer.domElement, document.body.firstChild);
        }

        this.updateCamera();
    }

    createParticles() {
        this.createInnerParticles();
        this.createOuterParticles();
        this.createBackgroundSphere();
    }

    createInnerParticles() {
        const maxCount = this.innerParams.count;
        this.innerGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(maxCount * 3);

        this.innerSphericalCoords = [];
        this.innerSphericalSpeeds = [];

        for (let i = 0; i < maxCount; i++) {
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);

            const x = 1.0 * Math.sin(phi) * Math.cos(theta);
            const y = 1.0 * Math.sin(phi) * Math.sin(theta);
            const z = 1.0 * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            this.innerSphericalCoords.push({ theta, phi });
            const baseSpeed = 0.002;
            const randomFactorTheta = (Math.random() - 0.5) * this.innerParams.randomness;
            const randomFactorPhi = (Math.random() - 0.5) * this.innerParams.randomness;
            this.innerSphericalSpeeds.push({
                dTheta: (randomFactorTheta + this.innerParams.directionX) * baseSpeed,
                dPhi: (randomFactorPhi + this.innerParams.directionY) * baseSpeed
            });
        }

        this.innerGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        this.innerMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: this.innerParams.size,
            sizeAttenuation: true,
            transparent: true,
            opacity: 1.0,
        });

        this.innerParticles = new THREE.Points(this.innerGeometry, this.innerMaterial);
        this.innerParticles.renderOrder = 0;
        this.scene.add(this.innerParticles);

        this.updateInnerParticleDensity();
    }

    createOuterParticles() {
        const maxCount = this.outerParams.count;
        this.outerGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(maxCount * 3);

        this.outerRadialCoords = [];
        this.outerRadialSpeeds = [];

        for (let i = 0; i < maxCount; i++) {
            const direction = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize();

            const radiusRange = this.outerParams.outerRadius - this.outerParams.innerRadius;
            const randomRadius = this.outerParams.innerRadius + Math.random() * radiusRange;
            const position = direction.clone().multiplyScalar(randomRadius);

            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;

            this.outerRadialCoords.push({
                direction: direction.clone(),
                radius: randomRadius
            });

            this.outerRadialSpeeds.push({
                radialSpeed: 0.3 * (0.8 + Math.random() * 0.4)
            });
        }

        this.outerGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.outerMaterial = this.createOuterShader();
        this.outerParticles = new THREE.Points(this.outerGeometry, this.outerMaterial);
        this.scene.add(this.outerParticles);

        this.updateOuterParticleDensity();
    }

    createBackgroundSphere() {
        const geometry = new THREE.SphereGeometry(1.0, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: false,
            side: THREE.BackSide
        });
        this.backgroundSphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.backgroundSphere);
    }


    createOuterShader() {
        const vertexShader = `
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                float distance = length(mvPosition.xyz);
                float baseSize = ${this.outerParams.size.toFixed(6)};
                float maxSize = ${this.outerParams.maxSize.toFixed(6)};
                float calculatedSize = (baseSize * 1000.0) / distance;
                gl_PointSize = min(calculatedSize, maxSize * 1000.0);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                gl_FragColor = vec4(0.67, 0.67, 0.67, 1.0);
            }
        `;

        return new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: false
        });
    }

    createLogo() {
        const logoContainer = document.createElement('div');
        logoContainer.className = 'particle-logo-container';
        logoContainer.style.cssText = `
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) scale(1) !important;
            -webkit-transform: translate(-50%, -50%) scale(1) !important;
            z-index: -998 !important; 
            pointer-events: none;
            transition: opacity 1s ease;
        `;

        const logoSvg = document.createElement('div');
        logoSvg.innerHTML = `
            <svg class="particle-puf-logo" viewBox="0 0 119 80" xmlns="http://www.w3.org/2000/svg">
                <path d="M112.536 57.4772C125.981 47.7487 114.167 22.4601 96.8054 28.5674C103.282 9.41258 76.2362 0.0459456 65.8911 15.6625C64.6932 9.14373 56.8346 0.812667 44.6508 0.812667C26.2123 0.749603 9.92472 18.5336 20.0952 37.8809C7.57922 37.8809 -1.27259 49.8166 1.01251 60.5042C4.43176 80.6415 31.4905 82.5334 42.1409 72.1843C47.6943 82.8487 72.1492 81.0132 72.525 68.7755C82.8364 77.0203 99.7113 69.2933 97.8154 56.3619C101.855 59.6147 107.761 60.0462 112.536 57.4772ZM46.5265 57.1386C37.7586 58.3003 34.8997 36.6761 43.6911 35.5907C52.4591 34.429 55.318 56.0532 46.5265 57.1386ZM69.3742 54.4401C60.6062 55.6018 57.7473 33.9776 66.5388 32.8922C75.3067 31.7338 78.1656 53.3548 69.3742 54.4401Z" fill="white"/>
            </svg>
        `;

        const logo = logoSvg.querySelector('.particle-puf-logo');
        logo.style.cssText = `
            height: auto;
            opacity: 0.9;
            transition: transform 0.4s ease, opacity 0.3s ease;
            transform-origin: center center;
        `;

        logoContainer.appendChild(logo);
        document.body.appendChild(logoContainer);
        this.logoContainer = logoContainer;

        this.updateLogoSize();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        window.addEventListener('mousemove', (event) => {
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
            this.updateMouseRotation();
        });

        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        this.updateMouseRotation();

        window.addEventListener('click', (event) => {
            if (event.target.closest('.navbar-buttons') ||
                event.target.closest('.top') ||
                event.target.closest('a') ||
                event.target.closest('button')) {
                return;
            }

            this.createExplosion(event.clientX, event.clientY);
        });

        window.addEventListener('touchstart', (event) => {
            if (event.target.closest('.navbar-buttons') ||
                event.target.closest('.top') ||
                event.target.closest('a') ||
                event.target.closest('button')) {
                return;
            }

            for (let i = 0; i < event.touches.length; i++) {
                const touch = event.touches[i];
                this.createExplosion(touch.clientX, touch.clientY);
            }
        }, { passive: true });

        this.bindHoverTargets();
        new MutationObserver(() => this.bindHoverTargets()).observe(document.body, { childList: true, subtree: true });
    }

    bindHoverTargets() {
        document.querySelectorAll('.js-hover').forEach(el => {
            if (el.__pufHoverBound) return;
            el.addEventListener('mouseenter', () => this.activateHoverEffect());
            el.addEventListener('mouseleave', () => this.deactivateHoverEffect());
            el.__pufHoverBound = true;
        });
    }

    createGradientOverlays() {
        this.innerGradientOverlay = document.createElement('div');
        this.innerGradientOverlay.className = 'particle-gradient-overlay';
        this.innerGradientOverlay.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            pointer-events: none;
            z-index: -999 !important;
            transition: opacity 1s ease;
        `;
        document.body.appendChild(this.innerGradientOverlay);
        this.updateInnerGradientOverlay();
    }

    getCurrentBreakpoint() {
        const width = window.innerWidth;
        if (width <= this.breakpoints.mobile) return 'mobile';
        if (width <= this.breakpoints.mobileLandscape) return 'mobileLandscape';
        if (width <= this.breakpoints.tablet) return 'tablet';
        return 'desktop';
    }

    calculateCameraDistance() {
        const breakpoint = this.getCurrentBreakpoint();
        const sphereSize = this.sphereSizes[breakpoint];
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let targetDiameterInPixels;
        if (sphereSize.unit === 'vh') {
            targetDiameterInPixels = (sphereSize.value / 100) * viewportHeight;
        } else {
            targetDiameterInPixels = (sphereSize.value / 100) * viewportWidth;
        }

        const sphereDiameterInUnits = 2.0;
        const fov = 75 * Math.PI / 180;
        const cameraDistance = (sphereDiameterInUnits * viewportHeight) / (2 * targetDiameterInPixels * Math.tan(fov / 2));

        return { breakpoint, cameraDistance };
    }

    updateCamera() {
        const cameraData = this.calculateCameraDistance();
        this.camera.position.z = cameraData.cameraDistance;
        this.camera.updateProjectionMatrix();
    }

    updateResponsiveSettings() {
        const cameraData = this.calculateCameraDistance();
        const newBreakpoint = cameraData.breakpoint;

        if (newBreakpoint !== this.currentBreakpoint) {
            this.currentBreakpoint = newBreakpoint;
            this.camera.position.z = cameraData.cameraDistance;
            this.updateParticleSizes();
            this.updateOuterRadius();
        }
    }

    updateParticleSizes() {
        const breakpoint = this.getCurrentBreakpoint();
        const sizeMultiplier = this.particleSizeMultipliers[breakpoint];

        const newInnerSize = this.innerParams.originalSize * sizeMultiplier;
        this.innerParams.size = newInnerSize;
        if (this.innerMaterial) this.innerMaterial.size = newInnerSize;

        this.outerParams.size = this.outerParams.originalSize * sizeMultiplier;
        this.outerParams.maxSize = this.outerParams.originalMaxSize * sizeMultiplier;
        this.updateOuterShader();
    }

    updateOuterRadius() {
        const breakpoint = this.getCurrentBreakpoint();
        const newRadius = this.outerRadiusValues[breakpoint];

        if (this.outerParams.outerRadius !== newRadius) {
            this.outerParams.outerRadius = newRadius;
            this.regenerateOuterParticles();
        }
    }


    updateOuterShader() {
        this.outerMaterial = this.createOuterShader();
        this.outerParticles.material = this.outerMaterial;
        this.outerMaterial.needsUpdate = true;
    }

    updateInnerParticleDensity() {
        const innerCurrentCount = Math.floor(this.innerParams.count * this.innerParams.density);
        this.innerGeometry.setDrawRange(0, innerCurrentCount);
    }

    updateOuterParticleDensity() {
        const outerCurrentCount = Math.floor(this.outerParams.count * this.outerParams.density);
        this.outerGeometry.setDrawRange(0, outerCurrentCount);
    }

    updateInnerParticleSpeeds() {
        const baseSpeed = 0.002;
        for (let i = 0; i < this.innerParams.count; i++) {
            const randomFactorTheta = (Math.random() - 0.5) * this.innerParams.randomness;
            const randomFactorPhi = (Math.random() - 0.5) * this.innerParams.randomness;
            this.innerSphericalSpeeds[i] = {
                dTheta: (randomFactorTheta + this.innerParams.directionX) * baseSpeed,
                dPhi: (randomFactorPhi + this.innerParams.directionY) * baseSpeed
            };
        }
    }

    updateInnerGradientOverlay(color = '0, 0, 0') {
        if (!this.innerGradientOverlay) return;

        const intensity = this.innerParams.gradientIntensity;
        if (intensity === 0) {
            this.innerGradientOverlay.style.opacity = '0';
            return;
        }

        const currentOpacity = parseFloat(this.innerGradientOverlay.style.opacity);
        if (isNaN(currentOpacity) || this.currentPageMode === 'home') {
             this.innerGradientOverlay.style.opacity = '1';
        }

        const breakpoint = this.getCurrentBreakpoint();
        const sphereSize = this.sphereSizes[breakpoint];
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let gradientSize;
        if (sphereSize.unit === 'vh') {
            gradientSize = sphereSize.value;
        } else {
            gradientSize = (sphereSize.value * viewportWidth) / viewportHeight;
        }

        gradientSize = Math.max(gradientSize, 20);
        const opaqueStop = Math.pow(intensity, 2) * 40;
        const transparentStart = Math.max(opaqueStop + 5, 60);

        const isMobile = window.innerWidth <= 768;
        const viewportUnit = isMobile && CSS.supports('height', '100svh') ? 'svh' : 'vh';

        this.innerGradientOverlay.style.background = `radial-gradient(${gradientSize}${viewportUnit} at 50% 50%, rgba(${color}, 0.85) 0%, rgba(${color}, 0.85) ${opaqueStop}%, transparent ${transparentStart}%)`;
    }

    updateMouseRotation() {
        if (!this.isMouseInteractionEnabled) return;

        const normalizedX = (this.mouseX / window.innerWidth) * 2 - 1;
        const normalizedY = (this.mouseY / window.innerHeight) * 2 - 1;

        this.outerParams.rotationY = normalizedX * 3;
        this.outerParams.rotationX = normalizedY * 3;
    }

    updateLogoSize() {
        const logo = document.querySelector('.particle-puf-logo');
        if (logo) {
            const breakpoint = this.getCurrentBreakpoint();
            const sphereSize = this.sphereSizes[breakpoint];
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            let targetDiameterInPixels;
            if (sphereSize.unit === 'vh') {
                targetDiameterInPixels = (sphereSize.value / 100) * viewportHeight;
            } else {
                targetDiameterInPixels = (sphereSize.value / 100) * viewportWidth;
            }
            
            const logoSize = targetDiameterInPixels * this.logoParams.sizeMultiplier;
            
            logo.style.width = logoSize + 'px';
            logo.style.height = 'auto';
        }
    }

    updateParticleColors(mode = 'home') {
        if (this.isTransitioning && this.currentPageMode === mode) return;
        this.isTransitioning = true;

        this.currentPageMode = mode;
        
        const transitionDuration = mode === 'about' ? 300 : 1000;

        if (mode === 'about') {
            document.body.style.backgroundColor = '#EBEBEB';
            document.body.classList.add('about-mode');
            document.body.classList.remove('home-mode');

            // Logo
            if (this.logoContainer) {
                const logoAnimation = { opacity: parseFloat(this.logoContainer.style.opacity) || 0 };
                this.paramAnimator.animateTo(logoAnimation, 'opacity', 0, transitionDuration, () => {
                    this.logoContainer.style.display = 'none';
                }, () => {
                    this.logoContainer.style.opacity = logoAnimation.opacity;
                });
            }

            // Inner Sphere and Gradient
            if (this.backgroundSphere && this.innerGradientOverlay) {
                this.backgroundSphere.material.transparent = true;

                const animationProps = { t: 0 };
                this.paramAnimator.animateTo(animationProps, 't', 1, transitionDuration, () => {
                    this.backgroundSphere.visible = false;
                    this.innerGradientOverlay.style.display = 'none';
                    this.innerParticles.visible = false;
                    this.isTransitioning = false;
                }, () => {
                    // Color
                    const black = new THREE.Color(0x000000);
                    const white = new THREE.Color(0xffffff);
                    this.backgroundSphere.material.color.lerpColors(black, white, animationProps.t);
                    
                    const r = Math.round(0 + (255 - 0) * animationProps.t);
                    const g = Math.round(0 + (255 - 0) * animationProps.t);
                    const b = Math.round(0 + (255 - 0) * animationProps.t);
                    this.updateInnerGradientOverlay(`${r}, ${g}, ${b}`);

                    // Opacity
                    const newOpacity = 1 - animationProps.t;
                    this.backgroundSphere.material.opacity = newOpacity;
                    this.innerGradientOverlay.style.opacity = newOpacity;
                    if (this.innerMaterial) this.innerMaterial.opacity = newOpacity;
                });
            } else {
                 this.isTransitioning = false;
            }
            
            if (this.outerMaterial && this.outerParticles) {
                const vertexShader = `
                    void main() {
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        float distance = length(mvPosition.xyz);
                        float baseSize = ${this.outerParams.size.toFixed(6)};
                        float maxSize = ${this.outerParams.maxSize.toFixed(6)};
                        float calculatedSize = (baseSize * 1000.0) / distance;
                        gl_PointSize = min(calculatedSize, maxSize * 1000.0);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `;

                const fragmentShader = `
                    void main() {
                        float dist = length(gl_PointCoord - vec2(0.5));
                        if (dist > 0.5) discard;
                        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                    }
                `;

                const newMaterial = new THREE.ShaderMaterial({
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    transparent: false
                });
                
                this.outerMaterial.dispose();
                this.outerMaterial = newMaterial;
                this.outerParticles.material = this.outerMaterial;
                this.outerMaterial.needsUpdate = true;
                
                console.log('🎨 About mode: Outer particles set to BLACK (0,0,0)');
            }
        } else {
            document.body.style.backgroundColor = '#000000';
            document.body.classList.remove('about-mode');
            document.body.classList.add('home-mode');

            // Make elements visible before animation
            if (this.logoContainer) {
                this.logoContainer.style.display = 'block';
                const logoAnimation = { opacity: parseFloat(this.logoContainer.style.opacity) || 0 };
                this.paramAnimator.animateTo(logoAnimation, 'opacity', 1, transitionDuration, null, () => {
                    this.logoContainer.style.opacity = logoAnimation.opacity;
                });
            }
            if (this.innerGradientOverlay) this.innerGradientOverlay.style.display = 'block';
            if (this.innerParticles) this.innerParticles.visible = true;
            if (this.backgroundSphere) {
                this.backgroundSphere.visible = true;
                this.backgroundSphere.material.transparent = true;
            }

            // Inner Sphere and Gradient
            if (this.backgroundSphere && this.innerGradientOverlay) {
                const animationProps = { t: 0 };
                this.paramAnimator.animateTo(animationProps, 't', 1, transitionDuration, () => {
                     this.isTransitioning = false;
                     this.backgroundSphere.material.transparent = false;
                }, () => {
                    // Color
                    const white = new THREE.Color(0xffffff);
                    const black = new THREE.Color(0x000000);
                    this.backgroundSphere.material.color.lerpColors(white, black, animationProps.t);

                    const r = Math.round(255 - (255 - 0) * animationProps.t);
                    const g = Math.round(255 - (255 - 0) * animationProps.t);
                    const b = Math.round(255 - (255 - 0) * animationProps.t);
                    this.updateInnerGradientOverlay(`${r}, ${g}, ${b}`);

                    // Opacity
                    const newOpacity = animationProps.t;
                    this.backgroundSphere.material.opacity = newOpacity;
                    this.innerGradientOverlay.style.opacity = newOpacity;
                    if (this.innerMaterial) this.innerMaterial.opacity = newOpacity;
                });
            } else {
                this.isTransitioning = false;
            }
            
            if (this.innerMaterial) this.innerMaterial.color.setHex(0xffffff);
            if (this.outerMaterial && this.outerParticles) {
                const vertexShader = `
                    void main() {
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        float distance = length(mvPosition.xyz);
                        float baseSize = ${this.outerParams.size.toFixed(6)};
                        float maxSize = ${this.outerParams.maxSize.toFixed(6)};
                        float calculatedSize = (baseSize * 1000.0) / distance;
                        gl_PointSize = min(calculatedSize, maxSize * 1000.0);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `;

                const fragmentShader = `
                    void main() {
                        float dist = length(gl_PointCoord - vec2(0.5));
                        if (dist > 0.5) discard;
                        gl_FragColor = vec4(0.67, 0.67, 0.67, 1.0);
                    }
                `;

                const newMaterial = new THREE.ShaderMaterial({
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    transparent: false
                });
                
                this.outerMaterial.dispose();
                this.outerMaterial = newMaterial;
                this.outerParticles.material = this.outerMaterial;
                this.outerMaterial.needsUpdate = true;
                
                console.log('🎨 Home mode: Outer particles restored to GRAY (0.67,0.67,0.67)');
            }
        }
        
        console.log(`🎨 Tema güncellendi: ${mode === 'about' ? 'Açık (About)' : 'Koyu (Home)'}`);
    }

    regenerateOuterParticles() {
        const positions = this.outerGeometry.attributes.position.array;
        for (let i = 0; i < this.outerParams.count; i++) {
            const direction = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize();

            const radiusRange = this.outerParams.outerRadius - this.outerParams.innerRadius;
            const randomRadius = this.outerParams.innerRadius + Math.random() * radiusRange;
            const position = direction.clone().multiplyScalar(randomRadius);

            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;

            this.outerRadialCoords[i] = {
                direction: direction.clone(),
                radius: randomRadius
            };
        }
        this.outerGeometry.attributes.position.needsUpdate = true;
    }

    createExplosion(screenX, screenY) {
        const canvas = this.renderer.domElement;
        const rect = canvas.getBoundingClientRect();

        const mouse = new THREE.Vector2();
        mouse.x = (screenX / rect.width) * 2 - 1;
        mouse.y = -(screenY / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        const distance = Math.abs(this.camera.position.z);
        const intersectionPoint = raycaster.ray.origin.clone().add(
            raycaster.ray.direction.clone().multiplyScalar(distance)
        );

        const explosionColor = this.currentPageMode === 'about' ? 0x000000 : 0xffffff;
        const explosion = new SimpleExplosion(intersectionPoint, this.explosionParams, this.scene, explosionColor);
        this.explosions.push(explosion);
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.updateResponsiveSettings();
        this.updateInnerGradientOverlay();
        this.updateLogoSize();
    }

    animate() {
        const currentTime = Date.now();

        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            const isAlive = explosion.update();

            if (!isAlive) {
                explosion.dispose();
                this.explosions.splice(i, 1);
            }
        }

        const innerPos = this.innerGeometry.attributes.position.array;
        const innerSpeed = this.innerParams.speed;
        const innerCurrentCount = Math.floor(this.innerParams.count * this.innerParams.density);
        const PI2 = Math.PI * 2;

        for (let i = 0; i < innerCurrentCount; i++) {
            const coord = this.innerSphericalCoords[i];
            const speed = this.innerSphericalSpeeds[i];

            coord.theta += speed.dTheta * innerSpeed;
            coord.phi += speed.dPhi * innerSpeed;

            coord.theta %= PI2;
            if (coord.theta < 0) coord.theta += PI2;

            if (coord.phi < 0) {
                coord.phi = -coord.phi;
                speed.dPhi = -speed.dPhi;
            } else if (coord.phi > Math.PI) {
                coord.phi = PI2 - coord.phi;
                speed.dPhi = -speed.dPhi;
            }

            const sinPhi = Math.sin(coord.phi);
            const cosPhi = Math.cos(coord.phi);
            const sinTheta = Math.sin(coord.theta);
            const cosTheta = Math.cos(coord.theta);

            innerPos[i * 3] = sinPhi * cosTheta;
            innerPos[i * 3 + 1] = sinPhi * sinTheta;
            innerPos[i * 3 + 2] = cosPhi;
        }
        this.innerGeometry.attributes.position.needsUpdate = true;

        const outerPos = this.outerGeometry.attributes.position.array;
        const directionValue = this.outerParams.direction;
        const hasMovement = directionValue !== 0;
        const deltaMultiplier = hasMovement ? directionValue * 0.02 : 0;
        const rotX = this.outerParams.rotationX * 0.02;
        const rotY = this.outerParams.rotationY * 0.02;
        const hasRotation = rotX !== 0 || rotY !== 0;
        const outerCurrentCount = Math.floor(this.outerParams.count * this.outerParams.density);

        let rotMatrixX, rotMatrixY;
        if (hasRotation) {
            if (rotX !== 0) rotMatrixX = new THREE.Matrix4().makeRotationX(rotX);
            if (rotY !== 0) rotMatrixY = new THREE.Matrix4().makeRotationY(rotY);
        }

        for (let i = 0; i < outerCurrentCount; i++) {
            const coord = this.outerRadialCoords[i];

            if (hasMovement) {
                coord.radius += this.outerRadialSpeeds[i].radialSpeed * deltaMultiplier;
            }

            if ((directionValue > 0 && coord.radius > this.outerParams.outerRadius) ||
                (directionValue < 0 && coord.radius < this.outerParams.innerRadius)) {
                coord.radius = directionValue > 0 ? this.outerParams.innerRadius : this.outerParams.outerRadius;
                coord.direction.set(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ).normalize();
            }

            const dir = coord.direction;
            const radius = coord.radius;
            let x = dir.x * radius;
            let y = dir.y * radius;
            let z = dir.z * radius;

            if (hasRotation) {
                if (rotMatrixX) {
                    const oldX = x, oldY = y, oldZ = z;
                    const m = rotMatrixX.elements;
                    x = oldX;
                    y = m[5] * oldY + m[6] * oldZ;
                    z = m[9] * oldY + m[10] * oldZ;
                }
                if (rotMatrixY) {
                    const oldX = x, oldZ = z;
                    const m = rotMatrixY.elements;
                    x = m[0] * oldX + m[2] * oldZ;
                    z = m[8] * oldX + m[10] * oldZ;
                }
            }

            const idx = i * 3;
            outerPos[idx] = x;
            outerPos[idx + 1] = y;
            outerPos[idx + 2] = z;
        }
        this.outerGeometry.attributes.position.needsUpdate = true;

        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    activateHoverEffect() {
        const logo = document.querySelector('.particle-puf-logo');
        if (logo) {
            logo.style.transform = `scale(${this.hoverParams.logoScale})`;
            logo.style.webkitTransform = `scale(${this.hoverParams.logoScale})`;
        }
        
        this.paramAnimator.animateTo(this.innerParams, 'directionX', this.hoverParams.directionX, 400, null, () => {
            this.updateInnerParticleSpeeds();
        });
        this.paramAnimator.animateTo(this.innerParams, 'speed', this.hoverParams.speed, 400);
        this.paramAnimator.animateTo(this.innerParams, 'gradientIntensity', this.hoverParams.gradientIntensity, 400, null, () => {
            this.updateInnerGradientOverlay();
        });
        this.paramAnimator.animateTo(this.outerParams, 'direction', this.hoverParams.outerDirection, 400);
        this.paramAnimator.animateTo(this.outerParams, 'density', this.hoverParams.outerDensity, 400, null, () => {
            this.updateOuterParticleDensity();
        });
        
        this.animateDensity(this.innerParams, 'density', this.hoverParams.density, 400);
    }

    animateDensity(object, property, targetValue, duration) {
        const startValue = object[property];
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easedProgress = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            const currentValue = startValue + (targetValue - startValue) * easedProgress;
            object[property] = currentValue;
            
            this.updateInnerParticleDensity();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }


    deactivateHoverEffect() {
        const logo = document.querySelector('.particle-puf-logo');
        if (logo) {
            logo.style.transform = `scale(${this.originalParams.logoScale})`;
            logo.style.webkitTransform = `scale(${this.originalParams.logoScale})`;
        }
        
        this.paramAnimator.animateTo(this.innerParams, 'directionX', this.originalParams.directionX, 400, null, () => {
            this.updateInnerParticleSpeeds();
        });
        this.paramAnimator.animateTo(this.innerParams, 'speed', this.originalParams.speed, 400);
        this.paramAnimator.animateTo(this.innerParams, 'density', this.originalParams.density, 400, null, () => {
            this.updateInnerParticleDensity();
        });
        this.paramAnimator.animateTo(this.innerParams, 'gradientIntensity', this.originalParams.gradientIntensity, 400, null, () => {
            this.updateInnerGradientOverlay();
        });
        this.paramAnimator.animateTo(this.outerParams, 'direction', this.originalParams.outerDirection, 400);
        this.paramAnimator.animateTo(this.outerParams, 'density', this.originalParams.outerDensity, 400, null, () => {
            this.updateOuterParticleDensity();
        });
        
        this.animateDensity(this.innerParams, 'density', this.originalParams.density, 400);
    }

    preventZoom() {
        document.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }

        if (this.innerGradientOverlay && this.innerGradientOverlay.parentNode) {
            this.innerGradientOverlay.parentNode.removeChild(this.innerGradientOverlay);
        }

        if (this.logoContainer && this.logoContainer.parentNode) {
            this.logoContainer.parentNode.removeChild(this.logoContainer);
        }

        if (this.innerParticles) {
            this.innerGeometry.dispose();
            this.innerMaterial.dispose();
        }

        if (this.outerParticles) {
            this.outerGeometry.dispose();
            this.outerMaterial.dispose();
        }

        if (this.backgroundSphere) {
            this.backgroundSphere.geometry.dispose();
            this.backgroundSphere.material.dispose();
        }

        this.explosions.forEach(explosion => explosion.dispose());
        this.explosions = [];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PufParticleSystem;
} else if (typeof window !== 'undefined') {
    window.PufParticleSystem = PufParticleSystem;
}
  document.addEventListener('DOMContentLoaded', function() {
    window.pufParticleSystem = new PufParticleSystem();
  });