/**
 * PUF Partikül Sistemi - Temiz Component Versiyonu
 * Three.js tabanlı partikül animasyon sistemi
 */

class PufParticleSystem {
    constructor(options = {}) {
        // Varsayılan ayarlar
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

        // Orijinal değerler
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

        // Responsive ayarlar
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

        // Sistem değişkenleri
        this.explosions = [];
        this.currentBreakpoint = 'desktop';
        this.currentPageMode = 'home';
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseInteractionEnabled = true;
        this.paramAnimator = new ParameterAnimator();
        this.innerGradientOverlay = null;

        // Three.js nesneleri
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

        // Container element
        this.container = options.container || document.body;
        
        // Başlat
        this.init();
    }

    init() {
        this.createScene();
        this.createParticles();
        this.createControls();
        this.setupEventListeners();
        this.createGradientOverlays();
        this.createLogo();
        this.updateResponsiveSettings();
        this.setupPageWatcher();
        this.preventZoom();
        this.animate();

        console.log('✅ PUF Partikül Sistemi başlatıldı!');
    }

    createScene() {
        // Scene oluştur
        this.scene = new THREE.Scene();
        
        // Camera oluştur
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        // Renderer oluştur
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Canvas'ı özel ID ve style ile oluştur
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
        
        // Canvas'ı layout div'inden önce body'ye ekle
        const layoutDiv = document.querySelector('.layout');
        if (layoutDiv) {
            document.body.insertBefore(this.renderer.domElement, layoutDiv);
        } else {
            document.body.insertBefore(this.renderer.domElement, document.body.firstChild);
        }

        // Kamera pozisyonunu ayarla
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
        });

        this.innerParticles = new THREE.Points(this.innerGeometry, this.innerMaterial);
        this.innerParticles.renderOrder = 0; // Arka planda kalması için
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

    createControls() {
        // Mevcut kontrol panelini kaldır
        const existingPanel = document.getElementById('particleControlPanel');
        if (existingPanel) {
            existingPanel.remove();
        }

        const controlContainer = document.createElement('div');
        controlContainer.className = 'particle-control-container';
        controlContainer.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            z-index: 1000000000;
        `;

        const mainPanel = document.createElement('div');
        mainPanel.className = 'particle-control-panel';
        mainPanel.id = 'particleControlPanel';
        mainPanel.style.cssText = `
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            margin: 20px;
            padding: 15px;
            color: white;
            font-family: 'Arial', sans-serif;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            max-height: calc(90vh - 40px);
            overflow-y: auto;
            transition: all 0.3s ease;
            min-width: 300px;
        `;

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'particle-toggle-button';
        toggleBtn.id = 'particleToggleBtn';
        toggleBtn.innerText = '+';
        toggleBtn.style.cssText = `
            position: fixed;
            top: 28px;
            right: 28px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            width: 22px;
            height: 22px;
            color: white;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            z-index: 1000000001;
        `;

        const panelsContainer = document.createElement('div');
        panelsContainer.className = 'panels-container';
        panelsContainer.id = 'particleControls';
        panelsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 15px;
            min-width: 300px;
        `;

        // Panel içeriğini oluştur (basitleştirilmiş)
        this.createControlPanels(panelsContainer);

        mainPanel.appendChild(panelsContainer);
        controlContainer.appendChild(mainPanel);
        controlContainer.appendChild(toggleBtn);
        document.body.appendChild(controlContainer);

        // Panel başlangıçta kapalı
        let visible = false;
        panelsContainer.style.display = 'none';
        mainPanel.style.cssText += `
            margin: 0;
            padding: 0;
            background: transparent;
            border: none;
            box-shadow: none;
            overflow: visible;
            max-height: none;
            display: inline-block;
            min-width: auto;
            width: auto;
            height: auto;
        `;

        // Toggle işlevselliği
        toggleBtn.addEventListener('click', () => {
            visible = !visible;
            panelsContainer.style.display = visible ? 'flex' : 'none';
            toggleBtn.innerText = visible ? '−' : '+';
            
            if (visible) {
                mainPanel.style.cssText = `
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    margin: 20px;
                    padding: 15px;
                    color: white;
                    font-family: 'Arial', sans-serif;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    max-height: calc(90vh - 40px);
                    overflow-y: auto;
                    transition: all 0.3s ease;
                    min-width: 300px;
                `;
            } else {
                mainPanel.style.cssText = `
                    margin: 0;
                    padding: 0;
                    background: transparent;
                    border: none;
                    box-shadow: none;
                    overflow: visible;
                    max-height: none;
                    display: inline-block;
                    min-width: auto;
                    width: auto;
                    height: auto;
                `;
            }
        });

        // Hover efektleri
        toggleBtn.addEventListener('mouseenter', () => {
            toggleBtn.style.background = 'rgba(255, 255, 255, 0.2)';
            toggleBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            toggleBtn.style.transform = 'scale(1.1)';
        });

        toggleBtn.addEventListener('mouseleave', () => {
            toggleBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            toggleBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            toggleBtn.style.transform = 'scale(1)';
        });
    }

    createControlPanels(container) {
        // İç Küre paneli - tam özellikli
        const innerPanel = document.createElement('div');
        innerPanel.className = 'sub-panel';
        innerPanel.style.cssText = 'flex: 1; min-width: 240px;';
        
        const innerTitle = document.createElement('h3');
        innerTitle.innerText = 'İç Küre';
        innerTitle.style.cssText = `
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            text-align: center;
            color: #ffffff;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 6px;
        `;
        innerPanel.appendChild(innerTitle);

        // İç küre görünürlük toggle
        const toggleRow = document.createElement('div');
        toggleRow.style.cssText = 'margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px;';
        
        const toggleLabel = document.createElement('label');
        toggleLabel.innerText = 'İç Küre Görünür';
        toggleLabel.style.cssText = 'font-size: 11px; font-weight: 500; color: #e0e0e0; flex: 1;';
        
        const toggleInput = document.createElement('input');
        toggleInput.type = 'checkbox';
        toggleInput.checked = this.innerParams.visible;
        toggleInput.style.cssText = `
            width: 40px; height: 20px; background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 10px;
            position: relative; cursor: pointer; outline: none;
            -webkit-appearance: none; appearance: none; transition: all 0.3s ease;
        `;
        
        toggleInput.addEventListener('change', (e) => {
            this.innerParams.visible = e.target.checked;
            if (this.innerParticles) this.innerParticles.visible = this.innerParams.visible;
            if (this.backgroundSphere) this.backgroundSphere.visible = this.innerParams.visible;
        });
        
        toggleRow.appendChild(toggleLabel);
        toggleRow.appendChild(toggleInput);
        innerPanel.appendChild(toggleRow);

        // İç küre kontrolleri
        innerPanel.appendChild(this.createSlider('Yoğunluk', 0.02, 1.0, this.innerParams.density, 0.02, (v) => { this.innerParams.density = v; this.updateInnerParticleDensity(); }));
        innerPanel.appendChild(this.createSlider('Hız', 0.0, 3.0, this.innerParams.speed, 0.1, (v) => { this.innerParams.speed = v; }));
        innerPanel.appendChild(this.createSlider('Rastgelelik', 0.0, 2.0, this.innerParams.randomness, 0.1, (v) => { this.innerParams.randomness = v; this.updateInnerParticleSpeeds(); }));
        innerPanel.appendChild(this.createSlider('Yön X', -3.0, 3.0, this.innerParams.directionX, 0.1, (v) => { this.innerParams.directionX = v; this.updateInnerParticleSpeeds(); }));
        innerPanel.appendChild(this.createSlider('Yön Y', -3.0, 3.0, this.innerParams.directionY, 0.1, (v) => { this.innerParams.directionY = v; this.updateInnerParticleSpeeds(); }));
        innerPanel.appendChild(this.createSlider('Boyut', 0.001, 0.02, this.innerParams.size, 0.0001, (v) => { this.innerParams.size = v; if (this.innerMaterial) this.innerMaterial.size = v; }));
        innerPanel.appendChild(this.createSlider('Gradyan', 0.0, 1.0, this.innerParams.gradientIntensity, 0.01, (v) => { this.innerParams.gradientIntensity = v; this.updateInnerGradientOverlay(); }));

        // Dış Halka paneli - tam özellikli
        const outerPanel = document.createElement('div');
        outerPanel.className = 'sub-panel';
        outerPanel.style.cssText = 'flex: 1; min-width: 240px;';
        
        const outerTitle = document.createElement('h3');
        outerTitle.innerText = 'Dış Halka';
        outerTitle.style.cssText = `
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            text-align: center;
            color: #ffffff;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 6px;
        `;
        outerPanel.appendChild(outerTitle);

        outerPanel.appendChild(this.createSlider('Yoğunluk', 0.01, 1.0, this.outerParams.density, 0.01, (v) => { this.outerParams.density = v; this.updateOuterParticleDensity(); }));
        outerPanel.appendChild(this.createSlider('Yön', -1.0, 1.0, this.outerParams.direction, 0.01, (v) => { this.outerParams.direction = v; }));
        outerPanel.appendChild(this.createSlider('Rot X', -6.0, 6.0, this.outerParams.rotationX, 0.1, (v) => { this.outerParams.rotationX = v; this.isMouseInteractionEnabled = false; }));
        outerPanel.appendChild(this.createSlider('Rot Y', -6.0, 6.0, this.outerParams.rotationY, 0.1, (v) => { this.outerParams.rotationY = v; this.isMouseInteractionEnabled = false; }));
        outerPanel.appendChild(this.createSlider('Parça Boyutu', 0.001, 0.02, this.outerParams.size, 0.0001, (v) => { 
            this.outerParams.size = v; 
            this.updateOuterShader(); 
        }));
        outerPanel.appendChild(this.createSlider('Maks Boyut', 0.01, 0.1, this.outerParams.maxSize, 0.005, (v) => { this.outerParams.maxSize = v; this.updateOuterShader(); }));
        outerPanel.appendChild(this.createSlider('İç Yarıçap', 0.5, 3.0, this.outerParams.innerRadius, 0.1, (v) => { this.outerParams.innerRadius = v; this.regenerateOuterParticles(); }));
        outerPanel.appendChild(this.createSlider('Dış Yarıçap', 1.0, 6.0, this.outerParams.outerRadius, 0.1, (v) => { this.outerParams.outerRadius = v; this.regenerateOuterParticles(); }));
        
        // Mouse toggle
        const mouseToggleRow = document.createElement('div');
        mouseToggleRow.style.cssText = 'margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px;';
        const mouseToggleLabel = document.createElement('label');
        mouseToggleLabel.innerText = 'Mouse ile Döndür';
        mouseToggleLabel.style.cssText = 'font-size: 11px; font-weight: 500; color: #e0e0e0; flex: 1;';
        const mouseToggleInput = document.createElement('input');
        mouseToggleInput.type = 'checkbox';
        mouseToggleInput.checked = this.isMouseInteractionEnabled;
        mouseToggleInput.style.cssText = `
            width: 40px; height: 20px; background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 10px;
            position: relative; cursor: pointer; outline: none;
            -webkit-appearance: none; appearance: none; transition: all 0.3s ease;
        `;
        mouseToggleInput.addEventListener('change', (e) => { this.isMouseInteractionEnabled = e.target.checked; });
        mouseToggleRow.appendChild(mouseToggleLabel);
        mouseToggleRow.appendChild(mouseToggleInput);
        outerPanel.appendChild(mouseToggleRow);

        // Logo paneli
        const logoPanel = document.createElement('div');
        logoPanel.className = 'sub-panel';
        logoPanel.style.cssText = 'flex: 1; min-width: 240px;';
        
        const logoTitle = document.createElement('h3');
        logoTitle.innerText = 'Logo';
        logoTitle.style.cssText = `
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            text-align: center;
            color: #ffffff;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 6px;
        `;
        logoPanel.appendChild(logoTitle);

        logoPanel.appendChild(this.createSlider('Boyut', 0.2, 3.0, this.logoParams.sizeMultiplier, 0.1, (v) => { this.logoParams.sizeMultiplier = v; this.updateLogoSize(); }));
        
        // Logo görünürlük toggle
        const logoToggleRow = document.createElement('div');
        logoToggleRow.style.cssText = 'margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px;';
        const logoToggleLabel = document.createElement('label');
        logoToggleLabel.innerText = 'Logo Görünür';
        logoToggleLabel.style.cssText = 'font-size: 11px; font-weight: 500; color: #e0e0e0; flex: 1;';
        const logoToggleInput = document.createElement('input');
        logoToggleInput.type = 'checkbox';
        logoToggleInput.checked = this.logoParams.visible;
        logoToggleInput.style.cssText = `
            width: 40px; height: 20px; background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 10px;
            position: relative; cursor: pointer; outline: none;
            -webkit-appearance: none; appearance: none; transition: all 0.3s ease;
        `;
        logoToggleInput.addEventListener('change', (e) => { 
            this.logoParams.visible = e.target.checked; 
            if (this.logoContainer) this.logoContainer.style.display = this.logoParams.visible ? 'block' : 'none'; 
        });
        logoToggleRow.appendChild(logoToggleLabel);
        logoToggleRow.appendChild(logoToggleInput);
        logoPanel.appendChild(logoToggleRow);

        // Hover paneli
        const hoverPanel = document.createElement('div');
        hoverPanel.className = 'sub-panel';
        hoverPanel.style.cssText = 'flex: 1; min-width: 240px;';
        
        const hoverTitle = document.createElement('h3');
        hoverTitle.innerText = 'Hover Ayarları';
        hoverTitle.style.cssText = `
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            text-align: center;
            color: #ffffff;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 6px;
        `;
        hoverPanel.appendChild(hoverTitle);

        hoverPanel.appendChild(this.createSlider('Hover Yön X', -6.0, 6.0, this.hoverParams.directionX, 0.1, (v) => { this.hoverParams.directionX = v; }));
        hoverPanel.appendChild(this.createSlider('Hover Hız', 0.1, 5.0, this.hoverParams.speed, 0.1, (v) => { this.hoverParams.speed = v; }));
        hoverPanel.appendChild(this.createSlider('Hover Yoğunluk', 0.05, 1.0, this.hoverParams.density, 0.01, (v) => { this.hoverParams.density = v; }));
        hoverPanel.appendChild(this.createSlider('Hover Gradyan', 0.0, 1.0, this.hoverParams.gradientIntensity, 0.01, (v) => { this.hoverParams.gradientIntensity = v; }));
        hoverPanel.appendChild(this.createSlider('Hover Logo Ölçek', 0.5, 2.0, this.hoverParams.logoScale, 0.01, (v) => { this.hoverParams.logoScale = v; }));
        hoverPanel.appendChild(this.createSlider('Hover Dış Yön', -2.0, 2.0, this.hoverParams.outerDirection, 0.01, (v) => { this.hoverParams.outerDirection = v; }));

        // Patlama paneli
        const explosionPanel = document.createElement('div');
        explosionPanel.className = 'sub-panel';
        explosionPanel.style.cssText = 'flex: 1; min-width: 240px;';
        
        const explosionTitle = document.createElement('h3');
        explosionTitle.innerText = 'Patlama';
        explosionTitle.style.cssText = `
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            text-align: center;
            color: #ffffff;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 6px;
        `;
        explosionPanel.appendChild(explosionTitle);

        explosionPanel.appendChild(this.createSlider('Parçacık', 10, 1000, this.explosionParams.particleCount, 10, (v) => { this.explosionParams.particleCount = Math.floor(v); }));
        explosionPanel.appendChild(this.createSlider('Hız', 0.01, 0.5, this.explosionParams.speed, 0.01, (v) => { this.explosionParams.speed = v; }));
        explosionPanel.appendChild(this.createSlider('Ömür (ms)', 500, 10000, this.explosionParams.lifeTime, 100, (v) => { this.explosionParams.lifeTime = Math.floor(v); }));
        explosionPanel.appendChild(this.createSlider('Boyut', 0.001, 0.05, this.explosionParams.size, 0.001, (v) => { this.explosionParams.size = v; }));

        // Tüm panelleri ekle
        container.appendChild(innerPanel);
        container.appendChild(outerPanel);
        container.appendChild(logoPanel);
        container.appendChild(hoverPanel);
        container.appendChild(explosionPanel);
    }


    createSlider(label, min, max, value, step, onChange) {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'margin-bottom: 10px; display: flex; align-items: center; gap: 8px;';

        const lbl = document.createElement('label');
        lbl.innerText = label;
        lbl.style.cssText = 'font-size: 11px; font-weight: 500; color: #e0e0e0; min-width: 70px; flex-shrink: 0;';

        const row = document.createElement('div');
        row.style.cssText = 'display: flex; align-items: center; gap: 6px; flex: 1;';

        const range = document.createElement('input');
        range.type = 'range';
        range.min = min;
        range.max = max;
        range.step = step;
        range.setAttribute('step', step.toString());
        range.value = parseFloat(value);
        range.style.cssText = `
            flex: 1;
            height: 4px;
            border-radius: 2px;
            background: rgba(255, 255, 255, 0.2);
            outline: none;
            opacity: 0.8;
            transition: opacity 0.2s;
            -webkit-appearance: none;
            appearance: none;
        `;

        const num = document.createElement('input');
        num.type = 'text';
        num.pattern = '[0-9]*\\.?[0-9]*';
        num.inputMode = 'decimal';
        const formattedValue = parseFloat(value).toFixed(step < 0.001 ? 5 : (step < 0.01 ? 4 : (step < 1 ? 3 : 0)));
        num.value = formattedValue;
        num.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            padding: 2px 4px;
            font-size: 10px;
            width: 45px;
            text-align: center;
            color: #ffffff;
            outline: none;
        `;

        range.addEventListener('input', e => {
            const val = parseFloat(e.target.value);
            num.value = val.toFixed(step < 0.001 ? 5 : (step < 0.01 ? 4 : (step < 1 ? 3 : 0)));
            onChange(val);
        });

        num.addEventListener('input', e => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) {
                range.value = v;
                onChange(v);
            }
        });

        row.appendChild(range);
        row.appendChild(num);
        wrap.appendChild(lbl);
        wrap.appendChild(row);
        return wrap;
    }

    setupEventListeners() {
        // Resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Mouse events
        window.addEventListener('mousemove', (event) => {
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
            this.updateMouseRotation();
        });

        // Initialize mouse position
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        this.updateMouseRotation();

        // Click events for explosions
        window.addEventListener('click', (event) => {
            // Kontrol paneli ve navbar'a tıklanırsa patlama oluşturma
            if (event.target.closest('.particle-control-container') ||
                event.target.closest('.navbar-buttons') ||
                event.target.closest('.top') ||
                event.target.closest('a') ||
                event.target.closest('button')) {
                return;
            }

            this.createExplosion(event.clientX, event.clientY);
        });

        // Touch events
        window.addEventListener('touchstart', (event) => {
            if (event.target.closest('.particle-control-container') ||
                event.target.closest('.navbar-buttons') ||
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

        // Hover efektleri için bağlantılar
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
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(this.innerGradientOverlay);
        this.updateInnerGradientOverlay();
    }

    setupPageWatcher() {
        const aboutContainer = document.querySelector('.about-container');
        const homeContainer = document.querySelector('.home-container');
        
        const checkCurrentPage = () => {
            let aboutVisible = false;
            
            if (aboutContainer) {
                const aboutStyle = window.getComputedStyle(aboutContainer);
                aboutVisible = aboutStyle.display !== 'none' && aboutStyle.opacity !== '0';
            }
            
            const newMode = aboutVisible ? 'about' : 'home';
            
            if (newMode !== this.currentPageMode) {
                this.updateParticleColors(newMode);
            }
        };
        
        // Observer'lar
        if (aboutContainer) {
            const aboutObserver = new MutationObserver(checkCurrentPage);
            aboutObserver.observe(aboutContainer, { 
                attributes: true, 
                attributeFilter: ['style', 'class'] 
            });
        }
        
        if (homeContainer) {
            const homeObserver = new MutationObserver(checkCurrentPage);
            homeObserver.observe(homeContainer, { 
                attributes: true, 
                attributeFilter: ['style', 'class'] 
            });
        }
        
        // İlk durum kontrolü
        checkCurrentPage();
        
        // Periyodik kontrol
        setInterval(checkCurrentPage, 1000);
    }

    // Utility methods
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

    updateInnerGradientOverlay() {
        if (!this.innerGradientOverlay) return;

        const intensity = this.innerParams.gradientIntensity;
        if (intensity === 0) {
            this.innerGradientOverlay.style.opacity = '0';
            return;
        }

        this.innerGradientOverlay.style.opacity = '1';
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

        this.innerGradientOverlay.style.background = `radial-gradient(${gradientSize}${viewportUnit} at 50% 50%, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.85) ${opaqueStop}%, transparent ${transparentStart}%)`;
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
        this.currentPageMode = mode;
        const root = document.documentElement;
        
        if (mode === 'about') {
            // About sayfası ayarları
            root.style.setProperty('--bg-color', '#EBEBEB');
            
            // Sadece radial button için renkleri değiştir
            const radialButton = document.querySelector('.link-radial.js-hover');
            if (radialButton) {
                radialButton.style.setProperty('--light', '#000000');
                radialButton.style.setProperty('--dark', '#ffffff');
                radialButton.style.borderColor = '#000000';
                radialButton.style.color = '#000000';
                
                const linkText = radialButton.querySelector('.link');
                if (linkText) {
                    linkText.style.color = '#000000';
                }
            }
            
            // About sayfasında body'ye class ekle
            document.body.classList.add('about-mode');
            console.log('🔄 About mode aktifleştirildi - Scroll debug başlıyor...');
            
            // Canvas z-index'ini about mode için ayarla ve görünürlüğünü garantile
            if (this.renderer && this.renderer.domElement) {
                this.renderer.domElement.style.zIndex = '5'; // Layout'un üstünde ama content'in altında
                this.renderer.domElement.style.display = 'block';
                this.renderer.domElement.style.visibility = 'visible';
                this.renderer.domElement.style.opacity = '1';
                this.renderer.domElement.style.position = 'fixed';
                this.renderer.domElement.style.pointerEvents = 'none'; // Tıklanamaz
                this.renderer.domElement.style.top = '0';
                this.renderer.domElement.style.left = '0';
                this.renderer.domElement.style.width = '100vw';
                this.renderer.domElement.style.height = '100vh';
                console.log('🎨 Canvas about mode için ayarlandı: z-index 5, pointer-events none');
            }
            
            // Scroll'u etkinleştir - KESIN ÇÖZÜM
            document.documentElement.style.overflow = 'auto';
            document.documentElement.style.overflowY = 'scroll';
            document.documentElement.style.height = '100%';
            document.body.style.overflow = 'auto';
            document.body.style.overflowY = 'scroll';
            document.body.style.height = 'auto';
            document.body.style.minHeight = '100vh';
            document.body.style.maxHeight = 'none';
            document.body.style.position = 'static';
            
            // Layout ve container ayarları - RADIKAL YAKLAŞIM
            const pageContainer = document.querySelector('.page-container');
            if (pageContainer) {
                pageContainer.style.overflow = 'visible';
                pageContainer.style.overflowY = 'visible';
            }
            
            const layout = document.querySelector('.layout');
            if (layout) {
                layout.style.overflow = 'visible';
                layout.style.overflowY = 'visible';
                layout.style.height = 'auto';
                layout.style.minHeight = '100vh';
                layout.style.position = 'static';
            }
            
            const aboutContainer = document.querySelector('.about-container');
            if (aboutContainer) {
                // Sadece scroll ve layout ile ilgili stil değişiklikleri
                aboutContainer.style.overflow = 'visible';
                aboutContainer.style.overflowY = 'visible';
                aboutContainer.style.height = 'auto';
                aboutContainer.style.minHeight = '200vh'; // Kesinlikle scroll olsun
                aboutContainer.style.position = 'static';
                aboutContainer.style.paddingBottom = '100vh'; // Ekstra scroll alanı
                
                // Display ve opacity navigation.js tarafından kontrol edilecek - burada dokunmuyoruz
                console.log('🎨 Particle system: About container layout updated, not touching display/opacity');
                
                // Responsive gap ayarları
                const width = window.innerWidth;
                if (width <= 479) {
                    aboutContainer.style.gap = '120px';
                } else if (width <= 767) {
                    aboutContainer.style.gap = '220px';
                } else if (width <= 991) {
                    aboutContainer.style.gap = '280px';
                } else {
                    aboutContainer.style.gap = '350px';
                }
            }
            
            // Home container'ı gizle
            const homeContainer = document.querySelector('.home-container');
            if (homeContainer) {
                homeContainer.style.display = 'none';
                homeContainer.style.height = '0';
                homeContainer.style.overflow = 'hidden';
            }
            
            // Home-wrap'in height: 100vh'ını iptal et
            const homeWrap = document.querySelector('.home-wrap');
            if (homeWrap) {
                homeWrap.style.height = 'auto';
                homeWrap.style.minHeight = 'auto';
            }
            
            // Tüm parent elementlerin overflow'unu temizle
            const allParents = document.querySelectorAll('*');
            allParents.forEach(element => {
                const computedStyle = window.getComputedStyle(element);
                if (computedStyle.overflow === 'hidden' && 
                    !element.classList.contains('w-embed') &&
                    !element.classList.contains('w-slider') &&
                    !element.classList.contains('w-lightbox') &&
                    element.tagName.toLowerCase() !== 'svg') {
                    element.style.overflow = 'visible';
                }
            });
            
            // About mode'da Lenis'i tamamen devre dışı bırak - native scroll kullan
            if (window.lenis) {
                window.lenis.destroy();
                window.lenis = null;
                console.log('🚫 Lenis tamamen devre dışı bırakıldı - Native scroll aktif');
            }
            
            console.log('✅ Scroll ayarları tamamlandı. Test için about container içeriğini scroll etmeyi deneyin.');
            console.log('🔍 About container yüksekliği:', aboutContainer ? aboutContainer.scrollHeight + 'px' : 'Bulunamadı');
            console.log('🔍 Body scroll yüksekliği:', document.body.scrollHeight + 'px');
            console.log('🔍 Viewport yüksekliği:', window.innerHeight + 'px');
            
            // Native scroll test
            setTimeout(() => {
                console.log('🧪 Native scroll test başlatılıyor...');
                const canScroll = document.body.scrollHeight > window.innerHeight;
                console.log('🧪 Scroll mümkün mü?', canScroll ? 'EVET' : 'HAYIR');
                
                if (canScroll) {
                    console.log('🧪 Native scroll to 500px test ediliyor...');
                    window.scrollTo({
                        top: 500,
                        behavior: 'smooth'
                    });
                    
                    setTimeout(() => {
                        console.log('🧪 Native scroll to 0 test ediliyor...');
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    }, 3000);
                } else {
                    console.log('❌ Scroll test yapılamıyor - canScroll:', canScroll);
                }
            }, 1000);
            
            // About mode'da iç küre, logo ve gradyanı gizle
            if (this.logoContainer) this.logoContainer.style.display = 'none';
            if (this.innerGradientOverlay) this.innerGradientOverlay.style.display = 'none';
            if (this.innerParticles) this.innerParticles.visible = false;
            if (this.backgroundSphere) this.backgroundSphere.visible = false;
            
            // Dış halka partiküllerini siyah yap
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

                // Yeni material oluştur ve uygula
                const newMaterial = new THREE.ShaderMaterial({
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    transparent: false
                });
                
                // Eski material'ı dispose et
                this.outerMaterial.dispose();
                this.outerMaterial = newMaterial;
                this.outerParticles.material = this.outerMaterial;
                this.outerMaterial.needsUpdate = true;
                
                console.log('🎨 About mode: Outer particles set to BLACK (0,0,0)');
            }
        } else {
            // Home sayfası ayarları
            root.style.setProperty('--bg-color', '#000000');
            
            // About mode class'ını kaldır
            document.body.classList.remove('about-mode');
            
            // Canvas z-index'ini home mode için sıfırla ve görünürlüğünü garantile
            if (this.renderer && this.renderer.domElement) {
                this.renderer.domElement.style.zIndex = '-1000'; // Home mode'da arka planda
                this.renderer.domElement.style.display = 'block';
                this.renderer.domElement.style.visibility = 'visible';
                this.renderer.domElement.style.opacity = '1';
                this.renderer.domElement.style.position = 'fixed';
                this.renderer.domElement.style.pointerEvents = 'none'; // Tıklanamaz
                console.log('🎨 Canvas home mode için ayarlandı: z-index -1000, pointer-events none');
            }
            
            // Scroll ayarlarını sıfırla
            document.documentElement.style.overflow = '';
            document.documentElement.style.overflowY = '';
            document.documentElement.style.height = '';
            document.body.style.overflow = '';
            document.body.style.overflowY = '';
            document.body.style.height = '';
            document.body.style.maxHeight = '';
            document.body.style.position = '';
            
            // Layout ve container ayarlarını sıfırla
            const pageContainer = document.querySelector('.page-container');
            if (pageContainer) {
                pageContainer.style.overflow = '';
                pageContainer.style.overflowY = '';
            }
            
            const layout = document.querySelector('.layout');
            if (layout) {
                layout.style.overflow = '';
                layout.style.overflowY = '';
                layout.style.height = '';
                layout.style.minHeight = '';
                layout.style.position = '';
            }
            
            const aboutContainer = document.querySelector('.about-container');
            if (aboutContainer) {
                // Sadece layout ile ilgili stilleri temizle, display/opacity navigation.js'e bırak
                aboutContainer.style.overflow = '';
                aboutContainer.style.overflowY = '';
                aboutContainer.style.height = '';
                aboutContainer.style.minHeight = '';
                aboutContainer.style.position = '';
                aboutContainer.style.paddingBottom = '';
                aboutContainer.style.gap = '';
                
                console.log('🎨 Particle system: About container layout reset, not touching display/opacity');
            }
            
            // Home container'ı göster
            const homeContainer = document.querySelector('.home-container');
            if (homeContainer) {
                homeContainer.style.display = '';
                homeContainer.style.height = '';
                homeContainer.style.overflow = '';
            }
            
            // Home-wrap'i resetle
            const homeWrap = document.querySelector('.home-wrap');
            if (homeWrap) {
                homeWrap.style.height = '';
                homeWrap.style.minHeight = '';
            }
            
            // Tüm elementlerin overflow ayarlarını sıfırla
            const allElements = document.querySelectorAll('*[style*="overflow"]');
            allElements.forEach(element => {
                if (!element.classList.contains('w-embed') &&
                    !element.classList.contains('w-slider') &&
                    !element.classList.contains('w-lightbox') &&
                    element.tagName.toLowerCase() !== 'svg') {
                    element.style.overflow = '';
                }
            });
            
            // Radial button renklerini sıfırla
            const radialButton = document.querySelector('.link-radial.js-hover');
            if (radialButton) {
                radialButton.style.removeProperty('--light');
                radialButton.style.removeProperty('--dark');
                radialButton.style.borderColor = '';
                radialButton.style.color = '';
                
                const linkText = radialButton.querySelector('.link');
                if (linkText) {
                    linkText.style.color = '';
                }
            }
            
            // Home mode'da iç küre, gradyan ve logoyu göster
            if (this.innerParticles) this.innerParticles.visible = this.innerParams.visible;
            if (this.backgroundSphere) this.backgroundSphere.visible = this.innerParams.visible;
            if (this.logoContainer) this.logoContainer.style.display = this.logoParams.visible ? 'block' : 'none';
            if (this.innerGradientOverlay) this.innerGradientOverlay.style.display = 'block';
            
            // Partikülleri beyaz/gri yap
            if (this.innerMaterial) this.innerMaterial.color.setHex(0xffffff);
            if (this.outerMaterial && this.outerParticles) {
                // Home mode için orijinal gri rengi geri yükle
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

                // Yeni material oluştur ve uygula
                const newMaterial = new THREE.ShaderMaterial({
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    transparent: false
                });
                
                // Eski material'ı dispose et
                this.outerMaterial.dispose();
                this.outerMaterial = newMaterial;
                this.outerParticles.material = this.outerMaterial;
                this.outerMaterial.needsUpdate = true;
                
                console.log('🎨 Home mode: Outer particles restored to GRAY (0.67,0.67,0.67)');
            }
            
            // Home mode için Lenis'i restore et (eğer yoksa)
            if (!window.lenis && typeof Lenis !== 'undefined') {
                setTimeout(() => {
                    const homeLenis = new Lenis({
                        duration: 1.2,
                        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                        smooth: true,
                        smoothTouch: false,
                        infinite: false
                    });
                    
                    function homeRaf(time) {
                        homeLenis.raf(time);
                        requestAnimationFrame(homeRaf);
                    }
                    requestAnimationFrame(homeRaf);
                    
                    window.lenis = homeLenis;
                    console.log('🔄 Home mode için Lenis restore edildi');
                }, 100);
            } else if (window.lenis) {
                console.log('🔄 Home mode - Lenis zaten mevcut');
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

        // Patlama rengi mode'a göre ayarla - About mode'da siyah, Home mode'da beyaz
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

        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            const isAlive = explosion.update();

            if (!isAlive) {
                explosion.dispose();
                this.explosions.splice(i, 1);
            }
        }

        // Update inner particles
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

        // Update outer particles
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

    // Hover effects
    activateHoverEffect() {
        const logo = document.querySelector('.particle-puf-logo');
        if (logo) {
            logo.style.transform = `scale(${this.hoverParams.logoScale})`;
            logo.style.webkitTransform = `scale(${this.hoverParams.logoScale})`;
        }
        
        // Smooth animasyonlar
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
        
        // Yoğunluk için özel animasyon - slider gibi çalışır
        this.animateDensity(this.innerParams, 'density', this.hoverParams.density, 400);
    }

    animateDensity(object, property, targetValue, duration) {
        const startValue = object[property];
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easedProgress = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            const currentValue = startValue + (targetValue - startValue) * easedProgress;
            object[property] = currentValue;
            
            // Slider gibi doğrudan güncelleme
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
        
        // Smooth animasyonlar
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
        
        // Yoğunluk için özel animasyon - slider gibi çalışır
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

    // Cleanup
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

        // Dispose geometries and materials
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

        // Dispose explosions
        this.explosions.forEach(explosion => explosion.dispose());
        this.explosions = [];

        // Remove control panel
        const controlPanel = document.getElementById('particleControlPanel');
        if (controlPanel && controlPanel.parentNode) {
            controlPanel.parentNode.removeChild(controlPanel);
        }
    }
}

// Parameter Animator Class
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
                
                // Animasyon sırasında güncellemeleri yap
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

// Simple Explosion Class
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
            blending: THREE.AdditiveBlending
        });

        this.points = new THREE.Points(this.geometry, this.material);
        this.points.renderOrder = 1; // İç kürenin önünde görünmesi için
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

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PufParticleSystem;
} else if (typeof window !== 'undefined') {
    window.PufParticleSystem = PufParticleSystem;
}