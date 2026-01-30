import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3 } from "three";
import { useSpring, animated, config } from "@react-spring/three";
import { useTexture } from "@react-three/drei";

interface MayaProps {
    state: "idle" | "eating" | "playing" | "dead";
    hunger: number;
    happiness: number;
}

export function Maya({ state, hunger, happiness }: MayaProps) {
    const groupRef = useRef<Group>(null);
    const [behavior, setBehavior] = useState<"idle" | "walking" | "running" | "sleeping">("idle");
    const targetPos = useRef<Vector3>(new Vector3(0, 0, 0));

    // Load fluffy cute texture
    const furMap = useTexture("/textures/cat_fur.png");
    if (furMap) {
        furMap.anisotropy = 16;
    }

    const [springs, api] = useSpring(() => ({
        scale: [1, 1, 1],
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        bowlOpacity: 0,
        ballOpacity: 0,
        config: config.wobbly,
    }));

    // Behavior AI Loop
    useEffect(() => {
        const isDead = state === "dead" || hunger <= 0;
        const isLowEnergy = happiness < 30;

        if (isDead) {
            setBehavior("sleeping");
            return;
        }

        if (state !== "idle") {
            setBehavior("idle");
            return;
        }

        const runAI = () => {
            if (isLowEnergy) {
                setBehavior("sleeping");
                return;
            }

            const rand = Math.random();
            const isHighEnergy = happiness > 60 && hunger > 60;
            if (isHighEnergy) {
                if (rand < 0.2) setBehavior("idle");
                else if (rand < 0.5) {
                    setBehavior("walking");
                    targetPos.current.set(Math.random() * 8 - 4, 0, Math.random() * 8 - 4);
                } else {
                    setBehavior("running");
                    targetPos.current.set(Math.random() * 12 - 6, 0, Math.random() * 12 - 6);
                }
            } else {
                if (rand < 0.4) setBehavior("idle");
                else if (rand < 0.8) {
                    setBehavior("walking");
                    targetPos.current.set(Math.random() * 6 - 3, 0, Math.random() * 6 - 3);
                } else setBehavior("sleeping");
            }
        };

        const interval = setInterval(runAI, 5000 + Math.random() * 3000);
        runAI();
        return () => clearInterval(interval);
    }, [state, hunger, happiness]);

    useFrame((root, delta) => {
        const isDead = state === "dead" || hunger <= 0;
        const isLowEnergy = happiness < 30;

        if (!groupRef.current || isDead || state === "eating" || state === "playing") {
            return;
        }

        if (isLowEnergy && behavior !== "sleeping") {
            setBehavior("sleeping");
        }

        const t = root.clock.getElapsedTime();
        const currentPos = groupRef.current.position;

        if (behavior === "walking" || behavior === "running") {
            const speedModifier = (hunger + happiness) / 200;
            const baseSpeed = behavior === "running" ? 2.5 : 1.0;
            const speed = baseSpeed * (0.5 + speedModifier * 0.5);

            const dir = targetPos.current.clone().sub(currentPos).setY(0);

            if (dir.length() > 0.1) {
                dir.normalize();
                currentPos.add(dir.multiplyScalar(speed * delta));
                const targetRotation = Math.atan2(dir.x, dir.z);
                groupRef.current.rotation.y += (targetRotation - groupRef.current.rotation.y) * 0.1;
                groupRef.current.position.y = Math.abs(Math.sin(t * speed * 5)) * 0.05;
            } else {
                setBehavior("idle");
            }
        } else if (behavior === "idle") {
            groupRef.current.position.y = Math.sin(t * 1.5) * 0.03;
            groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.02;
        } else if (behavior === "sleeping") {
            groupRef.current.position.y = -0.35;
        }
    });

    // Spring Animations for major state changes
    useEffect(() => {
        const isDead = state === "dead" || hunger <= 0;
        const isLowEnergy = happiness < 30;

        if (isDead) {
            api.start({
                rotation: [Math.PI / 2, 0.2, 0.1],
                position: [0, -0.4, 0],
                bowlOpacity: 0,
                ballOpacity: 0,
                config: config.slow,
            });
        } else if (state === "eating") {
            api.start({
                scale: [1, 0.8, 1],
                position: [0, -0.15, 0.1],
                rotation: [0.4, 0, 0],
                bowlOpacity: 1,
                ballOpacity: 0,
                config: { duration: 300 },
            });
            const timeout = setTimeout(() => {
                api.start({ bowlOpacity: 0, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] });
            }, 2500);
            return () => clearTimeout(timeout);
        } else if (state === "playing") {
            api.start({
                position: [0, 0.4, 0.4],
                rotation: [-0.3, 0, 0],
                ballOpacity: 1,
                bowlOpacity: 0,
                config: config.wobbly,
            });
            const timeout = setTimeout(() => {
                api.start({ ballOpacity: 0, position: [0, 0, 0], rotation: [0, 0, 0] });
            }, 2500);
            return () => clearTimeout(timeout);
        } else if (isLowEnergy || behavior === "sleeping") {
            api.start({
                scale: [1, 0.65, 1],
                position: [0, -0.3, 0],
                rotation: [0.35, 0.2, 0.6],
                bowlOpacity: 0,
                ballOpacity: 0,
                config: config.gentle,
            });
        } else {
            api.start({
                scale: [1, 1, 1],
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                bowlOpacity: 0,
                ballOpacity: 0,
                config: config.default,
            });
        }
    }, [state, hunger, happiness, behavior, api]);

    return (
        <animated.group ref={groupRef} {...(springs as any)} scale={[1.2, 1.2, 1.2]}>
            {/* Body */}
            <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <capsuleGeometry args={[0.5, 0.8, 8, 16]} />
                <meshStandardMaterial map={furMap} color={state === "dead" ? "#777" : "#fff"} roughness={1} />
            </mesh>

            {/* Head */}
            <mesh position={[0, 1.1, 0.7]}>
                <sphereGeometry args={[0.45, 32, 32]} />
                <meshStandardMaterial map={furMap} color={state === "dead" ? "#888" : "#fff"} roughness={1} />
            </mesh>

            {/* Eating Prop: Food Bowl */}
            <animated.group position={[0, 0, 1.2]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
                    <cylinderGeometry args={[0.25, 0.35, 0.15, 32]} />
                    <animated.meshStandardMaterial color="#8b4513" transparent opacity={springs.bowlOpacity as any} />
                </mesh>
                <mesh position={[0, -0.48, 0]}>
                    <sphereGeometry args={[0.18, 16, 8]} scale={[1, 0.4, 1]} />
                    <animated.meshStandardMaterial color="#ffd700" transparent opacity={springs.bowlOpacity as any} />
                </mesh>
            </animated.group>

            {/* Playing Prop: Yarn Ball */}
            <mesh position={[0, -0.2, 1.2]}>
                <sphereGeometry args={[0.15, 24, 24]} />
                <animated.meshStandardMaterial color="#ff4500" roughness={0.9} transparent opacity={springs.ballOpacity as any} />
            </mesh>

            {/* Cute Round Ears */}
            <mesh position={[-0.25, 1.42, 0.7]} rotation={[0.1, 0, 0.2]}>
                <sphereGeometry args={[0.15, 16, 16]} scale={[1, 1.2, 0.4]} />
                <meshStandardMaterial map={furMap} color={state === "dead" ? "#777" : "#fff"} />
            </mesh>
            <mesh position={[0.25, 1.42, 0.7]} rotation={[0.1, 0, -0.2]}>
                <sphereGeometry args={[0.15, 16, 16]} scale={[1, 1.2, 0.4]} />
                <meshStandardMaterial map={furMap} color={state === "dead" ? "#777" : "#fff"} />
            </mesh>

            {/* Almond Eyes */}
            <group position={[0, 1.18, 1.08]}>
                <group position={[-0.18, 0, 0]} rotation={[0, 0, 0.12]}>
                    <mesh scale={[1.35, 0.8, 1]}>
                        <sphereGeometry args={[0.07, 16, 16]} />
                        <meshStandardMaterial color="#222" />
                    </mesh>
                </group>
                <group position={[0.18, 0, 0]} rotation={[0, 0, -0.12]}>
                    <mesh scale={[1.35, 0.8, 1]}>
                        <sphereGeometry args={[0.07, 16, 16]} />
                        <meshStandardMaterial color="#222" />
                    </mesh>
                </group>
            </group>

            {/* Cute Pink Nose */}
            <mesh position={[0, 1.02, 1.15]}>
                <sphereGeometry args={[0.04, 16, 16]} scale={[1, 0.7, 1]} />
                <meshStandardMaterial color="#ffb6c1" roughness={0.3} />
            </mesh>

            {/* Muzzle */}
            <group position={[0, 0.98, 1.05]}>
                <mesh position={[-0.07, 0, 0]}>
                    <sphereGeometry args={[0.095, 16, 16]} />
                    <meshStandardMaterial map={furMap} color="#fff" />
                </mesh>
                <mesh position={[0.07, 0, 0]}>
                    <sphereGeometry args={[0.095, 16, 16]} />
                    <meshStandardMaterial map={furMap} color="#fff" />
                </mesh>
            </group>

            {/* Tail */}
            <mesh position={[0, 0.7, -0.9]} rotation={[0.6, 0.2, 0]}>
                <capsuleGeometry args={[0.09, 0.8, 4, 8]} />
                <meshStandardMaterial map={furMap} color="#fff" />
            </mesh>

            {/* Legs */}
            {[
                [-0.35, 0.2, 0.4], [0.35, 0.2, 0.4],
                [-0.35, 0.2, -0.4], [0.35, 0.2, -0.4]
            ].map((pos, i) => (
                <group key={i} position={pos as any}>
                    <mesh>
                        <capsuleGeometry args={[0.13, 0.4, 4, 8]} />
                        <meshStandardMaterial map={furMap} color="#fff" />
                    </mesh>
                    <mesh position={[0, -0.22, 0.05]}>
                        <sphereGeometry args={[0.15, 16, 16]} scale={[1, 0.6, 1.3]} />
                        <meshStandardMaterial map={furMap} color="#fff" />
                    </mesh>
                </group>
            ))}
        </animated.group>
    );
}
