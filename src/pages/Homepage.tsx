import { Link } from 'react-router-dom';
import { Car, Sparkles, Shield, Clock, MapPin, Phone, Mail, ChevronRight, MessageCircle, Droplets, Sun, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { storageService } from '@/services/storage';
import { toast } from 'sonner';

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

const services = [
  { icon: Sparkles, title: 'Polimento', desc: 'Polimento comercial e técnico com correção de pintura e brilho espelhado.', image: servicePolimento },
  { icon: Shield, title: 'Vitrificação', desc: 'Proteção cerâmica duradoura para pintura com acabamento hidrofóbico.', image: serviceVitrificacao },
  { icon: Droplets, title: 'Lavagem Detalhada', desc: 'Limpeza completa interna e externa com produtos premium.', image: serviceLavagem },
  { icon: Clock, title: 'Higienização', desc: 'Sanitização com ozônio, limpeza profunda de estofados e carpetes.', image: serviceHigienizacao },
  { icon: Sun, title: 'Tratamento de Couro', desc: 'Hidratação e proteção de bancos e painéis em couro.', image: serviceCouro },
  { icon: Car, title: 'Restauração de Faróis', desc: 'Recuperação da transparência e aplicação de proteção UV.', image: serviceFarois },
];

const gallery = [
  { before: before1, after: after1, title: 'Polimento de Pintura', desc: 'Correção de riscos e brilho espelhado' },
  { before: before2, after: after2, title: 'Higienização Interna', desc: 'Limpeza profunda de estofados' },
  { before: before3, after: after3, title: 'Restauração de Faróis', desc: 'Recuperação total da transparência' },
];

const BeforeAfterCard = ({ item }: { item: typeof gallery[0] }) => {
  const [showAfter, setShowAfter] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card">
      <div
        className="relative h-64 overflow-hidden cursor-pointer"
        onMouseEnter={() => setShowAfter(true)}
        onMouseLeave={() => setShowAfter(false)}
        onClick={() => setShowAfter(v => !v)}
      >
        <img
          src={item.before}
          alt={`Antes - ${item.title}`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${showAfter ? 'opacity-0' : 'opacity-100'}`}
          loading="lazy"
        />
        <img
          src={item.after}
          alt={`Depois - ${item.title}`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${showAfter ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold backdrop-blur-sm border ${showAfter ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-destructive/20 border-destructive/40 text-destructive'}`}>
            {showAfter ? 'DEPOIS' : 'ANTES'}
          </span>
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-background/70 backdrop-blur-sm px-3 py-1 text-[10px] text-muted-foreground">
            {showAfter ? 'Voltar para antes' : 'Passe o mouse para ver'}
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold">{item.title}</h3>
        <p className="text-sm text-muted-foreground">{item.desc}</p>
      </div>
    </div>
  );
};

const Homepage = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    const settings = storageService.getSettings();
    setWhatsappNumber(settings.whatsappNumber || '');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error('Preencha nome e telefone');
      return;
    }
    toast.success('Mensagem enviada com sucesso! Entraremos em contato.');
    setName('');
    setPhone('');
    setMessage('');
  };

  const whatsappLink = whatsappNumber
    ? `https://wa.me/55${whatsappNumber.replace(/\D/g, '')}`
    : '#';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={arycarLogo} alt="ARYCAR Logo" className="h-10 w-auto" />
          </div>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <a href="#servicos">Serviços</a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="#galeria">Galeria</a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="#contato">Contato</a>
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

      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-36">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.1),transparent_60%)]" />
        <div className="container relative flex flex-col items-center text-center space-y-8">
          <img
            src={arycarLogo}
            alt="ARYCAR Lava-Rápido"
            className="h-40 w-auto md:h-52 lg:h-64 drop-shadow-2xl"
          />
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Estética Automotiva
            <span className="block text-primary">de Excelência</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Cuidamos do seu veículo com produtos premium e técnicas profissionais.
            Carros, motos e caminhões — com serviço de <strong className="text-foreground">Leva e Traz</strong>.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <a href="#contato">Solicitar Orçamento</a>
            </Button>
            {whatsappNumber && (
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="servicos" className="py-20 bg-card/50">
        <div className="container">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-primary uppercase tracking-widest">O que fazemos</span>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Nossos Serviços</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Cada serviço é executado com atenção aos detalhes e produtos de alta performance.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={s.image}
                    alt={s.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                  <div className="absolute bottom-3 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Gallery */}
      <section id="galeria" className="py-20">
        <div className="container">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-primary uppercase tracking-widest">Resultados</span>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Antes e Depois</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Veja a transformação que nossos serviços proporcionam. Passe o mouse para comparar.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.map((item, i) => (
              <BeforeAfterCard key={i} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card/50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Leva e Traz</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Buscamos e entregamos seu veículo no endereço que preferir com total segurança.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Produtos Premium</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Utilizamos Vonixx, Meguiar's e outras marcas referência no mercado.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Agilidade</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Prazos cumpridos com qualidade profissional garantida em cada entrega.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contato" className="py-20">
        <div className="container max-w-lg">
          <div className="text-center mb-10">
            <span className="text-sm font-semibold text-primary uppercase tracking-widest">Contato</span>
            <h2 className="mt-2 text-3xl font-bold">Fale Conosco</h2>
          </div>
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xl shadow-primary/5">
            <div>
              <Label className="text-xs">Nome *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" />
            </div>
            <div>
              <Label className="text-xs">Telefone *</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <Label className="text-xs">Mensagem</Label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Descreva o serviço desejado..." rows={4} />
            </div>
            <Button type="submit" className="w-full h-11">
              <Mail className="mr-2 h-4 w-4" />
              Enviar Mensagem
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center gap-4">
          <img src={arycarLogo} alt="ARYCAR" className="h-12 w-auto opacity-60" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ARYCAR Estética Automotiva. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* WhatsApp FAB */}
      {whatsappNumber && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(142,71%,45%)] text-white shadow-xl transition-transform hover:scale-110 active:scale-95"
          aria-label="WhatsApp"
        >
          <MessageCircle className="h-7 w-7" />
        </a>
      )}
    </div>
  );
};

export default Homepage;
