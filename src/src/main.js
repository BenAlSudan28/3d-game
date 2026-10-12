import * as THREE from 'three';
import './style.css';

const loading = document.getElementById('loading');
const speedDisplay = document.getElementById('speed');
const distanceDisplay = document.getElementById('distance');
const message = document.getElementById('message');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8c9d0);
scene.fog = new THREE.Fog(0xa8c9d0, 100, 360);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  700
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.getElementById('game').prepend(renderer.domElement);

// Lighting
scene.add(new THREE.HemisphereLight(0xe5f5ff, 0x66734b, 2));

const sunlight = new THREE.DirectionalLight(0xffffff, 2.1);
sunlight.position.set(-70, 120, 45);
scene.add(sunlight);

// Materials
function material(color, roughness = 0.85, metalness = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness
  });
}

const grassMat = material(0x719b58);
const roadMat = material(0x363d45);
const lineMat = material(0xe8e3c9);
const sidewalkMat = material(0xbab9b0);
const whiteMat = material(0xf0f2f2);
const darkMat = material(0x18232b);
const glassMat = new THREE.MeshStandardMaterial({
  color: 0x8bc9dc,
  roughness: 0.25,
  metalness: 0.15
});

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(700, 700),
  grassMat
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.12;
scene.add(ground);

// Helpers
function box(parent, w, h, d, mat, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    mat
  );

  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, radius, height, mat, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 8),
    mat
  );

  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

// City roads
const roadGroup = new THREE.Group();
scene.add(roadGroup);

box(roadGroup, 620, 0.12, 620, grassMat, 0, -0.04, 0);

for (let p = -300; p <= 300; p += 60) {
  // Roads in both directions
  box(roadGroup, 620, 0.08, 14, roadMat, 0, 0, p);
  box(roadGroup, 14, 0.08, 620, roadMat, p, 0, 0);

  // Road markings
  for (let t = -300; t < 300; t += 18) {
    box(roadGroup, 7, 0.035, 0.22, lineMat, t, 0.055, p);
    box(roadGroup, 0.22, 0.035, 7, lineMat, p, 0.055, t);
  }

  // Sidewalks
  box(roadGroup, 620, 0.13, 2, sidewalkMat, 0, 0.02, p - 8);
  box(roadGroup, 620, 0.13, 2, sidewalkMat, 0, 0.02, p + 8);
  box(roadGroup, 2, 0.13, 620, sidewalkMat, p - 8, 0.02, 0);
  box(roadGroup, 2, 0.13, 620, sidewalkMat, p + 8, 0.02, 0);
}

// Buildings
const buildingColors = [
  0xd5d4cf,
  0xc5d2d8,
  0xe0c9ad,
  0xbac8bb,
  0xd9b9a8,
  0xaab9c6,
  0xe4dfd2
];

function makeBuilding(x, z, w, d, h, color) {
  const group = new THREE.Group();

  const buildingMat = material(color);
  box(group, w, h, d, buildingMat, 0, h / 2, 0);

  // Roof
  box(
    group,
    w + 0.5,
    0.35,
    d + 0.5,
    material(0x777d80),
    0,
    h + 0.15,
    0
  );

  // Window rows on the front and back
  const windowMat = material(0x568a9e, 0.3, 0.1);
  const cols = Math.max(2, Math.floor(w / 3));
  const rows = Math.max(2, Math.floor(h / 3.5));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const wx = -w / 2 + (col + 0.5) * w / cols;
      const wy = 2 + row * (h - 3) / rows;

      if (wy > h - 1) continue;

      box(
        group,
        Math.min(1.2, w / cols * 0.45),
        1.05,
        0.08,
        windowMat,
        wx,
        wy,
        d / 2 + 0.045
      );

      box(
        group,
        Math.min(1.2, w / cols * 0.45),
        1.05,
        0.08,
        windowMat,
        wx,
        wy,
        -d / 2 - 0.045
      );
    }
  }

  group.position.set(x, 0, z);
  scene.add(group);
}

