import React, { useEffect, useRef } from 'react';

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
        const lines = [];

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                // Reduced size and speed
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

        class Line {
            constructor() {
                this.startX = Math.random() * canvas.width;
                this.startY = Math.random() * canvas.height;
                this.endX = Math.random() * canvas.width;
                this.endY = Math.random() * canvas.height;
                // Reduced speed
                this.speed = (Math.random() * 0.5 + 0.1) * 0.5;
            }

            update() {
                this.startX += this.speed;
                this.endX += this.speed;

                if (this.startX > canvas.width) {
                    this.startX = 0;
                    this.endX = 0;
                }
            }

            draw() {
                ctx.strokeStyle = 'rgba(100, 200, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(this.startX, this.startY);
                ctx.lineTo(this.endX, this.endY);
                ctx.stroke();
            }
        }

        // Create particles and lines
        for (let i = 0; i < 75; i++) {
            particles.push(new Particle());
        }

        for (let i = 0; i < 15; i++) {
            lines.push(new Line());
        }

        function drawHexagon(x, y, size) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const hx = x + size * Math.cos(angle);
                const hy = y + size * Math.sin(angle);
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.2)';
            ctx.stroke();
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const particle of particles) {
                particle.update();
                particle.draw();
            }

            for (const line of lines) {
                line.update();
                line.draw();
            }

            // Reduced hexagon sizes
            drawHexagon(canvas.width / 2, canvas.height / 2, 75);
            drawHexagon(canvas.width / 4, canvas.height / 4, 40);
            drawHexagon(canvas.width * 3 / 4, canvas.height * 3 / 4, 60);

            requestAnimationFrame(animate);
        }

        animate();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [75, 15, 0.7, 0.5]);

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