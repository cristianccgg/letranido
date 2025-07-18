# 🚀 Guía de Deployment - Letranido

## Variables de Entorno Requeridas

### Para Vercel (Producción)

Configura estas variables en tu dashboard de Vercel:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Email Configuration (Resend)
VITE_RESEND_API_KEY=your_resend_api_key_here
VITE_FROM_EMAIL=noreply@letranido.com
VITE_EMAIL_MODE=production
VITE_ADMIN_EMAIL=admin@letranido.com

# Site Configuration
VITE_SITE_URL=https://letranido.com

# Analytics (Optional)
VITE_GA_MEASUREMENT_ID=your_google_analytics_id_here
```

### Para Desarrollo Local

Copia `.env.example` a `.env.local` y completa los valores:

```bash
cp .env.example .env.local
# Edita .env.local con tus valores de desarrollo
```

## 📋 Checklist Pre-Deployment

### ✅ Configuración
- [ ] Variables de entorno configuradas en Vercel
- [ ] Dominio personalizado configurado
- [ ] DNS apuntando a Vercel
- [ ] SSL certificate activo

### ✅ Email
- [ ] Dominio verificado en Resend
- [ ] DNS records para SPF/DKIM configurados
- [ ] Email de producción configurado (no @resend.dev)

### ✅ Base de Datos
- [ ] Supabase en plan de producción
- [ ] RLS policies activadas
- [ ] Backups configurados

### ✅ SEO & Analytics
- [ ] Google Analytics configurado
- [ ] Google Search Console configurado
- [ ] Sitemap.xml accesible
- [ ] Meta tags funcionando

### ✅ Seguridad
- [ ] Service Role Key solo en backend
- [ ] No hay console.logs en producción
- [ ] Error handling implementado

## 🔧 Comandos de Deployment

### Build Local
```bash
npm run build
npm run preview  # Test production build locally
```

### Deploy a Vercel
```bash
# Via Git (Automático)
git push origin main

# Via CLI (Manual)
npx vercel --prod
```

## 🔍 Verificación Post-Deployment

### Funcionalidades Críticas
1. **Auth**: Login/registro funcionando
2. **Email**: Newsletter signup funcionando
3. **Contest**: Envío de historias funcionando
4. **Voting**: Sistema de votación funcionando
5. **Admin**: Panel administrativo accesible

### SEO Check
1. **Meta tags**: View source y verificar meta tags
2. **Sitemap**: Acceder a /sitemap.xml
3. **Robots**: Acceder a /robots.txt
4. **Open Graph**: Test en Facebook Debugger
5. **Analytics**: Verificar eventos en GA

### Performance Check
1. **PageSpeed Insights**: Score > 90
2. **Core Web Vitals**: Todas las métricas en verde
3. **Lighthouse**: Score > 95 en todas las categorías

## 🚨 Troubleshooting Común

### Error: "Supabase client not initialized"
- Verificar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY

### Error: "Email sending failed"
- Verificar VITE_RESEND_API_KEY
- Confirmar que dominio está verificado en Resend

### Error: "Analytics not tracking"
- Verificar VITE_GA_MEASUREMENT_ID
- Confirmar que cookies analytics están aceptadas

### Error: "Build failed"
- Verificar que todas las variables requeridas están configuradas
- Revisar console para errores específicos

## 📞 Soporte

Si encuentras problemas durante el deployment:

1. Revisar logs en Vercel dashboard
2. Verificar variables de entorno
3. Confirmar que .env.local no está en el repo
4. Verificar que todas las dependencias están instaladas

## 🔄 Proceso de Updates

1. **Development**: Desarrollar en rama feature
2. **Testing**: Merge a develop y test en staging
3. **Production**: Merge a main para auto-deploy
4. **Monitoring**: Verificar que todo funciona correctamente

---

**Importante**: Nunca commitear archivos .env.local al repositorio. Usar .env.example como template.