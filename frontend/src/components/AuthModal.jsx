import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthModal = ({ isOpen, onClose, initialView = 'login' }) => {
  const [view, setView] = useState(initialView); // 'login' or 'register'
  const { login, register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (view === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register(
          formData.name,
          formData.email,
          formData.password,
          formData.password_confirmation
        );
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md p-10 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-white/10 relative animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <span className="material-symbols-rounded text-2xl">close</span>
        </button>

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-rounded text-sky-500 text-4xl">
              {view === 'login' ? 'login' : 'person_add'}
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            {view === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {view === 'login' ? '¡Bienvenido de nuevo, jugador!' : 'Crea tu cuenta en Nexus Arcade'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold flex items-center gap-3">
            <span className="material-symbols-rounded text-xl">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {view === 'register' && (
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-4">Nombre</label>
              <input
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Tu nombre"
                className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-sky-500 dark:focus:border-sky-500 rounded-2xl outline-none text-slate-900 dark:text-white transition-all font-bold placeholder:text-slate-400"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-4">Email</label>
            <input
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jugador@ejemplo.com"
              className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-sky-500 dark:focus:border-sky-500 rounded-2xl outline-none text-slate-900 dark:text-white transition-all font-bold placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-4">Contraseña</label>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-sky-500 dark:focus:border-sky-500 rounded-2xl outline-none text-slate-900 dark:text-white transition-all font-bold placeholder:text-slate-400 pr-14"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 transition-colors"
              >
                <span className="material-symbols-rounded">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {view === 'register' && (
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-4">Confirmar Contraseña</label>
              <div className="relative">
                <input
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-sky-500 dark:focus:border-sky-500 rounded-2xl outline-none text-slate-900 dark:text-white transition-all font-bold placeholder:text-slate-400 pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 transition-colors"
                >
                  <span className="material-symbols-rounded">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full py-5 bg-sky-500 hover:bg-sky-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-sky-500/30 transition-all active:scale-95 disabled:opacity-50 mt-4"
          >
            {loading ? 'Procesando...' : view === 'login' ? 'ENTRAR' : 'REGISTRARME'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
            {view === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button 
              onClick={() => setView(view === 'login' ? 'register' : 'login')}
              className="ml-2 text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              {view === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

