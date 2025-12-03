# 💎 Plan de Implementación: Ko-fi Credits System

**Fecha de creación:** Noviembre 26, 2025
**Estado:** Planificación
**Objetivo:** Monetización sostenible mediante beneficios opcionales para donantes

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

## 🎁 Catálogo de Beneficios

### 1. Historia Extendida (1 crédito) ⭐ MVP

**Qué ofrece:**

- Límite de palabras: 1,000 → 2,000 palabras
- Solo para UN reto específico
- Se consume al publicar la historia

**Flujo:**

1. Usuario tiene historia en reto actual
2. Clic en "Usar crédito: Extender palabras"
3. Confirmación: "Gastarás 1 crédito para 2000 palabras"
4. Al aceptar: límite cambia, crédito se consume
5. Badge visible: "✨ Historia Extendida"

**Por qué es MVP:**

- ✅ Técnicamente simple (solo cambiar límite)
- ✅ Beneficio claro e inmediato
- ✅ No afecta equidad del concurso
- ✅ Testeable con donantes actuales

---

### 2. Historia Libre (2 créditos)

**Qué ofrece:**

- Publicar 1 historia fuera de concurso
- Aparece en nueva sección "Historias Libres"
- Límite: 2,000 palabras
- Puede recibir likes de la comunidad

**Flujo:**

1. Usuario va a "Escribir Historia Libre"
2. Sistema verifica: ¿Tiene 2 créditos?
3. Editor especial con límite 2000 palabras
4. Al publicar: consume 2 créditos
5. Historia visible en galería "Historias Libres"

**Beneficios:**

- ✅ Genera contenido fuera de concursos
- ✅ Mantiene usuarios activos entre retos
- ✅ No satura concursos principales

---

### 3. Destaque de Historia (1 crédito)

**Qué ofrece:**

- Tu historia aparece con badge "⭐ Destacada" por 24h
- Posición prioritaria en lista de historias del reto
- Más visibilidad = potencialmente más lecturas
- **NO da más votos directamente**

**Flujo:**

1. Usuario tiene historia publicada en reto
2. Clic en "Destacar mi historia"
3. Confirmación: "Gastarás 1 crédito para destacar 24h"
4. Historia sube en la lista con badge dorado
5. Después de 24h, vuelve a posición normal

**Consideraciones:**

- ⚠️ Podría percibirse como "pagar por ventaja"
- ✅ Pero solo da visibilidad, no garantiza votos
- ✅ Útil para escritores que publican cerca del cierre

---

### 4. Avatar Personalizado (3 créditos)

**Qué ofrece:**

- Subir imagen propia en lugar de avatar generado
- Badge especial "🎨 Avatar Personalizado"
- Visible en todo el sitio

**Flujo:**

1. Usuario va a "Personalizar Avatar"
2. Sube imagen (validación: formato, tamaño)
3. Confirmación: "Gastarás 3 créditos"
4. Avatar se actualiza en 5 minutos
5. Badge permanente en perfil

**Beneficios:**

- ✅ Personalización valiosa para usuarios activos
- ✅ Costo alto = incentiva donaciones mayores
- ✅ Mejora identidad de marca personal

---

### 5. Exportación PDF/EPUB (1 crédito por historia) - Fase 2

**Qué ofrece:**

- Descargar tus historias en formato PDF o EPUB
- Diseño profesional con logo Letranido
- Ideal para portafolio o compartir

**Flujo:**

1. Usuario selecciona historia
2. Clic en "Exportar como PDF"
3. Gasta 1 crédito
4. Descarga inmediata del archivo

---

### 6. Paquete de Feedback Personalizado (5 créditos) - Fase 3

**Qué ofrece:**

- Análisis detallado de tu historia por admin/escritor experto
- Feedback sobre estructura, estilo, adherencia al prompt
- Sugerencias de mejora (300-500 palabras)
- Entrega en 7 días

**Por qué funciona:**

- ✅ Alto valor percibido (coaching personalizado)
- ✅ Mejora calidad de futuros escritos
- ✅ Costo alto incentiva acumulación y donaciones
- ✅ Límite mensual (3 por mes) crea escasez

