"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

// ── Mesh Sets (del viewer original, verificados) ──
const MESH_SET_1 = {
  head_top:     { file: "Head_top_4.obj",       role: "blade_sticker",  y: 0.0 },
  head_parts01: { file: "Head_parts01_16.obj",  role: "blade_ring",     y: 0.0 },
  head_metal:   { file: "Head_metal_21.obj",    role: "blade_metal",    y: 0.0 },
  head_parts02: { file: "Head_parts02_8.obj",   role: "blade_detail",   y: -0.002 },
  base_parts01: { file: "Base_parts01_6.obj",   role: "ratchet_main",   y: -0.01 },
  base_parts02: { file: "Base_parts02_14.obj",  role: "ratchet_ring",   y: -0.015 },
  base_parts03: { file: "Base_parts03_0.obj",   role: "ratchet_teeth",  y: -0.018 },
  base_parts04: { file: "Base_parts04_12.obj",  role: "ratchet_lock",   y: -0.022 },
  base_screw:   { file: "Base_screw_19.obj",    role: "ratchet_screw",  y: -0.025 },
  bit_part01:   { file: "Bit_part01_10.obj",    role: "bit_top",        y: -0.03 },
  bit_part02:   { file: "Bit_part02_24.obj",    role: "bit_mid",        y: -0.035 },
  bit_part03:   { file: "Bit_part03_2.obj",     role: "bit_tip",        y: -0.04 },
};

const TOTAL_MESHES = Object.keys(MESH_SET_1).length;

// ── Colores por tipo (del viewer original) ──
const TYPE_COLORS: Record<string, Record<string, number>> = {
  attack: {
    primary: 0xdd3344, secondary: 0xbb2233,
    metal: 0xddaaaa, base: 0x883333, bit: 0xcc5555,
  },
  defense: {
    primary: 0x3366dd, secondary: 0x2255cc,
    metal: 0xaaaadd, base: 0x334488, bit: 0x5566cc,
  },
  stamina: {
    primary: 0x33bb66, secondary: 0x22aa55,
    metal: 0xaaddbb, base: 0x338855, bit: 0x55cc77,
  },
  balance: {
    primary: 0xddbb33, secondary: 0xccaa22,
    metal: 0xddddaa, base: 0x887733, bit: 0xccbb55,
  },
};

// ── Materiales por rol (del catalog.html) ──
function createMaterial(role: string, typeColor: Record<string, number>) {
  const base: THREE.MeshPhysicalMaterialParameters = {
    side: THREE.DoubleSide,
  };

  switch (role) {
    case "blade_sticker":
      return new THREE.MeshPhysicalMaterial({
        ...base, color: 0xffffff,
        metalness: 0.1, roughness: 0.4, clearcoat: 0.8,
        emissive: new THREE.Color(typeColor.primary).multiplyScalar(0.05),
      });
    case "blade_ring":
      return new THREE.MeshPhysicalMaterial({
        ...base, color: typeColor.primary,
        metalness: 0.6, roughness: 0.2, clearcoat: 0.9,
        emissive: new THREE.Color(typeColor.primary).multiplyScalar(0.15),
      });
    case "blade_metal":
      return new THREE.MeshPhysicalMaterial({
        ...base, color: typeColor.metal,
        metalness: 0.95, roughness: 0.1, clearcoat: 0.5,
        emissive: new THREE.Color(typeColor.metal).multiplyScalar(0.08),
      });
    case "blade_detail":
      return new THREE.MeshPhysicalMaterial({
        ...base, color: typeColor.secondary,
        metalness: 0.5, roughness: 0.25, clearcoat: 0.8,
        emissive: new THREE.Color(typeColor.secondary).multiplyScalar(0.1),
      });
    case "ratchet_main":
      return new THREE.MeshPhysicalMaterial({
        ...base, color: 0xddddee,
        metalness: 0.7, roughness: 0.15, clearcoat: 0.7,
        emissive: new THREE.Color(0x8888cc).multiplyScalar(0.05),
      });
    case "ratchet_ring":
      return new THREE.MeshPhysicalMaterial({
        ...base, color: 0xccccdd,
        metalness: 0.8, roughness: 0.12, clearcoat: 0.6,
      });
    case "ratchet_teeth":
      return new THREE.MeshPhysicalMaterial({
        ...base, color: 0xaabbcc,
        metalness: 0.85, roughness: 0.1, clearcoat: 0.5,
      });
    case "ratchet_lock":
      return new THREE.MeshPhysicalMaterial({
        ...base, color: 0x889aaa,
        metalness: 0.9, roughness: 0.08, clearcoat: 0.4,
      });
    case "ratchet_screw":
      return new THREE.MeshPhysicalMaterial({
        ...base, color: 0x999999,
        metalness: 0.95, roughness: 0.05, clearcoat: 0.3,
      });
    case "bit_top":
      return new THREE.MeshPhysicalMaterial({
        ...base, color: typeColor.base,
        metalness: 0.4, roughness: 0.3, clearcoat: 0.7,
        emissive: new THREE.Color(typeColor.base).multiplyScalar(0.08),
      });
    case "bit_mid":
      return new THREE.MeshPhysicalMaterial({
        ...base, color: typeColor.bit,
        metalness: 0.6, roughness: 0.2, clearcoat: 0.5,
      });
    case "bit_tip":
      return new THREE.MeshPhysicalMaterial({
        ...base, color: 0x667788,
        metalness: 0.8, roughness: 0.15, clearcoat: 0.3,
      });
    default:
      return new THREE.MeshPhysicalMaterial({
        ...base, color: 0x8888cc,
        metalness: 0.5, roughness: 0.3,
      });
  }
}

