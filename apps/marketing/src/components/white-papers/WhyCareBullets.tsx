import { detectPersona, getPersonaConfig } from '@/utils/personalization';

const WhyCareBullets = () => {
  const persona = detectPersona();
  const config = getPersonaConfig(persona);

  return (
    <section className="py-12 bg-slate-100">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h3 className="text-2xl font-bold mb-6">Why This Matters Now</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {config.whyCareBullets.map((bullet, index) => (
            <div key={index}>
              <div className="text-[hsl(var(--brand-teal))] text-4xl mb-2">
                {bullet.icon}
              </div>
              <p className="font-semibold mb-1">{bullet.title}</p>
              <p className="text-sm text-gray-600">{bullet.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyCareBullets;
