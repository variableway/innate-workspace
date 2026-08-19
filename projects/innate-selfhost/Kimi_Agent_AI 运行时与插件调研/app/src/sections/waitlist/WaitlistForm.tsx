import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

// TODO: Replace with your Feishu multi-dimensional table webhook
// 1. Create a Feishu multi-dimensional table
// 2. Add a "Form" field to collect responses
// 3. Get the webhook URL from the table settings
// 4. Replace FEISHU_WEBHOOK_URL with your actual URL
const FEISHU_WEBHOOK_URL = 'https://YOUR_FEISHU_WEBHOOK_URL';

interface FormData {
  fullName: string;
  email: string;
  useCase: string;
  companyRole: string;
  llmProviders: string[];
}

interface FormErrors {
  fullName?: string;
  email?: string;
  useCase?: string;
}

const useCases = [
  'Personal AI Assistant',
  'Developer Tool',
  'Enterprise Automation',
  'Research & Analytics',
  'Education',
  'Other',
];

const llmProviders = [
  { id: 'claude', label: 'Claude (Anthropic)' },
  { id: 'gpt', label: 'GPT (OpenAI)' },
  { id: 'gemini', label: 'Gemini (Google)' },
  { id: 'ollama', label: 'Ollama (Local)' },
  { id: 'other', label: 'Other' },
];

