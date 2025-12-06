import React, { useState, useEffect } from 'react';
import { useLanguage } from './language-context';
import { useAuth } from './auth-context';
import { supabase } from '../utils/supabase/client';
import { toast } from "sonner@2.0.3";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { motion } from "motion/react";
import { MapPin, Check } from 'lucide-react';
import { useNavigation } from './navigation-context';

// China provinces (excluding direct municipalities which are listed separately)
const chinaProvinces = [
  '黑龙江', '吉林', '辽宁', '内蒙古', '河北', '山西', '陕西', '甘肃', '宁夏', '青海', '新疆', '西藏',
  '四川', '云南', '贵州', '湖南', '湖北', '河南', '山东', '江苏', '安徽', '浙江', '江西', '福建',
  '广东', '广西', '海南', '台湾', '香港', '澳门'
];

const directMunicipalities = ['北京', '上海', '重庆', '深圳'];

const globalRegions = [
  { id: 'north-america', name: 'North America', color: 'from-blue-500 to-cyan-500' },
  { id: 'south-america', name: 'South America', color: 'from-green-500 to-emerald-500' },
  { id: 'europe', name: 'Europe', color: 'from-purple-500 to-pink-500' },
  { id: 'middle-east', name: 'Middle East', color: 'from-orange-500 to-red-500' },
  { id: 'southeast-asia', name: 'Southeast Asia', color: 'from-yellow-500 to-amber-500' },
  { id: 'russia', name: 'Russia', color: 'from-indigo-500 to-blue-500' }
];

