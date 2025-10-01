import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const GoalJar3D = ({ progress }) => {
    const mountRef = useRef(null);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        let animationFrameId;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        camera.position.set(0, 3, 8);
        camera.lookAt(0, 2, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(renderer.domElement);

        // Enhanced Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(5, 10, 7);
        keyLight.castShadow = true;
        scene.add(keyLight);
        
        const fillLight = new THREE.DirectionalLight(0xffd700, 0.3);
        fillLight.position.set(-3, 5, 3);
        scene.add(fillLight);
        
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
        rimLight.position.set(0, 3, -5);
        scene.add(rimLight);

        // Jar Model (Realistic Glass)
        const jarHeight = 5;
        const jarRadius = 2;
        const glassMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.2,
            shininess: 100,
            specular: 0x222222
        });
        
        const jarBody = new THREE.Mesh(
            new THREE.CylinderGeometry(jarRadius, jarRadius, jarHeight, 64, 1, true), 
            glassMaterial
        );
        jarBody.position.y = jarHeight / 2;
        
        const jarBottom = new THREE.Mesh(
            new THREE.CylinderGeometry(jarRadius, jarRadius, 0.1, 64), 
            glassMaterial
        );
        jarBottom.position.y = 0.05;
        
        const jarGroup = new THREE.Group();
        jarGroup.add(jarBody);
        jarGroup.add(jarBottom);
        scene.add(jarGroup);

        // Liquid Gold with shimmer effect
        const liquidHeight = Math.max(0.01, Math.min(progress, 1) * (jarHeight - 0.1));
        const goldMaterial = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            shininess: 90,
            specular: 0xffff88,
            emissive: 0x332200
        });
        
        const liquid = new THREE.Mesh(
            new THREE.CylinderGeometry(jarRadius * 0.95, jarRadius * 0.95, liquidHeight, 64),
            goldMaterial
        );
        liquid.position.y = liquidHeight / 2 + 0.1;
        jarGroup.add(liquid);

        // Individual Gold Coins for overflow
        const coinGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.03, 16);
        const coinMaterial = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            shininess: 100,
            specular: 0xffffaa
        });
        
        const coins = [];
        const coinCount = 80;
        
        for (let i = 0; i < coinCount; i++) {
            const coin = new THREE.Mesh(coinGeometry, coinMaterial);
            coin.userData = {
                velocity: new THREE.Vector3(),
                rotationSpeed: new THREE.Vector3(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10
                ),
                initialPosition: new THREE.Vector3(
                    (Math.random() - 0.5) * jarRadius * 0.8,
                    jarHeight + Math.random() * 2,
                    (Math.random() - 0.5) * jarRadius * 0.8
                )
            };
            coin.position.copy(coin.userData.initialPosition);
            coin.visible = false;
            coins.push(coin);
            jarGroup.add(coin);
        }
        
        let overflowActive = false;
        const clock = new THREE.Clock();

        // Animation loop
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const time = clock.getElapsedTime();
            
            // Rotate jar slowly
            jarGroup.rotation.y += 0.003;

            // Animate liquid height smoothly
            const targetHeight = Math.max(0.01, Math.min(progress, 1) * (jarHeight - 0.1));
            const currentHeight = liquid.geometry.parameters.height;
            const newHeight = THREE.MathUtils.lerp(currentHeight, targetHeight, 0.05);

            if (Math.abs(newHeight - currentHeight) > 0.001) {
                liquid.geometry.dispose();
                liquid.geometry = new THREE.CylinderGeometry(jarRadius * 0.95, jarRadius * 0.95, newHeight, 64);
                liquid.position.y = newHeight / 2 + 0.1;
            }
            
            // Add shimmer to gold
            goldMaterial.emissive.setHSL(0.15, 0.5, 0.1 + Math.sin(time * 3) * 0.05);
            
            // Start overflow animation when goal is exceeded
            if (progress > 1 && !overflowActive) {
                overflowActive = true;
                coins.forEach((coin, i) => {
                    setTimeout(() => {
                        coin.visible = true;
                        coin.position.copy(coin.userData.initialPosition);
                        coin.userData.velocity.set(
                            (Math.random() - 0.5) * 2,
                            Math.random() * 2 + 1,
                            (Math.random() - 0.5) * 2
                        );
                    }, i * 50); // Stagger the coin appearances
                });
            }
            
            // Animate overflow coins
            if (overflowActive) {
                coins.forEach(coin => {
                    if (!coin.visible) return;
                    
                    // Apply gravity
                    coin.userData.velocity.y -= 12 * delta;
                    
                    // Update position
                    coin.position.addScaledVector(coin.userData.velocity, delta);
                    
                    // Rotate coins
                    coin.rotation.x += coin.userData.rotationSpeed.x * delta;
                    coin.rotation.y += coin.userData.rotationSpeed.y * delta;
                    coin.rotation.z += coin.userData.rotationSpeed.z * delta;
                    
                    // Reset coin if it falls too low (recycle for continuous effect)
                    if (coin.position.y < -3) {
                        if (progress > 1) {
                            coin.position.copy(coin.userData.initialPosition);
                            coin.userData.velocity.set(
                                (Math.random() - 0.5) * 2,
                                Math.random() * 2 + 1,
                                (Math.random() - 0.5) * 2
                            );
                        } else {
                            coin.visible = false;
                        }
                    }
                });
            }

            renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
            if (!mountRef.current) return;
            const width = currentMount.clientWidth;
            const height = currentMount.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup function
        return () => {
            window.removeEventListener('resize', handleResize);
            if (currentMount && renderer.domElement) {
                currentMount.removeChild(renderer.domElement);
            }
            cancelAnimationFrame(animationFrameId);
            
            // Dispose of geometries and materials
            scene.traverse(object => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            renderer.dispose();
        };
    }, [progress]);

    return <div ref={mountRef} style={{ width: '100%', height: '100%', background: 'transparent' }} />;
};

export default GoalJar3D;