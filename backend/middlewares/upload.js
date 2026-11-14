import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { put } from '@vercel/blob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');

// En Vercel el disco no persiste: con token de Blob las imágenes van a Vercel Blob
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

if (!useBlob && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Se valida por tipo real (MIME): .jfif/.jpe son JPEG aunque la extensión no lo diga
const MIME_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/pjpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const uniqueName = (mimetype) =>
  `${Date.now()}-${Math.round(Math.random() * 1e9)}${MIME_EXTENSIONS[mimetype] || '.jpg'}`;

const storage = useBlob
  ? multer.memoryStorage()
  : multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, uniqueName(file.mimetype)),
  });

const fileFilter = (req, file, cb) => {
  if (MIME_EXTENSIONS[file.mimetype]) return cb(null, true);
  const err = new Error('Solo se permiten imágenes (jpeg, png, webp, gif)');
  err.statusCode = 400;
  cb(err, false);
};

export const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10) },
  fileFilter,
});

/** Guarda el archivo subido y devuelve la URL pública para la base de datos */
export async function saveUpload(file) {
  if (!useBlob) return `/uploads/${file.filename}`;
  try {
    const blob = await put(`uploads/${uniqueName(file.mimetype)}`, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
    });
    return blob.url;
  } catch (cause) {
    console.error('[Blob]', cause);
    const err = new Error(`No se pudo subir la imagen: ${cause.message}`);
    err.statusCode = 502;
    throw err;
  }
}