export function PartnerPage() {
  const { t, region } = useLanguage();
  const { currentUser } = useAuth();
  const { navigate } = useNavigation();
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  
  // Form states
  const [role, setRole] = useState('');
  const [details, setDetails] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (currentUser?.email) {
      setContact(currentUser.email);
    }
  }, [currentUser]);

  const isChinese = region === 'CN';
  
  const handleSubmit = async (e: React.FormEvent, type: 'team' | 'distributor') => {
    e.preventDefault();
    setLoading(true);

    try {
      const isTeam = type === 'team';
      const submissionType = isTeam ? 'Partner' : 'Distributor';
      const submissionContact = currentUser?.email || contact;
      const submissionDescription = details;
      
      const { error } = await supabase
        .from("partner_applications")
        .insert([
          {
            type: submissionType,
            role: isTeam ? role : null,
            region: !isTeam ? selectedRegion : null,
            description: submissionDescription,
            contact: submissionContact,
            locale: region,
            source: "partner_page",
            status: "pending",
          }
        ]);

      if (error) throw error;

      // Show success toast
      const successTitle = isChinese ? '加入成功！' : 'You’re in!';
      const successMsg = isChinese 
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
      
      // Reset form
      if (type === 'team') setRole('');
      if (type === 'distributor') setSelectedRegion('');
      setDetails('');
      if (!currentUser) setContact('');

    } catch (error) {
      console.error('Partner submission error:', error);
      toast.error(isChinese ? '提交失败，请重试' : 'Submission failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  const SuccessView = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-8 shadow-2xl shadow-green-500/30">
        <Check className="w-12 h-12 text-white" strokeWidth={3} />
      </div>
      
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
        {isChinese ? '提交成功！' : 'Submission Successful!'}
      </h2>
      
      <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-md leading-relaxed">
        {isChinese 
          ? '我们已经收到你的合作申请，会在 3 个工作日内联系你。'
          : 'We’ve received your partnership application and will get back to you within 3 business days.'}
      </p>
      
      <Button 
        onClick={() => navigate('home')}
        className="min-w-[200px] h-14 text-lg font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-2xl shadow-xl transition-all hover:scale-105"
      >
        {isChinese ? '返回首页' : 'Return Home'}
      </Button>
    </motion.div>
  );

  const inputClasses = "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500";
  const labelClasses = "text-base text-slate-900 dark:text-slate-200";

  const detailsPlaceholder = isChinese 
    ? "是什么让你对我们感兴趣？请介绍一下你的优势..."
    : "What interests you about us? Please introduce your advantages...";

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto">
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-center mb-12"
         >
           <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
             {t('partner.page.title')}
           </h1>
           <p className="text-xl text-slate-600 dark:text-slate-400">
             {t('partner.page.desc')}
           </p>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-xl border border-slate-200 dark:border-slate-800 min-h-[500px] flex flex-col justify-center"
         >
           {isSuccess ? <SuccessView /> : (
             isChinese ? (
              // Chinese version: Show both tabs
              <Tabs defaultValue="team" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <TabsTrigger value="team" className="rounded-lg text-lg h-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-slate-600 dark:text-slate-400">{t('partner.tab.team')}</TabsTrigger>
                  <TabsTrigger value="distributor" className="rounded-lg text-lg h-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-slate-600 dark:text-slate-400">{t('partner.tab.distributor')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="team" className="mt-0">
                  <form onSubmit={(e) => handleSubmit(e, 'team')} className="space-y-6">
                    <div className="space-y-2">
                      <Label className={labelClasses}>{t('partner.form.role')}</Label>
                      <Select required value={role} onValueChange={setRole}>
                        <SelectTrigger className={`h-12 ${inputClasses}`}>
                          <SelectValue placeholder={t('partner.form.role')} />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                          <SelectItem value="dev" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">{t('partner.role.dev')}</SelectItem>
                          <SelectItem value="design" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">{t('partner.role.design')}</SelectItem>
                          <SelectItem value="brand" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">{t('partner.role.brand')}</SelectItem>
                          <SelectItem value="other" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">{t('partner.role.other')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className={labelClasses}>{t('partner.form.exp')}</Label>
                      <Textarea 
                        required 
                        placeholder={detailsPlaceholder} 
                        className={`min-h-[150px] resize-none text-base p-4 ${inputClasses}`}
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className={labelClasses}>{t('partner.form.contact')}</Label>
                      <Input 
                        required 
                        placeholder="Email / Phone" 
                        className={`h-12 text-base ${inputClasses}`}
                        value={contact}
                        disabled={!!currentUser}
                        onChange={(e) => setContact(e.target.value)}
                      />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-lg py-6 rounded-xl shadow-lg shadow-blue-500/20 border-0">
                      {loading ? '提交中...' : t('partner.form.submit')}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="distributor" className="mt-0">
                  <form onSubmit={(e) => handleSubmit(e, 'distributor')} className="space-y-6">
                    {/* China Map Region Selector */}
                    <div className="space-y-2">
                      <Label className={labelClasses}>{t('partner.form.region')}</Label>
                      
                      {/* Direct Municipalities Quick Select */}
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {directMunicipalities.map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => setSelectedRegion(city)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border-2 ${
                              selectedRegion === city
                                ? 'bg-purple-500 border-purple-500 text-white shadow-lg'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                            }`}
                          >
                            {city}
                          </button>
                        ))}
                      </div>

                      {/* Province Grid */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                          {chinaProvinces.map((province) => (
                            <button
                              key={province}
                              type="button"
                              onClick={() => setSelectedRegion(province)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                selectedRegion === province
                                  ? 'bg-purple-500 text-white shadow-md'
                                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-slate-600'
                              }`}
                            >
                              {province}
                            </button>
                          ))}
                        </div>
                      </div>

                      {selectedRegion && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-medium">已选择: {selectedRegion}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className={labelClasses}>{t('partner.form.exp')}</Label>
                      <Textarea 
                        required 
                        placeholder={detailsPlaceholder} 
                        className={`min-h-[150px] resize-none text-base p-4 ${inputClasses}`}
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className={labelClasses}>{t('partner.form.contact')}</Label>
                      <Input 
                        required 
                        placeholder="Email / Phone" 
                        className={`h-12 text-base ${inputClasses}`}
                        value={contact}
                        disabled={!!currentUser}
                        onChange={(e) => setContact(e.target.value)}
                      />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold text-lg py-6 rounded-xl shadow-lg shadow-purple-500/20 border-0">
                      {loading ? '提交中...' : t('partner.form.submit')}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            ) : (
              // English/Other languages: Only show distributor form
              <form onSubmit={(e) => handleSubmit(e, 'distributor')} className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {t('partner.tab.distributor')}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Partner with us to distribute Baseul products in your region.
                  </p>
                </div>

                {/* Global Region Selector */}
                <div className="space-y-2">
                  <Label className={labelClasses}>{t('partner.form.region')}</Label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {globalRegions.map((region) => (
                      <button
                        key={region.id}
                        type="button"
                        onClick={() => setSelectedRegion(region.name)}
                        className={`group relative px-6 py-4 rounded-xl text-left font-bold transition-all border-2 overflow-hidden ${
                          selectedRegion === region.name
                            ? 'border-transparent shadow-xl scale-[1.02]'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${region.color} transition-opacity ${
                          selectedRegion === region.name ? 'opacity-100' : 'opacity-0 group-hover:opacity-10'
                        }`} />
                        
                        <div className="relative flex items-center justify-between">
                          <div>
                            <div className={`flex items-center gap-2 ${
                              selectedRegion === region.name ? 'text-white' : 'text-slate-900 dark:text-white'
                            }`}>
                              <MapPin className="w-5 h-5" />
                              <span>{region.name}</span>
                            </div>
                          </div>
                          {selectedRegion === region.name && (
                            <Check className="w-5 h-5 text-white" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedRegion && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Selected: {selectedRegion}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className={labelClasses}>{t('partner.form.exp')}</Label>
                  <Textarea 
                    required 
                    placeholder={detailsPlaceholder} 
                    className={`min-h-[150px] resize-none text-base p-4 ${inputClasses}`}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses}>{t('partner.form.contact')}</Label>
                  <Input 
                    required 
                    placeholder="Email / Phone" 
                    className={`h-12 text-base ${inputClasses}`}
                    value={contact}
                    disabled={!!currentUser}
                    onChange={(e) => setContact(e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold text-lg py-6 rounded-xl shadow-lg shadow-purple-500/20 border-0">
                  {loading ? 'Submitting...' : t('partner.form.submit')}
                </Button>
              </form>
            )
           )}
         </motion.div>
      </div>
    </div>
  )
}
