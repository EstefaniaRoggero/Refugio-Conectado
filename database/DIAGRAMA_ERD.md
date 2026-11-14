# Alineación con el diagrama ERD

## Tablas del diagrama — estado en el esquema

| Entidad ERD | Tabla SQL | Estado |
|-------------|-----------|--------|
| Rol | `roles` | ✅ Agregada |
| Usuario | `usuarios` | ✅ Actualizada (`id_rol` FK) |
| TipoVivienda | `tipos_vivienda` | ✅ Agregada |
| PerfilAdoptante (IA) | `perfiles_adoptante` | ✅ Agregada |
| Tipo (mascota) | `tipos_mascota` | ✅ Agregada |
| EstadoMascota | `estados_mascota` | ✅ Agregada |
| Refugio | `refugios` | ✅ Agregada (faltaba) |
| Mascota | `mascotas` | ✅ Normalizada con FKs |
| EstadoSolicitudAdopcion | `estados_solicitud_adopcion` | ✅ Agregada |
| SolicitudAdopcion | `solicitudes_adopcion` | ✅ Actualizada |
| Tipo donación | `tipos_donacion` | ✅ Agregada |
| Donación | `donaciones` | ✅ Con `id_refugio`, `id_tipo_donacion` |
| Voluntariado | `voluntarios` | ✅ Con `id_refugio`, `tarea` |

## Extensiones del sistema web (no en ERD, recomendadas)

| Tabla | Propósito |
|-------|-----------|
| `mascota_imagenes` | Galería de fotos por mascota |
| `favoritos` | Lista de deseos del usuario |
| `mensajes` | Formulario de contacto (+ `id_refugio`) |
| `password_resets` | Recuperación de contraseña |
| `metodos_pago` | Catálogo de métodos (MercadoPago, tarjeta, etc.) |
| `citas_visita` | Citas de conocimiento post-solicitud |
| `notificaciones` | Avisos al usuario (estado adopción, etc.) |

## Relaciones clave del diagrama

```
roles (1) ──< usuarios (n)
tipos_vivienda (1) ──< usuarios (n)
tipos_vivienda (1) ──< perfiles_adoptante (1) ── usuarios (1)

refugios (1) ──< mascotas (n)
tipos_mascota (1) ── mascotas (n)
estados_mascota (1) ── mascotas (n)

usuarios (n) ──< solicitudes_adopcion >── (n) mascotas
estados_solicitud_adopcion (1) ── solicitudes (n)

usuarios (n) ──< donaciones >── (n) refugios
tipos_donacion (1) ── donaciones (n)

usuarios (n) ──< voluntarios >── (n) refugios
```

## Campo `codigo` en catálogos

Los catálogos incluyen columna `codigo` para mantener compatibilidad con la API existente (`disponible`, `perro`, `pendiente`, etc.) sin romper el frontend.

## Tablas agregadas: razas + historial médico

| Tabla | Relación | Descripción |
|-------|----------|-------------|
| `razas` | `tipos_mascota` (1:N) | Catálogo de razas por tipo |
| `mascotas.id_raza` | FK opcional | Raza de cada mascota |
| `historial_medico_mascota` | `mascotas` (1:N) | Vacunas, cirugías, consultas por fecha |

**API:** `GET /api/catalogos/razas?tipo=perro` · `GET /api/mascotas/:id/historial-medico` · `POST` (admin)

## Próximos pasos opcionales

- Tabla `usuarios_refugios` (N:M si un admin gestiona varias sedes)