export default function WaitlistForm() {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    useCase: '',
    companyRole: '',
    llmProviders: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name is required (min 2 characters)';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = 'Valid email address is required';
    }

    if (!formData.useCase) {
      newErrors.useCase = 'Please select a use case';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    // Mock Feishu webhook integration
    console.log('Submitting to Feishu:', {
      ...formData,
      submittedAt: new Date().toISOString(),
    });
    console.log('Webhook URL:', FEISHU_WEBHOOK_URL);

    // In production, replace with actual Feishu webhook:
    // await fetch(FEISHU_WEBHOOK_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     ...formData,
    //     submittedAt: new Date().toISOString(),
    //   }),
    // });

    // Mock success
    await new Promise((r) => setTimeout(r, 1000));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleLLMProviderToggle = (providerId: string) => {
    setFormData((prev) => ({
      ...prev,
      llmProviders: prev.llmProviders.includes(providerId)
        ? prev.llmProviders.filter((p) => p !== providerId)
        : [...prev.llmProviders, providerId],
    }));
  };

  if (isSubmitted) {
    return (
      <motion.div
        className="w-full max-w-[640px] mx-auto py-8 px-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      >
        <div
          className="rounded-[12px] p-10 text-center border border-[#10B981]/30"
          style={{ background: 'var(--bg-surface, #0C0B14)' }}
        >
          <motion.div
            className="w-16 h-16 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <Check className="size-8 text-[#10B981]" />
          </motion.div>
          <h3 className="font-['Space_Grotesk'] font-semibold text-[clamp(1.5rem,3vw,2rem)] tracking-[-0.02em] text-[#E0DDF0] mb-2">
            You're on the list!
          </h3>
          <p className="font-['Inter'] text-[1rem] text-[#8A85A0]">
            We'll reach out soon.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <section className="py-8 px-6">
      <div className="w-full max-w-[640px] mx-auto">
        {/* Gradient border card */}
        <motion.div
          className="rounded-[12px] p-[1px]"
          style={{ background: 'linear-gradient(90deg, #8B5CF6 0%, #6366F1 100%)' }}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <div
            className="rounded-[12px] p-8 sm:p-10"
            style={{ background: 'var(--bg-surface, #0C0B14)' }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              >
                <label className="block font-['Inter'] font-medium text-[0.875rem] text-[#E0DDF0] mb-2">
                  Full Name <span className="text-[#EF4444]">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  onBlur={() => handleBlur('fullName')}
                  className="h-11 w-full rounded-lg border border-[#1A1830] bg-[#0E0D18] px-4 font-['Inter'] text-[1rem] text-[#E0DDF0] placeholder:text-[#5A5570] focus-visible:border-[#8B5CF6] focus-visible:ring-[#8B5CF6]/20 transition-all duration-300"
                />
                <AnimatePresence>
                  {touched.fullName && errors.fullName && (
                    <motion.p
                      className="mt-1.5 font-['Inter'] text-[0.75rem] text-[#EF4444]"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {errors.fullName}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Email */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.46, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              >
                <label className="block font-['Inter'] font-medium text-[0.875rem] text-[#E0DDF0] mb-2">
                  Email <span className="text-[#EF4444]">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  onBlur={() => handleBlur('email')}
                  className="h-11 w-full rounded-lg border border-[#1A1830] bg-[#0E0D18] px-4 font-['Inter'] text-[1rem] text-[#E0DDF0] placeholder:text-[#5A5570] focus-visible:border-[#8B5CF6] focus-visible:ring-[#8B5CF6]/20 transition-all duration-300"
                />
                <AnimatePresence>
                  {touched.email && errors.email && (
                    <motion.p
                      className="mt-1.5 font-['Inter'] text-[0.75rem] text-[#EF4444]"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Use Case */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.52, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              >
                <label className="block font-['Inter'] font-medium text-[0.875rem] text-[#E0DDF0] mb-2">
                  Use Case <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={formData.useCase}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, useCase: e.target.value }))
                  }
                  onBlur={() => handleBlur('useCase')}
                  className="h-11 w-full rounded-lg border border-[#1A1830] bg-[#0E0D18] px-4 font-['Inter'] text-[1rem] text-[#E0DDF0] focus-visible:border-[#8B5CF6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/20 transition-all duration-300 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235A5570' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                  }}
                >
                  <option value="" disabled className="text-[#5A5570]">
                    Select your use case
                  </option>
                  {useCases.map((uc) => (
                    <option key={uc} value={uc} className="bg-[#0C0B14] text-[#E0DDF0]">
                      {uc}
                    </option>
                  ))}
                </select>
                <AnimatePresence>
                  {touched.useCase && errors.useCase && (
                    <motion.p
                      className="mt-1.5 font-['Inter'] text-[0.75rem] text-[#EF4444]"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {errors.useCase}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Company / Role */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.58, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              >
                <label className="block font-['Inter'] font-medium text-[0.875rem] text-[#E0DDF0] mb-2">
                  Company / Role <span className="text-[#5A5570]">(Optional)</span>
                </label>
                <Input
                  type="text"
                  placeholder="Company, Title"
                  value={formData.companyRole}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, companyRole: e.target.value }))
                  }
                  className="h-11 w-full rounded-lg border border-[#1A1830] bg-[#0E0D18] px-4 font-['Inter'] text-[1rem] text-[#E0DDF0] placeholder:text-[#5A5570] focus-visible:border-[#8B5CF6] focus-visible:ring-[#8B5CF6]/20 transition-all duration-300"
                />
              </motion.div>

              {/* Preferred LLM Provider */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.64, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              >
                <label className="block font-['Inter'] font-medium text-[0.875rem] text-[#E0DDF0] mb-3">
                  Preferred LLM Provider
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {llmProviders.map((provider) => (
                    <label
                      key={provider.id}
                      className="flex items-center gap-2.5 cursor-pointer group"
                    >
                      <Checkbox
                        checked={formData.llmProviders.includes(provider.id)}
                        onCheckedChange={() => handleLLMProviderToggle(provider.id)}
                        className="border-[#1A1830] data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#8B5CF6] data-[state=checked]:to-[#6366F1] data-[state=checked]:border-transparent transition-all duration-200"
                      />
                      <span className="font-['Inter'] text-[0.875rem] text-[#8A85A0] group-hover:text-[#E0DDF0] transition-colors duration-200">
                        {provider.label}
                      </span>
                    </label>
                  ))}
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                className="pt-3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              >
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-lg font-['Inter'] font-semibold text-[1rem] text-white transition-all duration-300 hover:scale-[1.01] hover:brightness-110 disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                    boxShadow: '0 0 30px rgba(139, 92, 246, 0.15)',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join Waitlist'
                  )}
                </button>
              </motion.div>

              {/* Privacy Note */}
              <motion.p
                className="text-center font-['Inter'] text-[0.75rem] text-[#5A5570] max-w-[480px] mx-auto pt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                We respect your privacy. Your information is stored securely and will never be sold or shared. You can unsubscribe at any time.
              </motion.p>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