---

### 7. "Boost de Visibilidad" - Pack de 3 usos (3 créditos) - Fase 3

**Qué ofrece:**

- 3 destacados de historia (normalmente 1 crédito cada uno)
- Ahorro de 33% vs compra individual
- Incentiva gasto recurrente

**Estrategia de pricing:**

- Individual: 1 crédito/uso
- Pack x3: 3 créditos (ahorro de 1)
- Incentiva compra por volumen

---

## 🔄 Estrategias para Incentivar GASTO de Créditos

**Problema:** Usuarios acumulan créditos pero no los gastan = no vuelven a donar

**Objetivo:** Tasa de gasto del 70%+ (70% de créditos ganados se gastan en 30 días)

### 🎯 Tácticas Psicológicas

#### 1. **Beneficios Consumibles (No Permanentes)**

✅ **Diseña beneficios que se consumen:**

| Beneficio | Tipo | Tasa de recompra esperada |
|-----------|------|---------------------------|
| Historia Extendida | **Consumible** (1 vez) | Alta - cada reto |
| Historia Libre | **Consumible** (1 vez) | Media - mensual |
| Destaque 24h | **Temporal** (expira) | Media - por reto |
| Avatar Personalizado | **Permanente** | Baja - una vez |
| Exportar PDF | **Consumible** (por historia) | Media - portafolio |

**Estrategia:** 80% beneficios consumibles, 20% permanentes

**Por qué funciona:**

- ✅ Beneficios consumibles crean demanda recurrente
- ✅ "Se me acabaron mis créditos" = incentivo para donar
- ✅ Permanentes dan sensación de "inversión" pero no recompra

---

#### 2. **Urgencia y Escasez Artificial**

**Ofertas por tiempo limitado:**

```jsx
<CreditPromotion>
  🔥 Solo este reto: Historia Extendida a 1 crédito
  (Próximo reto: 2 créditos)
</CreditPromotion>
```

**Beneficios estacionales:**

| Mes | Beneficio especial | Costo | Escasez |
|-----|-------------------|-------|---------|
| Diciembre | 🎄 Historia Navideña (3000 palabras) | 2 créditos | Solo dic |
| Junio | 📚 Compilación personal PDF (todas tus historias) | 5 créditos | Solo jun |
| Aniversario Letranido | 🎉 Pack x2 Historia Extendida | 1 crédito | Solo 1 semana |

**Por qué funciona:**

- ✅ FOMO (Fear of Missing Out)
- ✅ "Debo usar mis créditos ahora o pierdo la oferta"
- ✅ Evita acumulación indefinida

---

#### 3. **Recompensas por Gasto (Gamificación)**

**Sistema de "Créditos Bonus":**

```
Gasta 5 créditos en un mes → Recibe 1 crédito bonus
Gasta 10 créditos en un mes → Recibe 3 créditos bonus
```

**Badge de "Gran Gastador":**

- 🛍️ "Supporter Activo" - Ha gastado 10+ créditos
- Visible en perfil
- Reconocimiento social

**Por qué funciona:**

- ✅ Incentiva gasto, no acumulación
- ✅ Usuarios que gastan más = más propensos a donar
- ✅ Loop: Gastar → Bonus → Gastar más

---

#### 4. **Recordatorios Inteligentes (Nudges)**

**Email automático cuando:**

- ✅ Usuario tiene 5+ créditos sin usar por 30 días
- ✅ Nuevo reto comienza (CTA: "Usa Historia Extendida")
- ✅ Quedan 3 días para fin de reto ("Última chance para destacar")

**Mensaje ejemplo:**

```
Asunto: Tienes 6 créditos esperando ✨

¡Hola [Nombre]!

Notamos que tienes 6 créditos sin usar.
Aprovecha el reto actual para:

📝 Escribir con 2000 palabras (1 crédito)
⭐ Destacar tu historia 24h (1 crédito)
✨ Publicar historia libre (2 créditos)

[CTA: Ver beneficios disponibles]
```

**Por qué funciona:**

