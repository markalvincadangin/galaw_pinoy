'use client';

import { motion } from 'framer-motion';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitReflection, type ActionResult } from '@/app/actions';
import Navigation from '@/components/Navigation';
import { useEffect, useRef } from 'react';
import KineticButton from '@/components/ui/KineticButton';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <KineticButton
      type="submit"
      variant="primary"
      size="lg"
      disabled={pending}
    >
      {pending ? 'Submitting...' : 'Submit Reflection'}
    </KineticButton>
  );
}

function ReflectionForm({ initialState }: { initialState: ActionResult | null }) {
  const wrappedAction = async (
    prevState: ActionResult | null,
    formData: FormData
  ): Promise<ActionResult> => {
    return submitReflection(formData);
  };
  const [state, formAction] = useActionState(wrappedAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Clear form on successful submission
  useEffect(() => {
    if (state?.success && formRef.current && textareaRef.current) {
      formRef.current.reset();
      textareaRef.current.focus();
    }
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="mt-0">
      <textarea
        ref={textareaRef}
        name="content"
        rows={5}
        placeholder="Write your reflection here..."
        required
        className="w-full px-4 py-3 text-base bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue resize-none mb-6 transition-all text-white placeholder:text-white/50 font-body"
      />
      <div className="flex justify-start mt-0">
        <SubmitButton />
      </div>
      {state?.message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 px-4 py-3 rounded-lg font-body ${
            state.success
              ? 'bg-green-500/20 text-green-300 border border-green-500/30 backdrop-blur-sm'
              : 'bg-red-500/20 text-red-300 border border-red-500/30 backdrop-blur-sm'
          }`}
        >
          {state.message}
        </motion.div>
      )}
    </form>
  );
}

export default function Join() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen pb-20 md:pb-0">
        {/* Hero Section */}
        <section className="min-h-[70vh] flex flex-col justify-center items-center text-center px-6 md:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl w-full px-4"
          >
            <div className="mb-6">
              <span className="text-sm font-display font-bold uppercase tracking-wider text-brand-yellow">
                Join the Movement
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black uppercase leading-tight tracking-tight text-white mb-6 drop-shadow-xl">
              Move with <span className="text-brand-blue">Purpose</span>.<br />
              Play with <span className="text-brand-red">Culture</span>.
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed font-body drop-shadow-md max-w-3xl mx-auto">
              Galaw Pinoy invites you to take part in preserving Filipino culture while
              improving your health through movement.
            </p>
          </motion.div>
        </section>

        {/* Ways to Participate */}
        <section className="py-16 md:py-20 px-6 md:px-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-modern rounded-3xl p-8 md:p-12 cultural-texture"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6 drop-shadow-lg">
              Ways to Participate
            </h2>
            <ul className="list-none m-0 p-0 space-y-4">
              <li className="text-lg md:text-xl text-white/95 font-body flex items-start gap-3">
                <span className="text-brand-yellow text-2xl font-bold">•</span>
                <span>Play the interactive games</span>
              </li>
              <li className="text-lg md:text-xl text-white/95 font-body flex items-start gap-3">
                <span className="text-brand-yellow text-2xl font-bold">•</span>
                <span>Share the advocacy with others</span>
              </li>
              <li className="text-lg md:text-xl text-white/95 font-body flex items-start gap-3">
                <span className="text-brand-yellow text-2xl font-bold">•</span>
                <span>Integrate Galaw Pinoy into PE activities</span>
              </li>
              <li className="text-lg md:text-xl text-white/95 font-body flex items-start gap-3">
                <span className="text-brand-yellow text-2xl font-bold">•</span>
                <span>Promote traditional Filipino games</span>
              </li>
            </ul>
          </motion.div>
        </section>

        {/* Reflection Form */}
        <section className="py-16 md:py-20 px-6 md:px-8 max-w-5xl mx-auto pb-20 md:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-modern rounded-3xl p-8 md:p-12 cultural-texture"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4 drop-shadow-lg">
              Reflection
            </h2>
            <p className="text-lg md:text-xl text-white/95 mb-8 leading-relaxed font-body">
              How did this experience change your view of fitness and Filipino culture?
            </p>
            <ReflectionForm initialState={null} />
          </motion.div>
        </section>
      </main>
    </>
  );
}

