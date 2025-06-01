import { useEffect, useRef } from 'react';

const ParticleBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const hexagons = [];

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 * 0.7 + 0.5;
                this.speedX = (Math.random() * 3 - 1.5) * 0.5;
                this.speedY = (Math.random() * 3 - 1.5) * 0.5;
                this.color = `hsl(${Math.random() * 60 + 180}, 100%, 50%)`;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > canvas.width) this.x = 0;
                else if (this.x < 0) this.x = canvas.width;

                if (this.y > canvas.height) this.y = 0;
                else if (this.y < 0) this.y = canvas.height;
            }

            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        class Hexagon {
            constructor(x, y, size) {
                this.x = x;
                this.y = y;
                this.size = size;
                this.animationProgress = 0;
                this.isAnimating = false;
                this.rotation = 0;
                this.rotationSpeed = 0.0001; // rotation speed
            }

            update(deltaTime) {
                if (this.isAnimating) {
                    this.animationProgress += deltaTime * 0.0005;
                    if (this.animationProgress >= 1) {
                        this.animationProgress = 0;
                        this.isAnimating = false;
                    }
                }
                this.rotation += this.rotationSpeed * deltaTime;
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);

                // Draw hexagon outline
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const hx = this.size * Math.cos(angle);
                    const hy = this.size * Math.sin(angle);
                    if (i === 0) ctx.moveTo(hx, hy);
                    else ctx.lineTo(hx, hy);
                }
                ctx.closePath();
                ctx.strokeStyle = 'rgba(100, 200, 255, 0.2)';
                ctx.stroke();

                if (this.isAnimating) {
                    // Draw glowing border with reveal effect
                    ctx.beginPath();
                    const glowLength = 2; // Length of the glow in segments
                    for (let i = 0; i < 6; i++) {
                        const startAngle = (Math.PI / 3) * i;
                        const endAngle = (Math.PI / 3) * ((i + 1) % 6);
                        const segmentProgress = (this.animationProgress * 6) - i;

                        if (segmentProgress > -glowLength && segmentProgress < 1) {
                            const start = {
                                x: this.size * Math.cos(startAngle),
                                y: this.size * Math.sin(startAngle)
                            };
                            const end = {
                                x: this.size * Math.cos(endAngle),
                                y: this.size * Math.sin(endAngle)
                            };

                            const gradientStart = {
                                x: start.x + (end.x - start.x) * Math.max(0, segmentProgress),
                                y: start.y + (end.y - start.y) * Math.max(0, segmentProgress)
                            };
                            const gradientEnd = {
                                x: start.x + (end.x - start.x) * Math.min(1, segmentProgress + glowLength / 6),
                                y: start.y + (end.y - start.y) * Math.min(1, segmentProgress + glowLength / 6)
                            };

                            const gradient = ctx.createLinearGradient(gradientStart.x, gradientStart.y, gradientEnd.x, gradientEnd.y);
                            gradient.addColorStop(0, 'rgba(100, 200, 255, 0)');
                            gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.8)');
                            gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');

                            ctx.strokeStyle = gradient;
                            ctx.beginPath();
                            ctx.moveTo(gradientStart.x, gradientStart.y);
                            ctx.lineTo(gradientEnd.x, gradientEnd.y);
                            ctx.lineWidth = 2;
                            ctx.stroke();
                        }
                    }
                    ctx.lineWidth = 1;
                }

                ctx.restore();
            }
        }

        // Create particles
        for (let i = 0; i < 75; i++) {
            particles.push(new Particle());
        }

        // Create hexagons
        hexagons.push(new Hexagon(canvas.width / 5, canvas.height / 2, 75));
        hexagons.push(new Hexagon(canvas.width / 1.7, canvas.height / 4.2, 40));
        hexagons.push(new Hexagon(canvas.width * 3 / 4, canvas.height * 3 / 4, 60));

        let lastTime = 0;
        let currentHexagonIndex = 0;

        function animate(currentTime) {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const particle of particles) {
                particle.update();
                particle.draw();
            }

            let allInactive = true;
            for (let i = 0; i < hexagons.length; i++) {
                const hexagon = hexagons[i];
                hexagon.update(deltaTime);
                hexagon.draw();

                if (hexagon.isAnimating) {
                    allInactive = false;
                }
            }

            if (allInactive) {
                currentHexagonIndex = (currentHexagonIndex + 1) % hexagons.length;
                hexagons[currentHexagonIndex].isAnimating = true;
            }

            requestAnimationFrame(animate);
        }

        animate(0);

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Recalculate hexagon positions on resize
            hexagons[0] = new Hexagon(canvas.width / 5, canvas.height / 2, 75);
            hexagons[1] = new Hexagon(canvas.width / 1.7, canvas.height / 4.2, 40);
            hexagons[2] = new Hexagon(canvas.width * 3 / 4, canvas.height * 3 / 4, 60);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 bg-gray-900"
            style={{
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none'
            }}
        />
    );
};

export default ParticleBackground;