for (let bx = -270; bx <= 270; bx += 60) {
  for (let bz = -270; bz <= 270; bz += 60) {
    // Skip the center block to leave room around the starting position
    if (Math.abs(bx) < 35 && Math.abs(bz) < 35) continue;

    const positions = [
      [-13, -13],
      [13, -13],
      [-13, 13],
      [13, 13]
    ];

    for (const [ox, oz] of positions) {
      if (Math.random() < 0.15) continue;

      const w = 8 + Math.random() * 7;
      const d = 8 + Math.random() * 7;
      const h = 8 + Math.random() * 25;
      const color =
        buildingColors[
          Math.floor(Math.random() * buildingColors.length)
        ];

      makeBuilding(bx + ox, bz + oz, w, d, h, color);
    }
  }
}

// Trees
function makeTree(x, z) {
  const tree = new THREE.Group();

  cylinder(
    tree,
    0.35,
    2.4,
    material(0x76533b),
    0,
    1.2,
    0
  );

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(2.2, 5, 7),
    material(0x34754b)
  );

  leaves.position.y = 4.2;
  tree.add(leaves);

  const leaves2 = new THREE.Mesh(
    new THREE.ConeGeometry(1.6, 3.6, 7),
    material(0x488956)
  );

  leaves2.position.y = 5.5;
  tree.add(leaves2);

  tree.position.set(x, 0, z);
  scene.add(tree);
}

for (let x = -270; x <= 270; x += 30) {
  for (let z = -270; z <= 270; z += 30) {
    if (Math.abs(x % 60) < 1 || Math.abs(z % 60) < 1) {
      if (Math.random() > 0.65) makeTree(x + 5, z + 5);
    }
  }
}

// Sports car
const car = new THREE.Group();
scene.add(car);

const carBodyMat = material(0xd7192d, 0.28, 0.35);
const carDarkMat = material(0x242b33, 0.35, 0.15);
const wheelMat = material(0x141619, 0.8);
const rimMat = material(0xb8c2c8, 0.35, 0.7);
const headlightMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0xffedbd,
  emissiveIntensity: 1.5
});

box(car, 2.05, 0.58, 4.3, carBodyMat, 0, 0.75, 0);
box(car, 1.7, 0.12, 1.1, carBodyMat, 0, 1.06, -1.35);

const cabin = box(
  car,
  1.48,
  0.68,
  2.05,
  glassMat,
  0,
  1.35,
  0.15
);

box(car, 1.62, 0.12, 0.85, carBodyMat, 0, 1.08, 1.45);
box(car, 1.9, 0.16, 0.2, carDarkMat, 0, 0.55, 2.12);

for (const side of [-1, 1]) {
  box(
    car,
    0.08,
    0.13,
    0.3,
    headlightMat,
    side * 0.72,
    0.87,
    -2.17
  );
}

const wheels = [];

for (const x of [-1.03, 1.03]) {
  for (const z of [-1.35, 1.35]) {
    const wheel = new THREE.Group();
    wheel.position.set(x, 0.43, z);

    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.43, 0.43, 0.25, 16),
      wheelMat
    );

    tire.rotation.z = Math.PI / 2;
    wheel.add(tire);

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.27, 12),
      rimMat
    );

    rim.rotation.z = Math.PI / 2;
    wheel.add(rim);

    car.add(wheel);
    wheels.push(wheel);
  }
}

car.position.set(0, 0.1, 5);

// Driving state
const input = {
  left: false,
  right: false,
  gas: false,
  brake: false
};

let heading = 0;
let velocity = 0;
let distance = 0;
let cameraMode = 0;

const maxForwardSpeed = 34;
const maxReverseSpeed = 10;
const acceleration = 15;
const brakePower = 25;
const drag = 5;

