// Particle Background (unchanged from previous)
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.querySelector('.particles').appendChild(renderer.domElement);

const particlesGeometry = new THREE.BufferGeometry();
const particleCount = 500;
const posArray = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 2000;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 2,
    color: 0x00ffcc,
    transparent: true,
    opacity: 0.8
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

camera.position.z = 500;

function animateParticles() {
    requestAnimationFrame(animateParticles);
    particlesMesh.rotation.y += 0.001;
    renderer.render(scene, camera);
}
animateParticles();

// Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Dashboard: Load Servers
if (document.getElementById('server-grid')) {
    fetch('/api/servers')
        .then(res => res.json())
        .then(servers => {
            const grid = document.getElementById('server-grid');
            servers.forEach(server => {
                const card = document.createElement('div');
                card.className = 'server-card';
                card.dataset.tilt = '';
                card.innerHTML = `
                    <div class="card-inner">
                        <img src="${server.icon || 'https://via.placeholder.com/80'}" alt="Server Icon" class="server-icon">
                        <h3>${server.name}</h3>
                        <p>Members: ${server.member_count || 'N/A'}</p>
                        <p>Prefix: ${server.settings.prefix}</p>
                    </div>
                `;
                grid.appendChild(card);
            });
            VanillaTilt.init(document.querySelectorAll('.server-card'), {
                max: 25,
                speed: 400,
                glare: true,
                'max-glare': 0.5
            });
        })
        .catch(err => console.error('Error fetching servers:', err));
}

// Settings: Load Servers into Dropdown and Settings
let selectedGuildId = null;

if (document.getElementById('server-select')) {
    fetch('/api/servers')
        .then(res => res.json())
        .then(servers => {
            const select = document.getElementById('server-select');
            servers.forEach(server => {
                const option = document.createElement('option');
                option.value = server.id;
                option.textContent = server.name;
                select.appendChild(option);
            });
            if (servers.length > 0) {
                select.value = servers[0].id;
                loadSettings();
            }
        });
}

function loadSettings() {
    const guildId = document.getElementById('server-select').value;
    selectedGuildId = guildId;
    fetch('/api/servers')
        .then(res => res.json())
        .then(servers => {
            const server = servers.find(s => s.id === guildId);
            document.getElementById('prefix').value = server.settings.prefix;
            document.getElementById('music-toggle').checked = server.settings.modules.music;
        });
}

function saveSettings() {
    const guildId = selectedGuildId;
    const prefix = document.getElementById('prefix').value;
    const music = document.getElementById('music-toggle').checked;

    fetch(`/api/settings/${guildId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix, music })
    })
        .then(res => res.json())
        .then(data => alert('Settings saved!'))
        .catch(err => console.error('Error saving settings:', err));
}
