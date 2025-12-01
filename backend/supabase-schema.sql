-- ============================================
-- Schema SQL para Supabase
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================

-- Tabela de usuários (perfis)
-- Nota: O Supabase já tem auth.users, esta tabela armazena dados adicionais
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'cliente' CHECK (role IN ('cliente', 'barbeiro')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de serviços
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  barbeiro_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'accepted', 'rejected', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON public.appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Políticas RLS (Row Level Security)
-- ============================================

-- Políticas para users
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para services (todos podem ver, apenas barbeiros podem modificar)
CREATE POLICY "Anyone can view services"
  ON public.services FOR SELECT
  USING (true);

-- Políticas para appointments
CREATE POLICY "Users can view own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Barbeiros can manage appointments"
  ON public.appointments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'barbeiro'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'barbeiro'
    )
    AND (
      NEW.barbeiro_id IS NULL OR NEW.barbeiro_id = auth.uid()
    )
  );

-- Barbeiros podem ver todos os agendamentos
CREATE POLICY "Barbeiros can view all appointments"
  ON public.appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'barbeiro'
    )
  );

-- ============================================
-- Função RPC para executar SQL direto (opcional)
-- Use apenas se precisar manter compatibilidade com queries SQL complexas
-- ============================================

CREATE OR REPLACE FUNCTION public.execute_sql(
  query_text text,
  query_params jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  sql_result record;
  rows_array jsonb := '[]'::jsonb;
BEGIN
  -- Executar query dinâmica
  FOR sql_result IN EXECUTE query_text USING query_params
  LOOP
    rows_array := rows_array || to_jsonb(sql_result);
  END LOOP;
  
  RETURN jsonb_build_object(
    'rows', rows_array,
    'rowCount', jsonb_array_length(rows_array)
  );
END;
$$;

-- ============================================
-- Trigger para atualizar updated_at automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Dados iniciais (opcional)
-- ============================================

-- Inserir alguns serviços de exemplo (opcional)
-- INSERT INTO public.services (name, description, price, duration_minutes) VALUES
--   ('Corte de Cabelo', 'Corte de cabelo masculino', 25.00, 30),
--   ('Barba', 'Aparar e modelar barba', 15.00, 20),
--   ('Corte + Barba', 'Pacote completo', 35.00, 45)
-- ON CONFLICT DO NOTHING;