function bindControl(button) {
  const name = button.dataset.control;

  const release = () => {
    input[name] = false;
    button.classList.remove('active');
  };

  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    input[name] = true;
    button.classList.add('active');

    try {
      button.setPointerCapture(event.pointerId);
    } catch (_) {}
  });

  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  button.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });
}

document.querySelectorAll('[data-control]').forEach(bindControl);

window.addEventListener('keydown', (event) => {
  const keys = {
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    ArrowUp: 'gas',
    KeyW: 'gas',
    ArrowDown: 'brake',
    KeyS: 'brake'
  };

  const control = keys[event.code];

  if (control) {
    input[control] = true;
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  const keys = {
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    ArrowUp: 'gas',
    KeyW: 'gas',
    ArrowDown: 'brake',
    KeyS: 'brake'
  };

  const control = keys[event.code];
  if (control) input[control] = false;
});

document.getElementById('cameraButton').addEventListener('click', () => {
  cameraMode = (cameraMode + 1) % 2;
  message.textContent = cameraMode === 0
    ? 'كاميرا خلف السيارة'
    : 'كاميرا بعيدة';

  message.style.opacity = '1';

  setTimeout(() => {
    message.style.opacity = '0';
  }, 1800);
});

// Camera smoothing
const cameraTarget = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();
const forward = new THREE.Vector3();
const desiredCameraPosition = new THREE.Vector3();
const clock = new THREE.Clock();

function updateCar(delta) {
  // Acceleration and reverse
  if (input.gas) {
    velocity += acceleration * delta;
  } else if (input.brake) {
    if (velocity > 0.4) {
      velocity -= brakePower * delta;
    } else {
      velocity -= acceleration * 0.65 * delta;
    }
  } else {
    if (velocity > 0) {
      velocity = Math.max(0, velocity - drag * delta);
    } else if (velocity < 0) {
      velocity = Math.min(0, velocity + drag * delta);
    }
  }

  velocity = THREE.MathUtils.clamp(
    velocity,
    -maxReverseSpeed,
    maxForwardSpeed
  );

  // Steering works better while moving
  const steering = Number(input.right) - Number(input.left);

  if (Math.abs(velocity) > 0.3) {
    const steeringPower = Math.min(Math.abs(velocity) / 8, 1);
    heading += steering * steeringPower * 1.65 * delta
      * Math.sign(velocity);
  }

  // The car's front points along negative Z at heading zero
  forward.set(-Math.sin(heading), 0, -Math.cos(heading));

  car.position.addScaledVector(forward, velocity * delta);
  car.rotation.y = heading;

  // Keep the car within the city
  car.position.x = THREE.MathUtils.clamp(car.position.x, -295, 295);
  car.position.z = THREE.MathUtils.clamp(car.position.z, -295, 295);

  wheels.forEach((wheel) => {
    wheel.rotation.x += velocity * delta * 1.8;
  });

  distance += Math.abs(velocity * delta);

  speedDisplay.textContent = Math.round(Math.abs(velocity) * 3.6);
  distanceDisplay.textContent = Math.floor(distance);
}

function updateCamera(delta) {
  forward.set(-Math.sin(heading), 0, -Math.cos(heading));

  const distanceBack = cameraMode === 0 ? 8.5 : 13;
  const height = cameraMode === 0 ? 4.1 : 6.5;

  desiredCameraPosition
    .copy(car.position)
    .addScaledVector(forward, -distanceBack);

  desiredCameraPosition.y += height;

  camera.position.lerp(
    desiredCameraPosition,
    1 - Math.exp(-4 * delta)
  );

  cameraTarget.copy(car.position);
  cameraTarget.y += 1.1;

  camera.lookAt(cameraTarget);
}

let started = false;

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  updateCar(delta);
  updateCamera(delta);

  renderer.render(scene, camera);

  if (!started) {
    started = true;
    loading.classList.add('hidden');
  }
}

camera.position.set(0, 5, 14);
camera.lookAt(car.position);

animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
});

// Hide the introductory message
setTimeout(() => {
  message.style.opacity = '0';
}, 4500);
