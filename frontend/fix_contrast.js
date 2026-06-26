/* eslint-disable */
const fs = require('fs');

function getLuminance(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const rgb = parseInt(hex, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >>  8) & 0xff;
  const b = (rgb >>  0) & 0xff;
  
  const a = [r, g, b].map(function (v) {
      v /= 255;
      return v <= 0.03928
          ? v / 12.92
          : Math.pow( (v + 0.055) / 1.055, 2.4 );
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

const file = '/home/gytdrop/Desktop/BHAYYA/techazsure/3d print/frontend/app/globals.css';
let css = fs.readFileSync(file, 'utf8');

// Replace .btn-accent color: white; with color: var(--text-on-accent, #ffffff);
css = css.replace(/(\.btn-accent\s*\{[^}]*)color:\s*white;/, '$1color: var(--text-on-accent, #ffffff);');

// Replace all --text-primary values in palettes based on bg luminance, and add --text-on-accent
const paletteRegex = /\[data-palette="([^"]+)"\]\s*\{([^}]+)\}/g;
css = css.replace(paletteRegex, (match, paletteName, inner) => {
  // Find bg-primary and accent
  const bgMatch = inner.match(/--bg-primary:\s*#([0-9a-fA-F]+)/);
  const accentMatch = inner.match(/--accent:\s*#([0-9a-fA-F]+)/);
  
  if (!bgMatch || !accentMatch) return match;
  
  const bgHex = bgMatch[1];
  const accentHex = accentMatch[1];
  
  const bgLum = getLuminance(bgHex);
  const accentLum = getLuminance(accentHex);
  
  const textPrimary = bgLum > 0.5 ? '#1c1917' : '#fafaf9';
  const textOnAccent = accentLum > 0.35 ? '#1c1917' : '#ffffff';
  
  // Replace text-primary
  let newInner = inner.replace(/--text-primary:\s*#[0-9a-fA-F]+;/, `--text-primary:  ${textPrimary};`);
  
  // Add --text-on-accent right after --accent
  if (!newInner.includes('--text-on-accent')) {
    newInner = newInner.replace(/(--accent:\s*#[0-9a-fA-F]+;)/, `$1\n  --text-on-accent:${textOnAccent};`);
  }
  
  return `[data-palette="${paletteName}"] {${newInner}}`;
});

// Also do the same for :root
const rootRegex = /:root\s*\{([^}]+)\}/;
css = css.replace(rootRegex, (match, inner) => {
  const bgMatch = inner.match(/--bg-primary:\s*#([0-9a-fA-F]+)/);
  const accentMatch = inner.match(/--accent:\s*#([0-9a-fA-F]+)/);
  if (!bgMatch || !accentMatch) return match;
  const bgHex = bgMatch[1];
  const accentHex = accentMatch[1];
  const bgLum = getLuminance(bgHex);
  const accentLum = getLuminance(accentHex);
  const textPrimary = bgLum > 0.5 ? '#1c1917' : '#fafaf9';
  const textOnAccent = accentLum > 0.35 ? '#1c1917' : '#ffffff';
  let newInner = inner.replace(/--text-primary:\s*#[0-9a-fA-F]+;/, `--text-primary:  ${textPrimary};`);
  if (!newInner.includes('--text-on-accent')) {
    newInner = newInner.replace(/(--accent:\s*#[0-9a-fA-F]+;)/, `$1\n  --text-on-accent:  ${textOnAccent};`);
  }
  return `:root {${newInner}}`;
});

// Also fix legacy palettes
const legacyRegex = /\[data-palette="(glow|gallery|celebration)"\]\s*\{([^}]+)\}/g;
css = css.replace(legacyRegex, (match, paletteName, inner) => {
  const bgMatch = inner.match(/--bg-primary:\s*#([0-9a-fA-F]+)/);
  const accentMatch = inner.match(/--accent:\s*#([0-9a-fA-F]+)/);
  if (!bgMatch || !accentMatch) return match;
  const bgHex = bgMatch[1];
  const accentHex = accentMatch[1];
  const bgLum = getLuminance(bgHex);
  const accentLum = getLuminance(accentHex);
  const textPrimary = bgLum > 0.5 ? '#1c1917' : '#fafaf9';
  const textOnAccent = accentLum > 0.35 ? '#1c1917' : '#ffffff';
  let newInner = inner.replace(/--text-primary:\s*#[0-9a-fA-F]+;/, `--text-primary:${textPrimary};`);
  if (!newInner.includes('--text-on-accent')) {
    newInner = newInner.replace(/(--accent:\s*#[0-9a-fA-F]+;)/, `$1 --text-on-accent:${textOnAccent};`);
  }
  return `[data-palette="${paletteName}"] {${newInner}}`;
});


fs.writeFileSync(file, css, 'utf8');
console.log('Successfully updated globals.css contrast mappings.');
