import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck, ClipboardList, Camera, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ChecklistType = 'entry' | 'exit';

interface ChecklistItem {
  id: string;
  label: string;
  category: string;
}

const checklistItems: ChecklistItem[] = [
  // Exterior
  { id: 'paint_scratches', label: 'Riscos na pintura', category: 'Exterior' },
  { id: 'dents', label: 'Amassados', category: 'Exterior' },
  { id: 'mirrors', label: 'Retrovisores (estado)', category: 'Exterior' },
  { id: 'windshield', label: 'Para-brisa (trincas/chips)', category: 'Exterior' },
  { id: 'headlights', label: 'Faróis (funcionamento)', category: 'Exterior' },
  { id: 'taillights', label: 'Lanternas (funcionamento)', category: 'Exterior' },
  { id: 'tires', label: 'Pneus (estado geral)', category: 'Exterior' },
  { id: 'hubcaps', label: 'Calotas/Rodas', category: 'Exterior' },
  { id: 'antenna', label: 'Antena', category: 'Exterior' },
  { id: 'wipers', label: 'Palhetas do limpador', category: 'Exterior' },

  // Interior
  { id: 'seats', label: 'Bancos (rasgos/manchas)', category: 'Interior' },
  { id: 'dashboard', label: 'Painel (estado)', category: 'Interior' },
  { id: 'steering', label: 'Volante (estado)', category: 'Interior' },
  { id: 'ac', label: 'Ar condicionado', category: 'Interior' },
  { id: 'radio', label: 'Rádio/Multimídia', category: 'Interior' },
  { id: 'carpets', label: 'Tapetes', category: 'Interior' },
  { id: 'ceiling', label: 'Teto interno', category: 'Interior' },
  { id: 'seatbelts', label: 'Cintos de segurança', category: 'Interior' },

  // Itens do veículo
  { id: 'spare_tire', label: 'Estepe', category: 'Itens' },
  { id: 'jack', label: 'Macaco', category: 'Itens' },
  { id: 'wrench', label: 'Chave de roda', category: 'Itens' },
  { id: 'triangle', label: 'Triângulo', category: 'Itens' },
  { id: 'documents', label: 'Documentos no veículo', category: 'Itens' },
  { id: 'fuel_level', label: 'Nível de combustível', category: 'Itens' },
];

interface ChecklistState {
  [key: string]: { checked: boolean; note: string };
}

interface VehicleChecklistProps {
  type: ChecklistType;
  vehiclePlate: string;
  onSave: (data: { type: ChecklistType; items: ChecklistState; generalObs: string }) => void;
}

const VehicleChecklist = ({ type, vehiclePlate, onSave }: VehicleChecklistProps) => {
  const [items, setItems] = useState<ChecklistState>(() => {
    const initial: ChecklistState = {};
    checklistItems.forEach(item => {
      initial[item.id] = { checked: false, note: '' };
    });
    return initial;
  });
  const [generalObs, setGeneralObs] = useState('');

  const toggleItem = (id: string) => {
    setItems(prev => ({
      ...prev,
      [id]: { ...prev[id], checked: !prev[id].checked },
    }));
  };

  const setItemNote = (id: string, note: string) => {
    setItems(prev => ({
      ...prev,
      [id]: { ...prev[id], note },
    }));
  };

  const handleSave = () => {
    onSave({ type, items, generalObs });
  };

  const categories = [...new Set(checklistItems.map(i => i.category))];
  const isEntry = type === 'entry';

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          {isEntry ? (
            <ClipboardList className="h-5 w-5 text-primary" />
          ) : (
            <ClipboardCheck className="h-5 w-5 text-primary" />
          )}
          Checklist de {isEntry ? 'Entrada' : 'Saída'} — {vehiclePlate}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isEntry
            ? 'Registre o estado do veículo na chegada. Marque itens com problemas/avarias.'
            : 'Registre o estado do veículo na entrega. Confirme os itens verificados.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map(category => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">{category}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {checklistItems
                .filter(item => item.category === category)
                .map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      'rounded-lg border p-3 transition-colors',
                      items[item.id].checked
                        ? isEntry
                          ? 'border-warning/50 bg-warning/5'
                          : 'border-primary/50 bg-primary/5'
                        : 'border-border bg-card'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={item.id}
                        checked={items[item.id].checked}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                      <Label htmlFor={item.id} className="text-sm cursor-pointer flex-1">
                        {item.label}
                      </Label>
                    </div>
                    {items[item.id].checked && (
                      <input
                        type="text"
                        placeholder="Observação..."
                        value={items[item.id].note}
                        onChange={e => setItemNote(item.id, e.target.value)}
                        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}

        <div>
          <Label className="text-xs">Observações Gerais</Label>
          <Textarea
            value={generalObs}
            onChange={e => setGeneralObs(e.target.value)}
            placeholder="Observações adicionais sobre o estado do veículo..."
            rows={3}
          />
        </div>

        <Button className="w-full h-11" onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Salvar Checklist de {isEntry ? 'Entrada' : 'Saída'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default VehicleChecklist;
