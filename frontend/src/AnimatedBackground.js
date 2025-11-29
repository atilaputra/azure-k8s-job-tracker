import React, { useEffect, useRef } from 'react';

// Animated Background Component with Swirling Patterns
function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Color palette from the image
    const colors = [
      '#FFB6C1', // Light pink
      '#FFA07A', // Light salmon
      '#FF69B4', // Hot pink
      '#FF8C94', // Coral pink
      '#FFDAB9', // Peach
      '#FFE4B5', // Moccasin
      '#FF6B6B', // Red pink
      '#FFC0CB', // Pink
    ];

    class Swirl {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseX = this.x;
        this.baseY = this.y;
        this.radius = Math.random() * 150 + 100;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = (Math.random() * 0.3 + 0.1) * (Math.random() > 0.5 ? 1 : -1);
        this.color1 = colors[Math.floor(Math.random() * colors.length)];
        this.color2 = colors[Math.floor(Math.random() * colors.length)];
        this.rotationSpeed = Math.random() * 0.02 + 0.005;
        this.scale = Math.random() * 0.5 + 0.8;
        this.pulseSpeed = Math.random() * 0.02 + 0.01;
        this.pulseOffset = Math.random() * Math.PI * 2;
      }

      update(t) {
        // Smooth drifting motion
        this.x = this.baseX + Math.sin(t * 0.001 + this.angle) * 50;
        this.y = this.baseY + Math.cos(t * 0.001 + this.angle) * 50;
        this.angle += this.speed * 0.01;
        
        // Pulse effect
        const pulse = Math.sin(t * this.pulseSpeed + this.pulseOffset) * 0.2 + 1;
        this.currentScale = this.scale * pulse;
      }

      draw(t) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(t * this.rotationSpeed);
        ctx.scale(this.currentScale, this.currentScale);

        // Create gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, this.color1 + '80');
        gradient.addColorStop(0.5, this.color2 + '60');
        gradient.addColorStop(1, this.color1 + '00');

        // Draw multiple swirling layers
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          const spirals = 6;
          for (let j = 0; j < 360; j += 2) {
            const rad = (j * Math.PI) / 180;
            const dist = this.radius * (j / 360) * (1 - i * 0.2);
            const spiralAngle = rad * spirals + t * 0.001 * (i + 1);
            const x = Math.cos(spiralAngle) * dist;
            const y = Math.sin(spiralAngle) * dist;
            
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 3 - i;
          ctx.stroke();
        }

        // Draw circular waves
        for (let i = 1; i <= 5; i++) {
          const waveRadius = (this.radius / 5) * i;
          ctx.beginPath();
          ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
          ctx.strokeStyle = this.color2 + Math.floor(50 - i * 8).toString(16).padStart(2, '0');
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    class FlowingParticle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.size = Math.random() * 4 + 2;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.life = 0;
        this.maxLife = Math.random() * 200 + 100;
        this.trail = [];
      }

      update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 30) this.trail.shift();

        this.x += this.vx;
        this.y += this.vy;
        
        // Smooth wave motion
        this.vx += Math.sin(this.life * 0.02) * 0.05;
        this.vy += Math.cos(this.life * 0.02) * 0.05;
        
        this.life++;

        if (this.x < -50 || this.x > canvas.width + 50 || 
            this.y < -50 || this.y > canvas.height + 50 || 
            this.life > this.maxLife) {
          this.reset();
        }
      }

      draw() {
        // Draw flowing trail
        ctx.beginPath();
        for (let i = 0; i < this.trail.length - 1; i++) {
          const alpha = (i / this.trail.length) * 0.5;
          const width = (i / this.trail.length) * this.size;
          ctx.strokeStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
          ctx.lineWidth = width;
          ctx.moveTo(this.trail[i].x, this.trail[i].y);
          ctx.lineTo(this.trail[i + 1].x, this.trail[i + 1].y);
          ctx.stroke();
        }

        // Draw particle
        const alpha = 1 - (this.life / this.maxLife);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, this.color + 'ff');
        gradient.addColorStop(1, this.color + '00');
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }

    // Create swirls and particles
    const swirls = [];
    for (let i = 0; i < 8; i++) {
      swirls.push(new Swirl());
    }

    const particles = [];
    for (let i = 0; i < 100; i++) {
      particles.push(new FlowingParticle());
    }

    function animate() {
      time++;
      
      // Soft gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGradient.addColorStop(0, '#FFF5F7');
      bgGradient.addColorStop(0.3, '#FFE8E8');
      bgGradient.addColorStop(0.6, '#FFF0E6');
      bgGradient.addColorStop(1, '#FFE4E1');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw swirls
      swirls.forEach(swirl => {
        swirl.update(time);
        swirl.draw(time);
      });

      // Draw flowing particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1
      }}
    />
  );
}

// Demo component
function App() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'auto' }}>
      <AnimatedBackground />
      
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        padding: '40px',
        fontFamily: 'Segoe UI, sans-serif'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '50px',
          boxShadow: '0 20px 60px rgba(255, 140, 140, 0.3)',
          border: '2px solid rgba(255, 182, 193, 0.3)'
        }}>
          <h1 style={{ 
            color: '#FF6B6B', 
            marginBottom: '10px',
            fontSize: '42px',
            fontWeight: '700'
          }}>
            💼 My Job Applications
          </h1>
          
          <p style={{ 
            color: '#FF8C94', 
            fontSize: '18px',
            marginBottom: '30px'
          }}>
            Beautiful flowing animations behind your content
          </p>
          
          <div style={{
            padding: '30px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(255, 140, 140, 0.15)',
            marginTop: '30px'
          }}>
            <h3 style={{ color: '#FF69B4', marginBottom: '15px' }}>✨ Amazing Features:</h3>
            <ul style={{ color: '#666', lineHeight: '2', fontSize: '16px' }}>
              <li>🌊 Beautiful swirling patterns that pulse and flow</li>
              <li>🎨 Warm pink, coral, and peach color palette</li>
              <li>✨ Smooth flowing particles with trails</li>
              <li>💫 Animated spirals that rotate gently</li>
              <li>🌈 Gradient waves for depth</li>
              <li>⚡ Optimized performance</li>
            </ul>
          </div>

          <div style={{
            marginTop: '30px',
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(255,182,193,0.2) 0%, rgba(255,160,122,0.2) 100%)',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#FF6B6B',
            fontWeight: '600'
          }}>
            Scroll down to see more content with the beautiful background! 
          </div>

          {/* Add more content to show scrolling */}
          <div style={{ marginTop: '50px', height: '400px', 
            background: 'rgba(255,255,255,0.7)', 
            borderRadius: '16px', 
            padding: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FF8C94',
            fontSize: '24px',
            fontWeight: '600'
          }}>
            Your job applications table goes here!
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;