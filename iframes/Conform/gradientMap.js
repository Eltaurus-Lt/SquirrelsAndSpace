function hex2rgb(hex) {
  hex = hex.trim();
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const num = parseInt(hex, 16);
  return [((num >> 16) & 255)/255, ((num >> 8) & 255)/255, (num & 255)/255];
}

const gradientStops = [
  "#000",
  getComputedStyle(document.documentElement).getPropertyValue('--cf-green'),
  getComputedStyle(document.documentElement).getPropertyValue('--cf-green-pale'),
  getComputedStyle(document.documentElement).getPropertyValue('--cf-blue'),
  getComputedStyle(document.documentElement).getPropertyValue('--cf-blue-pale'),
  getComputedStyle(document.documentElement).getPropertyValue('--cf-yellow'),
  getComputedStyle(document.documentElement).getPropertyValue('--cf-yellow-pale'),
  getComputedStyle(document.documentElement).getPropertyValue('--cf-orange'),
  getComputedStyle(document.documentElement).getPropertyValue('--cf-orange-pale'),
];

const rStops = [], gStops = [], bStops = [];
gradientStops.forEach(c => {
  const rgb = hex2rgb(c);
  rStops.push(rgb[0]);
  rStops.push(rgb[0]);
  gStops.push(rgb[1]);
  gStops.push(rgb[1]);
  bStops.push(rgb[2]);
  bStops.push(rgb[2]);
});
document.querySelector("feFuncR").setAttribute('tableValues', rStops.join(' '));
document.querySelector("feFuncG").setAttribute('tableValues', gStops.join(' '));
document.querySelector("feFuncB").setAttribute('tableValues', bStops.join(' '));