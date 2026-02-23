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
  MousePointerClick,
  Star,
  BadgeCheck,
  Bot,
  PhoneCall,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { storageService } from '@/services/storage';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

import arycarLogo from '@/assets/arycar-logo.png';
import servicePolimento from '@/assets/service-polimento.jpg';
import serviceVitrificacao from '@/assets/service-vitrificacao.jpg';
import serviceLavagem from '@/assets/service-lavagem.jpg';
import serviceHigienizacao from '@/assets/service-higienizacao.jpg';
import serviceCouro from '@/assets/service-couro.jpg';
import serviceFarois from '@/assets/service-farois.jpg';

import before1 from '@/assets/before-1.jpg';
import after1 from '@/assets/after-1.jpg';
import before2 from '@/assets/before-2.jpg';
import after2 from '@/assets/after-2.jpg';
import before3 from '@/assets/before-3.jpg';
import after3 from '@/assets/after-3.jpg';

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

const services = [
  {
    id: 0,
    icon: Sparkles,
    title: 'Polimento',
    subtitle: 'Brilho e Correção',
    desc: 'Polimento comercial e técnico com correção de pintura e brilho espelhado.',
    image: servicePolimento,
    features: ['Remoção de marcas leves', 'Refino técnico em etapas', 'Acabamento brilhante'],
  },
  {
    id: 1,
    icon: Shield,
    title: 'Vitrificação',
    subtitle: 'Proteção Cerâmica',
    desc: 'Proteção cerâmica duradoura para pintura com acabamento hidrofóbico.',
    image: serviceVitrificacao,
    features: ['Barreira contra intempéries', 'Toque hidrofóbico', 'Maior durabilidade da pintura'],
  },
  {
    id: 2,
    icon: Droplets,
    title: 'Lavagem Detalhada',
    subtitle: 'Limpeza Premium',
    desc: 'Limpeza completa interna e externa com produtos premium.',
    image: serviceLavagem,
    features: ['Pré-lavagem técnica', 'Aspiração + acabamento interno', 'Finalização com brilho'],
  },
  {
    id: 3,
    icon: Clock,
    title: 'Higienização',
    subtitle: 'Saúde e Conforto',
    desc: 'Sanitização com ozônio, limpeza profunda de estofados e carpetes.',
    image: serviceHigienizacao,
    features: ['Extração de sujeira profunda', 'Neutralização de odores', 'Proteção para famílias e apps'],
  },
  {
    id: 4,
    icon: Sun,
    title: 'Tratamento de Couro',
    subtitle: 'Interior Conservado',
    desc: 'Hidratação e proteção de bancos e painéis em couro.',
    image: serviceCouro,
    features: ['Limpeza técnica de couro', 'Hidratação especializada', 'Proteção contra ressecamento'],
  },
  {
    id: 5,
    icon: Car,
    title: 'Restauração de Faróis',
    subtitle: 'Visibilidade e Segurança',
    desc: 'Recuperação da transparência e aplicação de proteção UV.',
    image: serviceFarois,
    features: ['Remoção de opacidade', 'Polimento de lente', 'Proteção UV'],
  },
];

const beforeAfterShowcases = [
  {
    id: 'polimento',
    serviceId: 0,
    title: 'Polimento Técnico',
    description: 'Redução de marcas leves e realce de brilho com acabamento espelhado.',
    beforeImage: before1,
    afterImage: after1,
  },
  {
    id: 'vitrificacao',
    serviceId: 1,
    title: 'Vitrificação Cerâmica',
    description: 'Pintura com proteção duradoura e toque hidrofóbico visível no acabamento.',
    beforeImage: before2,
    afterImage: after2,
  },
  {
    id: 'higienizacao',
    serviceId: 3,
    title: 'Higienização Interna',
    description: 'Remoção de sujeiras profundas e aspecto renovado em bancos e carpetes.',
    beforeImage: before3,
    afterImage: after3,
  },
  {
    id: 'couro',
    serviceId: 4,
    title: 'Tratamento de Couro',
    description: 'Revitalização de textura e uniformidade de cor para interior premium.',
    beforeImage: before2,
    afterImage: after2,
  },
];

