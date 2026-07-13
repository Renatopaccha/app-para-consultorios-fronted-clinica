import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/pages/dashboard/WorkScheduleView.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add States
const newStates = `
  // Patient form states
  const [patientFirstName, setPatientFirstName] = useState("");
  const [patientLastName, setPatientLastName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientCedula, setPatientCedula] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hybrid Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [existingPatientId, setExistingPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);

  // Search function
  const handleSearchPatient = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await apiClient.get(\`/api/doctors/patients/search?q=\${encodeURIComponent(q)}\`);
      setSearchResults(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };
`;

content = content.replace(
  /\/\/ Patient form states[\s\S]*?const \[isSubmitting, setIsSubmitting\] = useState\(false\);/,
  newStates.trim()
);

// 2. Modify UI
const newForm = `
                   <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                     <div className="flex items-center gap-2 mb-1">
                       <UserPlus className="w-4 h-4 text-sky-500" />
                       <span className="text-sm font-semibold text-slate-700">Datos del Paciente</span>
                     </div>
                     
                     {!showNewPatientForm && !existingPatientId && (
                       <div className="relative z-10">
                         <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                             type="text" 
                             value={searchQuery}
                             onChange={(e) => handleSearchPatient(e.target.value)}
                             placeholder="Buscar paciente por nombre o correo..." 
                             className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white" 
                           />
                           {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500 animate-spin" />}
                         </div>
                         
                         {searchResults.length > 0 && (
                           <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-20">
                             {searchResults.map(p => (
                               <div 
                                 key={p.id} 
                                 onClick={() => {
                                   setExistingPatientId(p.id);
                                   setSelectedPatientName(p.firstName + ' ' + p.lastName);
                                   setSearchResults([]);
                                   setSearchQuery('');
                                 }}
                                 className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex flex-col"
                               >
                                 <span className="text-sm font-medium text-slate-700">{p.firstName} {p.lastName}</span>
                                 <span className="text-xs text-slate-500">{p.email}</span>
                               </div>
                             ))}
                           </div>
                         )}
                         
                         <button 
                           onClick={() => setShowNewPatientForm(true)}
                           className="mt-3 text-[13px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1.5 transition-colors"
                         >
                           <Plus className="w-3.5 h-3.5" /> Agregar Nuevo Paciente
                         </button>
                       </div>
                     )}

                     {existingPatientId && (
                       <div className="flex items-center justify-between p-3 bg-white border border-sky-100 rounded-lg">
                         <div className="flex flex-col">
                           <span className="text-xs text-slate-500 font-medium">Paciente Seleccionado</span>
                           <span className="text-sm font-semibold text-slate-800">{selectedPatientName}</span>
                         </div>
                         <button 
                           onClick={() => {
                             setExistingPatientId(null);
                             setSelectedPatientName('');
                           }}
                           className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                         >
                           Cambiar
                         </button>
                       </div>
                     )}

                     {showNewPatientForm && (
                       <div className="space-y-3">
                         <div className="grid grid-cols-2 gap-3">
                           <input type="text" value={patientFirstName} onChange={(e) => setPatientFirstName(e.target.value)} placeholder="Nombre *" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white transition-all" />
                           <input type="text" value={patientLastName} onChange={(e) => setPatientLastName(e.target.value)} placeholder="Apellido *" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white transition-all" />
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           <input type="email" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} placeholder="Correo Electrónico *" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white transition-all" />
                           <input type="text" value={patientCedula} onChange={(e) => setPatientCedula(e.target.value)} placeholder="Cédula (Opcional)" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white transition-all" />
                         </div>
                         <button 
                           onClick={() => setShowNewPatientForm(false)}
                           className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                         >
                           Cancelar (Buscar Existente)
                         </button>
                       </div>
                     )}
                   </div>
`;

content = content.replace(
  /<div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">[\s\S]*?<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">[\s\S]*?<\/div>[\s\S]*?<\/div>/,
  newForm.trim()
);


// 3. Update handleCreateEvent logic
content = content.replace(
  /if \(\!patientFirstName\.trim\(\) \|\| \!patientLastName\.trim\(\) \|\| \!patientEmail\.trim\(\)\) \{[\s\S]*?alert\('Por favor completa el nombre, apellido y correo del paciente\.'\);[\s\S]*?setIsSubmitting\(false\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?\/\/ Crear\/Buscar la cuenta fantasma[\s\S]*?const guestResponse = await apiClient\.post\('\/api\/doctors\/patients\/guest', \{[\s\S]*?firstName: patientFirstName,[\s\S]*?lastName: patientLastName,[\s\S]*?email: patientEmail,[\s\S]*?cedula: patientCedula[\s\S]*?\}\);[\s\S]*?realPatientId = guestResponse\.data\.patientId;/,
  `
        if (existingPatientId) {
          realPatientId = existingPatientId;
        } else if (showNewPatientForm) {
          if (!patientFirstName.trim() || !patientLastName.trim() || !patientEmail.trim()) {
            alert('Por favor completa el nombre, apellido y correo del paciente.');
            setIsSubmitting(false);
            return;
          }
          // Crear/Buscar la cuenta fantasma
          const guestResponse = await apiClient.post('/api/doctors/patients/guest', {
            firstName: patientFirstName,
            lastName: patientLastName,
            email: patientEmail,
            cedula: patientCedula
          });
          realPatientId = guestResponse.data.patientId;
        } else {
          alert('Por favor selecciona un paciente o crea uno nuevo.');
          setIsSubmitting(false);
          return;
        }
  `.trim()
);

// 4. Update Reset form block
content = content.replace(
  /setPatientFirstName\(""\);\s*setPatientLastName\(""\);\s*setPatientEmail\(""\);\s*setPatientCedula\(""\);/,
  `setPatientFirstName("");
      setPatientLastName("");
      setPatientEmail("");
      setPatientCedula("");
      setExistingPatientId(null);
      setSelectedPatientName("");
      setShowNewPatientForm(false);
      setSearchQuery("");
      setSearchResults([]);`
);

fs.writeFileSync(file, content);
console.log("Updated WorkScheduleView.tsx with Hybrid Component");
