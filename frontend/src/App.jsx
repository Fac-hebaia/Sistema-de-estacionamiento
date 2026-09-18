import React, { useState, useEffect } from 'react';
import { 
  Car, PlusCircle, LogOut, Clock, RefreshCw, AlertCircle, 
  Search, ParkingSquare, DollarSign, Activity, CheckCircle2 
} from 'lucide-react';

const API_URL = 'https://sistema-de-estacionamiento.onrender.com';
const TARIFA_POR_HORA = 1500; // Tarifa configurable por hora ($)
const CAPACIDAD_TOTAL = 30;   // Capacidad del estacionamiento

export default function App() {
  const [autos, setAutos] = useState([]);
  const [modeloAuto, setModeloAuto] = useState('');
  const [patente, setPatente] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // 1. Cargar vehículos activos desde el backend
  const cargarAutosActivos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/usuarios`);
      if (res.ok) {
        const data = await res.json();
        setAutos(Array.isArray(data) ? data : []);
      } else if (res.status === 404) {
        setAutos([]);
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar con el servidor Express.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAutosActivos();
    // Actualizar vista cada 30 segundos para refrescar contadores
    const timer = setInterval(() => cargarAutosActivos(), 30000);
    return () => clearInterval(timer);
  }, []);

  // 2. Registrar ingreso
  const handleIngresar = async (e) => {
    e.preventDefault();
    if (!modeloAuto || !patente) return;

    try {
      const res = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          modeloAuto, 
          patente: patente.toUpperCase().trim() 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: `¡Vehículo ${patente.toUpperCase()} registrado correctamente!` });
        setModeloAuto('');
        setPatente('');
        cargarAutosActivos();
      } else {
        setMensaje({ tipo: 'error', texto: typeof data === 'string' ? data : data.error || 'Error al guardar' });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error de red al intentar registrar la entrada.' });
    }
  };

  // 3. Despachar / Dar Salida
  const handleDespachar = async (usuarioId, patenteAuto) => {
    try {
      const res = await fetch(`${API_URL}/usuarios/${usuarioId}`, {
        method: 'PATCH',
      });

      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: `Vehículo [${patenteAuto}] despachado e historial actualizado.` });
        cargarAutosActivos();
      } else {
        const data = await res.json();
        setMensaje({ tipo: 'error', texto: data.error || data });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al procesar la salida en el servidor.' });
    }
  };

  // Helper: Calcular tiempo transcurrido y cobro estimado
  const calcularEstadia = (fechaIngreso) => {
    if (!fechaIngreso) return { tiempo: 'Justo ahora', costo: TARIFA_POR_HORA };
    const inicio = new Date(fechaIngreso);
    const ahora = new Date();
    const diffMs = Math.max(0, ahora - inicio);
    const minutosTotales = Math.floor(diffMs / 60000);
    const horas = Math.floor(minutosTotales / 60);
    const mins = minutosTotales % 60;

    // Cálculo proporcional (mínimo 1 hora)
    const horasACobrar = Math.max(1, Math.ceil(minutosTotales / 60));
    const costo = horasACobrar * TARIFA_POR_HORA;

    const tiempoStr = horas > 0 ? `${horas}h ${mins}m` : `${mins} min`;
    return { tiempo: tiempoStr, costo };
  };

  // Filtrado de la lista por búsqueda
  const autosFiltrados = autos.filter(a => 
    a.patente.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.modelo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const lugaresLibres = Math.max(0, CAPACIDAD_TOTAL - autos.length);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* Navbar Superior */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <ParkingSquare className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                ParkControl <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">PRO</span>
              </h1>
              <p className="text-xs text-slate-400">Panel de Gestión e Historial de Estacionamiento</p>
            </div>
          </div>

          <button 
            onClick={cargarAutosActivos}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700/80 rounded-xl transition flex items-center gap-2 text-xs font-semibold shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} /> 
            {loading ? 'Sincronizando...' : 'Actualizar'}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Tarjetas de Métricas (Dashboard Stats) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ocupación Activa</p>
                <h3 className="text-3xl font-bold text-white mt-1">{autos.length} <span className="text-sm font-normal text-slate-500">/ {CAPACIDAD_TOTAL}</span></h3>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                <Car className="w-6 h-6" />
              </div>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (autos.length / CAPACIDAD_TOTAL) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Lugares Libres</p>
                <h3 className="text-3xl font-bold text-emerald-400 mt-1">{lugaresLibres}</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Disponibilidad en planta
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tarifa Base</p>
                <h3 className="text-3xl font-bold text-amber-400 mt-1">${TARIFA_POR_HORA.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">Por hora o fracción</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Estado Base Datos</p>
                <h3 className="text-lg font-bold text-emerald-400 mt-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span> Conectado
                </h3>
              </div>
              <div className="p-3 bg-slate-800 text-slate-300 rounded-xl">
                <ParkingSquare className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">PostgreSQL via Prisma API</p>
          </div>

        </div>

        {/* Notificaciones / Feedback Toast */}
        {mensaje && (
          <div className={`p-4 rounded-xl flex items-center justify-between border shadow-lg transition-all ${
            mensaje.tipo === 'exito' 
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800/80' 
              : 'bg-rose-950/90 text-rose-200 border-rose-800/80'
          }`}>
            <div className="flex items-center gap-3">
              {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
              <p className="text-sm font-semibold">{mensaje.texto}</p>
            </div>
            <button onClick={() => setMensaje(null)} className="text-xs bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-md text-slate-300">
              Entendido
            </button>
          </div>
        )}

        {/* Sección Principal: Formulario + Grilla de Vehículos */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Formulario de Registro (Columna Izquierda) */}
          <section className="lg:col-span-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5 sticky top-24">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" /> Registrar Ingreso
              </h2>
              <p className="text-xs text-slate-400 mt-1">Ingresa el vehículo al sistema para iniciar el conteo.</p>
            </div>

            <form onSubmit={handleIngresar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                  Patente / Dominio
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="ej. AB123CD"
                    value={patente}
                    onChange={(e) => setPatente(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-base text-white font-mono uppercase tracking-widest placeholder:normal-case placeholder:font-sans placeholder:tracking-normal placeholder-slate-600 outline-none transition"
                    maxLength={10}
                    required
                  />
                  <span className="absolute right-3 top-3 text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                    CHAPA
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                  Modelo del Vehículo
                </label>
                <input 
                  type="text" 
                  placeholder="ej. Volkswagen Golf / Ford Focus"
                  value={modeloAuto}
                  onChange={(e) => setModeloAuto(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 text-sm mt-2"
              >
                <PlusCircle className="w-5 h-5" /> Confirmar Ingreso
              </button>
            </form>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1">
              <p className="flex justify-between"><span>Cobro automático:</span> <strong className="text-slate-200">Por hora</strong></p>
              <p className="flex justify-between"><span>Ticket digital:</span> <strong className="text-emerald-400">Autogenerado</strong></p>
            </div>
          </section>

          {/* Grilla / Panel de Vehículos Estacionados (Columna Derecha) */}
          <section className="lg:col-span-8 space-y-5">
            
            {/* Barra de Búsqueda y Título */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Vehículos en Playa ({autos.length})
                </h2>
                <p className="text-xs text-slate-400">Listado activo en tiempo real</p>
              </div>

              <div className="relative sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input 
                  type="text" 
                  placeholder="Buscar patente o modelo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:border-emerald-500 outline-none transition"
                />
              </div>
            </div>

            {/* Listado de Tarjetas */}
            {loading && autos.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 p-12 rounded-2xl text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-sm text-slate-400">Cargando estacionamiento desde la API...</p>
              </div>
            ) : autosFiltrados.length === 0 ? (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 p-12 rounded-2xl text-center space-y-2">
                <ParkingSquare className="w-12 h-12 text-slate-700 mx-auto" />
                <p className="text-base font-semibold text-slate-300">
                  {busqueda ? 'No se encontraron coincidencias' : 'No hay vehículos estacionados'}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {busqueda ? 'Intenta buscar con otra palabra clave.' : 'Utiliza el formulario de la izquierda para registrar un nuevo ingreso.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {autosFiltrados.map((item) => {
                  const fechaReg = item.usuario?.fechaRegistro;
                  const { tiempo, costo } = calcularEstadia(fechaReg);

                  return (
                    <div 
                      key={item.idAuto || item.usuarioId} 
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl shadow-md transition hover:shadow-xl flex flex-col justify-between space-y-4 group"
                    >
                      {/* Cabecera con Chapa Patente */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1">
                          {/* Chapa Estilo Mercosur/Latam */}
                          <div className="inline-block bg-slate-950 border-2 border-slate-300 rounded-md px-3 py-0.5 text-center shadow-inner">
                            <span className="block text-[9px] tracking-widest text-blue-400 font-extrabold uppercase leading-none">ARGENTINA</span>
                            <span className="font-mono text-lg font-black text-white tracking-widest leading-tight">
                              {item.patente}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-slate-200 pt-1">{item.modelo}</h3>
                        </div>

                        <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[11px] font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Activo
                        </span>
                      </div>

                      {/* Detalles de Estadía y Costo */}
                      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400" /> Tiempo
                          </span>
                          <span className="font-semibold text-slate-200">{tiempo}</span>
                        </div>
                        <div className="space-y-0.5 text-right">
                          <span className="text-slate-500 flex items-center justify-end gap-1 text-[11px]">
                            <DollarSign className="w-3 h-3 text-amber-400" /> Acumulado
                          </span>
                          <span className="font-bold text-amber-400">${costo.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Pie con Hora de Ingreso y Botón de Salida */}
                      <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                        <span className="text-[11px] text-slate-500">
                          Ingreso: {fechaReg ? new Date(fechaReg).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>

                        <button 
                          onClick={() => handleDespachar(item.usuarioId, item.patente)}
                          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/50 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 active:scale-95"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Cobrar / Salida
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </section>

        </div>

      </main>
    </div>
  );
}