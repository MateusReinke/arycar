import { Link } from 'react-router-dom';
import {
  Car,
  Sparkles,
  Shield,
  Clock,
  MapPin,
  ChevronRight,
  MessageCircle,
  Droplets,
  Sun,
  ArrowRight,
  Star,
  BadgeCheck,
  Bot,
  PhoneCall,
  WandSparkles,
  Gauge,
  CircleDot,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { storageService } from '@/services/storage';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import beforeOne from '@/assets/before-1.jpg';
import afterOne from '@/assets/after-1.jpg';
import beforeTwo from '@/assets/before-2.jpg';
import afterTwo from '@/assets/after-2.jpg';
import beforeThree from '@/assets/before-3.jpg';
import afterThree from '@/assets/after-3.jpg';


const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

const services = [
  {
    id: 0,
    icon: Sparkles,
    title: 'Polimento',
    subtitle: 'Brilho e Correção',
    desc: 'Polimento comercial e técnico com correção de pintura e brilho espelhado.',
    features: ['Remoção de marcas leves', 'Refino técnico em etapas', 'Acabamento brilhante'],
  },
  {
    id: 1,
    icon: Shield,
    title: 'Vitrificação',
    subtitle: 'Proteção Cerâmica',
    desc: 'Proteção cerâmica duradoura para pintura com acabamento hidrofóbico.',
    features: ['Barreira contra intempéries', 'Toque hidrofóbico', 'Maior durabilidade da pintura'],
  },
  {
    id: 2,
    icon: Droplets,
    title: 'Lavagem Detalhada',
    subtitle: 'Limpeza Premium',
    desc: 'Limpeza completa interna e externa com produtos premium.',
    features: ['Pré-lavagem técnica', 'Aspiração + acabamento interno', 'Finalização com brilho'],
  },
  {
    id: 3,
    icon: Clock,
    title: 'Higienização',
    subtitle: 'Saúde e Conforto',
    desc: 'Sanitização com ozônio, limpeza profunda de estofados e carpetes.',
    features: ['Extração de sujeira profunda', 'Neutralização de odores', 'Proteção para famílias e apps'],
  },
  {
    id: 4,
    icon: Sun,
    title: 'Tratamento de Couro',
    subtitle: 'Interior Conservado',
    desc: 'Hidratação e proteção de bancos e painéis em couro.',
    features: ['Limpeza técnica de couro', 'Hidratação especializada', 'Proteção contra ressecamento'],
  },
  {
    id: 5,
    icon: Car,
    title: 'Restauração de Faróis',
    subtitle: 'Visibilidade e Segurança',
    desc: 'Recuperação da transparência e aplicação de proteção UV.',
    features: ['Remoção de opacidade', 'Polimento de lente', 'Proteção UV'],
  },
];

const WashOverlay = ({ className = '' }: { className?: string }) => (
  <svg
    className={`pointer-events-none absolute text-primary/30 ${className}`}
    viewBox="0 0 520 320"
    fill="none"
    aria-hidden="true"
  >
    <path d="M78 214c18-45 52-70 105-70h121c41 0 71 20 92 61l15 29" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
    <path d="M135 145l31-48h126l47 48" stroke="currentColor" strokeWidth="8" strokeLinejoin="round" />
    <circle cx="155" cy="235" r="30" stroke="currentColor" strokeWidth="9" />
    <circle cx="365" cy="235" r="30" stroke="currentColor" strokeWidth="9" />
    <path d="M74 88c76-44 163-47 262-9 44 17 80 18 108 3" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeDasharray="18 18" />
    <path d="M408 31c24 26 24 52 0 78M438 45c14 15 14 31 0 47" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
    {[60, 108, 456, 486].map((x, index) => (
      <circle key={x} cx={x} cy={index % 2 ? 56 : 112} r={index % 2 ? 9 : 13} fill="currentColor" />
    ))}
  </svg>
);


const FloatingCarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 220 90" fill="none" aria-hidden="true">
    <path d="M18 58h20l18-24h75c18 0 34 9 44 24h25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M68 34l18-18h38l24 18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="62" cy="61" r="12" stroke="currentColor" strokeWidth="4" />
    <circle cx="164" cy="61" r="12" stroke="currentColor" strokeWidth="4" />
    <path d="M90 58h43" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const PressureGunIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 160 120" fill="none" aria-hidden="true">
    <path d="M18 42h74l18 13h32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M52 47l18 22h24l-15-22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M70 69 55 101H35l19-32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M112 54c10-10 20-15 32-17M114 66c13 0 23 3 33 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const WaterDropIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <path d="M60 13C41 36 28 57 28 76c0 19 14 32 32 32s32-13 32-32C92 57 79 36 60 13Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    <path d="M44 79c2 9 8 14 18 15" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M91 28h18M100 19v18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const PolishSparkleIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <path d="M60 12l9 30 30 9-30 9-9 30-9-30-30-9 30-9 9-30Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    <path d="M96 78l4 13 13 4-13 4-4 13-4-13-13-4 13-4 4-13ZM23 14l3 10 10 3-10 3-3 10-3-10-10-3 10-3 3-10Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
  </svg>
);

const PolisherIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 150 120" fill="none" aria-hidden="true">
    <path d="M35 62h56c14 0 25 11 25 25H38c-10 0-18-8-18-18 0-4 3-7 7-7h8Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    <path d="M57 62V42h35l21 20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M52 42h38" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M38 96h80" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    <path d="M21 31c8-8 16-8 24 0M12 48c9-5 18-5 27 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const PatternIconLayer = () => {
  const icons = [
    { Icon: FloatingCarIcon, className: 'left-[2%] top-[8%] h-24 w-52 rotate-[-8deg]' },
    { Icon: PressureGunIcon, className: 'left-[14%] top-[32%] h-28 w-36 rotate-[10deg]' },
    { Icon: PolisherIcon, className: 'left-[22%] top-[70%] h-28 w-36 rotate-[-7deg]' },
    { Icon: PolishSparkleIcon, className: 'left-[40%] top-[14%] h-28 w-28 rotate-[8deg]' },
    { Icon: WaterDropIcon, className: 'left-[53%] top-[72%] h-24 w-24 rotate-[9deg]' },
    { Icon: PressureGunIcon, className: 'left-[67%] top-[19%] h-28 w-36 rotate-[-12deg]' },
    { Icon: FloatingCarIcon, className: 'left-[75%] top-[56%] h-24 w-52 rotate-[6deg]' },
    { Icon: PolishSparkleIcon, className: 'left-[91%] top-[28%] h-24 w-24 rotate-[-10deg]' },
    { Icon: PolisherIcon, className: 'left-[82%] top-[84%] h-28 w-36 rotate-[12deg]' },
    { Icon: WaterDropIcon, className: 'left-[6%] top-[88%] h-24 w-24 rotate-[8deg]' },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden text-cyan-200 opacity-[0.07]" aria-hidden="true">
      {icons.map(({ Icon, className }, index) => (
        <Icon key={index} className={`absolute ${className}`} />
      ))}
    </div>
  );
};
const beforeAfterShowcases = [
  {
    id: 'polimento',
    serviceId: 0,
    title: 'Polimento Técnico',
    beforeImage: beforeOne,
    afterImage: afterOne,
    description: 'Redução de marcas leves e realce de brilho com acabamento espelhado.',
    beforeLabel: 'Marcas na pintura',
    afterLabel: 'Brilho espelhado',
    accent: 'from-white/[0.045] to-primary/[0.055]',
  },
  {
    id: 'vitrificacao',
    serviceId: 1,
    title: 'Vitrificação Cerâmica',
    beforeImage: beforeTwo,
    afterImage: afterTwo,
    description: 'Pintura com proteção duradoura e toque hidrofóbico visível no acabamento.',
    beforeLabel: 'Sem proteção',
    afterLabel: 'Efeito hidrofóbico',
    accent: 'from-white/[0.045] to-primary/[0.055]',
  },
  {
    id: 'higienizacao',
    serviceId: 3,
    title: 'Higienização Interna',
    beforeImage: beforeThree,
    afterImage: afterThree,
    description: 'Remoção de sujeiras profundas e aspecto renovado em bancos e carpetes.',
    beforeLabel: 'Interior saturado',
    afterLabel: 'Cabine renovada',
    accent: 'from-white/[0.045] to-primary/[0.055]',
  },

  {
    id: 'lavagem',
    serviceId: 2,
    title: 'Lavagem Detalhada',
    beforeImage: beforeOne,
    afterImage: afterOne,
    description: 'Pré-lavagem, limpeza de cantos e finalização para remover sujeira acumulada com segurança.',
    beforeLabel: 'Sujeira acumulada',
    afterLabel: 'Acabamento limpo',
    accent: 'from-white/[0.045] to-primary/[0.055]',
  },
  {
    id: 'farois',
    serviceId: 5,
    title: 'Restauração de Faróis',
    beforeImage: beforeTwo,
    afterImage: afterTwo,
    description: 'Lente mais transparente para melhorar aparência, visibilidade e segurança na condução noturna.',
    beforeLabel: 'Lente opaca',
    afterLabel: 'Transparência recuperada',
    accent: 'from-white/[0.045] to-primary/[0.055]',
  },
  {
    id: 'couro',
    serviceId: 4,
    title: 'Tratamento de Couro',
    beforeImage: beforeThree,
    afterImage: afterThree,
    description: 'Revitalização de textura e uniformidade de cor para interior premium.',
    beforeLabel: 'Couro ressecado',
    afterLabel: 'Toque hidratado',
    accent: 'from-white/[0.045] to-primary/[0.055]',
  },
];