- ✅ Recordatorio suave, no invasivo
- ✅ Contextual (timing relevante)
- ✅ CTAs específicos

---

#### 5. **Bundles y Descuentos por Volumen**

**Packs con descuento:**

| Pack | Beneficios | Costo normal | Costo pack | Ahorro |
|------|-----------|--------------|------------|--------|
| 📦 "Escritor Prolífico" | 3x Historia Extendida | 3 créditos | **2 créditos** | 33% |
| 📦 "Paquete Visibilidad" | 2x Destaque + 1x Historia Libre | 4 créditos | **3 créditos** | 25% |
| 📦 "Pack Completo" | 2x Extendida + 1x Libre + 1x Avatar | 8 créditos | **6 créditos** | 25% |

**Por qué funciona:**

- ✅ Incentiva gasto inmediato de múltiples créditos
- ✅ Valor percibido ("estoy ahorrando")
- ✅ Reduce acumulación

---

#### 6. **Visibilidad Constante del Balance**

**Dashboard con "presión social":**

```jsx
<CreditBalance>
  <div className="text-2xl font-bold">{creditsBalance} créditos</div>

  {/* Comparación con comunidad */}
  <p className="text-sm text-gray-600">
    📊 Promedio de la comunidad: 3.2 créditos gastados/mes
    {userMonthlySpending < 3.2 && (
      <span className="text-rose-500">
        (Tú: {userMonthlySpending} - ¡aprovecha más!)
      </span>
    )}
  </p>

  {/* Sugerencias contextuales */}
  {creditsBalance >= 3 && (
    <div className="bg-linear-to-r from-pink-50 to-rose-50 p-4 rounded-lg">
      💡 Tienes suficientes créditos para:
      <ul>
        <li>✨ Historia Libre (2 créditos)</li>
        <li>📝 Historia Extendida (1 crédito)</li>
      </ul>
    </div>
  )}
</CreditBalance>
```

**Por qué funciona:**

- ✅ Visible en cada visita
- ✅ Sugerencias contextuales automáticas
- ✅ Comparación social (sin presión negativa)

---

#### 7. **Beneficios "Gratis" con Requisito de Gasto**

**Ejemplo:**

```
🎁 Gasta 3 créditos este mes → Recibe 1 Destaque GRATIS
🎁 Primera Historia Libre del mes: 2 créditos
    Segunda del mismo mes: 1 crédito (descuento)
```

**Por qué funciona:**

- ✅ "Debo gastar para desbloquear el regalo"
- ✅ Incentiva actividad dentro del mes
- ✅ Evita acumulación crónica

---

### 📊 Métricas para Monitorear Gasto

| Métrica | Objetivo | Señal de alerta |
|---------|----------|-----------------|
| **Tasa de gasto mensual** | 70%+ | <50% = usuarios acumulan |
| **Tiempo promedio hasta primer gasto** | <7 días | >14 días = no ven valor |
| **% usuarios con balance >10 sin usar** | <10% | >20% = mal diseño de beneficios |
| **Recompra (2da donación)** | 30%+ | <20% = no están gastando suficiente |
| **Beneficio más usado** | Historia Extendida (50%+) | Si ninguno domina = confusión |

**Dashboard admin debe mostrar:**

```jsx
<SpendingMetrics>
  <MetricCard
    title="Tasa de gasto mensual"
    value="68%"
    target="70%"
    trend="↗️ +5% vs mes anterior"
  />

  <MetricCard
    title="Usuarios con >10 créditos sin usar"
    value="8 usuarios (15%)"
    alert={value > 0.20 ? "warning" : "ok"}
  />

  <MetricCard
    title="Tiempo hasta primer gasto"
    value="5.3 días"
    target="<7 días"
  />

  <AlertBox type="warning" show={spendingRate < 0.50}>
    ⚠️ Tasa de gasto baja. Considera:
    - Enviar recordatorio a usuarios con créditos
    - Crear oferta temporal
    - Revisar precios de beneficios
  </AlertBox>
</SpendingMetrics>
```

---

### 🎯 Plan de Acción: Incentivar Gasto

