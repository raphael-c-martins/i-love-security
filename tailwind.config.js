// Configuração do build local do Tailwind CSS (substitui o CDN cdn.tailwindcss.com).
// Gera visual/css/tailwind.css a partir das classes usadas nos HTML e nos módulos JS.
// Rebuild: npm install && npm run build:css
module.exports = {
  darkMode: 'class',
  content: [
    './*.html',
    './visual/js/script.js',
    './visual/js/modules/**/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
