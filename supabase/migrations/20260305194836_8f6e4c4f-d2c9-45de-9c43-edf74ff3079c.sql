INSERT INTO public.client_statuses (key, label, class_name, sort_order)
VALUES 
  ('implementacao', 'Implementação', 'bg-info-light text-info border-info/20', 1),
  ('inativo', 'Inativo', 'bg-destructive/10 text-destructive border-destructive/20', 4)
ON CONFLICT (key) DO NOTHING;