**Mes 1 (MVP):**
- ✅ Lanzar Historia Extendida (consumible, 1 crédito)
- ✅ Email recordatorio a usuarios con 5+ créditos

**Mes 2:**
- ✅ Agregar Historia Libre (consumible, 2 créditos)
- ✅ Primera oferta temporal: "Historia Extendida gratis con pack"

**Mes 3:**
- ✅ Bundles con descuento
- ✅ Sistema de bonus por gasto
- ✅ Beneficio estacional navideño

**Continuo:**
- 📧 Email semanal con sugerencias contextuales
- 📊 Monitorear tasa de gasto (objetivo 70%)
- 🔄 Ajustar precios si acumulación >20%

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

## 📊 Métricas de Éxito

### KPIs a Trackear

**🎯 Prioridad 1: Gasto de Créditos (Clave para Recurrencia)**

| Métrica                        | Objetivo (3 meses) | Cómo medirlo                             | Por qué es crítica |
| ------------------------------ | ------------------ | ---------------------------------------- | ------------------ |
| **Tasa de gasto mensual** | **70%+** | (spent_total / earned_total) | Si <50% = usuarios acumulan y no donan más |
| **Tiempo hasta primer gasto** | **<7 días** | Días entre earn y primer spend | Si >14 días = no ven valor inmediato |
| **Usuarios con balance >10 sin usar** | **<10%** | Count usuarios con balance >10 y sin gasto 30+ días | Señal de mal diseño de beneficios |
| **Recompra (2da donación)** | **30%+** | Usuarios con 2+ donaciones | El objetivo final del sistema |

**💰 Prioridad 2: Monetización**

| Métrica                        | Objetivo (3 meses) | Cómo medirlo                             |
| ------------------------------ | ------------------ | ---------------------------------------- |
| Ingresos mensuales             | $80-120            | Total donaciones Ko-fi                   |
| Donantes recurrentes           | 30%                | Usuarios con 2+ donaciones               |
| Tiempo hasta recompra          | < 30 días          | Promedio entre `last_donation_date`      |
| Conversión donante (nuevos usuarios) | 10%         | % usuarios nuevos que donan en primer mes |

**📈 Prioridad 3: Engagement**

| Métrica                        | Objetivo (3 meses) | Cómo medirlo                             |
| ------------------------------ | ------------------ | ---------------------------------------- |
| Beneficio más popular          | Historia Extendida (50%+) | Tipo más usado en `credit_benefits_used` |
| Beneficios usados por usuario  | 2.5 promedio/mes | Promedio de transacciones por usuario activo |
| Usuarios activos con créditos  | 60%+ | % usuarios activos con balance >0 |

### Dashboard de Métricas (Admin)

```jsx
<MetricsDashboard>
  <MetricCard
    title="Donaciones este mes"
    value="$95"
    trend="+15% vs mes anterior"
  />
  <MetricCard
    title="Usuarios con créditos"
    value="12"
    subtitle="de 20 activos (60%)"
  />
  <MetricCard
    title="Créditos gastados"
    value="85%"
    subtitle="Alta utilización"
  />
  <MetricCard
    title="Beneficio más popular"
    value="Historia Extendida"
    subtitle="67% del uso"
  />
</MetricsDashboard>
```

---

## 🎯 Estrategia de Comunicación

### 1. Anuncio Inicial (Cuando lance MVP)

**Email a todos los usuarios:**

```
Asunto: 💎 Presentamos: Ko-fi Credits - Nuevos beneficios para supporters

¡Hola [Nombre]!

Tenemos noticias emocionantes. Hemos lanzado **Ko-fi Credits**,
un nuevo sistema para agradecer a quienes apoyan Letranido.

¿Cómo funciona?
• Donas en Ko-fi → Recibes créditos
• Usas créditos para beneficios opcionales
• $3 = 3 créditos | $5 = 6 créditos | $10 = 15 créditos

Beneficios disponibles:
✨ Historia Extendida (1 crédito) - Escribe hasta 2000 palabras
📖 Historia Libre (2 créditos) - Publica fuera de concursos
⭐ Y más por venir...

Importante: Esto NO afecta los concursos. Todos pueden participar
y ganar igual, tengan créditos o no. Los beneficios son extras
opcionales para quienes quieran apoyar la plataforma.

[CTA: Conocer más →]

¡Gracias por ser parte de Letranido!
```

