// Plan de estructura para el sistema de ligas y torneos semanales
// 1. Modelos y lógica backend
// 2. Endpoints backend para retos y rankings
// 3. UI/UX en League tab
// 4. Conexión frontend-backend
// 5. Lógica de escalado y recompensas
// 6. Pruebas y ajustes

/**
 * 1. Modelos Backend (backend/src/models/League.ts)
 * - League: id, nombre, descripción, nivel, usuarios, ranking
 * - Tournament: id, nombre, fecha_inicio, fecha_fin, participantes, retos
 * - Challenge: id, tipo (ahorro, gasto, velocidad), reglas, recompensa
 * - UserLeagueStats: userId, leagueId, puntos, posición, recompensas
 */

/**
 * 2. Endpoints Backend
 * - GET /leagues: Listar ligas y torneos activos
 * - GET /leagues/:id: Detalle de liga/torneo
 * - POST /leagues/:id/join: Unirse a liga
 * - GET /leagues/:id/ranking: Ranking de usuarios
 * - POST /leagues/:id/submit: Registrar resultado de reto
 */

/**
 * 3. UI League Tab
 * - Mostrar ligas activas, progreso, ranking y retos semanales
 * - Botón para unirse/participar
 * - Tabla de posiciones y recompensas
 */

/**
 * 4. Conexión Frontend-Backend
 * - Llamadas fetch/axios a los endpoints
 * - Actualización en tiempo real (opcional: socket.io)
 */

/**
 * 5. Lógica de escalado y recompensas
 * - Al finalizar torneo, actualizar posiciones y otorgar beneficios
 */

/**
 * 6. Pruebas y ajustes UI/UX
 * - Test de flujo completo y feedback visual
 */
