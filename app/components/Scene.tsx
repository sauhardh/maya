import { useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useTexture, Sky } from "@react-three/drei";
import { Maya } from "./Maya";
import * as THREE from "three";

interface SceneProps {
    mayaState: "idle" | "eating" | "playing" | "dead";
    hunger: number;
    happiness: number;
}

export default function Scene({ mayaState, hunger, happiness }: SceneProps) {
    const isDead = hunger <= 0 || mayaState === "dead";

    return (
        <div className="h-full w-full">
            <Canvas shadows camera={{ position: [3, 2, 5], fov: 45 }}>
                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
                <ambientLight intensity={isDead ? 0.4 : 0.8} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={isDead ? 0.5 : 1.5} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={isDead ? 0.2 : 0.5} />

                <Suspense fallback={null}>
                    <Maya state={mayaState} hunger={hunger} happiness={happiness} />
                    <Lawn dead={isDead} />
                    {isDead && <Graveyard />}
                    {!isDead && <Sky distance={450000} sunPosition={[0, -1, -5]} inclination={0} azimuth={0.25} />}
                    <Environment preset={isDead ? "night" : "sunset"} />
                </Suspense>
            </Canvas>
        </div>
    );
}

function Lawn({ dead }: { dead: boolean }) {
    const lawnMap = useTexture("/textures/lawn.png");
    if (lawnMap) {
        lawnMap.wrapS = lawnMap.wrapT = THREE.RepeatWrapping;
        lawnMap.repeat.set(8, 8);
        lawnMap.anisotropy = 16;
    }

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial
                map={lawnMap}
                color={dead ? "#223322" : "#77aa77"}
                roughness={0.8}
                metalness={0.1}
            />
        </mesh>
    );
}

function Graveyard() {
    return (
        <group position={[0, -0.6, 0]}>
            {/* Main Tombstone */}
            <mesh position={[0, 0.4, -1.2]}>
                <boxGeometry args={[0.6, 0.8, 0.15]} />
                <meshStandardMaterial color="#333" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.6, -1.1]}>
                <boxGeometry args={[0.4, 0.05, 0.05]} />
                <meshStandardMaterial color="#555" />
            </mesh>

            {/* Small Rubble */}
            <mesh position={[0.7, 0.1, -1.5]} rotation={[0.4, 0.5, 0.1]}>
                <dodecahedronGeometry args={[0.2]} />
                <meshStandardMaterial color="#444" />
            </mesh>
            <mesh position={[-0.8, 0.1, -1.0]} rotation={[0.2, -0.3, 0.5]}>
                <dodecahedronGeometry args={[0.15]} />
                <meshStandardMaterial color="#444" />
            </mesh>
        </group>
    );
}