const serviceWorkflow = [
  {
    step: '1. Diagnóstico rápido',
    description: 'Checklist técnico para definir prioridade, acabamento e tempo de entrega.',
  },
  {
    step: '2. Execução especializada',
    description: 'Processo por etapa com foco em proteção, brilho e segurança dos materiais.',
  },
  {
    step: '3. Entrega + manutenção',
    description: 'Orientação de cuidados pós-serviço e acompanhamento para manter o resultado.',
  },
];

const Homepage = () => {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [activeServiceId, setActiveServiceId] = useState<number | null>(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadVehicle, setLeadVehicle] = useState('');
  const [leadService, setLeadService] = useState('');
  const [leadMessage, setLeadMessage] = useState('');
  const [preferWhatsapp, setPreferWhatsapp] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeShowcaseId, setActiveShowcaseId] = useState(beforeAfterShowcases[0].id);
  const [comparisonPositions, setComparisonPositions] = useState<Record<string, number>>(() =>
    beforeAfterShowcases.reduce((acc, showcase) => ({ ...acc, [showcase.id]: 50 }), {}),
  );

  useEffect(() => {
    const settings = storageService.getSettings();
    setWhatsappNumber(settings.whatsappNumber || '');
  }, []);

  const activeShowcase = beforeAfterShowcases.find((showcase) => showcase.id === activeShowcaseId) || beforeAfterShowcases[0];
  const activeService = services.find((service) => service.id === activeServiceId) || services[0];
  const isAgentConfigured = Boolean(N8N_WEBHOOK_URL);

  const whatsappLink = whatsappNumber ? `https://wa.me/55${whatsappNumber.replace(/\D/g, '')}` : '#';

  const openContactForm = () => {
    setContactOpen(true);
    setMobileMenuOpen(false);
  };

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leadName.trim() || !leadPhone.trim() || !leadVehicle.trim() || !leadService.trim()) {
      toast.error('Preencha nome, telefone, veículo e serviço para iniciar o atendimento.');
      return;
    }

    const payload = {
      source: 'homepage-agent',
      name: leadName,
      phone: leadPhone,
      vehicle: leadVehicle,
      requestedService: leadService,
      message: leadMessage,
      preferWhatsapp,
      timestamp: new Date().toISOString(),
    };

    if (!isAgentConfigured) {
      toast.error('Configure VITE_N8N_WEBHOOK_URL para ativar o Assistente Arycar no deploy.');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar para o agente.');
      }

      toast.success('Atendimento iniciado! Nosso agente já recebeu sua solicitação.');
      setLeadName('');
      setLeadPhone('');
      setLeadVehicle('');
      setLeadService('');
      setLeadMessage('');
      setContactOpen(false);
    } catch {
      toast.error('Não foi possível enviar agora. Tente novamente em instantes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const seoKeywords =
    'estética automotiva, lavagem detalhada, polimento automotivo, vitrificação cerâmica, higienização interna, restauração de faróis, lava rápido';

  useEffect(() => {
    document.title = 'Arycar Estética Automotiva | Polimento, Vitrificação e Higienização';

    const applyMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    applyMeta('description', 'Estética automotiva premium com polimento, vitrificação cerâmica, higienização interna e leva e traz. Resultados profissionais para seu veículo.');
    applyMeta('keywords', seoKeywords);
  }, [seoKeywords]);

  return (
    <div className="site-dark-pattern min-h-screen">
      <PatternIconLayer />
      <main itemScope itemType="https://schema.org/AutoRepair" className="relative z-10 pb-40 md:pb-24">

        <header className="sticky top-0 z-50 border-b border-white/10 bg-background/85 backdrop-blur-xl">
          <div className="container relative flex h-16 max-w-[1400px] items-center justify-between">
            <Link to="/" className="text-xl font-black tracking-[0.18em] text-white" onClick={() => setMobileMenuOpen(false)}>ARY<span className="text-primary">CAR</span></Link>
            <nav className="hidden items-center gap-3 md:flex" aria-label="Navegação principal">
              <Button variant="ghost" size="sm" asChild>
                <a href="#servicos">Serviços</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="#galeria">Galeria</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="#faq">FAQ</a>
              </Button>
              <Button size="sm" asChild>
                <Link to="/login">
                  Área de Gestão
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </nav>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            {mobileMenuOpen && (
              <div className="absolute left-4 right-4 top-full mt-3 rounded-2xl border border-white/10 bg-card/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl md:hidden">
                {[
                  { href: '#servicos', label: 'Serviços' },
                  { href: '#galeria', label: 'Galeria' },
                  { href: '#faq', label: 'FAQ' },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block min-h-12 rounded-xl px-4 py-3 text-sm font-semibold text-foreground hover:bg-primary/10"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <Button className="mt-2 min-h-12 w-full" asChild>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Área de Gestão</Link>
                </Button>
              </div>
            )}
          </div>
        </header>

        <section className="relative overflow-hidden py-12 sm:py-14 lg:flex lg:min-h-[calc(100vh-4rem)] lg:items-center lg:py-16">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-primary/[0.04]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.08),transparent_40%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(6,15,32,0.95)_0%,rgba(7,17,38,0.82)_45%,rgba(7,15,32,0.72)_100%)]" />
          <div className="container relative grid max-w-[1400px] items-start gap-8 sm:gap-10 lg:grid-cols-[55fr_45fr] lg:items-center">
            <div className="space-y-5 text-center lg:space-y-6 lg:text-left">
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                Qualidade, cuidado e detalhes em cada serviço
              </span>
              <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                ARYCAR: estética automotiva com <span className="text-primary">acabamento de vitrine</span>
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
Lavagem, polimento, higienização e vitrificação com execução técnica, atendimento rápido e foco em resultado visível desde a primeira entrega.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4 lg:justify-start">
                <Button size="lg" className="h-12 w-full px-8 text-base sm:w-auto" asChild>
                  <a href="#servicos">Conhecer serviços</a>
                </Button>
                <Button size="lg" variant="outline" className="h-12 w-full px-8 text-base sm:w-auto" onClick={openContactForm}>
                  Falar com especialista
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-muted-foreground lg:justify-start">
                {['Agendamento rápido', 'Leva e traz', 'Atendimento para frotas', 'Equipe certificada'].map((pill, index) => (
                  <span key={pill} className={`rounded-full border border-border/80 bg-card/60 px-3 py-1 ${index > 1 ? 'hidden sm:inline-flex' : ''}`}>
                    {pill}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 text-left sm:grid-cols-3">
                <div className="rounded-xl border border-border/80 bg-card/50 p-3">
                  <p className="text-xl font-bold text-primary">+4.500</p>
                  <p className="text-xs text-muted-foreground">veículos atendidos</p>
                </div>
                <div className="rounded-xl border border-border/80 bg-card/50 p-3">
                  <p className="text-xl font-bold text-primary">4.9/5</p>
                  <p className="text-xs text-muted-foreground">avaliação média dos clientes</p>
                </div>
                <div className="col-span-2 rounded-xl border border-border/80 bg-card/50 p-3 sm:col-span-1">
                  <p className="text-xl font-bold text-primary">Até 12x</p>
                  <p className="text-xs text-muted-foreground">condições facilitadas</p>
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md rounded-3xl border border-primary/20 bg-card/70 p-6 shadow-2xl shadow-primary/20 backdrop-blur">
              <div className="mx-auto grid h-36 w-36 place-items-center rounded-[2rem] border border-primary/20 bg-white/[0.03] text-center shadow-2xl shadow-black/30"><div><FloatingCarIcon className="mx-auto h-14 w-28 text-primary" /><p className="mt-2 text-xl font-black tracking-[0.2em] text-white">ARY</p><p className="text-sm font-bold tracking-[0.25em] text-primary">CAR</p></div></div>
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-background/80 p-3">
                  <BadgeCheck className="mt-0.5 h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">Diagnóstico visual com checklist técnico antes de cada serviço.</p>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-background/80 p-3">
                  <Star className="mt-0.5 h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">Produtos de alto desempenho para brilho intenso e proteção duradoura.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-20" id="servicos-campanha">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_40%,rgba(24,131,255,0.25),transparent_45%)]" />
          <div className="container relative max-w-[1400px]">
            <div className="grid gap-10 lg:grid-cols-[55fr_45fr] lg:items-start">
              <div className="pattern-panel rounded-3xl p-6 sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Como funciona</p>
                <h2 className="mt-2 text-3xl font-black leading-tight text-white sm:text-4xl">
                  Menos promessa, mais processo com padrão Arycar
                </h2>
                <p className="mt-4 max-w-2xl text-sm text-slate-300">
                  Consolidamos as informações em um fluxo simples para evitar repetição: diagnóstico, execução e entrega orientada.
                </p>

                <div className="mt-8 space-y-3">
                  {serviceWorkflow.map((item) => (
                    <div key={item.step} className="rounded-xl border border-blue-300/15 bg-black/30 px-4 py-4">
                      <p className="text-sm font-semibold text-slate-100">{item.step}</p>
                      <p className="mt-1 text-sm text-slate-300">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pattern-panel relative overflow-hidden rounded-3xl p-6">
                <WashOverlay className="-right-24 top-0 h-72 w-[520px] opacity-80" />
                <div className="relative grid h-60 place-items-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-slate-950/50 to-slate-900/80">
                  <div className="absolute left-5 top-5 flex gap-2 text-primary/70">
                    <Droplets className="h-7 w-7" />
                    <WandSparkles className="h-7 w-7" />
                    <Gauge className="h-7 w-7" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Lava-rápido premium</p>
                    <p className="mt-3 text-3xl font-black text-white">Água, espuma e brilho</p>
                    <p className="mt-2 text-sm text-slate-300">Visual moderno sem imagens, focado em ícones e processo.</p>
                  </div>
                </div>
                <div className="relative mt-5 space-y-3">
                  {[
                    'Leva e traz para otimizar sua rotina de trabalho.',
                    'Equipe treinada para acabamento interno e externo.',
                    'Transparência no escopo e no prazo antes de iniciar.',
                  ].map((text) => (
                    <div key={text} className="flex items-start gap-2">
                      <BadgeCheck className="mt-0.5 h-4 w-4 text-primary" />
                      <p className="text-sm text-slate-200">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="servicos" className="relative overflow-hidden py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_25%,rgba(24,131,255,0.2),transparent_42%)]" />
          <div className="container relative max-w-[1400px]">
            <div className="mb-10 text-center lg:text-left">
              <span className="text-sm font-semibold uppercase tracking-widest text-primary">Cobertura técnica</span>
              <h2 className="mt-2 text-3xl font-black leading-tight text-white sm:text-4xl lg:max-w-xl">
                Segurança detalhada ponto a ponto para o seu carro.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 lg:mx-0">
                Sidebar de serviços reorganizada: selecione uma categoria à esquerda e veja os detalhes completos no painel principal, sem blocos repetidos.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1.55fr)] lg:items-stretch">
              <aside className="space-y-3 lg:sticky lg:top-24 lg:h-fit">
                <div className="rounded-2xl border border-slate-700/60 bg-[#0a1328]/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Sidebar de serviços</p>
                  <p className="mt-2 text-sm text-slate-300">Toque no serviço para atualizar o painel com descrição e escopo principal.</p>
                </div>

                <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 lg:mx-0 lg:grid lg:max-h-[500px] lg:grid-cols-1 lg:gap-3 lg:overflow-visible lg:px-0 lg:pb-0">
                {services.map((service) => {
                  const isActive = activeServiceId === service.id;

                  return (
                    <button
                      key={service.id}
                      onClick={() => setActiveServiceId(service.id)}
                      className={`group relative min-h-12 overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all duration-300 lg:px-4 lg:py-5 ${
                        isActive
                          ? 'border-primary/70 bg-[#060d20] shadow-[0_10px_35px_rgba(30,136,255,0.25)]'
                          : 'border-slate-700/60 bg-[#0a1328]/90 hover:border-primary/40'
                      }`}
                      aria-pressed={isActive}
                    >
                      {isActive && <span className="absolute inset-y-0 left-0 w-1 rounded-full bg-primary" />}
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl p-2 ${isActive ? 'bg-primary/20 text-primary' : 'bg-slate-800/80 text-slate-300'}`}>
                          <service.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-white">{service.title}</h3>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{service.subtitle}</p>
                        </div>
                        <ChevronRight className={`h-4 w-4 transition ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'}`} />
                      </div>
                    </button>
                  );
                })}
                </div>
              </aside>

              <article className="pattern-panel relative overflow-hidden rounded-3xl p-5 sm:p-7 lg:min-h-[560px]">
                <WashOverlay className="-right-28 top-8 hidden h-[420px] w-[640px] opacity-70 md:block" />
                <div className="pointer-events-none absolute right-8 top-8 hidden rounded-full border border-primary/20 bg-primary/10 p-5 text-primary/60 md:block">
                  <activeService.icon className="h-20 w-20" />
                </div>
                <div className="relative z-10 flex h-full flex-col">
                  <span className="inline-flex w-fit rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    Serviço selecionado
                  </span>

                  <h3 className="mt-4 text-2xl font-black leading-tight text-white sm:text-3xl lg:text-4xl">{activeService.title}</h3>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">{activeService.desc}</p>

                  <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                    {activeService.features.map((feature) => (
                      <li key={feature} className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-4 py-3 text-slate-100">
                        • {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-slate-300 lg:hidden">
                    Dica: toque em um serviço para trocar os detalhes sem informações cortadas no mobile.
                  </div>

                  <div className="mt-8 flex flex-col gap-4 border-t border-slate-700/60 pt-5 sm:flex-row sm:items-center sm:justify-between lg:mt-auto">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Atendimento premium em todos os pacotes</p>
                    <Button className="w-full sm:w-auto" onClick={openContactForm}>
                      Solicitar orçamento
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="galeria" className="py-20">
          <div className="container max-w-[1400px]">
            <div className="mb-12 text-center">
              <span className="text-sm font-semibold uppercase tracking-widest text-primary">Galeria de resultados reais</span>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Compare o antes e depois em visual moderno</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                Escolha um dos 6 serviços abaixo e arraste para os lados para visualizar o efeito do serviço com fotos em slider interativo de antes e depois.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              {beforeAfterShowcases.map((showcase) => {
                const service = services[showcase.serviceId];
                const isActive = activeShowcaseId === showcase.id;

                return (
                  <button
                    key={showcase.id}
                    onClick={() => setActiveShowcaseId(showcase.id)}
                    className={`min-h-12 rounded-xl border px-3 py-3 text-left transition ${
                      isActive
                        ? 'border-primary bg-primary/10 shadow-sm shadow-primary/20'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Serviço</p>
                    <p className="mt-1 text-sm font-semibold">{service.title}</p>
                  </button>
                );
              })}
            </div>

            <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/50 backdrop-blur-xl transition duration-300 hover:border-cyan-300/55 hover:shadow-[0_0_45px_rgba(34,211,238,0.20)] sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-white">{activeShowcase.title}</h3>
                  <p className="text-sm text-muted-foreground">{activeShowcase.description}</p>
                </div>
                <p className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">Arraste para comparar</p>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-inner shadow-black/70">
                <img
                  src={activeShowcase.afterImage}
                  alt={`Depois - ${activeShowcase.title}: ${activeShowcase.afterLabel}`}
                  className="h-64 w-full object-cover sm:h-[420px]"
                />
                <div
                  className="absolute inset-0"
                  style={{ clipPath: `inset(0 ${100 - (comparisonPositions[activeShowcase.id] ?? 50)}% 0 0)` }}
                >
                  <img
                    src={activeShowcase.beforeImage}
                    alt={`Antes - ${activeShowcase.title}: ${activeShowcase.beforeLabel}`}
                    className="h-64 w-full object-cover grayscale sm:h-[420px]"
                  />
                </div>

                <div
                  className="pointer-events-none absolute inset-y-0 w-0.5 bg-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.85)]"
                  style={{ left: `${comparisonPositions[activeShowcase.id] ?? 50}%` }}
                >
                  <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-100/80 bg-black/70 text-xs font-bold text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.55)] backdrop-blur">
                    ↔
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/55 backdrop-blur">Antes</div>
                <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-cyan-200/50 bg-cyan-300/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.35)] backdrop-blur">Depois</div>
                <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                  <CircleDot className="h-3 w-3 text-primary" /> Comparativo por serviço
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  value={comparisonPositions[activeShowcase.id] ?? 50}
                  onChange={(event) =>
                    setComparisonPositions((prev) => ({
                      ...prev,
                      [activeShowcase.id]: Number(event.target.value),
                    }))
                  }
                  className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
                  aria-label={`Comparar antes e depois de ${activeShowcase.title}`}
                />
              </div>
            </article>
          </div>
        </section>

        <section className="bg-card/30 py-20 backdrop-blur-sm">
          <div className="container grid max-w-[1400px] grid-cols-1 gap-8 text-center md:grid-cols-3 md:text-left">
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold">Leva e traz com segurança</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">Buscamos e entregamos seu veículo no endereço desejado com protocolos de cuidado durante todo o trajeto.</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold">Produtos e equipe especializada</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">Combinamos marcas premium, técnicas atualizadas e acabamento minucioso para máxima valorização do seu carro.</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold">Entrega no prazo</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">Fluxo operacional eficiente, com previsibilidade de tempo e comunicação em todas as etapas do serviço.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="py-20">
          <div className="container max-w-4xl">
            <div className="mb-10 text-center">
              <span className="text-sm font-semibold uppercase tracking-widest text-primary">FAQ</span>
              <h2 className="mt-2 text-3xl font-bold">Perguntas frequentes</h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  question: 'Quanto tempo leva um serviço completo de estética automotiva?',
                  answer: 'Depende do pacote escolhido e do estado do veículo. Em média, de 3 horas até 1 dia útil para entregas mais completas.',
                },
                {
                  question: 'A vitrificação protege por quanto tempo?',
                  answer: 'Com manutenção correta, a proteção pode durar muitos meses, mantendo brilho e efeito hidrofóbico.',
                },
                {
                  question: 'Posso agendar atendimento pelo WhatsApp?',
                  answer: 'Sim. Você pode clicar no botão flutuante e iniciar o contato imediato com nossa equipe.',
                },
              ].map((faq) => (
                <article key={faq.question} className="rounded-2xl border border-border bg-card p-5" itemScope itemType="https://schema.org/Question">
                  <h3 className="font-semibold" itemProp="name">{faq.question}</h3>
                  <p className="mt-2 text-sm text-muted-foreground" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <span itemProp="text">{faq.answer}</span>
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border py-8">
        <div className="container flex flex-col items-center gap-4">
          <p className="text-xl font-black tracking-[0.18em] text-white/70">ARY<span className="text-primary/80">CAR</span></p>
          <p className="text-center text-sm text-muted-foreground">© {new Date().getFullYear()} ARYCAR Estética Automotiva. Todos os direitos reservados.</p>
        </div>
      </footer>

      <div className="fixed bottom-4 left-3 right-3 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:left-auto sm:right-6">
        {contactOpen && (
          <div className="w-full max-w-[360px] rounded-2xl border border-primary/30 bg-card/95 p-4 text-left shadow-2xl shadow-primary/20 backdrop-blur">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <PhoneCall className="h-4 w-4 text-primary" />
                  Fale com nosso agente
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isAgentConfigured
                    ? 'Assistente online: as solicitações são enviadas direto para seu fluxo no n8n.'
                    : 'Configure VITE_N8N_WEBHOOK_URL no deploy para ativar o envio automático no n8n.'}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setContactOpen(false)}>
                Fechar
              </Button>
            </div>

            <form onSubmit={handleAgentSubmit} className="space-y-3">
              <div>
                <Label>Nome *</Label>
                <Input value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="Seu nome" />
              </div>
              <div>
                <Label>Telefone *</Label>
                <Input value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <Label>Veículo *</Label>
                <Input value={leadVehicle} onChange={(e) => setLeadVehicle(e.target.value)} placeholder="Ex.: Onix 2022" />
              </div>
              <div>
                <Label>Serviço desejado *</Label>
                <Input value={leadService} onChange={(e) => setLeadService(e.target.value)} placeholder="Ex.: Polimento técnico" />
              </div>
              <div>
                <Label>Mensagem</Label>
                <Textarea value={leadMessage} onChange={(e) => setLeadMessage(e.target.value)} placeholder="Quero orçamento para..." rows={3} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Receber contato pelo WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Nossa equipe prioriza esse canal quando ativado.</p>
                </div>
                <Switch checked={preferWhatsapp} onCheckedChange={setPreferWhatsapp} />
              </div>
              <Button disabled={isSubmitting} className="w-full" type="submit">
                {isSubmitting ? 'Enviando...' : 'Iniciar atendimento'}
              </Button>
            </form>
          </div>
        )}

        <button
          className="w-full max-w-[320px] rounded-2xl border border-primary/30 bg-card/95 p-4 text-left shadow-2xl shadow-primary/20 backdrop-blur sm:max-w-[280px]"
          aria-label="Abrir atendimento inteligente"
          onClick={() => setContactOpen((prev) => !prev)}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Assistente Arycar</p>
              <p className="text-xs text-muted-foreground">Clique para {contactOpen ? 'recolher' : 'expandir'} o mini chat</p>
            </div>
          </div>
        </button>
      </div>

      {whatsappNumber && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-32 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(142,71%,45%)] text-white shadow-xl transition-transform hover:scale-110 active:scale-95 sm:bottom-28 sm:right-6 sm:h-14 sm:w-14"
          aria-label="WhatsApp"
        >
          <MessageCircle className="h-7 w-7" />
        </a>
      )}
    </div>
  );
};

export default Homepage;