const Homepage = () => {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [activeServiceId, setActiveServiceId] = useState<number | null>(0);
  const [contactOpen, setContactOpen] = useState(false);
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
  const isAgentConfigured = Boolean(N8N_WEBHOOK_URL);

  const whatsappLink = whatsappNumber ? `https://wa.me/55${whatsappNumber.replace(/\D/g, '')}` : '#';

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
    <div className="min-h-screen bg-background">
      <main itemScope itemType="https://schema.org/AutoRepair">

        <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
          <div className="container flex h-16 items-center justify-between">
            <img src={arycarLogo} alt="ARYCAR Estética Automotiva" className="h-10 w-auto" />
            <nav className="hidden items-center gap-3 md:flex">
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
          </div>
        </header>

        <section className="relative overflow-hidden py-20 lg:py-28">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/5" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.2),transparent_40%)]" />
          <div className="container relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6 text-center lg:text-left">
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                Centro premium de estética automotiva
              </span>
              <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Cuidado técnico, visual impecável e <span className="text-primary">resultado que impressiona</span>
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Atendemos carros, motos e utilitários com protocolos profissionais de limpeza, proteção e restauração. Tudo com agendamento rápido, suporte humanizado e opção de leva e traz.
              </p>
              <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
                <Button size="lg" className="h-12 px-8 text-base" asChild>
                  <a href="#servicos">Conhecer serviços</a>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 text-base" onClick={() => setContactOpen(true)}>
                  Falar com especialista
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-muted-foreground lg:justify-start">
                {['Agendamento rápido', 'Leva e traz', 'Atendimento para frotas', 'Equipe certificada'].map((pill) => (
                  <span key={pill} className="rounded-full border border-border/80 bg-card/60 px-3 py-1">
                    {pill}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
                <div className="rounded-xl border border-border/80 bg-card/50 p-3">
                  <p className="text-xl font-bold text-primary">+4.500</p>
                  <p className="text-xs text-muted-foreground">veículos atendidos</p>
                </div>
                <div className="rounded-xl border border-border/80 bg-card/50 p-3">
                  <p className="text-xl font-bold text-primary">4.9/5</p>
                  <p className="text-xs text-muted-foreground">avaliação média dos clientes</p>
                </div>
                <div className="rounded-xl border border-border/80 bg-card/50 p-3">
                  <p className="text-xl font-bold text-primary">Até 12x</p>
                  <p className="text-xs text-muted-foreground">condições facilitadas</p>
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md rounded-3xl border border-primary/20 bg-card/70 p-6 shadow-2xl shadow-primary/20 backdrop-blur">
              <img src={arycarLogo} alt="Logo Arycar" className="mx-auto h-40 w-auto drop-shadow-2xl" />
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

        <section id="servicos" className="bg-card/40 py-20">
          <div className="container">
            <div className="mb-12 text-center">
              <span className="text-sm font-semibold uppercase tracking-widest text-primary">O que fazemos</span>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Serviços projetados para cada detalhe</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Cards adaptados para desktop e mobile. Toque em qualquer card e veja a solução ideal para o seu veículo.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => {
                  const isActive = activeServiceId === service.id;

                  return (
                    <article
                      key={service.id}
                      className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ${
                        isActive
                          ? 'border-primary/50 bg-card shadow-lg shadow-primary/20'
                          : 'border-border/80 bg-background/70 hover:border-primary/40'
                      }`}
                    >
                      <button
                        onClick={() => setActiveServiceId((prev) => (prev === service.id ? null : service.id))}
                        className="relative z-10 w-full text-left"
                        aria-expanded={isActive}
                      >
                        <img
                          src={service.image}
                          alt={service.title}
                          className="absolute inset-0 h-full w-full object-cover opacity-10 transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="relative z-10">
                          <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-2 text-primary">
                            <service.icon className="h-5 w-5" />
                          </div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{service.subtitle}</p>
                          <h3 className="mt-1 text-lg font-bold">{service.title}</h3>
                          <div className="mt-4 flex items-center gap-2 text-xs text-primary">
                            <MousePointerClick className="h-4 w-4" />
                            {isActive ? 'Toque para recolher' : 'Toque para expandir'}
                          </div>
                        </div>
                      </button>

                      {isActive && (
                        <div className="relative z-10 mt-5 space-y-4 border-t border-border/70 pt-4">
                          <p className="text-sm leading-relaxed text-muted-foreground">{service.desc}</p>
                          <ul className="space-y-2 text-sm">
                            {service.features.map((feature) => (
                              <li key={feature} className="rounded-lg border bg-background/80 px-3 py-2">• {feature}</li>
                            ))}
                          </ul>
                          <Button className="w-full" onClick={() => setContactOpen(true)}>
                            Solicitar orçamento
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </article>
                  );
                })}
            </div>
          </div>
        </section>

        <section id="galeria" className="py-20">
          <div className="container">
            <div className="mb-12 text-center">
              <span className="text-sm font-semibold uppercase tracking-widest text-primary">Galeria de resultados reais</span>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Compare o antes e depois deslizando</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                Escolha um dos 4 serviços abaixo e arraste para os lados para visualizar o efeito do serviço no veículo.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {beforeAfterShowcases.map((showcase) => {
                const service = services[showcase.serviceId];
                const isActive = activeShowcaseId === showcase.id;

                return (
                  <button
                    key={showcase.id}
                    onClick={() => setActiveShowcaseId(showcase.id)}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
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

            <article className="rounded-2xl border border-primary/30 bg-card p-4 shadow-lg shadow-primary/10 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold">{activeShowcase.title}</h3>
                  <p className="text-sm text-muted-foreground">{activeShowcase.description}</p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Arraste para comparar</p>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-border/80">
                <img
                  src={activeShowcase.afterImage}
                  alt={`${activeShowcase.title} - Depois`}
                  className="h-64 w-full object-cover sm:h-[420px]"
                  loading="lazy"
                />
                <img
                  src={activeShowcase.beforeImage}
                  alt={`${activeShowcase.title} - Antes`}
                  className="absolute inset-0 h-64 w-full object-cover sm:h-[420px]"
                  style={{ clipPath: `inset(0 ${100 - (comparisonPositions[activeShowcase.id] ?? 50)}% 0 0)` }}
                  loading="lazy"
                />

                <div
                  className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
                  style={{ left: `${comparisonPositions[activeShowcase.id] ?? 50}%` }}
                >
                  <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-black/50 text-[10px] font-bold text-white">
                    ↔
                  </div>
                </div>

                <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">Antes</div>
                <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">Depois</div>

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

        <section className="bg-card/50 py-20">
          <div className="container grid grid-cols-1 gap-10 md:grid-cols-3">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold">Leva e traz com segurança</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">Buscamos e entregamos seu veículo no endereço desejado com protocolos de cuidado durante todo o trajeto.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold">Produtos e equipe especializada</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">Combinamos marcas premium, técnicas atualizadas e acabamento minucioso para máxima valorização do seu carro.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
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

      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center gap-4">
          <img src={arycarLogo} alt="ARYCAR" className="h-12 w-auto opacity-60" />
          <p className="text-center text-sm text-muted-foreground">© {new Date().getFullYear()} ARYCAR Estética Automotiva. Todos os direitos reservados.</p>
        </div>
      </footer>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {contactOpen && (
          <div className="w-[min(92vw,360px)] rounded-2xl border border-primary/30 bg-card/95 p-4 text-left shadow-2xl shadow-primary/20 backdrop-blur">
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
          className="max-w-[280px] rounded-2xl border border-primary/30 bg-card/95 p-4 text-left shadow-2xl shadow-primary/20 backdrop-blur"
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
          className="fixed bottom-28 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(142,71%,45%)] text-white shadow-xl transition-transform hover:scale-110 active:scale-95"
          aria-label="WhatsApp"
        >
          <MessageCircle className="h-7 w-7" />
        </a>
      )}
    </div>
  );
};

export default Homepage;
