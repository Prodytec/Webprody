const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
const PUBLIC_PREFIX = '/uploads/';
const MAX_BYTES = 3.5 * 1024 * 1024;

// Validamos por el contenido real del archivo (firma), no por lo que declare el cliente.
const SIGNATURES = [
  { ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'webp', test: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
];

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400, publicMessage: message });
}

async function saveImage(dataUrl) {
  const m = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  if (!m) throw badRequest('Imagen inválida (usá JPG, PNG o WebP).');
  const buffer = Buffer.from(m[1], 'base64');
  if (buffer.length > MAX_BYTES) throw badRequest('La imagen es demasiado pesada.');
  const type = SIGNATURES.find((s) => s.test(buffer));
  if (!type) throw badRequest('El archivo no es una imagen válida.');

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const name = `${crypto.randomBytes(8).toString('hex')}.${type.ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, name), buffer);
  return PUBLIC_PREFIX + name;
}

async function deleteImage(publicPath) {
  if (!publicPath || !publicPath.startsWith(PUBLIC_PREFIX)) return;
  // basename evita salir de la carpeta de uploads
  await fs.rm(path.join(UPLOADS_DIR, path.basename(publicPath)), { force: true });
}

module.exports = { saveImage, deleteImage, UPLOADS_DIR };
