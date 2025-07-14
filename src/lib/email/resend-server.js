// NOTA: Este es un workaround temporal para pruebas
// En producción, esto debería estar en un endpoint de backend

export const sendEmailViaProxy = async ({ to, subject, html, text }) => {
  try {
    console.log('📧 Enviando email via proxy temporal...');
    
    // Para pruebas, vamos a simular el envío exitoso
    // En un entorno real, esto iría a un endpoint de tu backend
    console.log('📧 Datos del email:');
    console.log('- Para:', to);
    console.log('- Asunto:', subject);
    console.log('- HTML length:', html?.length || 0);
    console.log('- Text length:', text?.length || 0);
    
    // Simular envío exitoso
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay de red
    
    return {
      success: true,
      message: 'Email simulado enviado correctamente',
      data: {
        id: 'simulated-' + Date.now(),
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        created_at: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('❌ Error en sendEmailViaProxy:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función para mostrar el email en consola (para debugging)
export const previewEmailInConsole = ({ to, subject, html, text }) => {
  console.log('📧 PREVIEW DE EMAIL:');
  console.log('==========================================');
  console.log('Para:', to);
  console.log('Asunto:', subject);
  console.log('------------------------------------------');
  console.log('Contenido HTML:');
  console.log(html.substring(0, 500) + '...');
  console.log('------------------------------------------');
  console.log('Contenido Texto:');
  console.log(text.substring(0, 200) + '...');
  console.log('==========================================');
  
  return {
    success: true,
    message: 'Email preview mostrado en consola',
    data: { previewed: true }
  };
};