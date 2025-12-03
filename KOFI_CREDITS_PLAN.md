# 💎 Ko-fi Credits System - Plan de Implementación

**Estado:** ✅ Listo para desarrollo | **Lanzamiento:** Enero 1, 2026
**Última actualización:** Diciembre 3, 2025

---

## 🎯 Decisiones Clave

| Aspecto | Decisión |
|---------|----------|
| **Equidad** | 🏆 Beneficios NO afectan concursos (100% equitativo) |
| **Lanzamiento** | 🚀 Limpio en 2026 (todos empiezan desde cero) |
| **MVP** | 📖 Historia Libre (2 cr) + Avatar (3 cr) + Exportar PDF (1 cr) |
| **Path Gratuito** | ⭐ 40% créditos por mérito (ganar retos, logros, participación) |
| **Consumibles** | 🔄 80% beneficios consumibles → demanda recurrente |

**Beneficios ELIMINADOS por equidad:** Historia Extendida en concurso, Destaque 24h, Vista previa de prompt

---

## 📊 Contexto y Justificación

### Situación Actual

- **105 usuarios registrados** (20 activos mensuales)
- **5 donaciones orgánicas** = 4.7% conversión (excelente)
- **Donaciones actuales:** Una sola vez, sin incentivo para repetir
- **Problema:** Sin beneficios tangibles, las donaciones son puramente altruistas

### Por Qué Ko-fi Credits

✅ **Incentiva donaciones recurrentes** - Los créditos se gastan, se necesitan más
✅ **No es pay-to-win** - Los beneficios NO dan ventaja en concursos
✅ **Fácil de implementar** - Sistema simple de créditos y transacciones
✅ **Escalable** - Se pueden agregar más beneficios gradualmente
✅ **Mantiene equidad** - Usuarios gratuitos pueden competir y ganar igual

---

## 🎯 Sistema de Créditos

### Formas de Obtener Créditos

#### 1. Donaciones en Ko-fi

| Donación | Créditos | Bonus | Costo por crédito |
| -------- | -------- | ----- | ----------------- |
| $3 USD   | 3        | -     | $1.00             |
| $5 USD   | 6        | +1    | $0.83             |
| $10 USD  | 15       | +5    | $0.67             |

**Incentivo:** Donaciones mayores dan más valor por dólar

**Asignación Manual (MVP):**

- **Proceso:** Usuario dona → envía screenshot → admin asigna créditos manualmente
- **Tabla admin:** Panel simple para asignar créditos por user_id
- **Notificación:** Email al usuario confirmando créditos recibidos
- **Futuro:** Integración automática con Ko-fi webhooks (Fase 4)

---

#### 2. Ganar Retos Mensuales 🏆

**Path gratuito para obtener créditos:**

| Posición     | Créditos | Equivalente |
| ------------ | -------- | ----------- |
| 🥇 1er lugar | 5        | ~$5 USD     |
| 🥈 2do lugar | 3        | $3 USD      |
| 🥉 3er lugar | 2        | ~$2 USD     |

**Por qué funciona:**

- ✅ **Incentiva participación de calidad** - No solo donar, también escribir bien
- ✅ **Mantiene equidad** - Path alternativo gratuito para obtener créditos
- ✅ **Aumenta emoción de ganar** - Badge + créditos = doble premio
- ✅ **Crea loop de engagement** - Ganar → créditos → usar beneficios → participar más

**Implementación:**

- Al finalizar reto: Función SQL `assign_winner_credits(user_id, position)`
- Email de felicitación: "¡Ganaste! + recibiste X créditos Ko-fi"
- Créditos aparecen automáticamente en dashboard
- Transacción registrada con metadata del reto ganado

**Importante:**

- ⚠️ SIEMPRE mencionar ganadores PRIMERO que donaciones en comunicación
- ✅ Posiciona como "no es solo pay-to-win"
- ✅ Da esperanza real a usuarios gratuitos

---

#### 3. Logros de Calidad y Participación 🎯 (Fase 2)

**Path adicional para obtener créditos mediante mérito:**

| Logro | Créditos | Frecuencia | Dificultad |
|-------|----------|------------|------------|
| 📝 **Racha de 3 historias** | 1 | Cada 3 retos consecutivos | Media |
| ⭐ **Umbral de excelencia** (10+ votos) | 2 | Una vez por historia | Alta |
| 🎨 **Historia destacada** (curación admin) | 3 | Discrecional | Muy alta |
| 🔥 **Streak de 6 meses** | 5 | Una vez | Muy alta |
| 🏅 **Top 5 en un reto** | 1 | Por reto | Media |
| 💬 **Participación activa** | 1 | Por reto | Baja |

