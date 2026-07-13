import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/pages/dashboard/WorkScheduleView.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Dinamizar Modal de Disponibilidad (Configuracion)
const newSelect = `
                <select 
                  value={configClinic} 
                  onChange={(e) => setConfigClinic(e.target.value)} 
                  className="w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-400 transition-all duration-200 appearance-none font-medium"
                >
                  {clinics.length === 0 ? (
                    <option value="" disabled>No tienes sedes registradas</option>
                  ) : (
                    clinics.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  )}
                </select>
`;

content = content.replace(
  /<select value=\{configClinic\} onChange=\{\(e\) => setConfigClinic\(e\.target\.value\)\} className="w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500\/25 focus:border-sky-400 transition-all duration-200 appearance-none font-medium">[\s\S]*?<\/select>/,
  newSelect.trim()
);

// We need to disable the button if clinics.length === 0
content = content.replace(
  /<button onClick=\{handleSaveSchedule\} className="w-full py-3 bg-teal-500 hover:bg-teal-600 active:scale-\[0\.99\] text-white font-semibold rounded-xl shadow-sm shadow-teal-200 transition-all flex items-center justify-center gap-2">/g,
  '<button onClick={handleSaveSchedule} disabled={clinics.length === 0} className="w-full py-3 bg-teal-500 hover:bg-teal-600 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-semibold rounded-xl shadow-sm shadow-teal-200 transition-all flex items-center justify-center gap-2">'
);

// 2. Limpiar texto quemado 'Las Mercedes'
content = content.replace(
  /Las Mercedes/g,
  `{clinics.find(c => c.id === configClinic)?.name || 'Sede Seleccionada'}`
);

// 3. Update handleSaveSchedule
const newHandleSaveSchedule = `
  const handleSaveSchedule = async () => {
    try {
      if (!configClinic) return;
      
      const payload = {
        clinic_id: configClinic,
        days: scheduleConfig
      };
      
      await saveDoctorSchedule(payload);
      console.log("✅ Horarios base guardados exitosamente");
      setIsConfigOpen(false);
      
      // Opcional: refetchEvents() si necesitas refrescar la vista
      refetchEvents();
    } catch (error: any) {
      console.error("❌ Error al guardar horarios:", error);
      alert(\`Error al guardar: \${error.message || 'Desconocido'}\`);
    }
  };
`;

content = content.replace(
  /const handleSaveSchedule = \(\) => \{[\s\S]*?setIsConfigOpen\(false\);\n\s*\};/,
  newHandleSaveSchedule.trim()
);

fs.writeFileSync(file, content);
console.log("Updated config select, Las Mercedes hardcode, and handleSaveSchedule");
