// Tailwind v4 runs as a PostCSS plugin (not the Vite plugin) so it processes the
// output of the Sass compiler — @apply / @reference inside .scss modules resolve.
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
