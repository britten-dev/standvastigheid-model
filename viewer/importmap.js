// Shared by the harness and the viewer so the two never drift apart.
document.write(`<script type="importmap">${JSON.stringify({
  imports: {
    three: '/node_modules/three/build/three.module.js',
    'three/addons/': '/node_modules/three/examples/jsm/',
  },
})}<\/script>`);
