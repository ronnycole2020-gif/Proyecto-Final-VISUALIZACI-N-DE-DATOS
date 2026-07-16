# Informe técnico — FloodWatchEC

## 1. Introducción

Ecuador es vulnerable a inundaciones asociadas con episodios de El Niño, especialmente en la región Costa y en la cuenca del río Guayas. El incremento de la temperatura superficial del océano, las lluvias intensas, la elevación de la marea y la saturación de sistemas hídricos pueden coincidir y agravar el anegamiento urbano.

FloodWatchEC fue desarrollado como una plataforma académica de Big Data capaz de ingerir, procesar, almacenar y visualizar información climática en tiempo cuasi real. La solución traduce los datos recibidos en indicadores de riesgo y los presenta en un dashboard web interactivo.

## 2. Objetivo general

Diseñar e implementar una arquitectura de procesamiento masivo de datos que permita monitorear variables asociadas con El Niño y representar el riesgo simplificado de inundación en Guayaquil mediante gráficos, capas geoespaciales y rutas de evacuación sugeridas.

## 3. Objetivos específicos alcanzados

1. Implementar productores Kafka para NOAA, INOCAR, CELEC y SNGR.
2. Procesar eventos con Spark Structured Streaming.
3. Calcular un nivel e índice simplificado de riesgo.
4. Almacenar datos procesados en HDFS usando Parquet.
5. Exponer datos mediante FastAPI.
6. Construir un dashboard con Chart.js, Leaflet y OpenStreetMap.
7. Representar zonas vulnerables, lluvia, marea, escenario combinado y evacuación.
8. Documentar la arquitectura, funcionamiento y limitaciones.

## Desarrollo
El desarrollo del proyecto se realizó en Visual Studio Code mediante la extensión Remote - WSL. Los archivos fueron almacenados y ejecutados dentro de Ubuntu en WSL2, donde se configuraron Apache Kafka, Apache Spark, Hadoop HDFS, Python y FastAPI.

## 4. Arquitectura de la solución

La plataforma se organiza en cinco niveles:

### 4.1 Ingesta

Apache Kafka recibe eventos en topics separados:

- `sst-noaa`
- `precip-gpm`
- `mareas-inocar`
- `embalse-celec`
- `alertas-sngr`

Los mensajes usan formato JSON y contienen marca de tiempo.

### 4.2 Procesamiento

Spark Structured Streaming consume el topic `sst-noaa`, convierte los mensajes JSON en columnas estructuradas, añade variables ambientales representativas y calcula el riesgo.

Se evitó el join directo entre cuatro streams porque Spark exige watermarks y condiciones temporales para joins stream-stream. Para asegurar estabilidad y una demostración reproducible, se utiliza NOAA como stream principal y se incorporan valores realistas de marea, embalse y alerta. Los demás productores se mantienen implementados como fuentes Kafka independientes.

### 4.3 Almacenamiento

Los registros procesados se escriben en formato Parquet en HDFS. El formato columnar permite lecturas eficientes desde Spark y reduce el tamaño de almacenamiento.

### 4.4 Servicio

FastAPI lee los archivos Parquet de HDFS y expone los endpoints:

- `/`
- `/datos`
- `/ultimo`
- `/estadisticas`
- `/ciudades`
- `/docs`

El endpoint `/ultimo` también calcula un índice simplificado de riesgo entre 0 y 100.

### 4.5 Visualización

El dashboard consulta la API cada cinco segundos. Incluye:

- ocho tarjetas de indicadores;
- gráfico de temperatura y precipitación;
- historial de eventos;
- mapa de OpenStreetMap;
- zonas de riesgo;
- precipitación;
- marea;
- escenario combinado;
- ruta de evacuación;
- control y leyenda de capas.

## 5. Metodología de riesgo

Las reglas de clasificación utilizadas son:

- **CRÍTICO:** temperatura ≥ 30 °C, precipitación ≥ 20 mm, marea ≥ 3.5 m y embalse ≥ 85 %.
- **ALTO:** temperatura ≥ 30 °C y precipitación ≥ 10 mm.
- **MEDIO:** temperatura ≥ 28 °C o marea ≥ 3.0 m.
- **BAJO:** condiciones inferiores.

El índice mostrado por la API combina aportes limitados de temperatura, precipitación, marea y embalse para producir un valor entre 0 y 100. Se trata de un indicador académico simplificado, no de un modelo hidráulico oficial.

## 6. Escenario lluvia intensa y marea alta

El dashboard representa un escenario combinado en el que la lluvia intensa coincide con una marea elevada. La marea alta puede reducir la capacidad de descarga por gravedad del sistema pluvial hacia el estuario. Como resultado, el agua puede acumularse en sectores bajos y aumentar el riesgo de anegamiento.

La capa de inundación permite visualizar este efecto combinado mediante una zona de mayor extensión y color rojo.

## 7. Componente geoespacial

Se implementaron polígonos académicos para sectores de Guayaquil:

- Urdesa
- Sauces
- Centro
- Isla Trinitaria

Los colores indican niveles bajo, medio y alto. El control de Leaflet permite activar o desactivar ciudades, zonas, precipitación, marea, inundación y evacuación.

## 8. Ruta de evacuación

Se representa una ruta sugerida entre una zona de riesgo y un punto seguro. La versión académica usa una polilínea sobre el mapa. Una ampliación futura podría integrar OSRM, GraphHopper o pgRouting para calcular recorridos reales sobre la red vial de OpenStreetMap.

## 9. Resultados

La solución demostró el flujo completo:

```text
Productor → Kafka → Spark Streaming → HDFS → FastAPI → Dashboard
```

Los mensajes producidos fueron consumidos y transformados correctamente. Los archivos Parquet se almacenaron en HDFS, la API recuperó los registros y el dashboard mostró actualizaciones automáticas, gráficos y capas geográficas.

## 10. Limitaciones

- Los valores utilizados son simulados o realistas, no datos oficiales en vivo.
- Las zonas de riesgo son aproximadas.
- No se incorporó un DEM real ni una red de drenaje municipal.
- La ruta de evacuación no usa todavía un motor de ruteo.
- La integración multifuente no utiliza joins stream-stream con watermarks.
- El índice no sustituye un modelo hidráulico o pronóstico oficial.

## 11. Conclusiones

FloodWatchEC demuestra que una arquitectura basada en Kafka, Spark, HDFS y FastAPI puede utilizarse para construir una plataforma escalable de monitoreo climático. El proyecto integra procesamiento en streaming, almacenamiento distribuido y visualización geoespacial dentro de una solución coherente.

La principal contribución es transformar eventos climáticos en información visual comprensible: indicadores, niveles de riesgo, zonas vulnerables y rutas sugeridas. Aunque el modelo es simplificado, la arquitectura permite incorporar fuentes reales y métodos geoespaciales más avanzados en futuras versiones.

## 12. Recomendaciones

- Integrar datos oficiales y APIs reales.
- Procesar cada fuente mediante jobs separados.
- Añadir watermarks y ventanas temporales para consolidación multifuente.
- Incorporar topografía SRTM/Copernicus.
- Validar zonas de riesgo con registros históricos.
- Usar OSRM o pgRouting para evacuación.
- Desplegar el sistema en infraestructura cloud.
