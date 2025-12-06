import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useLanguage } from './language-context';
import { useAuth } from './auth-context';
import { supabase } from '../utils/supabase/client';
import { toast } from "sonner@2.0.3";
import { Check } from 'lucide-react';

export function PartnerModal({ children }: { children: React.ReactNode }) {
  const { t, region: langRegion } = useLanguage();
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form states
  const [role, setRole] = useState('');
  const [details, setDetails] = useState('');
  const [regionInput, setRegionInput] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (open) {
      if (!isSuccess && currentUser?.email) {
        setEmail(currentUser.email);
      }
    } else {
      // Reset state on close
      setIsSuccess(false);
      setRole('');
      setDetails('');
      setRegionInput('');
      if (!currentUser) setEmail('');
    }
  }, [open, currentUser, isSuccess]);

  const handleSubmit = async (e: React.FormEvent, type: 'team' | 'distributor') => {
    e.preventDefault();
    setLoading(true);

    try {
      const isTeam = type === 'team';
      const submissionType = isTeam ? 'Partner' : 'Distributor';
      const submissionContact = currentUser?.email || email;
      const submissionDescription = details;
      
      const { error } = await supabase
        .from("partner_applications")
        .insert([
          {
            type: submissionType,
            role: isTeam ? role : null,
            region: !isTeam ? regionInput : null,
            description: submissionDescription,
            contact: submissionContact,
            locale: langRegion,
            source: "partner_modal",
            status: "pending",
          }
        ]);

      if (error) throw error;

      // Show success toast
      const successTitle = langRegion === 'CN' ? '加入成功！' : 'You’re in!';
      const successMsg = langRegion === 'CN' 
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

      setIsSuccess(true);
      
    } catch (error) {
      console.error('Partner submission error:', error);
      toast.error(langRegion === 'CN' ? '提交失败，请重试' : 'Submission failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  const SuccessView = () => {
    const isCN = langRegion === 'CN';
    return (
      <div className="py-8 px-4 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </div>
        
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          {isCN ? '提交成功！' : 'Submission Successful!'}
        </h3>
        
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-[280px] leading-relaxed">
          {isCN 
            ? '我们已经收到你的合作申请，会在 3 个工作日内联系你。'
            : 'We’ve received your partnership application and will get back to you within 3 business days.'}
        </p>
        
        <Button 
          onClick={() => setOpen(false)}
          className="w-full max-w-[200px] h-12 text-base font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-xl"
        >
          {isCN ? '确定' : 'OK'}
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800">
        {isSuccess ? (
          <SuccessView />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center pb-2">{t('partner.modal.title')}</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="team" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="team">{t('partner.type.team')}</TabsTrigger>
                <TabsTrigger value="distributor">{t('partner.type.distributor')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="team" className="mt-0">
                <form onSubmit={(e) => handleSubmit(e, 'team')} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('partner.role.label')}</Label>
                    <Select required onValueChange={setRole} value={role}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('partner.role.label')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dev">{t('partner.role.dev')}</SelectItem>
                        <SelectItem value="design">{t('partner.role.design')}</SelectItem>
                        <SelectItem value="pm">{t('partner.role.pm')}</SelectItem>
                        <SelectItem value="sales">{t('partner.role.sales')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      required 
                      type="email" 
                      placeholder="your@email.com" 
                      value={email}
                      disabled={!!currentUser}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('partner.details.label')}</Label>
                    <Textarea 
                      required 
                      placeholder={t('partner.details.placeholder')} 
                      className="min-h-[120px] resize-none"
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium py-6 rounded-xl">
                    {loading ? 'Submitting...' : t('partner.submit')}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="distributor" className="mt-0">
                <form onSubmit={(e) => handleSubmit(e, 'distributor')} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('partner.region.label')}</Label>
                    <Input 
                      required 
                      placeholder={t('partner.region.placeholder')} 
                      value={regionInput}
                      onChange={(e) => setRegionInput(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      required 
                      type="email" 
                      placeholder="your@email.com" 
                      value={email}
                      disabled={!!currentUser}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('partner.details.label')}</Label>
                    <Textarea 
                      required 
                      placeholder={t('partner.details.placeholder')} 
                      className="min-h-[120px] resize-none"
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium py-6 rounded-xl">
                    {loading ? 'Submitting...' : t('partner.submit')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
