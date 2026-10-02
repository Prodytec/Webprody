const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { UPLOADS_DIR } = require('./image.service');

const MB = 1024 * 1024;
const ascii = (b, from, to) => b.subarray(from, to).toString('latin1');

// Se valida por el contenido real del archivo (firma), no por lo que declare el cliente.
const KINDS = {
  image: {
    max: 8 * MB,
    label: 'La imagen',
    types: [
      { ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
      { ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
      { ext: 'webp', test: (b) => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP' },
      { ext: 'gif', test: (b) => ascii(b, 0, 4) === 'GIF8' },
    ],
  },
  audio: {
    max: 60 * MB,
    label: 'El audio',
    types: [
      { ext: 'mp3', test: (b) => ascii(b, 0, 3) === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) },
      { ext: 'ogg', test: (b) => ascii(b, 0, 4) === 'OggS' },
      { ext: 'wav', test: (b) => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WAVE' },
      { ext: 'm4a', test: (b) => ascii(b, 4, 8) === 'ftyp' },
    ],
  },
  video: {
    max: 60 * MB,
    label: 'El video',
    types: [
      { ext: 'mp4', test: (b) => ascii(b, 4, 8) === 'ftyp' },
      { ext: 'webm', test: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
    ],
  },
};

const badRequest = (message) => Object.assign(new Error(message), { status: 400, publicMessage: message });

async function saveMedia(buffer, kind) {
  const spec = KINDS[kind];
  if (!spec) throw badRequest('Tipo de archivo no soportado.');
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw badRequest('No se recibió ningún archivo.');
  if (buffer.length > spec.max) throw badRequest(`${spec.label} supera el máximo de ${spec.max / MB} MB.`);
  const type = spec.types.find((t) => t.test(buffer));
  if (!type) throw badRequest(`${spec.label} no tiene un formato válido (${spec.types.map((t) => t.ext).join(', ')}).`);

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const name = `${crypto.randomBytes(8).toString('hex')}.${type.ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, name), buffer);
  return `/uploads/${name}`;
}

module.exports = { saveMedia };
