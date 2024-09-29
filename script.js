const { Engine, Render, World, Bodies, Mouse, MouseConstraint, Events, Body } = Matter;

class Balloon {
    constructor(x, y) {
        // Create a balloon with an elliptical shape using a slightly scaled circle
        this.body = Bodies.circle(x, y, 30, {
            restitution: 0.9, // Bouncy effect
            render: {
                fillStyle: this.generateGradientColor() // Use a static fill color for each balloon
            }
        });

        // Apply initial velocity for gentle upward movement
        Body.setVelocity(this.body, { x: Math.random() * 0.5 - 0.25, y: Math.random() * -1 });
        World.add(world, this.body);

        // Event listener for balloon updates
        Matter.Events.on(engine, 'afterUpdate', () => {
            this.checkBoundary();
        });
    }

    // Generate a gradient-like random color for the balloon
    generateGradientColor() {
        const hue = Math.random() * 360;
        return `hsl(${hue}, 100%, 70%)`; // HSL colors for smooth gradient-like effect
    }

    // Check if the balloon has reached the top and pop it if so
    checkBoundary() {
        if (this.body.position.y < 100) { // If the balloon goes above the canvas
            this.pop(); // Pop the balloon
            this.respawn(); // Respawn a new balloon
        }
    }

    // Pop the balloon with particles
    pop() {
        World.remove(world, this.body); // Remove balloon from the world
        this.createParticles(this.body.position); // Create pop particles
        const pop = new Audio('./pop.wav')
        pop.play();
    }

    // Respawn the balloon from the bottom
    respawn() {
        const x = Math.random() * render.canvas.width; // Random horizontal position
        const y = render.canvas.height ; // Start below the canvas
        this.body = Bodies.circle(x, y, 30, {
            restitution: 0.9,
            render: {
                fillStyle: this.generateGradientColor() // New random color
            }
        });

        // Apply initial velocity for upward movement again
        Body.setVelocity(this.body, { x: Math.random() * 0.5 - 0.25, y: Math.random() * -1 });
        World.add(world, this.body); // Add the new balloon to the world
    }

    // Create particles for pop animation
    createParticles(position) {
        const canvasRect = render.canvas.getBoundingClientRect();
        const particleCount = 30;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement("div");
            particle.classList.add("particle");
            document.body.appendChild(particle);

            // Set initial position of the particle relative to the canvas
            gsap.set(particle, {
                x: canvasRect.left + position.x,
                y: canvasRect.top + position.y,
                background: `hsl(${Math.random() * 360}, 100%, 70%)`,
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                position: "absolute"
            });

            // Animate the particles to burst outward
            gsap.to(particle, {
                duration: 1.5,
                x: canvasRect.left + position.x + (Math.random() - 0.5) * 200,
                y: canvasRect.top + position.y + (Math.random() - 0.5) * 200,
                opacity: 0,
                scale: Math.random() + 0.5,
                onComplete: () => particle.remove()
            });
        }
    }
}


// Create an engine for Matter.js
const engine = Engine.create();
const world = engine.world;
world.gravity.y = -0.05;  // Reduced gravity for slow floating effect

// Create a renderer for Matter.js
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false
    }
});

// Run the engine and renderer for Matter.js
Matter.Runner.run(engine);
Render.run(render);

// Boundary to keep balloons within the screen
let boundaries = [];

function createBoundaries() {
    // Remove existing boundaries
    World.remove(world, boundaries);

    // Create new boundaries based on window size
    boundaries = [
        Bodies.rectangle(window.innerWidth / 2, 0, window.innerWidth, 20, { isStatic: true }), // top
        Bodies.rectangle(window.innerWidth / 2, window.innerHeight, window.innerWidth, 20, { isStatic: true }), // bottom
        Bodies.rectangle(0, window.innerHeight / 2, 20, window.innerHeight, { isStatic: true }), // left
        Bodies.rectangle(window.innerWidth, window.innerHeight / 2, 20, window.innerHeight, { isStatic: true }) // right
    ];

    // Add new boundaries to the world
    World.add(world, boundaries);
}

