-- Script para crear un concurso de prueba para testing de emails
-- Ejecutar en el editor SQL de Supabase

INSERT INTO contests (
  title,
  description,
  month,
  category,
  min_words,
  max_words,
  submission_deadline,
  voting_deadline,
  is_active,
  created_at
) VALUES (
  'Concurso de Prueba - Enero 2025',
  'Un concurso especial para probar el sistema de emails de Letranido. Escribe una historia que explore temas de tecnología y humanidad en el futuro cercano.',
  'Enero',
  'Ciencia Ficción',
  500,
  1500,
  '2025-01-30 23:59:59+00',
  '2025-02-05 23:59:59+00',
  true,
  now()
);