---

### 2. Banner en Landing Page

```jsx
<AnnouncementBanner>
  <span>💎 Nuevo: Ko-fi Credits</span>
  <span>Apoya Letranido y obtén beneficios especiales</span>
  <Link to="/credits">Conocer más →</Link>
</AnnouncementBanner>
```

---

### 3. Página Informativa `/credits`

**Contenido:**

- ¿Qué son los Ko-fi Credits?
- ¿Cómo funcionan?
- Catálogo completo de beneficios
- Preguntas frecuentes
- CTA: Donar en Ko-fi

---

## ⚠️ Consideraciones Importantes

### Equidad del Concurso

✅ **Los beneficios NO pueden:**

- Dar más votos
- Garantizar ganar
- Permitir más de 1 historia por reto
- Ocultar historias de otros

✅ **Los beneficios SÍ pueden:**

- Dar más espacio creativo (palabras)
- Permitir contenido extra (historias libres)
- Mejorar visibilidad (highlight)
- Personalizar perfil (avatar)

### Transparencia

- ✅ Comunicar claramente que son beneficios opcionales
- ✅ Enfatizar que usuarios gratuitos pueden ganar igual
- ✅ Mostrar ejemplos de ganadores sin créditos
- ✅ Política de privacidad: quién ve que tienes créditos (nadie excepto tú)

### Escalabilidad

- ✅ Empezar simple (manual) para validar
- ✅ Automatizar cuando haya demanda
- ✅ No implementar todo de golpe
- ✅ Iterar según feedback real

---

## 📝 Preguntas Frecuentes (FAQ)

**¿Los créditos expiran?**
No, los créditos nunca expiran.

**¿Puedo transferir créditos a otro usuario?**
No, los créditos son personales e intransferibles.

**¿Qué pasa si tengo créditos y no sé qué hacer con ellos?**
Puedes guardarlos para futuros beneficios o retos.

**¿Donar me da ventaja en los concursos?**
No. Los concursos siguen siendo 100% equitativos. Los beneficios son extras opcionales.

**¿Puedo solicitar un reembolso?**
Las donaciones son voluntarias y no reembolsables, pero los créditos nunca expiran.

**¿Cómo sé que mi donación fue registrada?**
Recibirás un email confirmando tus créditos en 24-48 horas (manual) o 5 minutos (automático en Fase 4).

---

## 🔄 Plan de Iteración

**Cada 2 semanas:**

1. Revisar métricas de uso
2. Recopilar feedback de usuarios
3. Ajustar beneficios o precios según datos
4. Comunicar cambios con transparencia

**Preguntas a responder con datos:**

- ¿Qué beneficio es más popular?
- ¿Cuánto tiempo pasa hasta recompra?
- ¿Hay beneficios que nadie usa?
- ¿Los usuarios entienden el sistema?
- ¿Afecta negativamente la percepción de equidad?

---

## 🎉 Próximos Pasos Inmediatos

### Fase 1: MVP (Semanas 1-2)

1. ✅ **Crear infraestructura BD**
   - Tablas: `kofi_credits`, `credit_transactions`, `credit_benefits_used`
   - Funciones SQL: `add_kofi_credits`, `spend_kofi_credits`
   - RLS policies

2. ✅ **Panel Admin**
   - Asignar créditos manualmente
   - Ver historial de donaciones
   - Métricas básicas de gasto

3. ✅ **Dashboard Usuario**
   - Ver balance de créditos
   - Historial de transacciones
   - Catálogo de beneficios

4. ✅ **Primer Beneficio: Historia Extendida**
   - Botón "Usar crédito" en editor
   - Límite 1000 → 2000 palabras
   - Badge "✨ Historia Extendida"

5. ✅ **Sistema de Emails**
   - Confirmación al recibir créditos
   - Recordatorio a usuarios con 5+ créditos sin usar

