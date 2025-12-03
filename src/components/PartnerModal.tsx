import React, { useState } from 'react';
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

export function PartnerModal({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submit
    setOpen(false);
    // In a real app, we would send data to backend
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center pb-2">{t('partner.modal.title')}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="team" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="team">{t('partner.type.team')}</TabsTrigger>
            <TabsTrigger value="distributor">{t('partner.type.distributor')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="team" className="mt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('partner.role.label')}</Label>
                <Select required>
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
                <Label>{t('partner.details.label')}</Label>
                <Textarea required placeholder={t('partner.details.placeholder')} className="min-h-[120px] resize-none" />
              </div>
              <Button type="submit" className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium py-6 rounded-xl">
                {t('partner.submit')}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="distributor" className="mt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('partner.region.label')}</Label>
                <Input required placeholder={t('partner.region.placeholder')} />
              </div>
              <div className="space-y-2">
                <Label>{t('partner.details.label')}</Label>
                <Textarea required placeholder={t('partner.details.placeholder')} className="min-h-[120px] resize-none" />
              </div>
              <Button type="submit" className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium py-6 rounded-xl">
                {t('partner.submit')}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}