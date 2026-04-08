#!/bin/bash
# Download static images from Firebase Storage to public/images/
# Run from project root: bash scripts/download-firebase-images.sh

set -eu

BASE="https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o"
OUT="public/images"

# Create directories
mkdir -p "$OUT/hero" "$OUT/flags" "$OUT/categorias" "$OUT/ciudades" "$OUT/video" "$OUT/avatares"

echo "=== Hero ==="
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Ffamilia.webp?alt=media" -o "$OUT/hero/familia.webp"
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Ffamilia-movil.webp?alt=media" -o "$OUT/hero/familia-movil.webp"
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Fpersona.webp?alt=media" -o "$OUT/hero/persona.webp"
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Fpersona-movil.avif?alt=media" -o "$OUT/hero/persona-movil.avif"

echo "=== Flags ==="
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Fcolombia%2Fcolombia-100-77.png?alt=media" -o "$OUT/flags/colombia-100-77.png"
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Fcolombia%2Fcolombia-224-100.png?alt=media" -o "$OUT/flags/colombia-224-100.png"

echo "=== Categorias (display) ==="
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Fcategorias%2Fcompacto.webp?alt=media" -o "$OUT/categorias/compacto.webp"
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Fcategorias%2Fsedan.webp?alt=media" -o "$OUT/categorias/sedan.webp"
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Fcategorias%2Fsuv.webp?alt=media" -o "$OUT/categorias/suv.webp"

echo "=== Ciudades ==="
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Fciudades%2Fchica%2Fchica.webp?alt=media" -o "$OUT/ciudades/chica.webp"
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Fciudades%2Fchica%2Fchica-movil.webp?alt=media" -o "$OUT/ciudades/chica-movil.webp"

echo "=== Video ==="
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Fvideo.webp?alt=media" -o "$OUT/video/video.webp"
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Fvideo-movil.webp?alt=media" -o "$OUT/video/video-movil.webp"

echo "=== Avatares ==="
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Favatares%2Fuifaces-human-image6.webp?alt=media" -o "$OUT/avatares/uifaces-human-image6.webp"
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Favatares%2Fuifaces-popular-image.webp?alt=media" -o "$OUT/avatares/uifaces-popular-image.webp"
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Favatares%2Fuifaces-popular-image2.webp?alt=media" -o "$OUT/avatares/uifaces-popular-image2.webp"
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Favatares%2Fuifaces-popular-image3.webp?alt=media" -o "$OUT/avatares/uifaces-popular-image3.webp"
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Favatares%2Fuifaces-popular-image4.webp?alt=media" -o "$OUT/avatares/uifaces-popular-image4.webp"
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Favatares%2Fuifaces-popular-image5.webp?alt=media" -o "$OUT/avatares/uifaces-popular-image5.webp"

echo ""
echo "=== Done ==="
echo "Downloaded to $OUT/"
ls -lhR "$OUT/"
