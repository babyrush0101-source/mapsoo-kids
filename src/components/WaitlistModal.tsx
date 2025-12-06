import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { useLanguage } from './language-context';
import { useNavigation } from './navigation-context';

import { supabase } from '../utils/supabase/client';
import { toast } from "sonner@2.0.3";

export function WaitlistModal({ children }: { children: React.ReactNode }) {
  const { t, region } = useLanguage();
  const { currentView } = useNavigation();
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [addMemory, setAddMemory] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Derive product from currentView (e.g. 'product-growth' -> 'growth')
    const product = currentView.startsWith('product-') 
      ? currentView.replace('product-', '') 
      : 'general';

    const payload = {
      email,
      product,
      source: currentView || 'unknown',
      locale: region,
      referrer: document.referrer || '',
      status: 'new',
      add_memory: addMemory // snake_case to match DB column
    };

    console.log("🔵 Waitlist submitting...", payload);

    try {
      const { data, error } = await supabase
        .from('waitlist')
        .insert([payload])
        .select("*");

      if (error) {
        console.error("❌ Supabase waitlist insert error:", error);
        throw error;
      }

      console.log("🟢 Supabase waitlist insert success:", data);

      const successTitle = region === 'CN' ? '加入成功！' : 'You’re in!';
      const successMsg = region === 'CN' 
        ? '我们会第一时间通知你最新进展。' 
        : 'We’ll update you as soon as new features are ready.';

      toast.custom((t) => (
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-cyan-500/50 shadow-2xl shadow-purple-500/10">
           <div className="bg-slate-950 rounded-2xl p-5 flex flex-col gap-1.5 text-center min-w-[280px]">
             <h3 className="text-white font-bold text-base">{successTitle}</h3>
             <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
               {successMsg}
             </p>
           </div>
        </div>
      ), { duration: 2500 });

      setOpen(false);
      setEmail('');
      setAddMemory(false);
    } catch (error: any) {
      // Error is already logged above
      toast.error(region === 'CN' ? '提交失败，请稍后重试' : 'Failed to join waitlist, please try again later');
    } finally {
      setLoading(false);
    }
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
          <div className="grid gap-4">
            <Input 
              placeholder={isCN ? t('waitlist.input.cn') : t('waitlist.input.en')} 
              required 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-lg bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            
            <div className="flex items-center space-x-2 px-1">
              <Checkbox 
                id="memory" 
                checked={addMemory}
                onCheckedChange={(checked) => setAddMemory(checked as boolean)}
                className="border-slate-400 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
              />
              <Label 
                htmlFor="memory" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                {isCN ? '同时加入 Baseul Memory 等待列表' : 'Also join Baseul Memory waitlist'}
              </Label>
            </div>
          </div>
          
          <Button type="submit" disabled={loading} className="w-full h-12 text-lg font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-cyan-500/25 border-0">
            {loading ? (isCN ? '提交中...' : 'Submitting...') : t('waitlist.submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