// Initial boundary creation
createBoundaries();
// Add at least 5 balloons at the bottom of the screen
const balloons = [];


function addBalloonWithDelay(index, delay) {
    setTimeout(() => {
        const xPosition = (index + 1) * (window.innerWidth / 51); // Spread them across the screen
        balloons.push(new Balloon(xPosition, window.innerHeight - 100));
    }, delay); // Delay in milliseconds
}

// Function to add all balloons with delays
function addBalloonsWithDelay() {
    const delayIncrement = 200; // Delay between each balloon (200 ms)
    for (let i = 0; i < 15; i++) {
        addBalloonWithDelay(i, i * delayIncrement);
    }
}

// Call the function to add balloons with delays
addBalloonsWithDelay();






// Mouse control for Matter.js
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        render: { visible: false }
    }
});
World.add(world, mouseConstraint);

// Event listener for mouse click to add new balloons or pop existing ones
Events.on(mouseConstraint, 'mousedown', function (event) {
    const { mouse } = event.source;

    // Check if any balloon is clicked
    const clickedBody = mouseConstraint.body;
    if (clickedBody) {
        const balloon = balloons.find(b => b.body === clickedBody);
        if (balloon) {
            balloon.pop();  // Pop the balloon
            return;  // Prevent new balloon creation if popping
        }
    }

    // If no balloon is clicked, create a new balloon
    balloons.push(new Balloon(mouse.position.x, mouse.position.y));
});

// Add drag functionality
Events.on(mouseConstraint, 'mousemove', function (event) {
    if (mouseConstraint.body) {
        const balloon = balloons.find(b => b.body === mouseConstraint.body);
        if (balloon) {
            Body.setPosition(balloon.body, { x: mouse.position.x, y: mouse.position.y });
        }
    }
});

// Resize event to adjust boundaries when window size changes
window.addEventListener('resize', function () {
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;

    // Re-create boundaries for the new window size
    createBoundaries();
});



let scene, camera, renderer, textMesh;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(10, 10, 10);
  scene.add(pointLight);

  // Load font and create responsive text
  const loader = new THREE.FontLoader();
  loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    createTextMesh(font);
    animate();
  });

  window.addEventListener('resize', onWindowResize, false);
}

// Function to create the text mesh
function createTextMesh(font) {
  const textSize = Math.min(window.innerWidth, window.innerHeight) * 0.0003; // Adjusted text size to 2% of the smaller dimension

  const textGeometry = new THREE.TextGeometry('Happy Birthday, Ciprian!', {
    font: font,
    size: textSize, // Use calculated smaller size
    height: textSize * 0.25, // Adjust height based on size
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: textSize * 0.05,
    bevelSize: textSize * 0.03,
    bevelOffset: 0,
    bevelSegments: 3,
  });

  const textMaterial = new THREE.MeshPhongMaterial({ color: 0xffa500, shininess: 70 });
  if (textMesh) scene.remove(textMesh); // Remove previous textMesh if it exists
  textMesh = new THREE.Mesh(textGeometry, textMaterial);

  // Center the text
  textGeometry.computeBoundingBox();
  const centerOffset = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);
  textMesh.position.x = centerOffset;
  textMesh.position.y = -0.5;

  scene.add(textMesh);
}

// Update the renderer and camera when window is resized
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Recreate the text with new size
  const loader = new THREE.FontLoader();
  loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    createTextMesh(font);
  });
}

// Animate the text
function animate() {
  requestAnimationFrame(animate);

  // Gentle floating and rotation for smoother animation
  textMesh.position.y = Math.sin(Date.now() * 0.001) * 0.3 - 0.5; // Floating effect with reduced amplitude

  renderer.render(scene, camera);
}

// Initialize the scene
init();
