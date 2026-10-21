import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Sprout, Mail, LockKeyhole, UserRound, ArrowRight } from 'lucide-react';

const API = (import.meta.env.API_URL).replace(/\/$/, '');
export function AuthPage({ mode = 'login' }) {
  const isSignup = mode === 'signup';
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  const navigate=useNavigate(); const location=useLocation();
  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const response=await fetch(`${API}/api/auth/${isSignup?'signup':'login'}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,password})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(data.error || 'Could not authenticate.');
      localStorage.setItem('agrisense_token',data.token); localStorage.setItem('agrisense_user',JSON.stringify(data.user));
      navigate(location.state?.from || '/dashboard',{replace:true}); window.location.reload();
    } catch(err) { setError(err.message || 'Cannot reach backend. Check that Flask is running.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl p-7 sm:p-9">
      <div className="flex items-center gap-3 mb-8"><div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center"><Sprout/></div><div><h1 className="text-xl font-black text-slate-900">AgriSense</h1><p className="text-sm text-slate-500">Your fields, your data, your insights</p></div></div>
      <h2 className="text-2xl font-bold text-slate-900">{isSignup?'Create your account':'Welcome back'}</h2><p className="text-sm text-slate-500 mt-2 mb-6">{isSignup?'Save your fields and track every analysis over time.':'Sign in to access your saved fields and prediction history.'}</p>
      <form onSubmit={submit} className="space-y-4">
        {isSignup && <label className="block text-sm font-semibold text-slate-700">Full name<div className="mt-1 relative"><UserRound className="absolute left-3 top-3.5 w-4 h-4 text-slate-400"/><input required value={name} onChange={e=>setName(e.target.value)} className="w-full border rounded-xl py-3 pl-10 pr-3 outline-none focus:ring-2 focus:ring-emerald-600" placeholder="Your name"/></div></label>}
        <label className="block text-sm font-semibold text-slate-700">Email<div className="mt-1 relative"><Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400"/><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full border rounded-xl py-3 pl-10 pr-3 outline-none focus:ring-2 focus:ring-emerald-600" placeholder="you@example.com"/></div></label>
        <label className="block text-sm font-semibold text-slate-700">Password<div className="mt-1 relative"><LockKeyhole className="absolute left-3 top-3.5 w-4 h-4 text-slate-400"/><input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded-xl py-3 pl-10 pr-3 outline-none focus:ring-2 focus:ring-emerald-600" placeholder="At least 8 characters"/></div></label>
        {error && <p role="alert" className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold py-3 flex items-center justify-center gap-2">{busy?'Please wait…':isSignup?'Create account':'Sign in'} {!busy&&<ArrowRight className="w-4 h-4"/>}</button>
      </form>
      <p className="text-sm text-center text-slate-600 mt-6">{isSignup?'Already have an account?':'New to AgriSense?'} <Link className="text-emerald-700 font-bold" to={isSignup?'/login':'/signup'}>{isSignup?'Sign in':'Create account'}</Link></p>
      <p className="text-xs text-slate-400 text-center mt-5">Your field records and analysis history are saved to your account.</p>
    </div>
  </main>;
}
