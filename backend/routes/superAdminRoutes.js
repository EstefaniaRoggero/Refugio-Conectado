import { Router } from 'express';
import {
  loginSuperAdmin, getOverview, listRefugiosAdmin, createRefugio, updateRefugio,
  listAdmins, createAdmin, updateAdmin, listActivity,
  renewAdminInvitation, activateAdminInvitation,
} from '../controllers/superAdminController.js';
import {
  listZones, createZone, updateZone, listLocalities, createLocality, updateLocality,
  listPlatformUsers, updatePlatformUserStatus, updatePlatformUserRole,
  createRefugeRequest, listRefugeRequests, reviewRefugeRequest,
  listOrganizations, createOrganization, updateOrganization,
  listAgreements, saveAgreement, getPlatformStats, getSystemSettings, updateSystemSettings,
  saveCatalogItem, listPublicSystemCatalogs,
} from '../controllers/platformAdminController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { auditMutations } from '../services/auditService.js';
import { crearLimitadorLogin, crearLimitadorRecuperacion } from '../middlewares/rateLimiters.js';

const router = Router();

router.post('/login', crearLimitadorLogin(), loginSuperAdmin);
router.post('/activar', crearLimitadorRecuperacion(), activateAdminInvitation);
router.post('/solicitudes-refugio', createRefugeRequest);
router.get('/catalogos-publicos', listPublicSystemCatalogs);
router.use(protect, authorize('super_admin'), auditMutations);
router.get('/overview', getOverview);
router.get('/zonas', listZones);
router.post('/zonas', createZone);
router.put('/zonas/:id', updateZone);
router.get('/zonas/:id/localidades', listLocalities);
router.post('/zonas/:id/localidades', createLocality);
router.put('/zonas/:id/localidades/:localityId', updateLocality);
router.get('/refugios', listRefugiosAdmin);
router.post('/refugios', createRefugio);
router.put('/refugios/:id', updateRefugio);
router.get('/admins', listAdmins);
router.post('/admins', createAdmin);
router.put('/admins/:id', updateAdmin);
router.post('/admins/:id/invitacion', renewAdminInvitation);
router.get('/usuarios', listPlatformUsers);
router.put('/usuarios/:id/estado', updatePlatformUserStatus);
router.put('/usuarios/:id/rol', updatePlatformUserRole);
router.get('/solicitudes-refugio', listRefugeRequests);
router.put('/solicitudes-refugio/:id', reviewRefugeRequest);
router.get('/organizaciones', listOrganizations);
router.post('/organizaciones', createOrganization);
router.put('/organizaciones/:id', updateOrganization);
router.get('/convenios', listAgreements);
router.post('/convenios', saveAgreement);
router.put('/convenios/:id', saveAgreement);
router.get('/estadisticas', getPlatformStats);
router.get('/configuracion', getSystemSettings);
router.put('/configuracion', updateSystemSettings);
router.post('/configuracion/catalogos', saveCatalogItem);
router.put('/configuracion/catalogos/:id', saveCatalogItem);
router.get('/actividad', listActivity);

export default router;

