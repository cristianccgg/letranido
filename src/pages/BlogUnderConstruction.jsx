import React from 'react';
import { Link } from 'react-router-dom';
import { Construction, ArrowLeft, BookOpen, Calendar, Bell } from 'lucide-react';
import SEOHead from '../components/SEO/SEOHead';

const BlogUnderConstruction = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <SEOHead
        title="Blog en Construcción - Letranido"
        description="Nuestro blog de recursos para escritores estará disponible muy pronto. Mientras tanto, explora nuestras guías de escritura."
        url="/recursos/blog"
      />

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Navigation back */}
        <div className="mb-8">
          <Link
            to="/writing-resources"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Recursos
          </Link>
        </div>

        {/* Main content */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-full mb-8 shadow-xl">
            <Construction className="h-12 w-12 text-indigo-600" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            🚧 Blog en Construcción
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Estamos preparando contenido increíble para ti: reseñas de libros, 
            análisis de herramientas digitales, comparativas de cursos y recursos 
            especializados para escritores.
          </p>

          {/* Features preview */}
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/40">
              <BookOpen className="h-8 w-8 text-indigo-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Reseñas de Libros</h3>
              <p className="text-sm text-gray-600">
                Los mejores libros sobre escritura creativa, técnicas narrativas y desarrollo literario.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/40">
              <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Herramientas</h3>
              <p className="text-sm text-gray-600">
                Análisis de software, apps y recursos digitales para optimizar tu proceso de escritura.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/40">
              <Bell className="h-8 w-8 text-pink-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Cursos</h3>
              <p className="text-sm text-gray-600">
                Comparativas detalladas de cursos online y formación especializada para escritores.
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 rounded-2xl p-8 border border-indigo-200 shadow-xl mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📅 Lanzamiento Próximamente
            </h2>
            <p className="text-gray-700 mb-4">
              Nuestro blog estará disponible en las próximas semanas con contenido curado especialmente para escritores.
            </p>
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-indigo-600">Mientras tanto:</span> 
              {' '}Explora nuestras guías de escritura y participa en concursos mensuales.
            </div>
          </div>

          {/* Call to actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/writing-resources"
              className="inline-flex items-center px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <BookOpen className="h-5 w-5 mr-3" />
              Explorar Guías de Escritura
            </Link>

            <Link
              to="/contest/current"
              className="inline-flex items-center px-8 py-4 rounded-xl bg-white border-2 border-indigo-200 text-indigo-700 font-bold text-lg hover:bg-indigo-50 hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Calendar className="h-5 w-5 mr-3" />
              Ver Concurso Actual
            </Link>
          </div>

          {/* Newsletter signup hint */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">
              💡 <strong>Tip:</strong> Únete a nuestra comunidad para ser el primero en conocer cuando lancemos el blog
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogUnderConstruction;