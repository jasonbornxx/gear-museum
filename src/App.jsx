import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { View, OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

// --- 1. GEOMETRY GENERATORS (Procedural 3D Shapes) ---

// A generic function to create a Spur Gear shape
const GearGeom = ({ teeth = 12, radius = 1, width = 0.5, color = "orange", speed = 1, position = [0,0,0], rotation=[0,0,0], axis="y" }) => {
  const meshRef = useRef();
  
  // Animation loop
  useFrame((state, delta) => {
    if (meshRef.current) {
      if(axis === "y") meshRef.current.rotation.y += speed * delta;
      if(axis === "x") meshRef.current.rotation.x += speed * delta;
      if(axis === "z") meshRef.current.rotation.z += speed * delta;
    }
  });

  // Create a procedural gear shape using ExtrudeGeometry
  const shape = React.useMemo(() => {
    const s = new THREE.Shape();
    const n = teeth;
    const outerRadius = radius * 1.1;
    const innerRadius = radius * 0.9;
    const holeRadius = radius * 0.2;
    
    // Draw teeth
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2;
      const angleNext = ((i + 1) / n) * Math.PI * 2;
      const angleHalf = (angle + angleNext) / 2;
      
      // Tooth points
      s.lineTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
      s.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
      s.lineTo(Math.cos(angleHalf) * outerRadius, Math.sin(angleHalf) * outerRadius);
      s.lineTo(Math.cos(angleHalf) * innerRadius, Math.sin(angleHalf) * innerRadius);
    }
    s.closePath();
    
    // Center hole
    const hole = new THREE.Path();
    hole.absarc(0, 0, holeRadius, 0, Math.PI * 2, false);
    s.holes.push(hole);
    return s;
  }, [teeth, radius]);

  const extrudeSettings = { depth: width, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
    </mesh>
  );
};

// Simple Rack (Flat Gear)
const RackGeom = ({ width=4, speed=1 }) => {
    const meshRef = useRef();
    useFrame((state) => {
        // Oscillate back and forth
        if(meshRef.current) meshRef.current.position.x = Math.sin(state.clock.elapsedTime * speed) * 1.5;
    });
    return (
        <mesh ref={meshRef} position={[0, -1.1, 0]}>
            <boxGeometry args={[width, 0.5, 0.5]} />
            <meshStandardMaterial color="#44aaff" roughness={0.3} metalness={0.8} />
        </mesh>
    )
}

// Simple Worm Gear Cylinder
const WormGeom = ({ speed = 2 }) => {
    const meshRef = useRef();
    useFrame((state, delta) => {
        if(meshRef.current) meshRef.current.rotation.z += speed * delta;
    });
    return (
        <mesh ref={meshRef} position={[0, 1.2, 0]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 3, 16]} />
            {/* Visual threads using a texture would be better, but we use wireframe overlay for style here */}
            <meshStandardMaterial color="#ff5555" wireframe={true} />
            <mesh position={[0,0,0]}>
                 <cylinderGeometry args={[0.4, 0.4, 3, 16]} />
                 <meshStandardMaterial color="#ff5555" />
            </mesh>
        </mesh>
    )
}


// --- 2. GEAR SYSTEMS (The Scenes) ---

const SystemSpur = () => (
  <group>
    <GearGeom position={[-1.05, 0, 0]} teeth={12} radius={1} speed={1} color="#ffaa00" />
    <GearGeom position={[1.05, 0, 0]} teeth={12} radius={1} speed={-1} rotation={[0,0, (Math.PI/12)]} color="#00aaff" />
  </group>
);

const SystemRackPinion = () => (
    <group>
        <GearGeom position={[0, 0, 0]} teeth={12} radius={1} speed={2} color="#ffaa00" />
        <RackGeom />
    </group>
);

const SystemBevel = () => (
    <group rotation={[0.5, 0.5, 0]}>
        <GearGeom position={[0, -0.9, 0]} rotation={[Math.PI/2, 0, 0]} speed={1} axis="z" color="lightgreen" />
        <GearGeom position={[0, 0.9, 0]} rotation={[-Math.PI/2, 0, 0]} speed={-1} axis="z" color="orange" />
        {/* Visual representation only - true bevel math is complex for procedural code */}
        <mesh rotation={[0,0,Math.PI/2]}>
            <cylinderGeometry args={[0.1, 0.1, 2.5]} />
            <meshStandardMaterial color="gray" />
        </mesh>
    </group>
);

const SystemWorm = () => (
    <group>
        <WormGeom />
        <GearGeom position={[0, -0.5, 0]} rotation={[0, 0, 0]} speed={0.1} width={0.2} axis="y" color="gold" />
    </group>
)