### Fase 2: Logros y Más Beneficios (Mes 2-3)

6. ✅ **Nuevos Paths para Ganar Créditos**
   - Ganar retos (automático al finalizar)
   - Umbral de excelencia (10+ votos)
   - Historias destacadas (curación manual)
   - Racha de 3 historias
   - Participación activa

7. ✅ **Nuevos Beneficios Consumibles**
   - Historia Libre (2 créditos)
   - Destaque 24h (1 crédito)
   - Exportar PDF (1 crédito)

8. ✅ **Sistema de Bundles**
   - Pack "Escritor Prolífico" (descuento 33%)
   - Ofertas temporales estacionales

### Fase 3: Optimización de Gasto (Mes 4+)

9. ✅ **Gamificación del Gasto**
   - Sistema de bonus por gasto
   - Badges "Supporter Activo"
   - Comparación social en dashboard

10. ✅ **Automatización**
    - Ko-fi webhooks
    - Asignación automática de créditos
    - Recordatorios inteligentes contextuales

11. ✅ **Iteración basada en datos**
    - Monitorear tasa de gasto (objetivo 70%)
    - Ajustar precios si acumulación >20%
    - A/B testing de beneficios

---

## 📋 Resumen Ejecutivo

### El Sistema en Una Página

**🎯 Objetivo:** Monetización sostenible mediante créditos que incentivan donaciones recurrentes

**💎 Formas de Obtener Créditos:**

1. **Donaciones Ko-fi** (60% del total)
   - $3 = 3 créditos | $5 = 6 créditos | $10 = 15 créditos
   - Asignación manual (MVP) → automática (Fase 4)

2. **Ganar Retos** (15% del total)
   - 1° lugar: 5 créditos | 2° lugar: 3 créditos | 3° lugar: 2 créditos

3. **Logros de Calidad** (25% del total)
   - Umbral de excelencia (10+ votos): 2 créditos
   - Historia destacada (curación): 3 créditos
   - Racha de 3 historias: 1 crédito
   - Participación activa: 1 crédito/reto

**🎁 Formas de Gastar Créditos:**

| Beneficio | Costo | Tipo | Prioridad |
|-----------|-------|------|-----------|
| Historia Extendida (2000 palabras) | 1 | Consumible | ⭐ MVP |
| Historia Libre | 2 | Consumible | Fase 2 |
| Destaque 24h | 1 | Temporal | Fase 2 |
| Avatar Personalizado | 3 | Permanente | Fase 3 |
| Exportar PDF | 1 | Consumible | Fase 2 |
| Feedback Personalizado | 5 | Consumible | Fase 3 |

**🔑 Claves del Éxito:**

1. **80% beneficios consumibles** → Demanda recurrente
2. **Tasa de gasto 70%+** → Usuarios activos necesitan más créditos
3. **Recordatorios inteligentes** → Nudges contextuales
4. **Bundles con descuento** → Incentivo para gastar múltiples créditos
5. **Ofertas temporales** → FOMO y urgencia

**⚠️ Principios NO Negociables:**

- ❌ NO dar ventaja directa en concursos
- ❌ NO dar créditos por votos directos (evita gaming)
- ✅ Mantener equidad: usuarios gratuitos pueden ganar igual
- ✅ Path gratuito viable mediante logros de calidad
- ✅ Transparencia total sobre el sistema

**📊 Métricas Críticas:**

- **Tasa de gasto mensual:** 70%+ (si <50% = problema)
- **Tiempo hasta primer gasto:** <7 días
- **Recompra:** 30%+ de donantes donan 2+ veces
- **Ingresos mensuales:** $80-120 USD

**🚀 Timeline:**

- **Semanas 1-2:** MVP (Historia Extendida + admin panel)
- **Mes 2:** Logros de calidad + Historia Libre
- **Mes 3:** Bundles + gamificación
- **Mes 4+:** Automatización + optimización

---

**Última actualización:** Diciembre 3, 2025
**Responsable:** Equipo Letranido
**Revisión:** Mensual o según hitos de implementación
**Estado:** ✅ Plan completo - Listo para implementación MVP