// ── Props ──
interface Beyblade3DProps {
  beyType?: "attack" | "defense" | "stamina" | "balance";
  textureUrl?: string;
  size?: number;
  spinning?: boolean;
  spinSpeed?: number;
  className?: string;
  cameraAngle?: "battle" | "top" | "front";
  bloomEnabled?: boolean;
}

export default function Beyblade3D({
  beyType = "attack",
  textureUrl,
  size = 280,
  spinning = true,
  spinSpeed = 0.02,
  className = "",
  cameraAngle = "battle",
  bloomEnabled = true,
}: Beyblade3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const setup = useCallback(() => {
    if (!containerRef.current) return;

    // Limpiar instancia anterior
    if (cleanupRef.current) cleanupRef.current();

    const colors = TYPE_COLORS[beyType] || TYPE_COLORS.attack;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    containerRef.current.appendChild(renderer.domElement);

    // Post-processing: Bloom para efecto neon
    let composer: EffectComposer | null = null;
    if (bloomEnabled) {
      composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      renderPass.clearAlpha = 0;
      composer.addPass(renderPass);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(size, size),
        0.6,   // strength
        0.4,   // radius
        0.85   // threshold
      );
      composer.addPass(bloomPass);
    }

    // Luces (4 directionales + ambient + rim lights para el glow)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
    mainLight.position.set(5, 10, 5);
    scene.add(mainLight);

    const blueLight = new THREE.DirectionalLight(0x4488ff, 0.8);
    blueLight.position.set(-5, 5, -5);
    scene.add(blueLight);

    const cyanLight = new THREE.DirectionalLight(0x00ffff, 0.5);
    cyanLight.position.set(0, -5, 5);
    scene.add(cyanLight);

    const redLight = new THREE.DirectionalLight(0xff4444, 0.3);
    redLight.position.set(5, -3, -5);
    scene.add(redLight);

    // Rim light para resaltar bordes (contribuye al bloom)
    const rimLight = new THREE.DirectionalLight(0x6644ff, 0.6);
    rimLight.position.set(0, 0, -8);
    scene.add(rimLight);

    scene.add(new THREE.AmbientLight(0x404060, 0.6));

    // Grupo beyblade
    const beyGroup = new THREE.Group();
    scene.add(beyGroup);

    // Tracking de meshes cargados para auto-center
    let loadedCount = 0;

    function autoFitCamera() {
      // Calcular bounding box del grupo completo
      const box = new THREE.Box3().setFromObject(beyGroup);
      const boxCenter = box.getCenter(new THREE.Vector3());
      const boxSize = box.getSize(new THREE.Vector3());

      // Centrar el grupo en (0,0,0)
      beyGroup.position.sub(boxCenter);

      // Recalcular despues del recentrado
      const newBox = new THREE.Box3().setFromObject(beyGroup);
      const newSize = newBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(newSize.x, newSize.y, newSize.z);

      if (maxDim === 0) return;

      // Escalar para que ocupe ~80% del viewport
      // El FOV es 45deg, y queremos que el objeto llene ~80% del alto
      const fov = camera.fov * (Math.PI / 180);
      const targetSize = 2.0; // Tamaño target en unidades de la escena
      const scaleFactor = targetSize / maxDim;

      beyGroup.scale.setScalar(scaleFactor);

      // Posicionar camara segun angulo
      const dist = (targetSize / Math.tan(fov / 2)) * 0.85;

      switch (cameraAngle) {
        case "top":
          camera.position.set(0, dist, 0.01);
          break;
        case "front":
          camera.position.set(0, 0.3, dist);
          break;
        default: // battle — vista 3/4
          camera.position.set(0, dist * 0.45, dist * 0.75);
      }
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }

    // Cargar meshes
    const loader = new OBJLoader();
    const textureLoader = new THREE.TextureLoader();

    Object.entries(MESH_SET_1).forEach(([_key, config]) => {
      loader.load(
        `/models/meshes/${config.file}`,
        (obj) => {
          const mat = createMaterial(config.role, colors);

          // Aplicar textura al sticker si existe
          if (config.role === "blade_sticker" && textureUrl) {
            textureLoader.load(textureUrl, (tex) => {
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.flipY = false;
              mat.map = tex;
              mat.needsUpdate = true;
            });
          }

          obj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.material = mat;
              child.userData.role = config.role;
            }
          });

          // Rotacion Z-up -> Y-up (exportacion Unity)
          obj.rotation.x = -Math.PI / 2;
          obj.position.y = config.y;

          beyGroup.add(obj);

          // Auto-fit cuando todos los meshes estan cargados
          loadedCount++;
          if (loadedCount >= TOTAL_MESHES) {
            autoFitCamera();
          }
        },
        undefined,
        (err) => {
          console.warn(`Mesh ${config.file}:`, err);
          // Contar tambien los que fallan para no bloquear el auto-fit
          loadedCount++;
          if (loadedCount >= TOTAL_MESHES) {
            autoFitCamera();
          }
        }
      );
    });

    // Animacion
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (spinning) {
        beyGroup.rotation.y += spinSpeed * (60 * delta);
      }

      if (composer) {
        // Forzar clear alpha a 0 para transparencia con bloom
        renderer.setClearColor(0x000000, 0);
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    // Cleanup
    cleanupRef.current = () => {
      cancelAnimationFrame(animId);
      if (composer) composer.dispose();
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      if (
        containerRef.current &&
        renderer.domElement.parentNode === containerRef.current
      ) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [beyType, textureUrl, size, spinning, spinSpeed, cameraAngle, bloomEnabled]);

  useEffect(() => {
    setup();
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [setup]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: size, height: size }}
      data-testid="beyblade-3d"
    />
  );
}
