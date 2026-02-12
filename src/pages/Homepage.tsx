import { Link } from 'react-router-dom';
import { Car, Sparkles, Shield, Clock, MapPin, Phone, Mail, ChevronRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { storageService } from '@/services/storage';
import { toast } from 'sonner';

const services = [
  { icon: Sparkles, title: 'Polimento', desc: 'Comercial e técnico com resultados profissionais' },
  { icon: Shield, title: 'Vitrificação', desc: 'Proteção duradoura para pintura, faróis e couro' },
  { icon: Car, title: 'Lavagem Detalhada', desc: 'Limpeza completa interna e externa' },
  { icon: Clock, title: 'Higienização', desc: 'Sanitização com ozônio e limpeza profunda' },
];

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
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-lg" style={{ fontFamily: 'Space Grotesk' }}>
              A
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
              ARYCAR
            </span>
          </div>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <a href="#servicos">Serviços</a>
            </Button>
            <Button variant="ghost" asChild>
              <a href="#contato">Contato</a>
            </Button>
            <Button asChild>
              <Link to="/login">
                Área de Gestão
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div className="container relative text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Estética Automotiva
            <span className="block text-primary">de Excelência</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Cuidamos do seu veículo com produtos premium e técnicas profissionais.
            Carros, motos e caminhões — com serviço de Leva e Traz.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <a href="#contato">
                Solicitar Orçamento
              </a>
            </Button>
            {whatsappNumber && (
              <Button size="lg" variant="outline" asChild>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="servicos" className="py-16 bg-card/50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Nossos Serviços</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, i) => (
              <div key={i} className="glass-card rounded-xl p-6 text-center space-y-3 hover:border-primary/40 transition-colors">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <MapPin className="h-8 w-8 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Leva e Traz</h3>
                <p className="text-sm text-muted-foreground">Buscamos e entregamos seu veículo no endereço que preferir.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Produtos Premium</h3>
                <p className="text-sm text-muted-foreground">Utilizamos produtos Vonixx e marcas de referência no mercado.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="h-8 w-8 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Agilidade</h3>
                <p className="text-sm text-muted-foreground">Prazos cumpridos com qualidade profissional garantida.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contato" className="py-16 bg-card/50">
        <div className="container max-w-lg">
          <h2 className="text-3xl font-bold text-center mb-8">Fale Conosco</h2>
          <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-4">
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
            <Button type="submit" className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Enviar Mensagem
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ARYCAR Estética Automotiva. Todos os direitos reservados.</p>
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
