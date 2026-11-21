import { useState } from 'react';
import { LovableMark } from '@lovable.dev/cloud-auth-js/react';
import { LogIn, Mail, LoaderCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog,DialogContent,DialogTitle,DialogDescription } from '@/components/ui/dialog';
export function ScannerAccount() {
 const [open,setOpen]=useState(false);
 const [mode,setMode]=useState<'login'|'signup'|'reset'>('login');
 const [message,setMessage]=useState('');
 const [pending,setPending]=useState(false);
 const social = async (provider:'google'|'lovable') => {
  setPending(true);setMessage('');
  try {
   const result=await lovable.auth.signInWithOAuth(provider,{redirect_uri:window.location.origin});
   if(result.error) setMessage('Não foi possível entrar. Tente novamente.');
   else if(!result.redirected) setOpen(false);
  } catch {setMessage('Não foi possível entrar. Tente novamente.');}
  finally {setPending(false);}
 };
 return <>
  <Button variant="outline" className="h-auto min-h-10 whitespace-normal" onClick={()=>setOpen(true)}><LogIn size={16}/>Entrar para guardar histórico</Button>
  <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90dvh] overflow-y-auto max-w-md">
   <DialogTitle>{mode==='signup'?'Criar conta':mode==='reset'?'Recuperar senha':'Seu histórico privado'}</DialogTitle>
   <DialogDescription>Suas leituras ficam vinculadas à conta. Leituras sem conta ficam apenas nesta sessão, sem sincronização.</DialogDescription>
   {mode!=='reset' && <div className="grid gap-2">
    <Button disabled={pending} variant="outline" className="scanner-google" onClick={()=>social('google')}><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09c.95-2.85 3.6-4.96 6.73-4.96z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>Continuar com Google</Button>
    <Button disabled={pending} variant="outline" onClick={()=>social('lovable')}><LovableMark/>Continuar com Lovable</Button>
   </div>}
   <form className="grid gap-3" onSubmit={async e=>{
    e.preventDefault();setPending(true);setMessage('');
    const form=new FormData(e.currentTarget); const email=String(form.get('email')); const password=String(form.get('password')??'');
    try {
     if(mode==='reset') {
      const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/scanner-reset'});
      setMessage(error?'Não foi possível enviar o email. Tente novamente.':'Confira seu email para recuperar a senha.');
     } else if(mode==='signup') {
      const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin}});
      if(error) setMessage('Não foi possível criar a conta. Confira os dados e tente novamente.');
      else if(data.session) setOpen(false);
      else setMessage('Confira seu email e confirme a conta antes de entrar.');
     } else {
      const {error}=await supabase.auth.signInWithPassword({email,password});
      if(error) setMessage('Email ou senha inválidos, ou email ainda não confirmado.'); else setOpen(false);
     }
    } catch {setMessage('Sem conexão. Tente novamente.');} finally {setPending(false);}
   }}>
    <label className="grid gap-1">Email<Input name="email" type="email" autoComplete="email" required/></label>
    {mode!=='reset' && <label className="grid gap-1">Senha<Input name="password" type="password" autoComplete={mode==='signup'?'new-password':'current-password'} minLength={8} required/></label>}
    <Button disabled={pending} type="submit">{pending?<LoaderCircle className="animate-spin"/>:<Mail size={16}/>} {mode==='signup'?'Criar conta':mode==='reset'?'Enviar email':'Entrar com email'}</Button>
   </form>
   <p role="status" className="text-sm text-chart-4">{message}</p>
   <div className="flex flex-wrap gap-2"><Button variant="ghost" onClick={()=>{setMode(mode==='signup'?'login':'signup');setMessage('');}}>{mode==='signup'?'Já tenho conta':'Criar conta'}</Button><Button variant="ghost" onClick={()=>{setMode(mode==='reset'?'login':'reset');setMessage('');}}>{mode==='reset'?'Voltar para entrar':'Esqueci a senha'}</Button></div>
  </DialogContent></Dialog>
 </>;
}
