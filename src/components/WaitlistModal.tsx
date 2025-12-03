import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useLanguage } from './language-context';

export function WaitlistModal({ children }: { children: React.ReactNode }) {
  const { t, region } = useLanguage();
  const [open, setOpen] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    // Mock submit
    // In real app, connect to Supabase or API
  };

  const isCN = region === 'CN';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center pb-2 text-slate-900 dark:text-white">
            {t('waitlist.title')}
          </DialogTitle>
          <DialogDescription className="text-center text-slate-500 dark:text-slate-400 pb-2">
            {t('waitlist.desc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Input 
              placeholder={isCN ? t('waitlist.input.cn') : t('waitlist.input.en')} 
              required 
              className="h-12 text-lg bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <Button type="submit" className="w-full h-12 text-lg font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-cyan-500/25 border-0">
            {t('waitlist.submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}