-- Agregar categoría a torneos (standard o jr)
ALTER TABLE tournaments ADD COLUMN category text NOT NULL DEFAULT 'standard' CHECK (category IN ('standard', 'jr'));

-- Actualizar torneos existentes que contengan "JR" o "Junior" en el nombre
UPDATE tournaments SET category = 'jr' WHERE LOWER(name) LIKE '%jr%' OR LOWER(name) LIKE '%junior%';
