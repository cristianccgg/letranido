# Sistema de Emails - Configuración y Variables de Entorno

## 🔧 Variables Requeridas

### **Vercel (Frontend)**
```bash
# Email remitente (ACTUALIZADO - ya no usar noreply)
VITE_FROM_EMAIL=info@letranido.com

# Modo de email (para testing)
VITE_EMAIL_MODE=production  # o "test" para pruebas
```

### **Supabase Edge Function**
```bash
# Email remitente
FROM_EMAIL=info@letranido.com

# Modo de email  
EMAIL_MODE=production  # o "test" para pruebas

# Admin email (para recibir emails en modo test)
ADMIN_EMAIL=cristianccggg@gmail.com

# API Key de Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxx
```

## 🛡️ Sistema de Privacidad

### ✅ **CORRECTO: Sistema Actual (Supabase Edge Function)**
```typescript
// Para múltiples destinatarios
emailBody.to = [FROM_EMAIL];        // Solo el remitente en TO
emailBody.bcc = recipients;         // Destinatarios ocultos en BCC

// Para email individual  
emailBody.to = [recipient];         // Solo ese destinatario
```

### ❌ **INCORRECTO: Sistema Antiguo (ELIMINADO)**
```javascript
// ❌ PROBLEMA: Cada email individual exponía el destinatario
to: email,  // Esto era visible para otros en algunos clientes
```

## 📁 Archivos del Sistema

### **✅ ARCHIVOS ACTIVOS**
- `/supabase/functions/send-contest-emails/index.ts` - Sistema principal
- `/src/lib/email/supabase-emails.js` - Cliente para Edge Function
- `/src/components/admin/EmailManager.jsx` - Panel de administración
- `/src/lib/blog-email-generator.js` - Generador de emails de blog
- `/src/lib/email/local-test-mailer.js` - Herramientas de desarrollo
- `/src/lib/emailjs.js` - Sistema de feedback (EmailJS)

### **🗑️ ARCHIVOS OBSOLETOS** 
```bash
# Marcados como .DEPRECATED - eliminar en el futuro
/src/lib/email.js.DEPRECATED                    # Sistema antiguo inseguro
/src/lib/email/contest-mailer.js.DEPRECATED     # Duplicado
/src/lib/email/resend.js.DEPRECATED             # Duplicado  
/src/lib/email/test-simple.js.DEPRECATED        # No usado
/src/lib/email/index.js.DEPRECATED              # No usado
```

## 🔄 Flujo de Envío de Emails

### **Para Concursos:**
1. Admin usa EmailManager → `sendContestEmailViaSupabase()` 
2. Frontend llama a Edge Function con tipo de email
3. Edge Function obtiene usuarios según preferencias
4. Usa BCC para proteger privacidad
5. Envía via Resend API

### **Para Blog Posts:**
1. Admin selecciona post en EmailManager
2. `blog-email-generator.js` genera HTML automáticamente
3. Se envía como email manual via Edge Function

### **Para Feedback:**
- Completamente separado usando EmailJS
- No interfiere con sistema principal

## 🧪 Modo Test

### **Activar modo test:**
```bash
# En Vercel
VITE_EMAIL_MODE=test

# En Supabase Edge Function  
EMAIL_MODE=test
```

### **Comportamiento en modo test:**
- ✅ Todos los emails van solo a `ADMIN_EMAIL`
- ✅ Se respeta la privacidad (BCC)
- ✅ Se pueden probar templates sin molestar usuarios
- ✅ Logs muestran claramente "modo: test"

## ⚙️ Panel de Administración

### **EmailManager** (antes EmailTester)
- 🎯 **Emails de Concurso:** new_contest, reminder, voting, results
- 📝 **Blog Posts:** Individual, Newsletter semanal  
- 📧 **Emails Manuales:** General, Newsletter, Esencial
- 👁️ **Preview:** Ver exactamente cómo se verá el email
- 🛡️ **Test Seguro:** Preview y test local sin envío real

## 🚨 Checklist de Seguridad

- [x] Emails masivos usan BCC (privacidad protegida)
- [x] Sistema antiguo inseguro eliminado
- [x] Modo test funciona correctamente
- [x] Variables de entorno actualizadas (info@ en lugar de noreply@)
- [x] Un solo sistema de envío (Edge Function)
- [x] Archivos duplicados marcados como obsoletos

## 📞 Contacto

Si hay problemas con el sistema de emails:
1. Verificar variables de entorno en Vercel/Supabase
2. Revisar logs de Edge Function en Supabase
3. Confirmar que FROM_EMAIL está verificado en Resend
4. Usar EmailManager en modo preview primero