**Detalles de implementación:**

**📝 Racha de 3 historias consecutivas:**
- Publicar historia en 3 retos seguidos (sin saltarse ninguno)
- Función SQL verifica continuidad en tabla `stories`
- Badge temporal "🔥 En racha" mientras esté activo
- Crédito se otorga automáticamente al completar el 3er reto

**⭐ Umbral de excelencia (10+ votos):**
- Historia recibe 10 o más votos en un reto
- Indica calidad excepcional reconocida por la comunidad
- Máximo 1 crédito por historia (no acumulable)
- Trigger SQL automático al cerrar fase de votación

**🎨 Historia destacada (curación admin):**
- Admin selecciona 2-3 historias excepcionales cada mes
- Criterio: calidad literaria, originalidad, adherencia al prompt
- Post público explicando por qué fueron elegidas
- Badge permanente "⭐ Destacada"
- Más valioso que ganar (3 créditos vs 2-5)

**🔥 Streak de 6 meses:**
- Participar 6 meses consecutivos
- Premio único (se puede obtener solo una vez)
- Badge permanente "💎 Veterano Letranido"

**🏅 Top 5 en un reto:**
- Finalizar en posiciones 4 o 5
- Reconoce esfuerzo más allá del podio
- 1 crédito (menor que podio para mantener incentivo)

**💬 Participación activa:**
- Votar en 5 historias del reto actual
- Dejar 3 comentarios constructivos (mínimo 50 caracteres)
- Máximo 1 crédito por reto
- Incentiva engagement saludable

**Distribución mensual estimada (con logros):**

| Fuente | Créditos/mes | % del total |
|--------|--------------|-------------|
| 💰 Donaciones Ko-fi | 30-50 | **60%** |
| 🏆 Ganar retos (top 3) | 10 | 15% |
| ⭐ Historias destacadas | 6 | 10% |
| 📝 Logros de participación | 8-10 | 10% |
| 💬 Engagement activo | 3-5 | 5% |

**Ratio saludable:** 60% monetización + 40% mérito gratuito

**Por qué NO dar créditos por votos directos:**

- ❌ **Incentiva gaming**: Usuarios llaman amigos solo para votar
- ❌ **Grupos de votación mutua**: "Voto por ti si votas por mí"
- ❌ **Rompe equidad**: Se vuelve concurso de popularidad, no mérito
- ❌ **Desincentiva donaciones**: ¿Para qué donar si consigo créditos con votos?

**En cambio, umbral de 10+ votos:**

- ✅ **Indica calidad real**: Difícil manipular 10+ personas
- ✅ **Premia excelencia**: Solo historias excepcionales
- ✅ **No es gaming directo**: Requiere escritura de calidad
- ✅ **Complementa donaciones**: Path difícil, donaciones siguen siendo más fáciles

---

## 🎁 Catálogo de Beneficios (100% Equitativos)

**Principio rector:** Beneficios NO afectan competencia en concursos activos

---

### 📖 Categoría 1: Contenido Extra (Fuera de Concurso)

#### 1. Historia Libre (2 créditos) ⭐ **MVP**

- **Qué es:** Publicar 1 historia completamente **fuera de concurso**
- **Dónde aparece:** Galería separada "Historias Libres"
- **Límite:** 2000 palabras
- **Interacción:** Likes y comentarios de la comunidad
- **Equidad:** ✅ NO compite en retos, cero impacto en concursos

**Flujo:**
1. Usuario: "Tengo idea que no encaja con prompt actual"
2. Clic "Escribir Historia Libre" → gasta 2 créditos
3. Editor con 2000 palabras → publica
4. Aparece en galería separada, fuera del reto

**Por qué es MVP:**
- ✅ 100% equitativo (no toca concursos)
- ✅ Consumible (genera demanda recurrente)
- ✅ Mantiene usuarios activos entre retos
- ✅ Genera contenido extra para la plataforma

---

#### 2. Historia "Fuera de Temporada" (1 crédito)

- **Qué es:** Publicar en un **reto pasado** que ya cerró
- **Aparece como:** "Contribución Tardía" en archivo histórico
- **No puede:** Ganar ni recibir votos (solo portafolio)
- **Equidad:** ✅ Reto ya finalizó, cero impacto

