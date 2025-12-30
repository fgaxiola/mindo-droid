/**
 * Script de diagnóstico para identificar problemas al actualizar tasks
 * 
 * Uso:
 * 1. Abre la consola del navegador (F12)
 * 2. Copia y pega este script
 * 3. Ejecuta: debugTaskUpdate()
 * 
 * Esto mostrará información sobre el estado actual de las tasks y posibles problemas
 */

async function debugTaskUpdate() {
  console.log("=== DIAGNÓSTICO DE ACTUALIZACIÓN DE TASKS ===\n");
  
  // Verificar si hay tasks en el cache de React Query
  const queryClient = window.__REACT_QUERY_CLIENT__;
  if (!queryClient) {
    console.error("❌ No se encontró React Query Client. Asegúrate de que la app esté cargada.");
    return;
  }
  
  const tasks = queryClient.getQueryData(["tasks"]);
  if (!tasks || tasks.length === 0) {
    console.warn("⚠️ No hay tasks en el cache");
    return;
  }
  
  console.log(`✅ Encontradas ${tasks.length} tasks en el cache\n`);
  
  // Verificar estructura de las tasks
  console.log("=== ESTRUCTURA DE TASKS ===");
  const sampleTask = tasks[0];
  console.log("Task de ejemplo:", {
    id: sampleTask.id,
    title: sampleTask.title,
    coords: sampleTask.coords,
    quadrant_coords: sampleTask.quadrant_coords,
    matrixPosition: sampleTask.matrixPosition,
    matrix_position: sampleTask.matrix_position,
    position: sampleTask.position,
    user_id: sampleTask.user_id,
  });
  
  // Verificar problemas comunes
  console.log("\n=== VERIFICACIÓN DE PROBLEMAS ===");
  
  const problems = [];
  
  tasks.forEach((task, index) => {
    // Verificar user_id
    if (!task.user_id) {
      problems.push(`Task ${task.id} (índice ${index}): Falta user_id`);
    }
    
    // Verificar title
    if (!task.title) {
      problems.push(`Task ${task.id} (índice ${index}): Falta title`);
    }
    
    // Verificar coords vs quadrant_coords
    if (task.coords && !task.quadrant_coords) {
      console.warn(`Task ${task.id}: Tiene 'coords' pero no 'quadrant_coords' (esto es normal en frontend)`);
    }
  });
  
  if (problems.length > 0) {
    console.error("❌ PROBLEMAS ENCONTRADOS:");
    problems.forEach(p => console.error(`  - ${p}`));
  } else {
    console.log("✅ No se encontraron problemas obvios en la estructura de las tasks");
  }
  
  // Verificar conexión a Supabase
  console.log("\n=== VERIFICACIÓN DE SUPABASE ===");
  try {
    const { createClient } = await import('/src/lib/supabase/client.ts');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log(`✅ Usuario autenticado: ${user.email}`);
    } else {
      console.error("❌ No hay usuario autenticado");
    }
    
    // Intentar una query simple
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, quadrant_coords, position")
      .limit(1);
    
    if (error) {
      console.error("❌ Error al consultar Supabase:", error);
    } else {
      console.log("✅ Conexión a Supabase OK");
      if (data && data.length > 0) {
        console.log("Ejemplo de task en BD:", data[0]);
      }
    }
  } catch (err) {
    console.error("❌ Error al verificar Supabase:", err);
  }
  
  console.log("\n=== FIN DEL DIAGNÓSTICO ===");
}

// Exportar para uso en consola
if (typeof window !== 'undefined') {
  window.debugTaskUpdate = debugTaskUpdate;
  console.log("💡 Función debugTaskUpdate() disponible. Ejecuta: debugTaskUpdate()");
}


