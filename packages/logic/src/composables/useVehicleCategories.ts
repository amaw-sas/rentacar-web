// Types
import type { VehicleCategoryData } from '@rentacar-main/logic/utils';

export default function useVehicleCategories() {
    const vehicleCategories: VehicleCategoryData = 
        {
          "C": {
            "grupo": "Económico",
            "modelos": [
              {
                "nombre": "Fiat Mobi",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-fiat-mobi-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-fiat-mobi-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-fiat-mobi-alquiler-de-carros.jpg?alt=media"
                }
              },
              {
                "nombre": "Kia Picanto",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-kia-picanto-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-kia-picanto-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-kia-picanto-alquiler-de-carros.jpg?alt=media"
                }
              },
              {
                "nombre": "Renault Kwid",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-renault-kwid-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-renault-kwid-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-renault-kwid-alquiler-de-carros.jpg?alt=media"
                }
              },
              {
                "nombre": "Suzuki S-Presso",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-suzuki-spresso-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-suzuki-spresso-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-suzuki-spresso-alquiler-de-carros.jpg?alt=media"
                }
              }
            ],
            "descripcion_corta": "Compacto mecánico",
            "descripcion_larga": "Vehículos pequeños y ágiles, perfectos para desplazarse por la ciudad de manera eficiente y económica. Ideales para personas que buscan el menor costo en alquiler y consumo. Sin embargo, su espacio interior y capacidad de carga son limitados, lo que los hace más adecuados para trayectos urbanos y usuarios individuales o parejas.",
            "tags": [
              "Transmisión manual",
              "Capacidad: 4-5 personas",
              "1 maleta grande, 1 maleta pequeña",
              "Aire acondicionado",
              "Eleva vidrios manuales",
              "Cierre centralizado básico"
            ]
          },
          "CX": {
            "grupo": "Económico",
            "modelos": [
              {
                "nombre": "Kia Picanto Zenith",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-kia-picanto-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-kia-picanto-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-kia-picanto-alquiler-de-carros.jpg?alt=media"
                }
              }
            ],
            "descripcion_corta": "Económico Automático",
            "descripcion_larga": "Vehículo compacto con transmisión automática, ideal para desplazamientos urbanos con máxima comodidad. Equipado con dirección asistida eléctrica, aire acondicionado, vidrios eléctricos y un completo paquete de seguridad con 6 airbags y frenos ABS. Su tamaño compacto facilita el estacionamiento y su bajo consumo lo hace perfecto para quienes buscan economía sin sacrificar confort ni tecnología.",
            "tags": [
              "Transmisión Automática",
              "Capacidad: 5 personas",
              "1 maleta grande, 1 maleta pequeña",
              "Aire acondicionado",
              "Eleva vidrios eléctricos",
              "Dirección asistida eléctrica",
              "6 airbags",
              "Frenos ABS"
            ]
          },
          "FL": {
            "grupo": "Económico",
            "modelos": [
              {
                "nombre": "Fiat Mobi",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-fiat-mobi-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-fiat-mobi-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-fiat-mobi-alquiler-de-carros.jpg?alt=media"
                }
              },
              {
                "nombre": "Kia Picanto",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-kia-picanto-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-kia-picanto-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-kia-picanto-alquiler-de-carros.jpg?alt=media"
                }
              },
              {
                "nombre": "Renault Kwid",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-renault-kwid-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-renault-kwid-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-renault-kwid-alquiler-de-carros.jpg?alt=media"
                }
              },
              {
                "nombre": "Suzuki S-Presso",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-suzuki-spresso-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-suzuki-spresso-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-suzuki-spresso-alquiler-de-carros.jpg?alt=media"
                }
              }
            ],
            "descripcion_corta": "Compacto mecánico",
            "descripcion_larga": "Vehículos pequeños y ágiles, perfectos para desplazarse por la ciudad de manera eficiente y económica. Ideales para personas que buscan el menor costo en alquiler y consumo. Sin embargo, su espacio interior y capacidad de carga son limitados, lo que los hace más adecuados para trayectos urbanos y usuarios individuales o parejas.",
            "tags": [
              "Transmisión manual",
              "Capacidad: 4-5 personas",
              "1 maleta grande, 1 maleta pequeña",
              "Aire acondicionado",
              "Eleva vidrios manuales",
              "Cierre centralizado básico"
            ]
          },
          "F": {
            "grupo": "Económico",
            "modelos": [
              {
                "nombre": "Renault Logan 1.6",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamaf%2Fgrupo-f-renault-logan-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamaf%2Fgrupo-f-renault-logan-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamaf%2Fgrupo-f-renault-logan-alquiler-de-carros.jpg?alt=media"
                }
              },
              {
                "nombre": "Suzuki Swift Dzire 1.2",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamaf%2Fgrupo-f-suzuki-swift-dzire-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamaf%2Fgrupo-f-suzuki-swift-dzire-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamaf%2Fgrupo-f-suzuki-swift-dzire-alquiler-de-carros.jpg?alt=media"
                }
              },
              {
                "nombre": "Gol Trendline 1.6",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamaf%2Fgrupo-f-volkswagen-gol-trendline-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamaf%2Fgrupo-f-volkswagen-gol-trendline-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamaf%2Fgrupo-f-volkswagen-gol-trendline-alquiler-de-carros.jpg?alt=media"
                }
              },
              {
                "nombre": "Hyundai Accent 1.6",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamaf%2Fgrupo-f-hyundai-accent-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamaf%2Fgrupo-f-hyundai-accent-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamaf%2Fgrupo-f-hyundai-accent-alquiler-de-carros.jpg?alt=media"
                }
              }
            ],
            "descripcion_corta": "Sedán mecánico",
            "descripcion_larga": "Sedanes cómodos y funcionales que ofrecen un equilibrio entre economía y espacio. Son ideales para familias pequeñas, parejas o viajeros frecuentes que buscan mayor comodidad que un compacto, sin elevar demasiado los costos. Su maletero amplio los hace perfectos para viajes cortos o medianos. Pueden carecer de las comodidades avanzadas de gamas superiores.",
            "tags": [
              "Transmisión manual",
              "Capacidad: 5 personas",
              "2 maleta grande, 1 maleta pequeña",
              "Aire acondicionado",
              "Eleva vídrios electricos en las puertas delanteras",
              "Cierre centralizado"
            ]
          },
          "FX": {
            "grupo": "Intermedio",
            "modelos": [
              {
                "nombre": "Kia Rio 1.4",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-kia-rio-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-kia-rio-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-kia-rio-alquiler-de-carros.jpg?alt=media"
                }
              },
              {
                "nombre": "Suzuki Dzire 1.2 AT",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-suzuki-swift-dzire-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-suzuki-swift-dzire-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-suzuki-swift-dzire-alquiler-de-carros.jpg?alt=media"
                }
              },
              {
                "nombre": "Logan Dynamique 1.6 AT",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-logan-dynamique-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-logan-dynamique-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-logan-dynamique-alquiler-de-carros.jpg?alt=media"
                }
              },
              {
                "nombre": "Hyundai Accent 1.6 AT",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-hyundai-accent-advance-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-hyundai-accent-advance-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-hyundai-accent-advance-alquiler-de-carros.jpg?alt=media"
                }
              }
            ],
            "descripcion_corta": "Sedan automático",
            "descripcion_larga": "Conducción automática y gran versatilidad, estos sedanes ofrecen comodidad y facilidad de manejo, ideales tanto para uso urbano como para viajes. Son una opción intermedia que combina eficiencia con un costo razonable. Aunque tienen buen espacio interior, su maletero puede ser limitado para quienes necesitan transportar mayor equipaje.",
            "tags": [
              "Transmisión Automática",
              "Capacidad: 5 personas",
              "2 maleta grande, 1 maleta pequeña",
              "Aire acondicionado",
              "Eleva vidrios eléctricos",
              "Cierre centralizado"
            ]
          },
          "FU": {
            "grupo": "Intermedio",
            "modelos": [
              {
                "nombre": "Kia Rio 1.4",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-kia-rio-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-kia-rio-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-kia-rio-alquiler-de-carros.jpg?alt=media"
                }
              },
              {
                "nombre": "Suzuki Dzire 1.2 AT",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-suzuki-swift-dzire-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-suzuki-swift-dzire-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-suzuki-swift-dzire-alquiler-de-carros.jpg?alt=media"
                }
              },
              {
                "nombre": "Logan Dynamique 1.6 AT",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-logan-dynamique-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-logan-dynamique-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-logan-dynamique-alquiler-de-carros.jpg?alt=media"
                }
              },
              {
                "nombre": "Hyundai Accent 1.6 AT",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-hyundai-accent-advance-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-hyundai-accent-advance-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-hyundai-accent-advance-alquiler-de-carros.jpg?alt=media"
                }
              }
            ],
            "descripcion_corta": "Sedan automático",
            "descripcion_larga": "Conducción automática y gran versatilidad, estos sedanes ofrecen comodidad y facilidad de manejo, ideales tanto para uso urbano como para viajes. Son una opción intermedia que combina eficiencia con un costo razonable. Aunque tienen buen espacio interior, su maletero puede ser limitado para quienes necesitan transportar mayor equipaje.",
            "tags": [
              "Transmisión Automática",
              "Capacidad: 5 personas",
              "2 maleta grande, 1 maleta pequeña",
              "Aire acondicionado",
              "Eleva vidrios eléctricos",
              "Cierre centralizado"
            ]
          },
          "GC": {
            "grupo": "Intermedio",
            "modelos": [
              {
                "nombre": "Suzuki Vitara 1.6",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogc%2Fgrupo-gc-suzuki-vitara-at-alquiler-de-camionetas.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogc%2Fgrupo-gc-suzuki-vitara-at-alquiler-de-camionetas.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogc%2Fgrupo-gc-suzuki-vitara-at-alquiler-de-camionetas.jpg?alt=media"
                }
              },
              {
                "nombre": "Arona 1.6 AT",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogc%2Fgrupo-gc-seat-arona-at-alquiler-de-camionetas.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogc%2Fgrupo-gc-seat-arona-at-alquiler-de-camionetas.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogc%2Fgrupo-gc-seat-arona-at-alquiler-de-camionetas.jpg?alt=media"
                }
              },
              {
                "nombre": "Fiat Pulse 1.0",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogc%2Fgrupo-gc-fiat-pulse-at-alquiler-de-camionetas.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogc%2Fgrupo-gc-fiat-pulse-at-alquiler-de-camionetas.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogc%2Fgrupo-gc-fiat-pulse-at-alquiler-de-camionetas.jpg?alt=media"
                }
              },
              {
                "nombre": "Hyundai Creta 1.6",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogc%2Fgrupo-gc-hyundai-creta-at-alquiler-de-camionetas.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogc%2Fgrupo-gc-hyundai-creta-at-alquiler-de-camionetas.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogc%2Fgrupo-gc-hyundai-creta-at-alquiler-de-camionetas.jpg?alt=media"
                }
              }
            ],
            "descripcion_corta": "Camioneta automática",
            "descripcion_larga": "Camionetas compactas con bajo consumo y facilidad de manejo, ideales para la ciudad. Diseñadas para quienes necesitan la comodidad de una camioneta pero con dimensiones y costos accesibles. Aunque prácticas, su espacio interior y maletero son moderados, haciéndolas menos adecuadas para viajes familiares largos o con mucho equipaje.",
            "tags": [
              "Transmisión Automática",
              "Capacidad: 5 personas",
              "2 maleta grande, 2 maleta pequeña",
              "Aire acondicionado",
              "Eleva vidrios eléctricos",
              "Cierre centralizado"
            ]
          },
          "G4": {
            "grupo": "Intermedio",
            "modelos": [
              {
                "nombre": "Renault Duster 1.3",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupog4%2Fgrupo-g4-renault-duster-alquiler-de-camionetas-4x4.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupog4%2Fgrupo-g4-renault-duster-alquiler-de-camionetas-4x4.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupog4%2Fgrupo-g4-renault-duster-alquiler-de-camionetas-4x4.jpg?alt=media"
                }
              },
              {
                "nombre": "Suzuki Vitara 1.6",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupog4%2Fgrupo-g4-suzuki-vitara-alquiler-de-camionetas-4x4.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupog4%2Fgrupo-g4-suzuki-vitara-alquiler-de-camionetas-4x4.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupog4%2Fgrupo-g4-suzuki-vitara-alquiler-de-camionetas-4x4.jpg?alt=media"
                }
              }
            ],
            "descripcion_corta": "Camioneta mecánica 4x4",
            "descripcion_larga": "Robustas y confiables, estas camionetas están diseñadas para enfrentar terrenos difíciles y aventuras al aire libre. Ideales para quienes buscan un vehículo resistente para actividades fuera de carretera. Aunque su consumo de combustible es mayor y su confort puede ser básico, compensan con su capacidad todoterreno.",
            "tags": [
              "Transmisión manual",
              "Capacidad: 5 personas",
              "3 maleta grande, 1 maleta pequeña",
              "Aire acondicionado",
              "Eleva vidrios eléctricos",
              "Cierre centralizado"
            ]
          },
          "GL": {
            "grupo": "Intermedio",
            "modelos": [
              {
                "nombre": "Renault Duster 1.3",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupog4%2Fgrupo-g4-renault-duster-alquiler-de-camionetas-4x4.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupog4%2Fgrupo-g4-renault-duster-alquiler-de-camionetas-4x4.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupog4%2Fgrupo-g4-renault-duster-alquiler-de-camionetas-4x4.jpg?alt=media"
                }
              },
              {
                "nombre": "Suzuki Vitara 1.6",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupog4%2Fgrupo-g4-suzuki-vitara-alquiler-de-camionetas-4x4.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupog4%2Fgrupo-g4-suzuki-vitara-alquiler-de-camionetas-4x4.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupog4%2Fgrupo-g4-suzuki-vitara-alquiler-de-camionetas-4x4.jpg?alt=media"
                }
              }
            ],
            "descripcion_corta": "Camioneta mecánica 4x4",
            "descripcion_larga": "Robustas y confiables, estas camionetas están diseñadas para enfrentar terrenos difíciles y aventuras al aire libre. Ideales para quienes buscan un vehículo resistente para actividades fuera de carretera. Aunque su consumo de combustible es mayor y su confort puede ser básico, compensan con su capacidad todoterreno.",
            "tags": [
              "Transmisión manual",
              "Capacidad: 5 personas",
              "3 maleta grande, 1 maleta pequeña",
              "Aire acondicionado",
              "Eleva vidrios eléctricos",
              "Cierre centralizado"
            ]
          },
          "LE": {
            "grupo": "Prémium",
            "modelos": [
              {
                "nombre": "Renault Koleos 2.5",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupole%2Fgrupo-le-renault-koleos-alquiler-de-camionetas.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupole%2Fgrupo-le-renault-koleos-alquiler-de-camionetas.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupole%2Fgrupo-le-renault-koleos-alquiler-de-camionetas.jpg?alt=media"
                }
              },
              {
                "nombre": "Kia Sportage 2.0 AT",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupole%2Fgrupo-le-kia-sportage-alquiler-de-camionetas.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupole%2Fgrupo-le-kia-sportage-alquiler-de-camionetas.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupole%2Fgrupo-le-kia-sportage-alquiler-de-camionetas.jpg?alt=media"
                }
              },
              {
                "nombre": "Hyundai Tucson 2.0",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupole%2Fgrupo-le-hyundai-tucson-alquiler-de-camionetas.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupole%2Fgrupo-le-kia-sportage-alquiler-de-camionetas.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupole%2Fgrupo-le-kia-sportage-alquiler-de-camionetas.jpg?alt=media"
                }
              },
              {
                "nombre": "Nissan Qashqai 2.0",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupole%2Fgrupo-le-nissan-qashqai-alquiler-de-camionetas.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupole%2Fgrupo-le-kia-sportage-alquiler-de-camionetas.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupole%2Fgrupo-le-kia-sportage-alquiler-de-camionetas.jpg?alt=media"
                }
              }
            ],
            "descripcion_corta": "Camioneta automática de lujo",
            "descripcion_larga": "Vehículos premium con acabados de alta calidad y tecnología avanzada. Perfectas para quienes priorizan el confort, el espacio amplio y las prestaciones superiores. Son ideales para viajes largos o usuarios que buscan un toque de exclusividad. Su costo de alquiler y consumo son más altos, pero ofrecen una experiencia superior.",
            "tags": [
              "Transmisión Automática",
              "Capacidad: 5 personas",
              "4 maleta grande, 2 maleta pequeña",
              "Aire acondicionado automático de doble zona",
              "Eleva vidrios eléctricos",
              "Cierre centralizado con acceso sin llave"
            ]
          },
          "GY": {
            "grupo": "Prémium",
            "modelos": [
              {
                "nombre": "Hyundai Santa Fe 1.6",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamagy%2Fgrupo-gy-hyundai-santa-fe-alquiler-de-carros.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamagy%2Fgrupo-gy-hyundai-santa-fe-alquiler-de-carros.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamagy%2Fgrupo-gy-hyundai-santa-fe-alquiler-de-carros.jpg?alt=media"
                }
              }
            ],
            "descripcion_corta": "SUV Automática 7 puestos",
            "descripcion_larga": "SUV espaciosa con transmisión automática y capacidad para 7 pasajeros, ideal para familias o grupos. Equipada con motor 1.6 turbo, dirección asistida eléctrica, aire acondicionado, vidrios eléctricos y 7 airbags (frontales, laterales y cortina). Frenos ABS y 5 puertas.",
            "tags": [
              "Transmisión Automática",
              "Capacidad: 7 personas",
              "Aire acondicionado",
              "Eleva vidrios eléctricos",
              "Dirección asistida eléctrica",
              "7 airbags",
              "Frenos ABS",
              "5 puertas"
            ]
          },
          "GR": {
            "grupo": "Prémium",
            "modelos": [
              {
                "nombre": "Ford Explorer 3.0",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogr%2Fgrupo-gr-ford-explorer-alquiler-de-camionetas-7-puestos.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogr%2Fgrupo-gr-ford-explorer-alquiler-de-camionetas-7-puestos.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogr%2Fgrupo-gr-ford-explorer-alquiler-de-camionetas-7-puestos.jpg?alt=media"
                }
              },
              {
                "nombre": "Subaru Evoltis 2.4 AT",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogr%2Fgrupo-gr-subaru-evoltis-alquiler-de-camionetas-7-puestos.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogr%2Fgrupo-gr-subaru-evoltis-alquiler-de-camionetas-7-puestos.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogr%2Fgrupo-gr-subaru-evoltis-alquiler-de-camionetas-7-puestos.jpg?alt=media"
                }
              },
              {
                "nombre": "Trailblazer LTZ 3.6",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogr%2Fgrupo-gr-trailblazer-ltz-alquiler-de-camionetas-7-puestos.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogr%2Fgrupo-gr-trailblazer-ltz-alquiler-de-camionetas-7-puestos.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogr%2Fgrupo-gr-trailblazer-ltz-alquiler-de-camionetas-7-puestos.jpg?alt=media"
                }
              },
              {
                "nombre": "Mitsubishi Montero Sport 3.0",
                "imagenes": {
                  "avif": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogr%2Fgrupo-gr-mitsubishi-montero-sport-alquiler-de-camionetas-7-puestos.avif?alt=media",
                  "webp": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogr%2Fgrupo-gr-mitsubishi-montero-sport-alquiler-de-camionetas-7-puestos.webp?alt=media",
                  "jpg": "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogr%2Fgrupo-gr-mitsubishi-montero-sport-alquiler-de-camionetas-7-puestos.jpg?alt=media"
                }
              }
            ],
            "descripcion_corta": "Camioneta automática 7 puestos",
            "descripcion_larga": "Camionetas espaciosas con capacidad para 7 pasajeros, ideales para familias numerosas o grupos. Ofrecen gran versatilidad, potencia y comodidad para múltiples usos, desde actividades al aire libre hasta largos viajes. Su costo de alquiler y consumo de combustible son elevados, pero su capacidad y prestaciones lo compensan.",
            "tags": [
              "Transmisión Automática",
              "Capacidad: 7 personas",
              "4 maleta grande o 2 maleta grandes con los 7 asientos ocupados",
              "Aire acondicionado de triple zona",
              "Eleva vidrios eléctricos",
              "Cierre centralizado con acceso sin llave"
            ]
          }
        };
    
    return { vehicleCategories }
}