**Caso de uso:** "Se me ocurrió idea genial para el reto de julio, pero ya cerró"

---

### 🎨 Categoría 2: Personalización del Perfil

#### 3. Avatar Personalizado (3 créditos)

- Subir imagen propia vs avatar generado
- Badge "🎨 Avatar Personalizado" visible en perfil
- **Equidad:** ✅ Cosmético puro, cero ventaja competitiva

#### 4. Banner de Perfil (2 créditos)

- Imagen de fondo en perfil público
- Diseño profesional o imagen propia
- **Equidad:** ✅ Personalización visual, no afecta concursos

#### 5. Biografía Extendida (1 crédito)

- Límite: 200 → 500 caracteres
- Sección "Sobre mi escritura" + links adicionales
- **Equidad:** ✅ Solo mejora perfil personal

---

### 📦 Categoría 3: Utilidades y Portafolio

#### 6. Exportar Historia PDF/EPUB (1 crédito por historia)

- Descarga profesional con logo Letranido
- Ideal para portafolio o compartir
- **Equidad:** ✅ Beneficio post-concurso
- **Consumible:** Sí (1 crédito por cada historia exportada)

#### 7. Compilación Anual PDF (5 créditos)

- Todas tus historias del año en un PDF tipo libro
- Diseño profesional, índice, portada personalizada
- Solo disponible en Diciembre
- **Equidad:** ✅ Portafolio personal, no afecta concursos
- **Consumible:** Sí (cada año nuevo)

#### 8. Análisis de Escritura con IA (2 créditos)

- Análisis de estilo: palabras favoritas, complejidad, tono
- Sugerencias de mejora automáticas
- Funciona con historias ya publicadas
- **Equidad:** ✅ Herramienta de aprendizaje post-concurso

---

### 🌟 Categoría 4: Experiencias Premium

#### 9. "Café Virtual" con Admin (10 créditos) - Fase 3

- Sesión 30 min Zoom/Meet con admin
- Feedback personalizado sobre escritura
- Límite: 2 por mes (escasez)
- **Equidad:** ✅ Coaching personal, no afecta concursos
- **Consumible:** Sí (alto costo = incentiva donaciones)

#### 10. Comentario Destacado (1 crédito)

- Tu comentario en historia ajena aparece destacado (dorado)
- Más visible para la comunidad
- Solo en historias de otros usuarios
- **Equidad:** ✅ Fomenta engagement, no afecta tu historia

---

## 🚫 Beneficios ELIMINADOS por Equidad

| Beneficio Rechazado | Razón de Eliminación |
|---------------------|---------------------|
| ❌ Historia Extendida (2000 palabras en concurso) | Ventaja percibida: más espacio para desarrollar historia ganadora |
| ❌ Destaque 24h en reto actual | Más visibilidad = potencialmente más votos |
| ❌ Vista previa de prompt | Tiempo extra de preparación |
| ❌ Publicar 2 historias en un reto | Doble oportunidad de ganar |
| ❌ Votar 5 veces (vs 3) | Manipulación de votación |

**Mensaje clave:** "Los concursos son 100% equitativos. Créditos = beneficios extra, NO ventajas competitivas."

---

## 🔄 Estrategias para Incentivar GASTO de Créditos

**Objetivo:** Tasa de gasto del **70%+** (créditos ganados se gastan en 30 días)

**Problema a evitar:** Usuarios acumulan créditos sin gastar → no vuelven a donar

### 7 Tácticas Clave

| # | Táctica | Implementación | Resultado Esperado |
|---|---------|----------------|-------------------|
| 1️⃣ | **80% Consumibles** | Historia Libre, Exportar PDF, Análisis IA | "Se acabaron" → donar más |
| 2️⃣ | **Ofertas Temporales** | "Solo este mes: Compilación PDF 4 créditos" | FOMO → gasto inmediato |
| 3️⃣ | **Bonus por Gasto** | Gasta 5 → recibe 1 bonus | Incentiva gasto, no acumulación |
| 4️⃣ | **Recordatorios Email** | "Tienes 5+ créditos sin usar por 30 días" | Nudge suave contextual |
| 5️⃣ | **Bundles con Descuento** | 3x Historia Libre = 5 créditos (vs 6) | Gasto múltiple inmediato |
| 6️⃣ | **Dashboard Visible** | Balance + sugerencias contextuales | Recordatorio constante |
| 7️⃣ | **"Gratis" con Gasto** | Gasta 3 → recibe 1 beneficio gratis | Desbloqueo por actividad |