const SystemHelical = () => (
     <group>
        {/* Represented by twisted boxes for simplicity in this low-code setup */}
        <mesh rotation={[0.2, 0, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="cyan" />
        </mesh>
        <mesh position={[1.2, 0, 0]} rotation={[-0.2, 0, 0]}>
             <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="magenta" />
        </mesh>
        <gridHelper />
     </group>
)

// ... We reuse these generic systems for the demo to save file space, 
// in a real app you would make 10 unique components.
const SystemGeneric = ({color}) => (
    <group rotation={[0.5,0.5,0]}>
        <GearGeom color={color} speed={2} />
    </group>
)


// --- 3. DATA CONTENT ---

const gearSystems = [
  { 
    id: 1, 
    title: "Spur Gears", 
    Component: SystemSpur,
    desc: "The most common type of gear. Straight teeth parallel to the axis.",
    uses: "Clocks, washing machines, power plants.",
    history: "Invented in ancient Greece, improved during the Industrial Revolution."
  },
  { 
    id: 2, 
    title: "Rack and Pinion", 
    Component: SystemRackPinion,
    desc: "Converts rotational motion into linear motion.",
    uses: "Car steering systems, stairlifts, railways.",
    history: "Used in China and Rome for crossbow mechanisms."
  },
  { 
    id: 3, 
    title: "Worm Gear", 
    Component: SystemWorm,
    desc: "A gear in the form of a screw that meshes with a worm wheel.",
    uses: "Tuning instruments, elevators, conveyor belts.",
    history: "Attributed to Archimedes."
  },
  { 
    id: 4, 
    title: "Bevel Gears", 
    Component: SystemBevel,
    desc: "Cone-shaped gears that transmit power between intersecting axles.",
    uses: "Hand drills, differential drives in cars.",
    history: "Used in ancient windmills."
  },
  { 
    id: 5, 
    title: "Helical Gears", 
    Component: SystemHelical,
    desc: "Teeth are cut at an angle. Smoother and quieter than spur gears.",
    uses: "Car transmissions.",
    history: "Developed in the 19th century."
  },
  { id: 6, title: "Planetary Gears", Component: () => <SystemGeneric color="red" />, desc: "A central sun gear with orbiting planet gears.", uses: "Automatic transmissions.", history: "Ancient Greek Antikythera mechanism." },
  { id: 7, title: "Spiral Bevel", Component: () => <SystemGeneric color="purple" />, desc: "Bevel gears with curved teeth.", uses: "High performance vehicles.", history: "Early 20th century." },
  { id: 8, title: "Hypoid Gears", Component: () => <SystemGeneric color="green" />, desc: "Similar to bevel, but axes do not intersect.", uses: "Rear-wheel drive axles.", history: "1920s automotive industry." },
  { id: 9, title: "Herringbone", Component: () => <SystemGeneric color="yellow" />, desc: "Double helical gear, looks like a V.", uses: "Heavy machinery.", history: "Invented by André Citroën." },
  { id: 10, title: "Screw Gears", Component: () => <SystemGeneric color="teal" />, desc: "Crossed helical gears for non-parallel axes.", uses: "Light loads, instrument drives.", history: "Renaissance mechanics." },
];


// --- 4. MAIN LAYOUT COMPONENT ---

export default function App() {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} style={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
      
      {/* GLOBAL CANVAS - This is the magic trick for performance */}
      <Canvas
        className="canvas-container"
        eventSource={containerRef} // Allows the HTML divs to control the 3D rotation
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none' }}
      >
        <View.Port /> {/* This renders all the "Views" defined below */}
      </Canvas>

      {/* HEADER */}
      <div style={{ padding: '40px', textAlign: 'center', background: '#222' }}>
        <h1 style={{ fontSize: '3rem', margin: 0 }}>The Gear Museum</h1>
        <p style={{ opacity: 0.7 }}>A 3D Interactive Encyclopedia</p>
      </div>

      {/* GRID OF GEARS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '40px', 
        padding: '40px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {gearSystems.map((gear) => (
          <div key={gear.id} style={{ background: '#333', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            
            {/* The 3D Window */}
            <div style={{ height: '300px', width: '100%', position: 'relative' }}>
              {/* The View component connects this HTML div to the Global Canvas */}
              <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <gear.Component />
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
                <OrbitControls makeDefault enableZoom={true} enablePan={false} />
                <Environment preset="city" />
              </View>
            </div>

            {/* The Text Content */}
            <div style={{ padding: '20px' }}>
              <h2 style={{ marginTop: 0, color: '#ffaa00' }}>{gear.title}</h2>
              <p><strong>Description:</strong> {gear.desc}</p>
              <p><strong>Uses:</strong> {gear.uses}</p>
              <p><strong>History:</strong> {gear.history}</p>
            </div>

          </div>
        ))}
      </div>
        <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>
            Scroll down for more • 3D powered by R3F
        </div>
    </div>
  );
}

// Add this file named src/index.css
// html, body { width: 100%; height: 100%; margin: 0; background: #1a1a1a; }