### Métricas Críticas de Gasto

| Métrica | Target | 🚨 Alerta | Acción si falla |
|---------|--------|-----------|-----------------|
| Tasa de gasto mensual | 70%+ | <50% | Enviar recordatorios + crear oferta temporal |
| Tiempo hasta 1er gasto | <7 días | >14 días | Revisar precios de beneficios |
| Usuarios con +10 créditos sin usar | <10% | >20% | Rediseñar catálogo de beneficios |
| Recompra (2da donación) | 30%+ | <20% | Aumentar recordatorios de uso |

---

## 🗄️ Arquitectura de Base de Datos

### Nuevas Tablas

```sql
-- Tabla de balance de créditos por usuario
CREATE TABLE kofi_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_balance INTEGER DEFAULT 0 NOT NULL,
  credits_earned_total INTEGER DEFAULT 0 NOT NULL,
  credits_spent_total INTEGER DEFAULT 0 NOT NULL,
  last_donation_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de transacciones de créditos
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positivo = ganado, Negativo = gastado
  transaction_type TEXT NOT NULL, -- 'earned', 'spent', 'admin_adjustment'
  description TEXT NOT NULL,
  metadata JSONB, -- Info adicional (ej: donation_amount, benefit_used, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de beneficios usados (para auditoría)
CREATE TABLE credit_benefits_used (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  benefit_type TEXT NOT NULL, -- 'extended_words', 'free_story', 'highlight', 'custom_avatar'
  credits_spent INTEGER NOT NULL,
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL, -- Si aplica
  expires_at TIMESTAMPTZ, -- Para beneficios temporales (highlight)
  metadata JSONB, -- Info adicional del beneficio
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_kofi_credits_user ON kofi_credits(user_id);
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(created_at DESC);
CREATE INDEX idx_benefits_user ON credit_benefits_used(user_id);
CREATE INDEX idx_benefits_story ON credit_benefits_used(story_id);
```

### Row Level Security (RLS)

```sql
-- Usuarios solo pueden ver sus propios créditos
ALTER TABLE kofi_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own credits" ON kofi_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Usuarios solo pueden ver sus propias transacciones
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Usuarios solo pueden ver sus propios beneficios
ALTER TABLE credit_benefits_used ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own benefits" ON credit_benefits_used
  FOR SELECT USING (auth.uid() = user_id);

-- Solo admins pueden insertar/modificar créditos
CREATE POLICY "Admins can manage credits" ON kofi_credits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

### Funciones SQL Auxiliares

```sql
-- Función para agregar créditos (uso admin)
CREATE OR REPLACE FUNCTION add_kofi_credits(
  target_user_id UUID,
  credits_amount INTEGER,
  donation_amount NUMERIC,
  admin_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insertar o actualizar balance
  INSERT INTO kofi_credits (user_id, credits_balance, credits_earned_total, last_donation_date)
  VALUES (target_user_id, credits_amount, credits_amount, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    credits_balance = kofi_credits.credits_balance + credits_amount,
    credits_earned_total = kofi_credits.credits_earned_total + credits_amount,
    last_donation_date = NOW(),
    updated_at = NOW();

  -- Registrar transacción
  INSERT INTO credit_transactions (user_id, amount, transaction_type, description, metadata)
  VALUES (
    target_user_id,
    credits_amount,
    'earned',
    'Donación Ko-fi recibida',
    jsonb_build_object(
      'donation_amount', donation_amount,
      'admin_notes', admin_notes
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para gastar créditos (uso usuario)
CREATE OR REPLACE FUNCTION spend_kofi_credits(
  benefit_type TEXT,
  credits_cost INTEGER,
  target_story_id UUID DEFAULT NULL,
  benefit_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  current_balance INTEGER;
  result JSONB;
BEGIN
  -- Verificar balance
  SELECT credits_balance INTO current_balance
  FROM kofi_credits
  WHERE user_id = auth.uid();

  IF current_balance IS NULL OR current_balance < credits_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Créditos insuficientes');
  END IF;

  -- Restar créditos
  UPDATE kofi_credits
  SET credits_balance = credits_balance - credits_cost,
      credits_spent_total = credits_spent_total + credits_cost,
      updated_at = NOW()
  WHERE user_id = auth.uid();

  -- Registrar transacción
  INSERT INTO credit_transactions (user_id, amount, transaction_type, description, metadata)
  VALUES (
    auth.uid(),
    -credits_cost,
    'spent',
    'Beneficio usado: ' || benefit_type,
    benefit_metadata
  );

  -- Registrar beneficio usado
  INSERT INTO credit_benefits_used (user_id, benefit_type, credits_spent, story_id, metadata)
  VALUES (auth.uid(), benefit_type, credits_cost, target_story_id, benefit_metadata);

  RETURN jsonb_build_object('success', true, 'new_balance', current_balance - credits_cost);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎨 Interfaz de Usuario

### 1. Dashboard de Créditos (Perfil del Usuario)

**Ubicación:** `/profile` → Nueva sección "Mis Créditos Ko-fi"

**Componentes:**

```jsx
<KofiCreditsCard>
  {/* Balance actual */}
  <div className="bg-linear-to-br from-pink-400 via-rose-500 to-red-500 rounded-xl p-6">
    <h3>💎 Tus Créditos Ko-fi</h3>
    <div className="text-4xl font-bold">{creditsBalance}</div>
    <p className="text-sm">créditos disponibles</p>
  </div>

  {/* CTA para donar */}
  {creditsBalance < 3 && (
    <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
      <p>¿Quieres más créditos?</p>
      <a href="https://ko-fi.com/letranido" className="btn-primary">
        Donar en Ko-fi →
      </a>
      <p className="text-xs">
        $3 = 3 créditos • $5 = 6 créditos • $10 = 15 créditos
      </p>
    </div>
  )}

  {/* Catálogo de beneficios */}
  <div className="grid grid-cols-2 gap-4">
    <BenefitCard
      title="Historia Extendida"
      cost={1}
      icon="📝"
      description="2000 palabras para una historia"
      onClick={handleExtendWords}
    />
    <BenefitCard
      title="Historia Libre"
      cost={2}
      icon="✨"
      description="Publica fuera de concursos"
      onClick={handleFreeStory}
    />
    {/* ... más beneficios */}
  </div>

  {/* Historial de transacciones */}
  <TransactionHistory transactions={transactions} />
</KofiCreditsCard>
```

---

### 2. Panel de Admin para Asignar Créditos

**Ubicación:** `/admin` → Nueva pestaña "Ko-fi Credits"

**Funcionalidad:**

```jsx
<AdminKofiPanel>
  <h2>Asignar Créditos Ko-fi</h2>

  <form onSubmit={handleAssignCredits}>
    <input
      type="email"
      placeholder="Email del usuario"
      value={userEmail}
      onChange={(e) => setUserEmail(e.target.value)}
    />

    <select value={donationAmount}>
      <option value="3">$3 USD → 3 créditos</option>
      <option value="5">$5 USD → 6 créditos</option>
      <option value="10">$10 USD → 15 créditos</option>
      <option value="custom">Personalizado</option>
    </select>

    {donationAmount === "custom" && (
      <input type="number" placeholder="Cantidad de créditos" />
    )}

    <textarea
      placeholder="Notas (opcional): Screenshot de Ko-fi, etc."
      value={adminNotes}
    />

    <button type="submit" className="btn-primary">
      Asignar Créditos
    </button>
  </form>

  {/* Lista de donaciones recientes */}
  <RecentDonations />
</AdminKofiPanel>
```

---

## 🚀 Plan de Implementación por Fases

### 📅 Fase 1: MVP - Historia Extendida (1-2 semanas)

**Objetivo:** Validar el sistema con la funcionalidad más simple

**Tareas:**

1. ✅ Crear tablas de BD (`kofi_credits`, `credit_transactions`, `credit_benefits_used`)
2. ✅ Crear funciones SQL (`add_kofi_credits`, `spend_kofi_credits`)
3. ✅ Implementar RLS policies
4. ✅ Panel admin para asignar créditos manualmente
5. ✅ Dashboard de créditos en perfil de usuario
6. ✅ Implementar beneficio "Historia Extendida"
   - Modificar límite de palabras en editor
   - Botón "Usar crédito" en página de escritura
   - Validación de créditos disponibles
   - Badge "✨ Historia Extendida" visible
7. ✅ Email de confirmación al recibir créditos
8. ✅ Testear con 2-3 donantes actuales
9. ✅ Iterar según feedback

**Criterio de éxito:**

- ✅ 3+ donantes prueban la funcionalidad
- ✅ Feedback positivo sobre el sistema
- ✅ Al menos 1 usuario usa "Historia Extendida"

---

### 📅 Fase 2: Historias Libres (2-3 semanas)

**Objetivo:** Generar contenido fuera de concursos

**Tareas:**

1. ✅ Nueva tabla `free_stories` o flag en `stories`
2. ✅ Editor especial para historias libres
3. ✅ Página "/historias-libres" con galería
4. ✅ Sistema de likes para historias libres
5. ✅ Integración con créditos (consumir 2 al publicar)
6. ✅ SEO para historias libres

**Criterio de éxito:**

- ✅ 5+ historias libres publicadas
- ✅ Usuarios interactúan (likes, comentarios)

---

### 📅 Fase 3: Más Beneficios (3-4 semanas)

**Objetivo:** Diversificar uso de créditos

**Tareas:**

1. ✅ Implementar "Destaque de Historia"
2. ✅ Implementar "Avatar Personalizado"
3. ✅ Sistema de expiración para beneficios temporales
4. ✅ Notificaciones cuando expiran beneficios

**Criterio de éxito:**

- ✅ Usuarios usan 2+ tipos diferentes de beneficios
- ✅ Tasa de recompra de créditos > 30%

---

### 📅 Fase 4: Automatización (1-2 meses)

**Objetivo:** Eliminar proceso manual

**Tareas:**

1. ✅ Integración con Ko-fi Webhooks
2. ✅ Asignación automática de créditos
3. ✅ Email automático de confirmación
4. ✅ Dashboard de métricas para admin

**Criterio de éxito:**

- ✅ 0% intervención manual en donaciones
- ✅ Créditos asignados en < 5 minutos automáticamente

---

## 📊 KPIs y Dashboard Admin

### Métricas Clave (3 Prioridades)

**1️⃣ Gasto de Créditos** (más importante)
- Tasa gasto mensual: 70%+ (alerta <50%)
- Tiempo hasta 1er gasto: <7 días (alerta >14 días)
- Usuarios +10 sin usar: <10% (alerta >20%)

**2️⃣ Monetización**
- Ingresos mensuales: $80-120
- Recompra (2da donación): 30%+
- Conversión nuevos usuarios: 10%

**3️⃣ Engagement**
- Beneficio más popular: Historia Libre (40%+)
- Beneficios usados/usuario: 2.5/mes
- Usuarios activos con créditos: 60%+

### Dashboard Admin (Mockup)

```jsx
<AdminDashboard>
  <MetricCard title="💰 Ingresos" value="$95" trend="+15%" />
  <MetricCard title="📊 Tasa gasto" value="68%" alert={<70} />
  <MetricCard title="🔄 Recompra" value="32%" trend="+8%" />
  <AlertBox show={gastoMensual < 50}>
    ⚠️ Gasto bajo → Enviar recordatorios + crear oferta temporal
  </AlertBox>
</AdminDashboard>
```

---

## 🎯 Comunicación (Timeline Lanzamiento 2026)

### Noviembre 2025: Teaser "Coming Soon"

**Post Landing + Email:**
> 🎁 **2026: Ko-fi Credits**
>
> Nuevo sistema de beneficios para apoyar Letranido.
> - Donar → créditos
> - Ganar retos → créditos
> - Escribir bien → créditos
>
> Beneficios: Historias libres, personalización, portafolio profesional
>
> ✅ Todos empiezan desde cero en Enero
> ✅ Concursos 100% equitativos
>
> Más detalles próximamente...

### Diciembre 1-15: Beta Cerrada

**Invitación a 5 donantes:**
> Te invitamos a probar Ko-fi Credits antes del lanzamiento.
> Recibirás 5 créditos de prueba (se resetean en Enero).
> Tu feedback es invaluable.

### Diciembre 15-31: Educación (4 Posts)

1. "Cómo ganar créditos gratis" (sin donar)
2. "Catálogo de beneficios" (con mockups)
3. "FAQ: Equidad y concursos"
4. "Listo para 2026" (cuenta regresiva)

### Enero 1, 2026: Lanzamiento

**Email masivo:**
> 🎉 Ko-fi Credits YA ESTÁ AQUÍ
>
> Empieza a ganar HOY:
> 🏆 Gana reto Enero → hasta 5 créditos
> 📝 Publica historia → camino a racha
> 💰 Dona en Ko-fi → $3 = 3 créditos
>
> [Ver mi dashboard] [Explorar beneficios]

---

## 📝 FAQ y Principios

### Preguntas Frecuentes

**¿Los créditos expiran?** No, nunca.

**¿Puedo transferirlos?** No, son personales.

**¿Donar da ventaja en concursos?** No. Concursos 100% equitativos. Créditos = beneficios extra fuera de competencia.

**¿Cómo confirmo mi donación?** Email en 24-48h (manual MVP) o 5 min (automático Fase 4).

**¿Puedo reembolso?** Donaciones son voluntarias y no reembolsables. Créditos nunca expiran.

### Principios NO Negociables

❌ Beneficios NO afectan concursos activos
❌ NO dar créditos por votos directos
✅ Usuarios gratuitos pueden ganar igual
✅ Path gratuito viable (40% créditos por mérito)
✅ Transparencia total

### Iteración Continua

**Cada 2 semanas:** Revisar métricas → feedback → ajustar precios → comunicar

**Preguntas clave:**
- ¿Beneficio más popular?
- ¿Tiempo hasta recompra?
- ¿Beneficios sin uso?
- ¿Afecta percepción de equidad?

---


## 📋 Resumen Ejecutivo

### El Sistema en Una Página

**🎯 Objetivo:** Monetización sostenible + beneficios 100% equitativos

---

### 💎 Obtener Créditos (3 Paths)

| Path | Créditos/mes | % | Método |
|------|--------------|---|--------|
| 💰 **Donaciones Ko-fi** | 30-50 | 60% | $3=3 / $5=6 / $10=15 |
| 🏆 **Ganar Retos** | 10 | 15% | 1°=5 / 2°=3 / 3°=2 |
| ⭐ **Logros Calidad** | 14-21 | 25% | Umbral 10+ votos, racha, participación |

---

### 🎁 Gastar Créditos (100% Equitativos)

| Beneficio | Costo | Equidad | Fase |
|-----------|-------|---------|------|
| **Historia Libre** | 2 | ✅ Fuera de concurso | MVP |
| **Avatar Personalizado** | 3 | ✅ Cosmético | MVP |
| **Exportar PDF** | 1 | ✅ Post-concurso | MVP |
| Banner de Perfil | 2 | ✅ Cosmético | 2 |
| Biografía Extendida | 1 | ✅ Perfil | 2 |
| Análisis IA | 2 | ✅ Educativo | 2 |
| Compilación Anual PDF | 5 | ✅ Portafolio | 3 |
| Café Virtual con Admin | 10 | ✅ Experiencia | 3 |

**❌ Eliminados:** Historia Extendida en concurso, Destaque 24h, Vista previa de prompt

---

### 🔑 Principios Clave

1. **Concursos 100% equitativos** - Créditos NO afectan competencia
2. **80% beneficios consumibles** - Demanda recurrente
3. **Tasa de gasto 70%+** - Incentiva donaciones recurrentes
4. **Path gratuito viable** - 40% créditos por mérito
5. **Lanzamiento limpio 2026** - Todos empiezan desde cero

---

### 📊 Métricas Críticas

| Métrica | Target | Alerta |
|---------|--------|--------|
| Tasa de gasto mensual | 70%+ | <50% |
| Recompra (2da donación) | 30%+ | <20% |
| Tiempo hasta 1er gasto | <7 días | >14 días |
| Ingresos mensuales | $80-120 | <$50 |

---

### 🚀 Plan de Lanzamiento Enero 2026

**Nov 2025:** Desarrollo silencioso + anuncio "Coming Soon"
**Dic 1-15:** Beta cerrada (5 donantes actuales)
**Dic 15-31:** Campaña educación (4 posts explicativos)
**Ene 1, 2026:** 🎉 **LANZAMIENTO OFICIAL**
**Ene 31:** Primeros ganadores reciben créditos automáticamente

**Bonus de Lanzamiento (Solo Enero):**
- Primera Historia Libre: GRATIS
- Primera donación Ko-fi: +2 créditos bonus
- Participar en reto Enero: +1 crédito bonus

---

**Última actualización:** Diciembre 3, 2025
**Estado:** ✅ Plan completo - Listo para desarrollo
**Decisión clave:** Sistema 100% equitativo, lanzamiento limpio 2026
